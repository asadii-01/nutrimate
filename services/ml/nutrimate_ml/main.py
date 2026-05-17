"""FastAPI entrypoint for the NutriMate ML service.

Endpoints (TRD §6.4):
    GET  /ml/health             — model versions + load time
    GET  /ml/metrics            — training-time metrics for all three models
    POST /ml/predict-calories   — ANN calorie prediction
    POST /ml/recommend-meals    — KNN meal recommendation
    POST /ml/predict-health-risk — SVM health-risk classification

Models load once on startup. If an artifact is missing the service still comes
up; the affected endpoint returns 503 so the API can fall back (TRD §6.5).
"""

from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from . import __version__
from .artifacts import store
from .config import settings
from .predictor import predict_calories
from .recommender import RecommendationError, recommend_meals
from .risk import predict_health_risk
from .schemas import (
    CaloriePredictRequest,
    CaloriePredictResponse,
    HealthResponse,
    HealthRiskRequest,
    HealthRiskResponse,
    MealRecommendRequest,
    MealRecommendResponse,
    ModelMetricsResponse,
)

logging.basicConfig(
    level=settings.log_level,
    format='{"ts":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","msg":"%(message)s"}',
)
logger = logging.getLogger("nutrimate_ml")


@asynccontextmanager
async def lifespan(_: FastAPI):
    started = time.perf_counter()
    store.load()
    logger.info(
        "startup complete in %.2fs (ann=%s knn=%s svm=%s)",
        time.perf_counter() - started,
        store.ann_ready,
        store.knn_ready,
        store.svm_ready,
    )
    yield


app = FastAPI(title="NutriMate ML", version=__version__, lifespan=lifespan)


@app.middleware("http")
async def timing(request: Request, call_next):
    """Stamp each response with its server-side latency (SLA visibility)."""
    started = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - started) * 1000
    response.headers["X-Response-Time-Ms"] = f"{elapsed_ms:.1f}"
    return response


@app.get("/ml/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    ready = [store.ann_ready, store.knn_ready, store.svm_ready]
    if all(ready):
        status = "ok"
    elif any(ready):
        status = "degraded"
    else:
        status = "down"
    return HealthResponse(
        status=status,
        annVersion=store.ann_version,
        knnVersion=store.knn_version,
        svmVersion=store.svm_version,
        annLoaded=store.ann_ready,
        knnLoaded=store.knn_ready,
        svmLoaded=store.svm_ready,
        loadedAt=store.loaded_at,
    )


@app.get("/ml/metrics", response_model=ModelMetricsResponse)
async def metrics() -> ModelMetricsResponse:
    """Training-time metrics for the ANN, KNN and SVM (read from the pipelines'
    metric files at startup). Informational — no fallback."""
    return ModelMetricsResponse(
        ann=store.metrics.get("ann"),
        knn=store.metrics.get("knn"),
        svm=store.metrics.get("svm"),
    )


@app.post("/ml/predict-calories", response_model=CaloriePredictResponse)
async def predict(req: CaloriePredictRequest) -> CaloriePredictResponse:
    if not store.ann_ready:
        raise HTTPException(status_code=503, detail="calorie model unavailable")
    try:
        return predict_calories(store, req)
    except Exception:  # noqa: BLE001
        logger.exception("prediction failed")
        raise HTTPException(status_code=500, detail="prediction failed")


@app.post("/ml/recommend-meals", response_model=MealRecommendResponse)
async def recommend(req: MealRecommendRequest) -> MealRecommendResponse:
    if not store.knn_ready:
        raise HTTPException(status_code=503, detail="recommendation model unavailable")
    try:
        return recommend_meals(store, req)
    except RecommendationError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception:  # noqa: BLE001
        logger.exception("recommendation failed")
        raise HTTPException(status_code=500, detail="recommendation failed")


@app.post("/ml/predict-health-risk", response_model=HealthRiskResponse)
async def predict_risk(req: HealthRiskRequest) -> HealthRiskResponse:
    if not store.svm_ready:
        raise HTTPException(status_code=503, detail="health-risk model unavailable")
    try:
        return predict_health_risk(store, req)
    except Exception:  # noqa: BLE001
        logger.exception("health-risk prediction failed")
        raise HTTPException(status_code=500, detail="health-risk prediction failed")


@app.exception_handler(Exception)
async def unhandled(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "internal error"})


def run() -> None:
    """`python -m nutrimate_ml.main` — dev convenience runner."""
    import uvicorn

    uvicorn.run(
        "nutrimate_ml.main:app",
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    run()
