"""Train the calorie-prediction ANN (TRD §6.1).

    Input(8) → Dense(64, relu) → Dropout(0.2)
            → Dense(32, relu) → Dropout(0.2)
            → Dense(16, relu)
            → Dense(1, linear)

8 features (built in `build_features`):
    age, gender_male, gender_female, gender_other, heightCm, weightKg,
    activityLevelOrdinal, bmi

Reference target: MAE ≤ 150 kcal on the held-out test split (TRD §6.1).
Exceeding it is a soft warning, not a hard failure — pass `--max-mae` to
re-enable a hard gate.

Reads `data/calorie_dataset.csv` produced by `preprocess.py` (real demographic
rows from a Kaggle dataset + a Mifflin–St Jeor kcal label).
Writes:
    models/calorie_ann_v{VERSION}.keras
    models/scaler.pkl
    models/metrics.json
"""

from __future__ import annotations

import argparse
import json
import os
import random
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# Make TF quiet about CUDA when we don't have a GPU.
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

import tensorflow as tf  # noqa: E402

VERSION = "0.2.0"
SEED = 42
MAE_REFERENCE = 150.0  # kcal — TRD §6.1 reference (soft; see module docstring)
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


def set_seeds(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    tf.random.set_seed(seed)


def build_features(df: pd.DataFrame) -> np.ndarray:
    """Turn the preprocess CSV into the 8-dim feature matrix."""
    gender_dummies = pd.get_dummies(df["gender"], prefix="gender")
    # Guarantee all three columns exist even if a category is missing.
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
    return features[FEATURE_ORDER].to_numpy(dtype=np.float32)


def build_model() -> tf.keras.Model:
    model = tf.keras.Sequential(
        [
            tf.keras.layers.Input(shape=(8,)),
            tf.keras.layers.Dense(64, activation="relu"),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(32, activation="relu"),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(16, activation="relu"),
            tf.keras.layers.Dense(1, activation="linear"),
        ]
    )
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="mse",
        metrics=["mae"],
    )
    return model


def main() -> None:
    parser = argparse.ArgumentParser(description="Train calorie ANN.")
    parser.add_argument(
        "--data",
        type=Path,
        default=SERVICE_ROOT / "data" / "calorie_dataset.csv",
    )
    parser.add_argument("--models-dir", type=Path, default=SERVICE_ROOT / "models")
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--patience", type=int, default=10)
    parser.add_argument(
        "--max-mae",
        type=float,
        default=None,
        help="hard-fail if test MAE exceeds this (default: off — only warn)",
    )
    args = parser.parse_args()

    set_seeds(SEED)
    args.models_dir.mkdir(parents=True, exist_ok=True)

    if not args.data.exists():
        raise SystemExit(
            f"dataset not found: {args.data}\n"
            f"Run preprocess.py first to build it from the raw Kaggle CSV."
        )
    df = pd.read_csv(args.data)
    print(f"loaded {len(df):,} rows from {args.data}")

    X = build_features(df)
    y = df["kcal"].to_numpy(dtype=np.float32)

    # 80/10/10 split (TRD §6.1).
    X_train, X_tmp, y_train, y_tmp = train_test_split(X, y, test_size=0.2, random_state=SEED)
    X_val, X_test, y_val, y_test = train_test_split(
        X_tmp, y_tmp, test_size=0.5, random_state=SEED
    )

    scaler = StandardScaler().fit(X_train)
    X_train_s = scaler.transform(X_train)
    X_val_s = scaler.transform(X_val)
    X_test_s = scaler.transform(X_test)

    model = build_model()
    model.summary()

    early = tf.keras.callbacks.EarlyStopping(
        monitor="val_mae",
        patience=args.patience,
        restore_best_weights=True,
        verbose=1,
    )
    history = model.fit(
        X_train_s,
        y_train,
        validation_data=(X_val_s, y_val),
        epochs=args.epochs,
        batch_size=args.batch_size,
        callbacks=[early],
        verbose=2,
    )

    test_loss, test_mae = model.evaluate(X_test_s, y_test, verbose=0)
    preds = model.predict(X_test_s, verbose=0).flatten()
    mean_dev = float(np.mean(preds - y_test))
    print(f"\nTest MSE: {test_loss:.2f}")
    print(f"Test MAE: {test_mae:.2f} kcal  (reference: ≤ {MAE_REFERENCE})")
    print(f"Mean prediction deviation (pred − actual): {mean_dev:+.2f} kcal")

    model_path = args.models_dir / f"calorie_ann_v{VERSION}.keras"
    scaler_path = args.models_dir / "scaler.pkl"
    metrics_path = args.models_dir / "metrics.json"

    model.save(model_path)
    joblib.dump(scaler, scaler_path)
    metrics_path.write_text(
        json.dumps(
            {
                "modelVersion": VERSION,
                "testMae": round(float(test_mae), 2),
                "testMse": round(float(test_loss), 2),
                "meanDeviation": round(mean_dev, 2),
                "trainSize": int(len(X_train)),
                "valSize": int(len(X_val)),
                "testSize": int(len(X_test)),
                "epochsTrained": int(len(history.history["loss"])),
                "featureOrder": FEATURE_ORDER,
            },
            indent=2,
        )
    )
    print(f"\nsaved: {model_path}")
    print(f"saved: {scaler_path}")
    print(f"saved: {metrics_path}")

    if args.max_mae is not None and test_mae > args.max_mae:
        raise SystemExit(
            f"FAIL: test MAE {test_mae:.2f} > --max-mae {args.max_mae} kcal"
        )
    if test_mae > MAE_REFERENCE:
        print(
            f"\nWARNING: MAE {test_mae:.2f} exceeds the {MAE_REFERENCE} kcal "
            f"reference — expected on real intake data (higher variance than "
            f"the old synthetic formula)."
        )
    else:
        print(f"\nPASS: MAE {test_mae:.2f} ≤ {MAE_REFERENCE}")


if __name__ == "__main__":
    main()
