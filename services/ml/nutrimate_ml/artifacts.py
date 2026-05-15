"""Model artifact loading. Loads once at startup; never raises on missing files
so the service can come up degraded and 503 individual endpoints (TRD §6.5)."""

from __future__ import annotations

import logging
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# Keep TensorFlow quiet before it is imported.
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

import joblib  # noqa: E402

from .config import settings  # noqa: E402

logger = logging.getLogger("nutrimate_ml.artifacts")

_ANN_RE = re.compile(r"calorie_ann_v(?P<ver>[\d.]+)\.keras$")
_KNN_RE = re.compile(r"knn_v(?P<ver>[\d.]+)\.pkl$")


def _latest(models_dir: Path, pattern: re.Pattern[str]) -> tuple[Path, str] | None:
    """Return the highest-versioned file matching `pattern`, or None."""
    candidates: list[tuple[tuple[int, ...], Path, str]] = []
    if not models_dir.is_dir():
        return None
    for path in models_dir.iterdir():
        m = pattern.search(path.name)
        if m:
            ver = m.group("ver")
            key = tuple(int(x) for x in ver.split("."))
            candidates.append((key, path, ver))
    if not candidates:
        return None
    candidates.sort()
    _, path, ver = candidates[-1]
    return path, ver


class ModelStore:
    """Holds loaded models. Attributes are None until `load()` succeeds."""

    def __init__(self) -> None:
        self.ann_model: Any | None = None
        self.ann_scaler: Any | None = None
        self.ann_version: str | None = None
        self.knn: dict[str, Any] | None = None
        self.knn_version: str | None = None
        self.loaded_at: str | None = None
        self.errors: list[str] = []

    @property
    def ann_ready(self) -> bool:
        return self.ann_model is not None and self.ann_scaler is not None

    @property
    def knn_ready(self) -> bool:
        return self.knn is not None

    def load(self) -> None:
        models_dir = settings.models_dir
        logger.info("loading model artifacts from %s", models_dir)
        self._load_ann(models_dir)
        self._load_knn(models_dir)
        self.loaded_at = datetime.now(timezone.utc).isoformat()

    def _load_ann(self, models_dir: Path) -> None:
        found = _latest(models_dir, _ANN_RE)
        scaler_path = models_dir / "scaler.pkl"
        if found is None:
            self.errors.append("ANN model file not found")
            logger.warning("ANN model not found in %s — predict-calories will 503", models_dir)
            return
        model_path, version = found
        if not scaler_path.exists():
            self.errors.append("ANN scaler.pkl not found")
            logger.warning("scaler.pkl missing — predict-calories will 503")
            return
        try:
            import tensorflow as tf

            self.ann_model = tf.keras.models.load_model(model_path)
            self.ann_scaler = joblib.load(scaler_path)
            self.ann_version = version
            logger.info("loaded ANN v%s from %s", version, model_path.name)
        except Exception as exc:  # noqa: BLE001 — degrade, don't crash
            self.errors.append(f"ANN load failed: {exc}")
            logger.exception("failed to load ANN model")

    def _load_knn(self, models_dir: Path) -> None:
        found = _latest(models_dir, _KNN_RE)
        if found is None:
            self.errors.append("KNN model file not found")
            logger.warning("KNN model not found in %s — recommend-meals will 503", models_dir)
            return
        knn_path, version = found
        try:
            self.knn = joblib.load(knn_path)
            self.knn_version = self.knn.get("version", version)
            logger.info(
                "loaded KNN v%s (%d plans, k=%s) from %s",
                self.knn_version,
                len(self.knn.get("plans", [])),
                self.knn.get("k"),
                knn_path.name,
            )
        except Exception as exc:  # noqa: BLE001
            self.errors.append(f"KNN load failed: {exc}")
            logger.exception("failed to load KNN model")


store = ModelStore()
