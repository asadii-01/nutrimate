"""Build the calorie-prediction training dataset (hybrid: real rows + formula label).

NutriMate's calorie ANN was previously trained on a fully synthetic
Mifflin–St Jeor grid. It is now trained on a **hybrid** dataset:

  * Demographic rows (age, gender, height, weight, activity level) are taken
    from a real public Kaggle dataset — by default the "Diet Recommendations
    Dataset" (`ziya07/diet-recommendations-dataset`), so the model sees a real
    population's feature distribution.
  * The `kcal` target is **regenerated** from the Mifflin–St Jeor BMR formula
    (BMR × activity multiplier, with 5% Gaussian noise). The dataset's own
    `Daily_Caloric_Intake` column is discarded — it is statistically
    independent of body metrics (|r| < 0.09 against every feature), i.e. noise,
    so a model trained on it learns nothing. No public dataset directly
    measures TDEE; the formula is the meaningful label.

Per TRD §6.1 the model's input is 8-dim:
    [age, gender_male, gender_female, gender_other, heightCm, weightKg,
     activityLevelOrdinal (1..5), bmi]

Raw CSV in:   data/raw/diet_recommendations_dataset.csv  (gitignored)
Cleaned out:  data/calorie_dataset.csv                   (gitignored)

Run `python pipelines/preprocess.py --inspect` first to print the raw schema
and confirm the column / activity mappings below match the actual file.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd

SERVICE_ROOT = Path(__file__).resolve().parent.parent
RAW_DEFAULT = SERVICE_ROOT / "data" / "raw" / "diet_recommendations_dataset.csv"
OUT_DEFAULT = SERVICE_ROOT / "data" / "calorie_dataset.csv"

SEED = 42
TDEE_NOISE_PCT = 0.05  # 5% Gaussian on TDEE — mimics inter-person variability

# Physiological ranges — rows outside these are clamped (height/weight/bmi) or
# dropped (age).
AGE_MIN, AGE_MAX = 13, 90
HEIGHT_MIN, HEIGHT_MAX = 130.0, 220.0  # cm
WEIGHT_MIN, WEIGHT_MAX = 35.0, 200.0   # kg
BMI_MIN, BMI_MAX = 12.0, 50.0

# Activity multiplier applied to BMR to get TDEE (the kcal label).
ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "active": 1.725,
    "very_active": 1.9,
}

# Canonical ANN feature → candidate raw column names (matched case-insensitively,
# ignoring spaces/underscores). Extend a list if `--inspect` shows a new name.
# Note: the raw calorie column is intentionally NOT ingested — see module docstring.
COLUMN_CANDIDATES: dict[str, list[str]] = {
    "age": ["age"],
    "gender": ["gender", "sex"],
    "heightCm": ["height_cm", "heightcm", "height", "heightcms"],
    "weightKg": ["weight_kg", "weightkg", "weight"],
    "activityLevel": [
        "physical_activity_level", "activity_level", "activitylevel",
        "physicalactivitylevel", "activity",
    ],
    "bmi": ["bmi", "body_mass_index"],
}

# Raw activity value (normalized) → (ordinal 1-5, canonical 5-level name).
ACTIVITY_MAP: dict[str, tuple[int, str]] = {
    "sedentary": (1, "sedentary"),
    "inactive": (1, "sedentary"),
    "low": (1, "sedentary"),
    "light": (2, "light"),
    "lightlyactive": (2, "light"),
    "lightexercise": (2, "light"),
    "moderate": (3, "moderate"),
    "medium": (3, "moderate"),
    "moderatelyactive": (3, "moderate"),
    "active": (4, "active"),
    "high": (4, "active"),
    "highlyactive": (4, "active"),
    "veryactive": (5, "very_active"),
    "extraactive": (5, "very_active"),
    "intense": (5, "very_active"),
}

GENDER_MAP = {
    "m": "male", "male": "male", "man": "male",
    "f": "female", "female": "female", "woman": "female",
}


def _norm(s: object) -> str:
    """Lower-case and strip non-alphanumerics — for tolerant matching."""
    return "".join(ch for ch in str(s).lower() if ch.isalnum())


def resolve_column(df: pd.DataFrame, field: str) -> str:
    """Find the raw column matching an ANN field, or exit with guidance."""
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


def mifflin_st_jeor_bmr(weight_kg: float, height_cm: float, age: float, gender: str) -> float:
    """Mifflin–St Jeor BMR. For gender='other' use the male/female midpoint."""
    base = 10.0 * weight_kg + 6.25 * height_cm - 5.0 * age
    if gender == "male":
        return base + 5.0
    if gender == "female":
        return base - 161.0
    return base - 78.0  # midpoint of +5 and -161


def inspect(raw_path: Path) -> None:
    """Print the raw dataset's schema so the mappings can be confirmed."""
    df = pd.read_csv(raw_path)
    print(f"loaded {len(df):,} rows from {raw_path}\n")
    print("columns + dtypes:")
    print(df.dtypes.to_string())
    print("\nhead:")
    print(df.head().to_string())
    print("\ndescribe:")
    print(df.describe(include="all").to_string())


