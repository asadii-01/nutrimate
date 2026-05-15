# nutrimate-ml

FastAPI service hosting the ANN (calorie prediction) and KNN (meal
recommendation) models. Built in **Phase 2** of the
[IMPLEMENTATION_PLAN.md](../../IMPLEMENTATION_PLAN.md); see TRD §6.

## Local setup

Use Python 3.11 (TensorFlow 2.16 does not support 3.13+). The repo lives on an
NTFS partition — keep the venv and pip cache on the same partition to avoid the
cross-filesystem hang documented in `HANDOFF.md`.

```bash
cd services/ml
pyenv local 3.11.15            # or any 3.11.x
python -m venv .venv
source .venv/bin/activate
export PIP_CACHE_DIR="$PWD/.pip-cache"
pip install -e ".[dev]"
```

## Train the models

The training scripts are offline and reproducible (fixed `random_state`).
Artifacts land in `models/` (gitignored).

```bash
python pipelines/preprocess.py     # → data/synthetic_dataset.csv (20k rows)
python pipelines/train_ann.py      # → models/calorie_ann_v0.1.0.keras + scaler.pkl
python pipelines/train_knn.py      # → models/knn_v0.1.0.pkl
```

- **ANN** — 8-dim input, `64/32/16` ReLU + dropout → linear. Acceptance:
  test MAE ≤ 150 kcal. Latest run: **87.9 kcal**.
- **KNN** — `NearestNeighbors(k=5)` over 52 seed Pakistani meal plans across
  4 profile clusters (low/high-cal × veg/non-veg).

## Run the service

```bash
uvicorn nutrimate_ml.main:app --host 0.0.0.0 --port 8000
# or: python -m nutrimate_ml.main
```

Models load once on startup. If an artifact is missing the service still
starts; the affected endpoint returns 503 so the API can fall back (TRD §6.5).

## Endpoints

| Method | Path                   | Purpose                              |
|--------|------------------------|--------------------------------------|
| GET    | `/ml/health`           | status + model versions + load time  |
| POST   | `/ml/predict-calories` | ANN daily-calorie prediction         |
| POST   | `/ml/recommend-meals`  | KNN meal-plan recommendation         |

Interactive docs at `/docs`. Every response carries an `X-Response-Time-Ms`
header. SLAs (TRD §6.4): ANN p95 ≤ 500 ms, KNN p95 ≤ 300 ms.

### Smoke test

```bash
curl -s localhost:8000/ml/health | jq

curl -s localhost:8000/ml/predict-calories \
  -H 'content-type: application/json' \
  -d '{"age":28,"gender":"male","heightCm":178,"weightKg":75,"activityLevel":"moderate"}' | jq

curl -s localhost:8000/ml/recommend-meals \
  -H 'content-type: application/json' \
  -d '{"features":{"age":22,"bmi":20.5,"activityLevel":5,"goal":"gain","dietPref":"nonveg"},
       "kcalTarget":2700,"dietPref":"nonveg"}' | jq
```

## Layout

```
services/ml/
├── pyproject.toml
├── .env.example
├── nutrimate_ml/          # FastAPI app
│   ├── main.py            # app, routes, lifespan, JSON logging
│   ├── config.py          # env-sourced settings
│   ├── schemas.py         # pydantic DTOs (mirror @nutrimate/shared-types)
│   ├── artifacts.py       # startup model loader (degrades, never crashes)
│   ├── predictor.py       # ANN inference
│   └── recommender.py     # KNN lookup + diet/budget composition
├── pipelines/             # offline training
│   ├── preprocess.py      # Mifflin–St Jeor synthetic dataset
│   ├── train_ann.py       # calorie ANN
│   ├── train_knn.py       # meal-recommendation KNN
│   └── seed_data.py       # Pakistani dish library + 52 seed meal plans
├── data/                  # generated datasets (gitignored)
└── models/                # versioned artifacts (gitignored)
```
