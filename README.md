# NutriMate

> AI-powered diet & meal recommendation system — personalized calorie targets,
> meal plans, hydration goals and health-risk insights for students, gym
> beginners, and budget-conscious users (with a Pakistani-market focus).

NutriMate combines **three machine-learning models** — an ANN for daily-calorie
prediction, a KNN meal-recommendation engine, and an SVM health-risk classifier
— behind a clean, responsive React interface, with graceful fallbacks when the
ML service is unavailable.

See [`PRD.md`](./PRD.md), [`TRD.md`](./TRD.md), and
[`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) for full product and
technical specifications.

---

## Monorepo Layout

```
nutrimate/
├── apps/
│   ├── web/                # React + Vite SPA — 9 screens, design-system theme
│   └── api/                # Express API gateway — auth, profile, predictions,
│   │                       #   recommendations, logs, nutrition, health-risk
├── services/
│   └── ml/                 # FastAPI service — ANN + KNN + SVM models
├── packages/
│   └── shared-types/       # Zod schemas + TS types (single source of truth FE↔BE)
├── PRD.md                  # Product requirements
├── TRD.md                  # Technical requirements
└── IMPLEMENTATION_PLAN.md  # Phased build plan
```

---

## Prerequisites

| Tool               | Version         | Install                                                      |
| ------------------ | --------------- | ------------------------------------------------------------ |
| Node.js            | 20 LTS or newer | https://nodejs.org / via `nvm install 20` (we run v24)       |
| pnpm               | 9.x             | `corepack enable && corepack prepare pnpm@9.15.0 --activate` |
| Python             | 3.11            | https://www.python.org — TensorFlow 2.16 needs 3.11/3.12     |
| MongoDB            | 7.x             | https://www.mongodb.com/docs/manual/installation/            |

Verify after installing:

```bash
node --version    # v20+ (we run v24 locally)
pnpm --version    # 9.x
python3 --version # 3.11.x
mongosh --version
```

> **No Docker is used for the MVP.** All services run directly on the host.

---

## First-Time Setup

```bash
# 1. Install JS workspace dependencies
pnpm install

# 2. Copy the env template and fill in secrets / DB URI
cp .env.example .env
# Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET (each ≥ 32 chars):
#   openssl rand -hex 32
# Optionally set SPOONACULAR_API_KEY for live nutrition search.

# 3. Build the shared types package
pnpm --filter @nutrimate/shared-types build

# 4. Start MongoDB
sudo systemctl start mongod        # or: mongod --dbpath ~/data/db

# 5. Confirm Mongo is reachable
mongosh "mongodb://127.0.0.1:27017"
```

### ML service setup (Python)

The ML service has its own Python virtualenv:

```bash
cd services/ml
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

Then train the models (offline, reproducible). See
[`services/ml/README.md`](./services/ml/README.md) for dataset placement:

```bash
python pipelines/preprocess.py          # ANN dataset
python pipelines/train_ann.py           # calorie ANN
python pipelines/train_knn.py           # meal-recommendation KNN
python pipelines/preprocess_obesity.py  # SVM dataset
python pipelines/train_svm.py           # health-risk SVM
```

---

## Running the Full Stack

Start the four processes (each in its own terminal):

```bash
# 1. MongoDB
mongod --dbpath ~/data/db

# 2. ML service (FastAPI) on :8000
cd services/ml && source .venv/bin/activate
uvicorn nutrimate_ml.main:app --host 0.0.0.0 --port 8000

# 3. API gateway (Express) on :4000
pnpm --filter @nutrimate/api seed:catalog    # one-time, idempotent — seeds the food catalog
pnpm --filter @nutrimate/api dev

# 4. Web client (Vite) on :5173
pnpm --filter @nutrimate/web dev
```

Open http://localhost:5173 — register, complete the profile wizard, and explore.
The app degrades gracefully if the ML service is down (Mifflin–St Jeor calorie
fallback, curated-catalog meal fallback, BMI-band health-risk fallback).

---

## Workspace Scripts (root)

| Command             | What it does                           |
| ------------------- | -------------------------------------- |
| `pnpm install`      | Install all JS workspace deps          |
| `pnpm build`        | Run `build` in every workspace package |
| `pnpm typecheck`    | TypeScript check across all workspaces |
| `pnpm lint`         | ESLint on all JS/TS                    |
| `pnpm format`       | Prettier write all supported files     |
| `pnpm format:check` | Prettier check (CI-friendly)           |

Per-package commands:

```bash
pnpm --filter @nutrimate/api dev            # API dev server (:4000)
pnpm --filter @nutrimate/api seed:catalog   # seed the food catalog (idempotent)
pnpm --filter @nutrimate/web dev            # web dev server (:5173)
pnpm --filter @nutrimate/web build          # production build → apps/web/dist
```

---

## Environment Variables

All variables live in a single repo-root `.env` (see `.env.example`). Highlights:

| Variable                                  | Used by | Notes                                          |
| ----------------------------------------- | ------- | ---------------------------------------------- |
| `MONGODB_URI`                             | api     | MongoDB connection string                      |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`| api     | Each must be ≥ 32 chars                         |
| `ML_SERVICE_URL`                          | api     | ML service base URL (default `:8000`)           |
| `SPOONACULAR_API_KEY`                     | api     | Optional — enables live recipe/nutrition search |
| `EDAMAM_APP_ID` / `EDAMAM_APP_KEY`        | api     | Optional — Edamam fallback provider             |
| `ML_KNN_K`                                | ml      | KNN neighbour count (default 8)                  |
| `VITE_API_BASE_URL`                       | web     | API base URL the SPA calls                       |

Without nutrition API keys, search degrades to a local `food_catalog` text
search — the endpoint stays useful.

---

## Project Status

| Phase | Description                | Status        |
| ----- | -------------------------- | ------------- |
| 0     | Scaffolding & shared types | ✅ Done       |
| 1     | API skeleton + auth        | ✅ Done       |
| 2     | ML service (ANN/KNN/SVM)   | ✅ Done       |
| 3     | API business logic         | ✅ Done       |
| 4     | Frontend foundation        | ✅ Done       |
| 5     | Pages (9 screens)          | ✅ Done       |
| 6     | Quality gates              | ⬛ Descoped   |

All feature phases are complete and verified end-to-end against the live local
stack. Phase 6 (the automated-test suite) was descoped; testing is manual.

---

## License

Released under the [MIT License](./LICENSE).
