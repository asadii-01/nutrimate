# nutrimate-ml

FastAPI service hosting three models: the ANN (calorie prediction), the KNN
(meal recommendation) and the SVM (health-risk classification). Built in
**Phase 2** of the [IMPLEMENTATION_PLAN.md](../../IMPLEMENTATION_PLAN.md);
see TRD §6.

## Local setup

Use Python 3.11 (TensorFlow 2.16 does not support 3.13+).

```bash
cd services/ml
pyenv local 3.11.15            # or any 3.11.x
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

## Train the models

The training scripts are offline and reproducible (fixed `random_state`).
Artifacts land in `models/` (gitignored).

```bash
python pipelines/preprocess.py          # → data/calorie_dataset.csv (ANN hybrid)
python pipelines/train_ann.py           # → models/calorie_ann_v0.2.0.keras + scaler.pkl
python pipelines/train_knn.py           # → models/knn_v0.1.0.pkl
python pipelines/preprocess_obesity.py  # → data/health_risk_dataset.csv (SVM)
python pipelines/train_svm.py           # → models/svm_v0.1.0.pkl
```

- **ANN** — 8-dim input, `64/32/16` ReLU + dropout → linear. Reference:
  test MAE ≤ 150 kcal. Trained on a hybrid dataset (real Kaggle rows +
  Mifflin–St Jeor label).
- **KNN** — `NearestNeighbors(k=8)` over 52 seed Pakistani meal plans across
  4 profile clusters (low/high-cal × veg/non-veg).
- **SVM** — `SVC(kernel="rbf")` health-risk classifier (low/moderate/high),
  bundled with its `StandardScaler` in a sklearn `Pipeline`. 8-dim input
  (same layout as the ANN). Trained on the real UCI/Kaggle "Obesity Levels"
  dataset — place `ObesityDataSet_raw_and_data_sinthetic.csv` in
  `data/raw/` first. Latest run: **test accuracy 96.2%**, macro-F1 0.95.

## Run the service

```bash
uvicorn nutrimate_ml.main:app --host 0.0.0.0 --port 8000
# or: python -m nutrimate_ml.main
```

Models load once on startup. If an artifact is missing the service still
starts; the affected endpoint returns 503 so the API can fall back (TRD §6.5).

## Endpoints

| Method | Path                      | Purpose                                |
| ------ | ------------------------- | -------------------------------------- |
| GET    | `/ml/health`              | status + model versions + load time    |
| GET    | `/ml/metrics`             | ANN/KNN/SVM training metrics            |
| POST   | `/ml/predict-calories`    | ANN daily-calorie prediction           |
| POST   | `/ml/recommend-meals`     | KNN meal-plan recommendation           |
| POST   | `/ml/predict-health-risk` | SVM health-risk classification         |

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

curl -s localhost:8000/ml/predict-health-risk \
  -H 'content-type: application/json' \
  -d '{"age":45,"gender":"male","heightCm":170,"weightKg":105,"activityLevel":"sedentary"}' | jq
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
│   ├── recommender.py     # KNN lookup + diet/budget composition
│   └── risk.py            # SVM health-risk inference
├── pipelines/             # offline training
│   ├── preprocess.py          # ANN hybrid dataset (real rows + Mifflin label)
│   ├── train_ann.py           # calorie ANN
│   ├── train_knn.py           # meal-recommendation KNN
│   ├── seed_data.py           # Pakistani dish library + 52 seed meal plans
│   ├── preprocess_obesity.py  # SVM dataset (Obesity Levels → 3-class risk)
│   └── train_svm.py           # health-risk SVM
├── data/                  # generated datasets (gitignored)
└── models/                # versioned artifacts (gitignored)
```