def build_dataset(raw_path: Path, rng: np.random.Generator) -> pd.DataFrame:
    """Map the raw CSV to the ANN feature schema and generate the kcal label."""
    raw = pd.read_csv(raw_path)
    cols = {field: resolve_column(raw, field) for field in COLUMN_CANDIDATES}
    print("resolved columns:")
    for field, raw_col in cols.items():
        print(f"  {field:14s} <- {raw_col}")

    df = pd.DataFrame()
    df["age"] = pd.to_numeric(raw[cols["age"]], errors="coerce")
    df["gender"] = raw[cols["gender"]].map(lambda v: GENDER_MAP.get(_norm(v), "other"))
    df["heightCm"] = pd.to_numeric(raw[cols["heightCm"]], errors="coerce")
    df["weightKg"] = pd.to_numeric(raw[cols["weightKg"]], errors="coerce")

    # Activity → ordinal 1-5 + canonical level name.
    raw_activity = raw[cols["activityLevel"]]
    mapped = raw_activity.map(lambda v: ACTIVITY_MAP.get(_norm(v)))
    unmapped = sorted(raw_activity[mapped.isna()].dropna().astype(str).unique())
    if unmapped:
        raise SystemExit(
            f"unmapped activity values: {unmapped}\nAdd them (normalized) to ACTIVITY_MAP."
        )
    df["activityLevel"] = mapped.map(lambda t: t[1])
    df["activityLevelOrdinal"] = mapped.map(lambda t: t[0]).astype("Int64")
    print("\nactivity mapping:")
    for val in sorted(raw_activity.dropna().astype(str).unique()):
        ordn, name = ACTIVITY_MAP[_norm(val)]
        print(f"  {val:24s} -> ordinal {ordn} ({name})")

    # BMI: use the raw column if usable, else compute from height/weight.
    raw_bmi = pd.to_numeric(raw[cols["bmi"]], errors="coerce")
    computed_bmi = df["weightKg"] / (df["heightCm"] / 100.0) ** 2
    df["bmi"] = raw_bmi.where(raw_bmi.between(BMI_MIN, BMI_MAX), computed_bmi)

    before = len(df)
    df = df.dropna().drop_duplicates()
    df = df[df["age"].between(AGE_MIN, AGE_MAX)]
    print(f"\ndropped {before - len(df):,} NaN/dupe/out-of-range rows")

    # Clamp continuous fields into physiological bounds; recompute BMI to match.
    df["heightCm"] = df["heightCm"].clip(HEIGHT_MIN, HEIGHT_MAX)
    df["weightKg"] = df["weightKg"].clip(WEIGHT_MIN, WEIGHT_MAX)
    df["bmi"] = (df["weightKg"] / (df["heightCm"] / 100.0) ** 2).clip(BMI_MIN, BMI_MAX)

    # kcal label = Mifflin–St Jeor BMR × activity multiplier + 5% Gaussian noise.
    bmr = np.array(
        [
            mifflin_st_jeor_bmr(w, h, a, g)
            for w, h, a, g in zip(df["weightKg"], df["heightCm"], df["age"], df["gender"])
        ]
    )
    multiplier = df["activityLevel"].map(ACTIVITY_MULTIPLIERS).to_numpy(dtype=float)
    tdee = bmr * multiplier
    kcal = tdee + rng.normal(0.0, TDEE_NOISE_PCT * tdee)
    df["kcal"] = kcal.round().astype(np.int32)

    return df.astype(
        {
            "age": np.int32,
            "heightCm": np.float64,
            "weightKg": np.float64,
            "activityLevelOrdinal": np.int32,
            "bmi": np.float64,
            "kcal": np.int32,
        }
    ).reset_index(drop=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the hybrid calorie dataset.")
    parser.add_argument("--raw", type=Path, default=RAW_DEFAULT, help="raw Kaggle CSV")
    parser.add_argument("--out", type=Path, default=OUT_DEFAULT, help="cleaned output CSV")
    parser.add_argument("--inspect", action="store_true", help="print raw schema and exit")
    args = parser.parse_args()

    if not args.raw.exists():
        sys.exit(
            f"raw dataset not found: {args.raw}\n"
            f"Download it from Kaggle (ziya07/diet-recommendations-dataset) and "
            f"place the CSV there — see this file's docstring."
        )

    if args.inspect:
        inspect(args.raw)
        return

    rng = np.random.default_rng(SEED)
    df = build_dataset(args.raw, rng)
    df = df[
        ["age", "gender", "heightCm", "weightKg",
         "activityLevel", "activityLevelOrdinal", "bmi", "kcal"]
    ]
    df["heightCm"] = df["heightCm"].round(1)
    df["weightKg"] = df["weightKg"].round(1)
    df["bmi"] = df["bmi"].round(2)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.out, index=False)

    print(f"\nwrote {len(df):,} rows -> {args.out}")
    print(df.describe(include="all").to_string())


if __name__ == "__main__":
    main()
