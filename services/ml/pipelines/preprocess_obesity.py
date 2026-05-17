"""Build the health-risk classification dataset from the real Obesity dataset.

NutriMate's health-risk SVM is trained on the UCI / Kaggle **"Obesity Levels"**
dataset ("Estimation of obesity levels based on eating habits and physical
condition") — `ObesityDataSet_raw_and_data_sinthetic.csv`, ~2,111 rows of real
demographic data with a real 7-class obesity label.

This script maps the raw CSV onto NutriMate's feature schema and **collapses the
7-class `NObeyesdad` label into a 3-class health-risk label**:

    low      <- Insufficient_Weight, Normal_Weight
    moderate <- Overweight_Level_I, Overweight_Level_II
    high     <- Obesity_Type_I, Obesity_Type_II, Obesity_Type_III

The SVM input is the same 8-dim layout as the calorie ANN (TRD §6.1):
    [age, gender_male, gender_female, gender_other, heightCm, weightKg,
     activityLevelOrdinal (1..5), bmi]

Two notable transforms:
  * Height in the raw dataset is in **metres** — converted to cm.
  * `FAF` (physical-activity frequency, 0..3, often non-integer in the
    synthetic rows) is binned monotonically into NutriMate's 1..5 activity
    ordinal — see `FAF_BINS`.

Raw CSV in:   data/raw/ObesityDataSet_raw_and_data_sinthetic.csv  (gitignored)
Cleaned out:  data/health_risk_dataset.csv                        (gitignored)

Run `python pipelines/preprocess_obesity.py --inspect` first to print the raw
schema and confirm the column / FAF / label mappings below match the file.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

SERVICE_ROOT = Path(__file__).resolve().parent.parent
RAW_DEFAULT = SERVICE_ROOT / "data" / "raw" / "ObesityDataSet_raw_and_data_sinthetic.csv"
OUT_DEFAULT = SERVICE_ROOT / "data" / "health_risk_dataset.csv"

# Physiological ranges — continuous fields are clamped, age is dropped if outside.
AGE_MIN, AGE_MAX = 13, 90
HEIGHT_MIN, HEIGHT_MAX = 130.0, 220.0  # cm
WEIGHT_MIN, WEIGHT_MAX = 35.0, 200.0   # kg
BMI_MIN, BMI_MAX = 12.0, 50.0

# Canonical field -> candidate raw column names (matched case-insensitively,
# ignoring spaces/underscores). Extend a list if `--inspect` shows a new name.
COLUMN_CANDIDATES: dict[str, list[str]] = {
    "age": ["age"],
    "gender": ["gender", "sex"],
    "heightM": ["height", "height_m", "heightm"],
    "weightKg": ["weight", "weight_kg", "weightkg"],
    "faf": ["faf", "physical_activity_frequency", "physicalactivity"],
    "label": ["nobeyesdad", "obesity_level", "obesitylevel", "label", "class"],
}

GENDER_MAP = {
    "m": "male", "male": "male", "man": "male",
    "f": "female", "female": "female", "woman": "female",
}

# FAF (0..3) -> NutriMate activity ordinal (1..5). Monotonic discretisation:
# each (upper-bound, ordinal, canonical-name). A value <= bound falls in the bin.
FAF_BINS: list[tuple[float, int, str]] = [
    (0.5, 1, "sedentary"),
    (1.25, 2, "light"),
    (2.0, 3, "moderate"),
    (2.75, 4, "active"),
    (float("inf"), 5, "very_active"),
]

# 7-class NObeyesdad -> 3-class health risk. Keys are normalised (see `_norm`).
RISK_MAP: dict[str, str] = {
    "insufficientweight": "low",
    "normalweight": "low",
    "overweightleveli": "moderate",
    "overweightlevelii": "moderate",
    "obesitytypei": "high",
    "obesitytypeii": "high",
    "obesitytypeiii": "high",
}


def _norm(s: object) -> str:
    """Lower-case and strip non-alphanumerics — for tolerant matching."""
    return "".join(ch for ch in str(s).lower() if ch.isalnum())


def resolve_column(df: pd.DataFrame, field: str) -> str:
    """Find the raw column matching a field, or exit with guidance."""
    norm_to_raw = {_norm(c): c for c in df.columns}
    for candidate in COLUMN_CANDIDATES[field]:
        if _norm(candidate) in norm_to_raw:
            return norm_to_raw[_norm(candidate)]
    raise SystemExit(
        f"could not find a column for '{field}'.\n"
        f"  tried: {COLUMN_CANDIDATES[field]}\n"
        f"  available: {list(df.columns)}\n"
        f"Run with --inspect, then add the real name to COLUMN_CANDIDATES['{field}']."
    )


def faf_to_activity(faf: float) -> tuple[int, str]:
    """Bin a raw FAF value (0..3) into a (ordinal 1-5, canonical name)."""
    for upper, ordinal, name in FAF_BINS:
        if faf <= upper:
            return ordinal, name
    return 5, "very_active"  # unreachable — last bin is +inf


def inspect(raw_path: Path) -> None:
    """Print the raw dataset's schema so the mappings can be confirmed."""
    df = pd.read_csv(raw_path)
    print(f"loaded {len(df):,} rows from {raw_path}\n")
    print("columns + dtypes:")
    print(df.dtypes.to_string())
    print("\nhead:")
    print(df.head().to_string())
    label_col = resolve_column(df, "label")
    print(f"\nlabel value counts ({label_col}):")
    print(df[label_col].value_counts().to_string())


