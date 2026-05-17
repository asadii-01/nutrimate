# @nutrimate/api

Express API gateway for NutriMate. Owns authentication, request validation, the
data model, and orchestration of the ML service and external nutrition
providers. All business endpoints are wired and verified end-to-end against live
MongoDB + the ML service.

## Running locally

From the repo root:

```bash
# 1. Make sure Mongo is running
sudo systemctl start mongod   # or: mongod --dbpath ~/data/db

# 2. Copy the env template and fill in JWT secrets (≥ 32 chars each)
cp .env.example .env
# Edit JWT_ACCESS_SECRET / JWT_REFRESH_SECRET — e.g. `openssl rand -hex 32`
# Optionally set SPOONACULAR_API_KEY for live nutrition search.

# 3. Seed the food catalog (one-time, idempotent — 36 Pakistani dishes)
pnpm --filter @nutrimate/api seed:catalog

# 4. Dev server (auto-reload)
pnpm --filter @nutrimate/api dev

# Or one-shot build + run
pnpm --filter @nutrimate/api build
pnpm --filter @nutrimate/api start
```

The API listens on `http://localhost:4000` by default. For the ML-backed
endpoints (predictions, recommendations, health-risk), also run the ML service
on `:8000` — see [`services/ml/README.md`](../../services/ml/README.md). If the
ML service is down the API falls back to formula-based logic (TRD §6.6).

## Endpoints

All business endpoints are under `/api/v1` and (except auth) require an
`Authorization: Bearer <jwt>` header.

### Auth & system

| Method | Path                    | Notes                                                      |
| ------ | ----------------------- | ---------------------------------------------------------- |
| GET    | `/healthz`              | Liveness + Mongo connectivity (503 if Mongo is down)       |
| POST   | `/api/v1/auth/register` | `{ email, password }` → `{ accessToken, refreshToken, … }` |
| POST   | `/api/v1/auth/login`    | `{ email, password }` → tokens                             |
| POST   | `/api/v1/auth/refresh`  | `{ refreshToken }` → new tokens, revokes old jti           |
| POST   | `/api/v1/auth/logout`   | `{ refreshToken }` → 204; idempotent                       |
| GET    | `/api/v1/me`            | Protected echo: returns the bearer's user info             |

### Profile, predictions & recommendations

| Method | Path                              | Notes                                                  |
| ------ | --------------------------------- | ------------------------------------------------------ |
| GET    | `/api/v1/profile`                 | Current user's profile (404 if not yet created)        |
| POST   | `/api/v1/profile`                 | Create profile; awaits the first prediction            |
| PATCH  | `/api/v1/profile`                 | Update profile; recomputes prediction in background    |
| GET    | `/api/v1/predictions/calories`    | Latest calorie target + BMI (`source: ann｜fallback`)   |
| POST   | `/api/v1/predictions/recompute`   | Force recomputation                                    |
| GET    | `/api/v1/recommendations/today`   | Today's meal plan (persisted in `meal_plans`)          |
| POST   | `/api/v1/recommendations/swap`    | Swap one meal `{ mealType }`                           |
| POST   | `/api/v1/recommendations/regenerate` | Regenerate the whole day                            |
| GET    | `/api/v1/health-risk`             | Multi-factor health-risk grade (SVM; BMI-band fallback)|

### Logs, nutrition & models

| Method | Path                                | Notes                                          |
| ------ | ----------------------------------- | ---------------------------------------------- |
| POST   | `/api/v1/logs/meal`                 | Log a meal `{ mealType, items }`               |
| POST   | `/api/v1/logs/water`                | Log glasses `{ glasses }` — cumulative per day |
| GET    | `/api/v1/logs/day?date=YYYY-MM-DD`  | Day summary (incl. `loggedMeals`)              |
| GET    | `/api/v1/logs/range?from=&to=`      | Date range — feeds the progress charts         |
| GET    | `/api/v1/nutrition/search?q=`       | Food search — cached 24h; catalog fallback     |
| GET    | `/api/v1/nutrition/item/:id`        | Item detail                                    |
| GET    | `/api/v1/models/metrics`            | ANN/KNN/SVM training metrics (proxied from ML) |

## Smoke test

```bash
# Register
curl -s http://localhost:4000/api/v1/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"test@example.com","password":"hunter2hunter2"}' | jq

# Login
TOKEN=$(curl -s http://localhost:4000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"test@example.com","password":"hunter2hunter2"}' | jq -r .accessToken)

# Call a protected route
curl -s http://localhost:4000/api/v1/me -H "authorization: Bearer $TOKEN" | jq
```

## Layout

```
src/
├── server.ts          # entry point — connects Mongo, starts HTTP, graceful shutdown
├── app.ts             # composes middleware + routes
├── config/env.ts      # Zod-validated env vars
├── db/mongo.ts        # mongoose connection helpers
├── lib/               # logger, errors, password, jwt, bmi, dates, mifflin, mlClient
├── jobs/              # in-process monthly maintenance scheduler
├── data/              # food-catalog seed JSON
├── scripts/           # seedFoodCatalog (pnpm seed:catalog)
├── middleware/        # errorHandler, validate, auth, rateLimit
├── models/            # Mongoose models (TRD §5.1 + RefreshToken + MealPlan)
├── modules/           # auth, profile, predictions, recommendations,
│                      #   health-risk, logs, nutrition (service + routes per module)
└── routes/            # /healthz, /me, /models, /api/v1 router
```

## Behaviours worth knowing

- **Calorie target** = ML maintenance kcal + goal delta (`lose −500`,
  `gain +500`, `maintain 0`), clamped to a 1200 kcal floor.
- **ML fallback (TRD §6.6):** on ML timeout/5xx, predictions fall back to
  Mifflin–St Jeor, recommendations to a curated-catalog composer, and
  health-risk to a BMI-band heuristic — all tagged `source: "fallback"`.
- **Refresh-token rotation:** `/auth/refresh` revokes the old jti and issues a
  fresh pair; logout is idempotent.
- **Nutrition search** checks a 24h cache, then Spoonacular (if keyed), then
  Edamam, then a local `food_catalog` text search.
- **Recommendations are persisted** in `meal_plans` per `{ userId, date }` so
  swap/regenerate mutate a stable plan.
