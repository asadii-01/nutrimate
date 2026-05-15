"""Runtime configuration, sourced from environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

SERVICE_ROOT = Path(__file__).resolve().parent.parent


@dataclass(frozen=True)
class Settings:
    host: str = os.getenv("ML_HOST", "0.0.0.0")
    port: int = int(os.getenv("ML_PORT", "8000"))
    models_dir: Path = Path(os.getenv("ML_MODELS_DIR", str(SERVICE_ROOT / "models")))
    knn_k: int = int(os.getenv("ML_KNN_K", "5"))
    log_level: str = os.getenv("ML_LOG_LEVEL", "INFO").upper()
    # ±tolerance band when composing a plan against the kcal target (TRD §6.2).
    kcal_tolerance: float = float(os.getenv("ML_KCAL_TOLERANCE", "0.10"))


settings = Settings()
