"""Health-risk classification — turns a request into the 8-dim feature vector
and runs the SVM pipeline (StandardScaler + SVC) to grade low/moderate/high."""

from __future__ import annotations

import numpy as np

from .artifacts import ModelStore
from .schemas import HealthRiskRequest, HealthRiskResponse

# Must match FEATURE_ORDER in pipelines/train_svm.py (same layout as the ANN).
_ACTIVITY_ORDINAL = {
    "sedentary": 1,
    "light": 2,
    "moderate": 3,
    "active": 4,
    "very_active": 5,
}


def _build_features(req: HealthRiskRequest, bmi: float) -> np.ndarray:
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
        dtype=np.float64,
    )


def predict_health_risk(store: ModelStore, req: HealthRiskRequest) -> HealthRiskResponse:
    """Run the SVM. Caller must ensure `store.svm_ready` is True."""
    artifact = store.svm
    assert artifact is not None  # guarded by caller

    bmi = req.bmi if req.bmi is not None else req.weightKg / (req.heightCm / 100.0) ** 2
    features = _build_features(req, bmi)

    pipeline = artifact["pipeline"]
    classes: list[str] = artifact["classes"]
    proba = pipeline.predict_proba(features)[0]
    best = int(np.argmax(proba))

    return HealthRiskResponse(
        riskLevel=classes[best],
        confidence=round(float(proba[best]), 4),
        probabilities={cls: round(float(p), 4) for cls, p in zip(classes, proba)},
        modelVersion=artifact.get("version") or store.svm_version or "unknown",
    )
