"""Generate the calorie-prediction training dataset.

Strategy: synthetic sampling using the Mifflin–St Jeor BMR formula combined with
activity multipliers, with realistic correlations (BMI bounded to 16–40) and
±5% Gaussian noise on TDEE to mimic inter-person metabolic variability. This
gives the ANN a meaningful target — a perfectly noise-free formula would
collapse to MAE ≈ 0 and tell us nothing.

Per TRD §6.1 the model's input is 8-dim:
    [age, gender_male, gender_female, gender_other, heightCm, weightKg,
     activityLevelOrdinal (1..5), bmi]

TRD only enumerates 7 raw fields; bmi is added as the engineered 8th feature
(matching `Input(8)` in the architecture spec, and aligning with the BMI value
the API will compute anyway for the KNN service).

Outputs CSV to `data/synthetic_dataset.csv` (gitignored).
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

SEED = 42
ACTIVITY_LEVELS = ["sedentary", "light", "moderate", "active", "very_active"]
ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "active": 1.725,
    "very_active": 1.9,
}
ACTIVITY_ORDINAL = {name: i + 1 for i, name in enumerate(ACTIVITY_LEVELS)}
GENDERS = ["male", "female", "other"]

# Realistic physiological ranges (PRD §FR-2.7).
AGE_MIN, AGE_MAX = 13, 80
HEIGHT_MIN, HEIGHT_MAX = 140.0, 210.0  # cm — narrower than PRD's 100–250 hard limits
WEIGHT_MIN, WEIGHT_MAX = 40.0, 150.0   # kg — narrower than PRD's 30–250 hard limits
BMI_MIN, BMI_MAX = 16.0, 40.0
TDEE_NOISE_PCT = 0.05  # 5% Gaussian on TDEE


def mifflin_st_jeor_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
    """Mifflin–St Jeor BMR. For gender='other' use the male/female midpoint."""
    base = 10.0 * weight_kg + 6.25 * height_cm - 5.0 * age
    if gender == "male":
        return base + 5.0
    if gender == "female":
        return base - 161.0
    return base - 78.0  # midpoint of +5 and -161


def sample_dataset(n: int, rng: np.random.Generator) -> pd.DataFrame:
    """Sample n synthetic profiles with realistic height/weight correlation."""
    ages = rng.integers(AGE_MIN, AGE_MAX + 1, size=n)
    genders = rng.choice(GENDERS, size=n, p=[0.47, 0.47, 0.06])

    # Height: gender-conditional normal, clipped.
    height_mean = np.where(genders == "male", 173.0, np.where(genders == "female", 161.0, 167.0))
    heights = rng.normal(height_mean, 7.5).clip(HEIGHT_MIN, HEIGHT_MAX)

    # Weight: sample BMI in a realistic band, then derive weight = bmi * (h/100)^2.
    bmis = rng.normal(24.0, 4.0, size=n).clip(BMI_MIN, BMI_MAX)
    weights = (bmis * (heights / 100.0) ** 2).clip(WEIGHT_MIN, WEIGHT_MAX)
    # Recompute BMI after weight clipping so they stay consistent.
    bmis = weights / (heights / 100.0) ** 2

    activities = rng.choice(ACTIVITY_LEVELS, size=n)
    activity_ord = np.array([ACTIVITY_ORDINAL[a] for a in activities], dtype=np.int32)

    bmr = np.array(
        [
            mifflin_st_jeor_bmr(w, h, int(a), g)
            for w, h, a, g in zip(weights, heights, ages, genders)
        ]
    )
    multiplier = np.array([ACTIVITY_MULTIPLIERS[a] for a in activities])
    tdee = bmr * multiplier

    # Add 5% Gaussian noise — mean 0, std = 5% of each TDEE.
    noise = rng.normal(0.0, TDEE_NOISE_PCT * tdee)
    kcal = (tdee + noise).round().astype(np.int32)

    return pd.DataFrame(
        {
            "age": ages.astype(np.int32),
            "gender": genders,
            "heightCm": heights.round(1),
            "weightKg": weights.round(1),
            "activityLevel": activities,
            "activityLevelOrdinal": activity_ord,
            "bmi": bmis.round(2),
            "kcal": kcal,
        }
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate synthetic calorie dataset.")
    parser.add_argument("--n", type=int, default=20_000, help="number of synthetic rows")
    parser.add_argument(
        "--out",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "data" / "synthetic_dataset.csv",
    )
    args = parser.parse_args()

    rng = np.random.default_rng(SEED)
    df = sample_dataset(args.n, rng)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.out, index=False)

    print(f"wrote {len(df):,} rows → {args.out}")
    print(df.describe(include="all").to_string())


if __name__ == "__main__":
    main()