def build_dataset(raw_path: Path) -> pd.DataFrame:
    """Map the raw Obesity CSV to the health-risk feature + label schema."""
    raw = pd.read_csv(raw_path)
    cols = {field: resolve_column(raw, field) for field in COLUMN_CANDIDATES}
    print("resolved columns:")
    for field, raw_col in cols.items():
        print(f"  {field:10s} <- {raw_col}")

    df = pd.DataFrame()
    df["age"] = pd.to_numeric(raw[cols["age"]], errors="coerce")
    df["gender"] = raw[cols["gender"]].map(lambda v: GENDER_MAP.get(_norm(v), "other"))

    # Height is in metres in this dataset — convert to cm. Guard against a row
    # that is already in cm (value > 3 cannot be a human height in metres).
    height = pd.to_numeric(raw[cols["heightM"]], errors="coerce")
    df["heightCm"] = height.where(height > 3.0, height * 100.0)
    df["weightKg"] = pd.to_numeric(raw[cols["weightKg"]], errors="coerce")

    # FAF (0..3) -> activity ordinal 1-5.
    faf = pd.to_numeric(raw[cols["faf"]], errors="coerce")
    activity = faf.map(lambda v: faf_to_activity(float(v)) if pd.notna(v) else None)
    df["activityLevel"] = activity.map(lambda t: t[1] if t else None)
    df["activityLevelOrdinal"] = activity.map(lambda t: t[0] if t else None)
    print("\nFAF -> activity bins:")
    for upper, ordinal, name in FAF_BINS:
        bound = "inf" if upper == float("inf") else f"{upper}"
        print(f"  FAF <= {bound:>4s}  -> ordinal {ordinal} ({name})")

    # 7-class obesity label -> 3-class risk.
    raw_label = raw[cols["label"]]
    mapped = raw_label.map(lambda v: RISK_MAP.get(_norm(v)))
    unmapped = sorted(raw_label[mapped.isna()].dropna().astype(str).unique())
    if unmapped:
        raise SystemExit(
            f"unmapped obesity labels: {unmapped}\n"
            f"Add them (normalised) to RISK_MAP."
        )
    df["riskClass"] = mapped

    before = len(df)
    df = df.dropna().drop_duplicates()
    df = df[df["age"].between(AGE_MIN, AGE_MAX)]
    print(f"\ndropped {before - len(df):,} NaN/dupe/out-of-range rows")

    # Clamp continuous fields into physiological bounds; compute BMI to match.
    df["heightCm"] = df["heightCm"].clip(HEIGHT_MIN, HEIGHT_MAX)
    df["weightKg"] = df["weightKg"].clip(WEIGHT_MIN, WEIGHT_MAX)
    df["bmi"] = (df["weightKg"] / (df["heightCm"] / 100.0) ** 2).clip(BMI_MIN, BMI_MAX)

    return df.astype(
        {
            "age": "int32",
            "heightCm": "float64",
            "weightKg": "float64",
            "activityLevelOrdinal": "int32",
            "bmi": "float64",
        }
    ).reset_index(drop=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the health-risk dataset.")
    parser.add_argument("--raw", type=Path, default=RAW_DEFAULT, help="raw Obesity CSV")
    parser.add_argument("--out", type=Path, default=OUT_DEFAULT, help="cleaned output CSV")
    parser.add_argument("--inspect", action="store_true", help="print raw schema and exit")
    args = parser.parse_args()

    if not args.raw.exists():
        sys.exit(
            f"raw dataset not found: {args.raw}\n"
            f"Download the UCI/Kaggle 'Obesity Levels' dataset "
            f"(ObesityDataSet_raw_and_data_sinthetic.csv) and place it there — "
            f"see this file's docstring."
        )

    if args.inspect:
        inspect(args.raw)
        return

    df = build_dataset(args.raw)
    df = df[
        ["age", "gender", "heightCm", "weightKg",
         "activityLevel", "activityLevelOrdinal", "bmi", "riskClass"]
    ]
    df["heightCm"] = df["heightCm"].round(1)
    df["weightKg"] = df["weightKg"].round(1)
    df["bmi"] = df["bmi"].round(2)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.out, index=False)

    print(f"\nwrote {len(df):,} rows -> {args.out}")
    print("\nrisk class distribution:")
    print(df["riskClass"].value_counts().to_string())


if __name__ == "__main__":
    main()
