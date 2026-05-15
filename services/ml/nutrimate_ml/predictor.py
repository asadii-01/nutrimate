"""Calorie prediction — turns a request into the 8-dim ANN feature vector,
scales it with the trained StandardScaler, and runs inference."""

from __future__ import annotations

import numpy as np

from .artifacts import ModelStore
from .schemas import CaloriePredictRequest, CaloriePredictResponse

# Must match FEATURE_ORDER in pipelines/train_ann.py.
_ACTIVITY_ORDINAL = {
    "sedentary": 1,
    "light": 2,
    "moderate": 3,
    "active": 4,
    "very_active": 5,
}

# Training distribution ranges (pipelines/preprocess.py) — used for a coarse
# confidence signal: predictions on out-of-range inputs are extrapolations.
_TRAIN_RANGES = {
    "age": (13, 80),
    "heightCm": (140.0, 210.0),
    "weightKg": (40.0, 150.0),
    "bmi": (16.0, 40.0),
}


def _build_features(req: CaloriePredictRequest, bmi: float) -> np.ndarray:
    return np.array(
        [[
            float(req.age),
            1.0 if req.gender == "male" else 0.0,
            1.0 if req.gender == "female" else 0.0,
            1.0 if req.gender == "other" else 0.0,
            float(req.heightCm),
            float(req.weightKg),
            float(_ACTIVITY_ORDINAL[req.activityLevel]),
            bmi,
        ]],
        dtype=np.float32,
    )


def _confidence(req: CaloriePredictRequest, bmi: float) -> float:
    """0.9 when every input is within the training distribution, dropping by
    0.1 per out-of-range field (floored at 0.5)."""
    values = {
        "age": req.age,
        "heightCm": req.heightCm,
        "weightKg": req.weightKg,
        "bmi": bmi,
    }
    out_of_range = sum(
        1 for k, v in values.items() if not (_TRAIN_RANGES[k][0] <= v <= _TRAIN_RANGES[k][1])
    )
    return round(max(0.5, 0.9 - 0.1 * out_of_range), 2)


def predict_calories(store: ModelStore, req: CaloriePredictRequest) -> CaloriePredictResponse:
    """Run the ANN. Caller must ensure `store.ann_ready` is True."""
    bmi = req.weightKg / (req.heightCm / 100.0) ** 2
    features = _build_features(req, bmi)
    scaled = store.ann_scaler.transform(features)
    kcal = float(store.ann_model.predict(scaled, verbose=0)[0][0])
    return CaloriePredictResponse(
        kcal=max(1, round(kcal)),
        modelVersion=store.ann_version or "unknown",
        confidence=_confidence(req, bmi),
    )
