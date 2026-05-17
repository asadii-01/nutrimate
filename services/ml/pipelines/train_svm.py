"""Train the health-risk SVM classifier (3rd ML model).

A support-vector classifier that grades a user's health risk as one of
**low / moderate / high** from multi-factor profile inputs — distinct from the
deterministic BMI-threshold category, which uses BMI alone.

8-dim input (same layout as the calorie ANN, TRD §6.1):
    age, gender_male, gender_female, gender_other, heightCm, weightKg,
    activityLevelOrdinal, bmi

Model: a scikit-learn Pipeline bundling StandardScaler + SVC(kernel="rbf",
probability=True). Bundling the scaler in the Pipeline guarantees the inference
path applies the exact scaling fitted at train time.

Reads `data/health_risk_dataset.csv` produced by `preprocess_obesity.py`
(real Obesity-dataset rows + a 3-class risk label).
Writes:
    models/svm_v{VERSION}.pkl
    models/svm_meta.json
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

VERSION = "0.1.0"
SEED = 42
ACCURACY_REFERENCE = 0.80  # soft reference on the held-out test split
RISK_CLASSES = ["low", "moderate", "high"]
FEATURE_ORDER = [
    "age",
    "gender_male",
    "gender_female",
    "gender_other",
    "heightCm",
    "weightKg",
    "activityLevelOrdinal",
    "bmi",
]
SERVICE_ROOT = Path(__file__).resolve().parent.parent


def build_features(df: pd.DataFrame) -> np.ndarray:
    """Turn the preprocess CSV into the 8-dim feature matrix (gender one-hot)."""
    gender_dummies = pd.get_dummies(df["gender"], prefix="gender")
    for col in ("gender_male", "gender_female", "gender_other"):
        if col not in gender_dummies.columns:
            gender_dummies[col] = 0
    features = pd.concat(
        [
            df[["age"]].astype(float),
            gender_dummies[["gender_male", "gender_female", "gender_other"]].astype(float),
            df[["heightCm", "weightKg", "activityLevelOrdinal", "bmi"]].astype(float),
        ],
        axis=1,
    )
    return features[FEATURE_ORDER].to_numpy(dtype=np.float64)


def main() -> None:
    parser = argparse.ArgumentParser(description="Train health-risk SVM.")
    parser.add_argument(
        "--data",
        type=Path,
        default=SERVICE_ROOT / "data" / "health_risk_dataset.csv",
    )
    parser.add_argument("--models-dir", type=Path, default=SERVICE_ROOT / "models")
    parser.add_argument(
        "--min-accuracy",
        type=float,
        default=None,
        help="hard-fail if test accuracy is below this (default: off — only warn)",
    )
    args = parser.parse_args()

    args.models_dir.mkdir(parents=True, exist_ok=True)

    if not args.data.exists():
        raise SystemExit(
            f"dataset not found: {args.data}\n"
            f"Run preprocess_obesity.py first to build it from the raw CSV."
        )
    df = pd.read_csv(args.data)
    print(f"loaded {len(df):,} rows from {args.data}")
    print("class distribution:")
    print(df["riskClass"].value_counts().to_string())

    X = build_features(df)
    y = df["riskClass"].astype(str).to_numpy()

    # 80/10/10 split (mirrors the ANN). Stratify so each split keeps the
    # class balance — the 3 collapsed classes are uneven.
    X_train, X_tmp, y_train, y_tmp = train_test_split(
        X, y, test_size=0.2, random_state=SEED, stratify=y
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_tmp, y_tmp, test_size=0.5, random_state=SEED, stratify=y_tmp
    )

    pipeline = Pipeline(
        [
            ("scaler", StandardScaler()),
            (
                "svc",
                SVC(
                    kernel="rbf",
                    probability=True,
                    class_weight="balanced",
                    random_state=SEED,
                ),
            ),
        ]
    )
    pipeline.fit(X_train, y_train)

    val_acc = accuracy_score(y_val, pipeline.predict(X_val))
    test_pred = pipeline.predict(X_test)
    test_acc = accuracy_score(y_test, test_pred)
    macro_f1 = f1_score(y_test, test_pred, average="macro")
    print(f"\nValidation accuracy: {val_acc:.4f}")
    print(f"Test accuracy:       {test_acc:.4f}  (reference: ≥ {ACCURACY_REFERENCE})")
    print(f"Test macro-F1:       {macro_f1:.4f}")
    print("\nclassification report (test split):")
    print(classification_report(y_test, test_pred, zero_division=0))

    classes = list(pipeline.classes_)
    artifact = {
        "version": VERSION,
        "pipeline": pipeline,
        "classes": classes,
        "featureOrder": FEATURE_ORDER,
    }
    artifact_path = args.models_dir / f"svm_v{VERSION}.pkl"
    joblib.dump(artifact, artifact_path)

    meta_path = args.models_dir / "svm_meta.json"
    meta_path.write_text(
        json.dumps(
            {
                "modelVersion": VERSION,
                "testAccuracy": round(float(test_acc), 4),
                "valAccuracy": round(float(val_acc), 4),
                "testMacroF1": round(float(macro_f1), 4),
                "classes": classes,
                "classDistribution": df["riskClass"].value_counts().to_dict(),
                "trainSize": int(len(X_train)),
                "valSize": int(len(X_val)),
                "testSize": int(len(X_test)),
                "featureOrder": FEATURE_ORDER,
            },
            indent=2,
        )
    )
    print(f"saved: {artifact_path}")
    print(f"saved: {meta_path}")

    # Sanity probe: an obese, sedentary profile should classify as "high".
    probe = np.array(
        [[45.0, 1.0, 0.0, 0.0, 170.0, 105.0, 1.0, 36.33]], dtype=np.float64
    )
    probe_label = pipeline.predict(probe)[0]
    print(f"probe (obese sedentary 45M) → {probe_label}")

    if args.min_accuracy is not None and test_acc < args.min_accuracy:
        raise SystemExit(
            f"FAIL: test accuracy {test_acc:.4f} < --min-accuracy {args.min_accuracy}"
        )
    if test_acc < ACCURACY_REFERENCE:
        print(
            f"\nWARNING: accuracy {test_acc:.4f} is below the "
            f"{ACCURACY_REFERENCE} reference."
        )
    else:
        print(f"\nPASS: accuracy {test_acc:.4f} ≥ {ACCURACY_REFERENCE}")


if __name__ == "__main__":
    main()
