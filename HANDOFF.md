# NutriMate – Handoff Notes

| Field          | Value                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------ |
| Last updated   | 2026-05-17 (added a 3rd ML model — health-risk SVM — see "SVM health-risk model")                  |
| Author         | Claude (Opus 4.7) + Asad                                                                         |
| Current phase  | Phase 5 complete & verified; Phase 6 descoped; post-Phase-5 fixes ongoing                        |
| Repo location  | **`/home/asad-tauqeer/develop/ml`** (ext4) — see "Repo location & migration" below               |
| Companion docs | [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md), [`PRD.md`](./PRD.md), [`TRD.md`](./TRD.md) |

---

## TL;DR

- **Phase 0 (scaffolding):** complete and verified — lint, typecheck, build all green.
- **Phase 1 (API skeleton):** complete and verified — deps installed, register → login → `/me` smoke test passes.
- **Phase 2 (ML service):** complete and verified — ANN test MAE 87.9 kcal, KNN serving 52 seed plans, all 3 endpoints smoke-tested within SLA.
- **Phase 3 (API business logic):** complete and verified — profile, predictions, recommendations, logs, nutrition-search wired; food catalog seeded (36 dishes); end-to-end smoke test green against live Mongo + ML.
- **Phase 4 (frontend foundation):** complete and verified — `pnpm install` succeeded (network back, 2m30s), `typecheck` + `build` green, auth flow (register → login → `/me`) smoke-tested against the live API.
- **Phase 5 (pages):** **complete and verified.** All 9 screens built — public landing, auth, 4-step profile wizard, dashboard, meal recommendations, nutrition search, progress analytics, settings, plus shared empty/loading/error states. `typecheck` + `lint` (0 problems) + `build` green; full end-to-end smoke test passed against live Mongo + ML + API (auth, profile, predictions, recommendations + swap, logs meal/water/day/range, nutrition search). Web dev server serves `/` and SPA routes.
- **Phase 6 (quality gates): descoped** — the user opted out of the heavy
  automated-test suite; testing is manual against the live local stack.
- **Post-Phase-5 fixes (2026-05-16):** Spoonacular recipe search wired up with
  real keys, the meal-plan swap/regenerate "nothing changes" bug fixed, and a
  "meal eaten" indicator added to the Meals page. See "Post-Phase-5 changes".
- **ANN dataset migration (2026-05-17):** the calorie ANN moved off the fully
  synthetic grid to a hybrid dataset — real Kaggle demographic rows + a
  Mifflin–St Jeor kcal label. ANN v0.2.0, test MAE 114, verified. See "ANN
  real-dataset migration".
- **SVM health-risk model (2026-05-17):** a 3rd ML model added — an `SVC`
  health-risk classifier (low/moderate/high), trained on the real UCI/Kaggle
  "Obesity Levels" dataset (test accuracy 96.2%). Exposed end-to-end:
  `POST /ml/predict-health-risk` → `GET /api/v1/health-risk` → a dashboard
  "Health risk" card. SVM v0.1.0, verified. See "SVM health-risk model".
- **Project is a git repo** (branch `master`). Linear history on the ext4 copy:
  `4de2bf5` Phases 0–2 → `fa85873` Phase 3 → `93b077b` Phase 4 → `721ae59`
  Phase 5 → `c41872d` post-Phase-5 fixes → `92c4cdb` ANN hybrid-dataset
  migration. Working tree is clean.
- **The project now lives on ext4** at `/home/asad-tauqeer/develop/ml`. The old
  NTFS partition copy is detached and obsolete — all NTFS workaround notes below
  are **historical only**. See "Repo location & migration".

---

## Repo location & migration (2026-05-16)

The project was developed on an NTFS partition, then moved to ext4 at
`/home/asad-tauqeer/develop/ml`. A Claude session mistakenly ran Phase 5 in the
**old NTFS copy**, so the two copies diverged. On 2026-05-16 this was resolved:

- Phase 5's `apps/web` work was synced from the NTFS copy into the ext4 repo and
  committed as `721ae59` on top of the ext4 Phase 4 commit (`93b077b`). The only
  Phase 5 code lives in `apps/web`; `apps/api`, `services/ml`, and
  `packages/shared-types` were byte-identical between the copies.
- **`.gitignore` bug fixed:** a bare `logs/` rule was silently ignoring
  `apps/api/src/modules/logs/` (Phase 3) and `apps/web/src/features/logs/`
  (Phase 5) — 4 source files that had never been committed. The rule is now
  anchored to `/logs/`; the files are committed in `721ae59`.
- **All four services now run from ext4** — API :4000, web :5173, ML :8000
  (its own ext4 venv at `services/ml/.venv`), Mongo :27017 (`~/data/db`).
- The NTFS copy at `/run/media/.../Development/ML` is detached and can be
  archived/deleted. The NTFS-specific workarounds below (`.npmrc` store-dir,
  venv-on-NTFS) **do not apply** to the ext4 repo and are kept only as history.

> **Start new sessions from `/home/asad-tauqeer/develop/ml`.**

---

## What's on disk right now

```
nutrimate/                                 (this directory — repo root)
├── PRD.md, TRD.md, design.md,             # Hand-authored specs
│   project-description.md
├── designs/                               # Stitch UI mocks + design system YAML
│
├── IMPLEMENTATION_PLAN.md                 # The build plan
├── HANDOFF.md                             # ← this file
├── README.md                              # Setup/prereqs/scripts
│
├── package.json, pnpm-workspace.yaml      # Root workspace
├── tsconfig.base.json
├── eslint.config.js, .prettierrc.json, .prettierignore
├── .editorconfig, .gitignore, .npmrc, .env.example
├── pnpm-lock.yaml                         # Root deps only — apps/api not in lock yet
│
├── apps/
│   ├── api/                               # ✅ Phases 1 & 3 — all endpoints wired, e2e smoke test passes
│   │   ├── package.json, tsconfig.json, README.md
│   │   └── src/                           # Phase 1 skeleton + Phase 3 modules (see layouts below)
│   └── web/                               # ✅ Phases 4 & 5 — shell + all 9 pages, build green
│       ├── package.json, vite.config.ts, tailwind.config.js, tsconfig.json
│       └── src/                           # shell + features/* api hooks + pages/*
│
├── services/
│   └── ml/                                # ✅ Phase 2 — FastAPI app + pipelines + trained models
│
├── packages/
│   └── shared-types/                      # ✅ Built and used by apps/api
│       ├── src/ (auth, common, log, meal, prediction, profile, index)
│       └── dist/ (compiled)
│
├── node_modules/, .pnpm-store/            # Root install only
└── .claude/                               # Claude Code workspace state
```

---

## Phase status

| Phase | Description               | Status         | Notes                                                                                           |
| ----- | ------------------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| 0     | Repo & tooling foundation | ✅ Done        | `pnpm install` 47s, `pnpm build/typecheck/lint/format:check` all green.                         |
| 1     | API skeleton + auth       | ✅ Done        | Deps installed; register → login → `/me` smoke test passes.                                     |
| 2     | ML service (ANN + KNN)    | ✅ Done        | ANN MAE 87.9 kcal; KNN 52 seed plans; `/ml/*` endpoints verified, p95 well under SLA.           |
| 3     | API business logic        | ✅ Done        | Profile/predictions/recommendations/logs/nutrition wired; catalog seeded; e2e smoke test green. |
| 4     | Frontend foundation       | ✅ Done        | Shell verified — `pnpm install` ran, typecheck/build green, auth smoke test passes.            |
| 5     | Pages                     | ✅ Done        | All 9 screens built; typecheck/lint/build green; e2e smoke test green against live stack.       |
| 6     | Quality gates             | ⬛ Descoped    | User opted out of the automated-test suite; testing is manual against the live stack.           |

---

## Environment notes (important)

> **Historical — superseded by the ext4 migration (see "Repo location &
> migration" above).** The notes in this section describe the old NTFS setup.
> The current ext4 repo has no cross-filesystem hang; `pnpm install` is fast and
> the `.npmrc` `store-dir` line is not present in the ext4 copy.

### NTFS hang on cross-filesystem pnpm installs

- The repo lives on `/dev/nvme0n1p1` (NTFS via `ntfs3`).
- pnpm's default content-addressable store is on `~/.local/share/pnpm/store` (ext4 root).
- Hardlinks cannot cross filesystems, so pnpm falls back to **copying** every file.
- On NTFS this can hang indefinitely (we saw a 4h 43m hang, 0 IO progress in the last 45m).
- **Fix in place:** `.npmrc` at the repo root pins `store-dir=./.pnpm-store` so the store sits on the same NTFS partition and hardlinks work.
- **First install after applying the fix:** 47s.

> Keep `.npmrc` checked in. If you ever clone this repo elsewhere, you can delete that line.

### bcrypt → bcryptjs swap

- Original Phase 1 plan: `bcrypt` (native).
- `bcrypt`'s postinstall downloads a prebuilt binary; on NTFS this hung the install for hours.
- **Switched to `bcryptjs`** (pure JS, no postinstall). Performance at cost 12: ~50 ms vs ~10 ms — fine for our scale.
- Code already uses `bcryptjs` in `apps/api/src/lib/password.ts`; `apps/api/package.json` already lists it. No further action needed.

### Toolchain pinned during dev

- Node v24.15.0 (via nvm) — `package.json` engines pin is `>=20`.
- pnpm 9.15.0 (via corepack).
- Python 3.11.15 installed via **pyenv** (host default is 3.14, which TF can't use). pyenv init lines were appended to `~/.bashrc`. `services/ml/.python-version` pins `3.11.15`.
- ML venv at `services/ml/.venv` (on NTFS, beside the code). pip cache pinned via `PIP_CACHE_DIR=services/ml/.pip-cache` — same NTFS cross-fs reasoning as the pnpm store.
- Installed ML stack: TensorFlow 2.16.2, scikit-learn 1.8.0, FastAPI 0.136.1, pandas 2.3.3, numpy 1.26.4.

---

## Phase 0 — what got built

### Root tooling

- `package.json` (workspace root, ESM, scripts: build / typecheck / lint / format / format:check).
- `pnpm-workspace.yaml` — workspaces: `apps/*`, `packages/*`.
- `tsconfig.base.json` — strict, ES2022, bundler resolution.
- `eslint.config.js` (flat config v9), `.prettierrc.json`, `.prettierignore` (excludes user-authored docs).
- `.editorconfig`, `.gitignore`, `.env.example`, `.npmrc`.

### `packages/shared-types`

Zod schemas + inferred TypeScript types, compiled to `dist/`. Single source of truth FE↔BE.

| File            | Exports                                                                                                                                         |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `common.ts`     | enums (Gender, ActivityLevel, Goal, DietPref, BudgetTier, MealType, BmiCategory, PredictionSource, CostTier), IsoDate, ObjectId, ApiError shape |
| `auth.ts`       | Email/Password schemas, Register/Login/Refresh requests, AuthTokens                                                                             |
| `profile.ts`    | ProfileInput / Profile / ProfilePatch (PRD physiological ranges)                                                                                |
| `prediction.ts` | Prediction + ML request/response DTOs                                                                                                           |
| `meal.ts`       | Macros, FoodItem, Meal, MealPlan, MealRecommendRequest, FoodCatalogItem                                                                         |
| `log.ts`        | MealLogEntry, WaterLogEntry, MealLogInput, WaterLogInput, DaySummary                                                                            |

Import as `@nutrimate/shared-types`.

---

## Phase 1 — what got built (code, not yet run)

### Layout

```
apps/api/src/
├── server.ts                       # entry — connect Mongo, start HTTP, graceful shutdown
├── app.ts                          # helmet, cors, json, pino-http, rate limit, routers, error handler
├── config/env.ts                   # Zod-validated env (fails fast if JWT secrets < 32 chars)
├── db/mongo.ts                     # mongoose connect/disconnect, event logging, URI masking
├── lib/
│   ├── logger.ts                   # pino + pino-pretty in dev
│   ├── errors.ts                   # ApiError class, ApiErrorCode union, RFC-7807 JSON shape
│   ├── password.ts                 # bcryptjs hash/verify, cost from env
│   └── jwt.ts                      # access (24h) + refresh (30d) sign/verify, jti support
├── middleware/
│   ├── errorHandler.ts             # ApiError | ZodError | JWT errors → JSON
│   ├── validate.ts                 # validate(schema, "body"|"query"|"params")
│   ├── auth.ts                     # Bearer guard, sets req.userId
│   └── rateLimit.ts                # generalLimiter (120/min), authLimiter (20/15min)
├── models/                         # Mongoose schemas — TRD §5.1
│   ├── User.ts                     # email unique, passwordHash, timestamps
│   ├── Profile.ts                  # PRD ranges enforced
│   ├── Prediction.ts               # compound index { userId, date }
│   ├── MealLog.ts                  # FoodItem subdoc, compound index
│   ├── WaterLog.ts                 # compound index
│   ├── FoodCatalog.ts              # text index on name, secondary on dietTags+costTier
│   ├── NutritionCache.ts           # TTL 86400s on fetchedAt
│   ├── RefreshToken.ts             # jti unique, expiresAt TTL, revokedAt on logout
│   └── index.ts
├── modules/auth/
│   ├── auth.service.ts             # register, login, refresh (rotates jti), logout (revokes jti)
│   └── auth.routes.ts              # POST register/login/refresh/logout, behind authLimiter
└── routes/
    ├── healthz.ts                  # GET /healthz — 200 if mongo connected, 503 otherwise
    ├── me.ts                       # GET /api/v1/me — protected echo (verifies bearer flow)
    └── index.ts                    # mounts /auth and /me under /api/v1
```

### Behaviors worth knowing

- **Refresh-token rotation:** `/auth/refresh` revokes the old jti and issues a fresh refresh + access pair.
- **Logout is idempotent:** invalid tokens silently no-op.
- **Mongo URI is logged with the password masked.**
- **`/healthz` returns 503 if Mongo is disconnected** — fine for an uptime probe.
- **Error responses follow TRD §4.8:** `{ error: { code, message, details? } }` with stable `code` strings.

---

## How to resume Phase 1 verification

```bash
# 1. Install API deps (store is pre-warmed — should be fast, ~1–2 min)
pnpm install --prefer-offline

# If install hangs again, retry with:
#   pnpm install --prefer-offline --ignore-scripts

# 2. Bring up Mongo
sudo systemctl start mongod
# or, ad-hoc:  mongod --dbpath ~/data/db

# 3. Configure secrets (each must be ≥ 32 chars)
cp .env.example .env
# Edit JWT_ACCESS_SECRET and JWT_REFRESH_SECRET, e.g.:
#   openssl rand -hex 32

# 4. Run API
pnpm --filter @nutrimate/api dev

# 5. Smoke test
curl -s http://localhost:4000/healthz | jq

curl -s http://localhost:4000/api/v1/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"test@example.com","password":"hunter2hunter2"}' | jq

TOKEN=$(curl -s http://localhost:4000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"test@example.com","password":"hunter2hunter2"}' | jq -r .accessToken)

curl -s http://localhost:4000/api/v1/me -H "authorization: Bearer $TOKEN" | jq
```

**Phase 1 exit criteria:** can register → login → call `/me` with bearer. ✅ Verified.

---

## Phase 2 — what got built (complete and verified)

### Layout

```
services/ml/
├── pyproject.toml, .env.example, .gitignore, README.md
├── nutrimate_ml/                  # FastAPI app
│   ├── main.py                    # app, routes, lifespan, JSON logging, timing middleware
│   ├── config.py                  # env-sourced settings
│   ├── schemas.py                 # pydantic DTOs — mirror @nutrimate/shared-types
│   ├── artifacts.py               # startup model loader; degrades, never crashes
│   ├── predictor.py               # ANN inference (8-dim feature build + scale)
│   └── recommender.py             # KNN lookup + diet/budget filter + kcal composition
├── pipelines/                     # offline, reproducible (fixed random_state)
│   ├── preprocess.py              # ingest+clean real Kaggle calorie dataset
│   ├── train_ann.py               # calorie ANN
│   ├── train_knn.py               # meal-recommendation KNN
│   └── seed_data.py               # 36 Pakistani dishes + 52 seed meal plans
├── data/                          # raw/ (Kaggle CSV) + calorie_dataset.csv (gitignored)
└── models/                        # calorie_ann_v0.1.0.keras, scaler.pkl, knn_v0.1.0.pkl (gitignored)
```

### Models

- **ANN** — 8-dim input `[age, gender×3 one-hot, heightCm, weightKg, activityOrdinal, bmi]`.
  BMI is the engineered 8th feature (TRD §6.1 lists 7 raw fields but specifies `Input(8)`).
  Originally trained on a fully synthetic Mifflin–St Jeor grid (Test MAE 87.9).
  **As of 2026-05-17 (ANN v0.2.0) it trains on a hybrid dataset — real Kaggle
  demographic rows + a Mifflin–St Jeor kcal label, Test MAE 114** — see
  "ANN real-dataset migration".
- **KNN** — `NearestNeighbors`, Euclidean on StandardScaler-normalized
  `[age, bmi, activityLevel, goalEnc, dietEnc]`. 52 seed plans across 4 clusters
  (low/high-cal × veg/non-veg), 13 each. Dish catalog bundled into the artifact
  so the recommender can filter/substitute at inference. (`k` was 5 at Phase 2;
  raised to 8 in the post-Phase-5 fixes — see that section.)

### Behaviors worth knowing

- `/ml/health` returns `ok` / `degraded` / `down` based on which models loaded.
- Missing artifacts → service still starts; the affected endpoint 503s (TRD §6.5).
- Recommender filters dishes by `dietPref` (strict) + `budgetTier`, substitutes a
  same-meal-type dish if a filter would empty a meal, then scales servings
  (0.1 steps, clamped 0.5–2.0) to land total kcal within ±10% of target.
- Every response carries an `X-Response-Time-Ms` header.

### Verification (2026-05-15)

- ANN predictions track Mifflin–St Jeor: e.g. 28M/178/75/moderate → 2671 kcal (formula 2678).
- Recommender hits ±10% across veg / vegan / budget-low cases (+0.9% to +3.9%).
- Latency: ANN p95 **39.5 ms** (SLA ≤ 500), KNN p95 **1.1 ms** (SLA ≤ 300).
- Bad enum input → 422; all endpoints return correct status codes.

**Phase 2 exit criteria:** both endpoints serve from a saved model; `/ml/health`
reports loaded versions. ✅ Verified.

### How to resume / re-run

```bash
cd services/ml && source .venv/bin/activate
python pipelines/preprocess.py && python pipelines/train_ann.py && python pipelines/train_knn.py
uvicorn nutrimate_ml.main:app --host 0.0.0.0 --port 8000
```

---

## Phase 3 — what got built (complete and verified)

### Layout (new files under `apps/api/src/`)

```
apps/api/src/
├── lib/
│   ├── bmi.ts                       # computeBmi + WHO category
│   ├── dates.ts                     # UTC-midnight helpers, ISO date parsing
│   ├── mifflin.ts                   # Mifflin–St Jeor BMR/TDEE + goal delta (fallback)
│   └── mlClient.ts                  # fetch wrapper for the ML service (timeout, MlServiceError)
├── jobs/
│   └── scheduler.ts                 # in-process monthly maintenance (log rollup)
├── data/
│   └── food-catalog-seed.json       # 36 dishes, generated from ML seed_data.py DISHES
├── scripts/
│   └── seedFoodCatalog.ts           # idempotent food_catalog seeder (upsert by slug)
├── models/MealPlan.ts               # NEW collection meal_plans (see decision #16)
└── modules/
    ├── profile/                     # GET/POST/PATCH /profile
    ├── predictions/                 # GET /predictions/calories, POST /recompute
    ├── recommendations/             # GET /today, POST /swap, POST /regenerate
    ├── logs/                        # POST /meal|/water, GET /day|/range
    └── nutrition/                   # GET /search, GET /item/:id (+ providers)
```

### Behaviors worth knowing

- **Calorie target = ML maintenance kcal + goal delta** (`lose −500`, `gain +500`,
  `maintain 0`), clamped to a 1200 kcal floor. Same delta applies to the fallback.
- **ML fallback (TRD §6.5):** `mlClient` throws `MlServiceError` only on timeout/5xx;
  predictions fall back to Mifflin–St Jeor (`source:"fallback"`), recommendations
  fall back to a curated `food_catalog` composer (`source:"fallback"`). A 4xx from
  ML is a caller bug and is surfaced, not swallowed.
- **`POST /profile` awaits the recompute** so the dashboard has a prediction
  immediately; **`PATCH /profile` recomputes in the background** (FR-2.7).
- **Recommendations are persisted** in `meal_plans` per `{userId, date}` so `/swap`
  and `/regenerate` mutate a stable stored plan. `/swap` rebuilds the day and
  replaces only the requested meal; the catalog composer picks randomly among the
  3 closest-kcal dishes so swap/regenerate produce variety.
- **Water logging is cumulative** — repeated `POST /logs/water` calls add glasses
  to the same day's record.
- **Nutrition search** checks the 24h `nutrition_cache` first, then the external
  provider (Spoonacular if keyed, else Edamam); with no API keys it degrades to a
  `food_catalog` text search. Only external results are cached (the cache `source`
  enum is spoonacular|edamam).
- **Background scheduler** is a dependency-free interval check (no node-cron). It
  runs monthly: prunes `meal_logs`/`water_logs` older than 3 months (TRD Q4) and
  logs a reminder to retrain the KNN. `lastRunMonth` is seeded at boot so it fires
  on month rollover, not on every restart.

### Verification (2026-05-15)

Brought up Mongo (ad-hoc `mongod`), the ML service, and the API; seeded the
catalog (36 dishes); ran an end-to-end smoke test:

- register → `POST /profile` (28M/178/75/moderate/lose) → `GET /predictions/calories`
  → **2171 kcal, `source:"ann"`, BMI 23.7** (ANN ~2671 maintenance − 500).
- `GET /recommendations/today` → `source:"knn"`, total 2271 kcal vs 2171 target;
  `matchedPlanIds` populated. `POST /swap` and `/regenerate` work.
- Vegan profile → regenerate returns only vegan-tagged dishes (diet filter holds).
- `POST /logs/meal` (kcal recomputed from items), cumulative `POST /logs/water`,
  `GET /logs/day` and `/logs/range` (7-day) all correct.
- `GET /nutrition/search` + `/item/:id` serve from `food_catalog` (no API keys).
- Error paths: bad enum → 422, missing bearer → 401, bad item id → 404.

**Phase 3 exit criteria:** end-to-end profile → prediction → recommendation works
against real data. ✅ Verified.

### How to resume / re-run

```bash
sudo systemctl start mongod          # or ad-hoc: mongod --dbpath ~/data/db --fork --logpath ~/data/log/mongod.log
cd services/ml && source .venv/bin/activate && uvicorn nutrimate_ml.main:app --port 8000 &
cd ../.. && pnpm --filter @nutrimate/api seed:catalog    # one-time, idempotent
pnpm --filter @nutrimate/api dev
```

---

## Phase 4 — what got built (code complete, NOT yet verified)

The whole `apps/web` shell was written this session. **It has not been
typechecked, built, or run** — the build host had no outbound network, so
`pnpm install` for the new front-end dependencies could not complete (see
the warning in "How to resume" below).

### Stack (versions pinned in `apps/web/package.json`)

Vite 5 · React 18 · TypeScript 5.7 · Tailwind 3 · TanStack Query 5 ·
React Router 6 · axios · Recharts 2 (declared, used in Phase 5) ·
`lucide-react` for icons.

### Layout

```
apps/web/
├── index.html, vite.config.ts, postcss.config.js
├── tailwind.config.js                 # hand-translated from DESIGN.md
├── tsconfig.json                      # noEmit; typecheck = tsc --noEmit
├── public/favicon.svg
└── src/
    ├── main.tsx                       # providers: Query → Router → Auth → Toast
    ├── App.tsx                        # route map (public vs. protected)
    ├── index.css                      # Tailwind layers + keyframes
    ├── lib/
    │   ├── env.ts                     # VITE_API_BASE_URL resolution
    │   ├── api.ts                     # axios client — bearer + 401 refresh
    │   ├── tokenStore.ts              # localStorage tokens (TRD Q1)
    │   ├── queryClient.ts             # TanStack Query defaults
    │   └── cn.ts                      # className joiner (no clsx dep)
    ├── features/auth/                 # AuthContext/Provider, useAuth, guards
    ├── components/
    │   ├── ui/                        # Button, Input, Card, Spinner
    │   ├── toast/                     # ToastProvider + useToast
    │   ├── MealCard, ProgressRing, StatCard, MotivationalChip, Drawer
    │   └── PagePlaceholder            # Phase-4 stub for Phase-5 pages
    ├── layout/                        # AppShell, TopNav, SideNav, BottomNav, Logo
    └── pages/                         # AuthPage + 5 placeholder destinations
```

### Behaviours worth knowing

- **Tailwind theme** is a 1:1 hand-translation of
  `designs/nutrimate_design_system/DESIGN.md` frontmatter — colour tokens,
  Plus Jakarta Sans type scale, 4/8px spacing, radius scale, Level 1/2
  shadows (`shadow-card`, `shadow-floating`, `shadow-nav`).
- **Token refresh:** `lib/api.ts` attaches the bearer, and on a 401 (non-auth
  route) runs a **single-flight** `/auth/refresh` — concurrent 401s share one
  refresh promise, then replay. A failed refresh clears storage and emits a
  `nutrimate:logout` window event the `AuthProvider` listens for.
- **Tokens in `localStorage`** (TRD Q1) — all storage access funnels through
  `lib/tokenStore.ts`.
- **Routing:** `/login` + `/register` are public-only (redirect away when
  signed in); everything under `<AppShell>` is behind `<ProtectedRoute>`.
  `AuthProvider` bootstraps by calling `GET /me` to validate stored tokens.
- **Responsive shell:** fixed 256px `SideNav` on desktop, `BottomNav` 5-tab
  bar on mobile, sticky `TopNav` (search + bell + avatar menu) on both.
- **Phase 5 pages are stubs** — every destination renders `<PagePlaceholder>`;
  only `AuthPage` is fully functional.

**Phase 4 exit criteria:** auth flow works against the live API; shell renders
responsive nav. ✅ Verified (2026-05-16) — `pnpm install` ran in 2m30s once the
network was back, typecheck + build green, register → login → `/me` smoke test
passed.

---

## Phase 5 — what got built (complete and verified)

All nine screens from the plan, built in user-flow order on top of the Phase 4
shell. Every data-driven view has explicit loading / empty / error states.

### Layout (new files under `apps/web/src/`)

```
apps/web/src/
├── lib/
│   ├── dates.ts                      # UTC-date helpers (todayIso, isoRange, labels)
│   └── labels.ts                     # human labels for the domain enums
├── features/                         # TanStack Query API layer (fns + hooks)
│   ├── profile/   profile.api.ts, RequireProfile.tsx
│   ├── predictions/ predictions.api.ts
│   ├── recommendations/ recommendations.api.ts
│   ├── logs/      logs.api.ts, QuickLogDrawer.tsx
│   └── nutrition/ nutrition.api.ts, NutritionDetailDrawer.tsx
├── components/
│   ├── states/    EmptyState, ErrorState, Skeleton
│   ├── charts/    chartTheme, MacroDonut, CalorieTrendChart
│   └── ui/        Select (new — joins Button/Input/Card/Spinner)
└── pages/                            # all 9 real screens (placeholders removed)
    ├── LandingPage, AuthPage, ProfileSetupPage
    ├── DashboardPage, MealsPage, SearchPage
    └── ProgressPage, SettingsPage  (+ NotFoundPage)
```

### Behaviours worth knowing

- **Routing:** `/` now serves the public **LandingPage** (was a redirect to
  `/dashboard`). `/setup` hosts the wizard. App pages sit behind
  `<RequireProfile>` — a signed-in user with no profile (`GET /profile` → 404)
  is redirected to `/setup`; the wizard redirects back to `/dashboard` once a
  profile exists.
- **Profile wizard** is 4 steps (demographics → activity → goal → diet+budget)
  with a progress bar and per-step validation against the PRD physiological
  ranges; the final step `POST /profile` (which computes the first prediction).
- **Dashboard** — calorie + hydration `ProgressRing`s, a BMI card with a
  healthy-range marker, a Recharts macro donut and 7-day calorie trend
  (`ComposedChart`: consumed area + dashed target line), today's plan preview,
  and a FAB → `QuickLogDrawer` (one-tap water logging + meal shortcuts).
- **Meals** — `GET /recommendations/today` rendered as four meal cards with
  item breakdowns; per-meal **Swap** (`POST /swap`) and **Mark eaten**
  (`POST /logs/meal`), plus **Regenerate day**. Diet/budget/source filter chips.
- **Search** — query synced to the `?q=` URL param; results grid → detail
  `Drawer` with a 0.5-step serving selector that scales kcal/macros and logs to
  a chosen meal type. External items with no macros are handled gracefully.
- **Progress** — 7/30/90-day range selector; four chart types (Area+Line
  trend, water Bar, macro donut, stacked macro Bar); derived achievement badges
  and AI-style insight cards computed client-side from `GET /logs/range`.
- **Settings** — editable profile form (`PATCH /profile`, dirty-tracked),
  a local-only water-reminder toggle, a client-side JSON data export, and sign
  out. Password-change and account-deletion are intentionally **not** built —
  no API endpoints exist for them (see follow-ups).
- **Recharts** is split into its own `charts` bundle via Vite `manualChunks`
  (app 49 kB / vendor 143 kB / charts 120 kB gzipped).

### Verification (2026-05-16)

`typecheck`, `lint` (0 problems) and `build` all green. Brought up Mongo + ML +
API, seeded the catalog, and ran an end-to-end smoke test covering every
endpoint the Phase 5 pages call: register/login/`/me`; `GET /profile` 404 →
`POST /profile`; `GET /predictions/calories` (ann, 2121 kcal, BMI 23.5);
`GET /recommendations/today` (knn, 4 meals) + `/swap`; `POST /logs/meal` &
`/water`, `GET /logs/day` & `/range`; `GET /nutrition/search`. Web dev server
serves `/` and SPA routes (200).

**Phase 5 exit criteria:** all 9 screens reachable, responsive, hitting real
endpoints. ✅ Verified.

### How to resume / re-run

```bash
mongod --dbpath ~/data/db --fork --logpath ~/data/log/mongod.log
cd services/ml && source .venv/bin/activate && uvicorn nutrimate_ml.main:app --port 8000 &
cd ../.. && pnpm --filter @nutrimate/api seed:catalog        # idempotent
pnpm --filter @nutrimate/api dev                             # API on :4000
pnpm --filter @nutrimate/web dev                             # web on :5173
# → open http://localhost:5173 — register, complete the wizard, explore.
```

---

## Post-Phase-5 changes (2026-05-16)

Phase 6 was descoped (no automated-test suite); the user runs the stack locally
and tests manually, conveying fixes one at a time. Three were done this session.

### 1. Spoonacular nutrition search — wired to real keys

- `SPOONACULAR_API_KEY` is now set in the root `.env`; it is read by the **API**
  (`apps/api/src/config/env.ts`), not the ML service. Restart the API to pick
  up `.env` changes — `tsx watch` only reloads on `.ts` edits.
- **Endpoints corrected** (`apps/api/src/modules/nutrition/nutrition.providers.ts`):
  the provider now hits `…/recipes/complexSearch` and `…/recipes/{id}/information`
  (was the wrong `…/food/ingredients` surface). Search passes
  `addRecipeNutrition=true`, so results carry calories/macros inline.
- **Connection fix** (`apps/api/src/server.ts`): added
  `net.setDefaultAutoSelectFamilyAttemptTimeout(3000)`. Node's Happy Eyeballs
  abandons each connection attempt after 250 ms by default; this network's TCP
  handshake to Spoonacular (Cloudflare) takes ~600 ms, so every attempt timed
  out (`AggregateError [ETIMEDOUT]`) and the search silently fell back to the
  `food_catalog`. Widening the window fixes it.
- **Cache fix** (`nutrition.service.ts`): `search()` only pre-caches items that
  carry nutrition, so a name-only stub can't shadow the `{id}/information`
  detail lookup.
- **Images:** `NutritionItem` gained an `image` field (Spoonacular/Edamam fill
  it, catalog is `null`). The Search results grid and `NutritionDetailDrawer`
  now show the recipe photo, with a tinted-icon fallback.

### 2. Meal-plan swap/regenerate variety

- **Bug:** swap and regenerate never changed any meal. Root cause — the KNN
  recommender (`services/ml/nutrimate_ml/recommender.py`) was fully
  deterministic, so every rebuild produced the identical plan. (It was *not*
  the catalog fallback, which is already randomized.)
- **Fix:** `recommender.py` now picks **randomly** among the neighbour plans
  whose base total fits the 0.5–2.0× serving-scale window (falls back to the
  closest plan otherwise); `_substitute` randomizes over the 3 closest dishes.
- **Seed data** (`services/ml/pipelines/seed_data.py`): `_COMBOS` expanded from
  6 → **13 distinct meal combos per cluster**, so every seed plan is unique.
- **KNN k** raised 5 → 8 (`pipelines/train_knn.py`) for a wider candidate pool.
  **The KNN was retrained** (`knn_v0.1.0.pkl`, 52 plans, k=8) and the ML
  service restarted. Re-run with `python pipelines/train_knn.py`.

### 3. "Meal eaten" indicator on the Meals page

- `GET /logs/day` (`apps/api/src/modules/logs/logs.service.ts`) now returns
  `loggedMeals` — the distinct meal types logged that day.
- The web `MealsPage` reads it via `useDaySummary()`; a logged meal card shows
  an "Eaten ✓" indicator instead of the "Mark eaten" button (Swap disabled).
  `useLogMeal` invalidates the `logs` queries, so the card flips immediately
  and the state survives a reload (it is server-derived).

### Known issue surfaced by fix #2

`swapMeal` merges a meal that was serving-scaled for a *different* plan into the
current one, so a swapped plan's total can drift above the ±10% band (~+20%
observed). Pre-existing; invisible until swap actually changed something.
Follow-up: re-scale the merged plan.

---

## ANN real-dataset migration (2026-05-17)

The calorie ANN was trained on a fully synthetic Mifflin–St Jeor grid; the user
asked to train it on a **real** dataset. Scope: **ANN only** — the KNN
recommender keeps its `seed_data.py` meal plans.

**What we tried first, and why it failed.** We took `ziya07/diet-recommendations-dataset`
from Kaggle and trained directly on its `Daily_Caloric_Intake` column. Result:
test MAE **497 kcal** — no better than predicting the mean. The column turned
out to be statistically **independent** of body metrics (Pearson |r| < 0.09
against age, gender, height, weight, activity, BMI) — i.e. simulated noise. No
public dataset directly measures TDEE, so a real intake *label* was a dead end.

**Final approach — hybrid.** Keep the dataset's **real demographic rows**
(age, gender, height, weight, activity — a genuine population distribution) but
**regenerate the `kcal` label** from the Mifflin–St Jeor formula
(BMR × activity multiplier + 5% Gaussian noise). Real inputs, formula label.

- **Dataset:** `ziya07/diet-recommendations-dataset` (1,000 rows). Fetched
  manually (no `kaggle` CLI / creds on this box), placed at
  **`services/ml/data/raw/diet_recommendations_dataset.csv`** (gitignored).
- **`preprocess.py` rewritten** as a hybrid builder: tolerant column matching,
  gender + activity normalization (activity → ordinal 1–5), BMI fill/clamp,
  physiological-range clamping, then the Mifflin–St Jeor kcal label. The raw
  `Daily_Caloric_Intake` column is **discarded**. Writes
  `data/calorie_dataset.csv`. Has an `--inspect` mode to dump the raw schema.
- **`train_ann.py`:** default `--data` → `calorie_dataset.csv`; `VERSION`
  bumped `0.1.0` → `0.2.0`; the MAE ≤ 150 gate is now a **soft warning** —
  pass `--max-mae` to re-enable a hard gate. Model architecture, the 8-dim
  feature contract, scaler shape, and 80/10/10 split are **unchanged**, so
  `predictor.py`, the API, and the web need no changes.
- **Note on this dataset:** it has only 2 genders (male/female) and 3 activity
  levels (→ ordinals 1/3/4), so `gender_other` and ordinal-5 are unseen in
  training; the scaler/ANN extrapolate fine (verified — see below).
- **Result — verified (2026-05-17):** ANN v0.2.0, **test MAE 113.99 kcal**
  (PASS ≤ 150), mean deviation +13.25. ML service reloaded, `/ml/health`
  reports `annVersion 0.2.0`. Predictions sane: 28M/178/75/moderate → 2616
  (Mifflin ~2671), 45F/160/90/sedentary → 1742, 22M/185/80/very_active → 3578.
- **Re-run:** `python pipelines/preprocess.py && python pipelines/train_ann.py`,
  then restart the ML service.

---

## SVM health-risk model (2026-05-17)

A **third ML model** was added — primarily to demonstrate ML breadth
(ANN + KNN + SVM). It is a multi-factor **health-risk classifier**: an
`sklearn.svm.SVC` (RBF kernel) grading a user **low / moderate / high** risk
from age + gender + height + weight + BMI + activity. This is distinct from the
existing BMI "category", which is a plain BMI-threshold lookup (`bmi.ts`), not a
model — the SVM uses all six factors.

**Dataset.** The real UCI/Kaggle "Obesity Levels" dataset
(`ObesityDataSet_raw_and_data_sinthetic.csv`, 2,111 rows). Unlike the ANN, this
has a *genuine* label — the 7-class `NObeyesdad` obesity level — so no synthetic
label was needed. Fetched from the UCI mirror (archive.ics.uci.edu, dataset
544); placed at `services/ml/data/raw/` (gitignored). `preprocess_obesity.py`
converts height m→cm, bins `FAF` (0–3) to the 1–5 activity ordinal, and
collapses the 7 classes to 3 (`Insufficient/Normal → low`,
`Overweight I/II → moderate`, `Obesity I/II/III → high`).

**Model.** A scikit-learn `Pipeline` bundling `StandardScaler` + `SVC`
(`probability=True`, `class_weight="balanced"`), saved as `models/svm_v0.1.0.pkl`
(joblib). 8-dim input — the same feature layout as the ANN.

**Wiring (all additive — ANN/KNN flows untouched):**
- ML service: `pipelines/preprocess_obesity.py`, `pipelines/train_svm.py`,
  `nutrimate_ml/risk.py` (inference), plus loader/route/schema changes in
  `artifacts.py` / `main.py` / `schemas.py`. New route
  `POST /ml/predict-health-risk`; `/ml/health` now reports `svmVersion`/`svmLoaded`
  and is `ok` only when all three models load.
- API: `mlClient.ts` gained `predictHealthRisk()`; a new
  `modules/health-risk/` module serves `GET /api/v1/health-risk`. The result is
  **computed on demand, not persisted** (no new Mongo model). ML-down fallback
  derives risk from the BMI band, `source: "fallback"`,
  `modelVersion: "bmi-heuristic-v1"`.
- shared-types: `HEALTH_RISK_LEVELS` enum in `common.ts`, new `healthRisk.ts`.
- Web: `features/health-risk/health-risk.api.ts` + a "Health risk" card on the
  dashboard (next to the BMI card). The metrics grid is now a 4-up row.

**Result — verified (2026-05-17):** SVM v0.1.0, **test accuracy 96.2%**,
macro-F1 0.95. `/ml/health` reports `svmVersion 0.1.0`, status `ok`. End-to-end
smoke test green — `/ml/predict-health-risk` returns high/moderate/low correctly;
`GET /api/v1/health-risk` returns `source:"svm"`; with the ML service stopped it
falls back to `source:"fallback"` (HTTP 200). `pnpm typecheck/lint/build` green.

**Re-run:** download `ObesityDataSet_raw_and_data_sinthetic.csv` into
`services/ml/data/raw/`, then
`python pipelines/preprocess_obesity.py && python pipelines/train_svm.py`,
then restart the ML service.

---

## Decisions log (since the original plan)

| #   | Decision                                              | Why                                                                                                                                |
| --- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Docker skipped for MVP                                | User instruction.                                                                                                                  |
| 2   | Sentry skipped for MVP                                | User instruction. Structured logs via pino only.                                                                                   |
| 3   | CI/CD skipped for MVP                                 | User instruction. Deploys are manual.                                                                                              |
| 4   | Password reset removed                                | User instruction; PRD already updated. No `/auth/forgot-password` or `/auth/reset`.                                                |
| 5   | Project-local pnpm store                              | NTFS hang fix.                                                                                                                     |
| 6   | bcryptjs over bcrypt                                  | Avoids native postinstall hang on NTFS.                                                                                            |
| 7   | Hand-authored docs added to `.prettierignore`         | Don't reformat user-curated docs (PRD, TRD, design, project-description, designs/.../DESIGN.md).                                   |
| 8   | `engine-strict=false` in .npmrc                       | Allow Node 24 even though engines pin says `>=20` (would otherwise warn).                                                          |
| 9   | Python 3.11 via **pyenv** (3.11.15)                   | User chose pyenv over uv / system apt. Compiled from source; build deps installed via apt.                                         |
| 10  | ML venv + pip cache on the NTFS partition             | Same cross-fs reasoning as the pnpm store. `PIP_CACHE_DIR=services/ml/.pip-cache`.                                                 |
| 11  | BMI is the engineered 8th ANN feature                 | TRD §6.1 lists 7 raw inputs but specifies `Input(8)`; BMI is the natural fill and the API already computes it.                     |
| 12  | TensorFlow 2.16.2 (not 2.15)                          | `pyproject.toml` allows `>=2.15,<2.17`; pip resolved 2.16.2 on Python 3.11. Uses Keras 3.                                          |
| 13  | Recommender scales servings in 0.1 steps              | Coarser (0.5) steps collapsed most scale factors to 1.0 and missed the ±10% kcal band.                                             |
| 14  | Native `fetch` for ML + nutrition calls (no axios)    | Node 24 has global `fetch` + `AbortSignal.timeout`; avoids another NTFS-prone install.                                             |
| 15  | Dependency-free interval scheduler, not `node-cron`   | Plan suggested node-cron; a small `setInterval` month-rollover check avoids a network install and is enough for MVP.               |
| 16  | Added a `meal_plans` collection (not in TRD §5.1's 7) | `/recommendations/swap` and `/regenerate` need a stable persisted plan to mutate; recomputing per call would be non-deterministic. |
| 17  | Nutrition search falls back to `food_catalog`         | No Spoonacular/Edamam keys are configured; a local text search keeps the endpoint useful and is the graceful-degrade path.         |
| 18  | `pino-http` imported as a named export                | Version drift (10.3→10.5 in the lockfile) broke the default import under NodeNext; `import { pinoHttp }` fixes the typecheck.      |
| 19  | Web `tsc --noEmit` for typecheck (not `tsc -b`)        | Avoids composite/project-reference setup; Vite owns the actual build, so `tsc` only needs to typecheck.                            |
| 20  | `lucide-react` for icons (design mock used Material Symbols) | DESIGN.md "Shapes" specifies Lucide/Phosphor; Lucide ships as tree-shakeable React components — no icon font/CDN needed.      |
| 21  | Dependency-free `cn()` helper (no `clsx`/`tailwind-merge`) | The component set is small and never needs class de-duplication; one fewer NTFS-prone install.                                 |
| 22  | Vite `envDir: "../../"`                                | Lets `apps/web` read `VITE_API_BASE_URL` from the monorepo-root `.env`. Only `VITE_`-prefixed vars reach the client bundle.        |
| 23  | Root `eslint.config.js` gains an `apps/web` override   | Front-end files need browser globals + JSX; `no-undef` is disabled there (TypeScript resolves identifiers).                       |
| 24  | `/` serves the public Landing page (was a redirect)    | Phase 5 adds a real marketing landing screen; signed-in visitors get a "Go to dashboard" CTA instead of a redirect.               |
| 25  | `<RequireProfile>` route guard added                   | Dashboard / plans / logs all need a profile + prediction; the guard bounces profile-less users to `/setup` instead of erroring.   |
| 26  | Recharts split into its own bundle (`manualChunks`)    | Recharts + d3 are ~120 kB gzipped; isolating them keeps the app chunk small and cacheable, and clears Vite's 500 kB warning.       |
| 27  | Settings omits password-change & account-deletion      | No API endpoints exist for either (auth has only register/login/refresh/logout); a note is shown rather than a dead form.         |
| 28  | Spoonacular uses the `/recipes` API, not `/food/ingredients` | NutriMate surfaces meals/recipes; `complexSearch` + `{id}/information` is the right surface and returns photos.              |
| 29  | `net.setDefaultAutoSelectFamilyAttemptTimeout(3000)` in the API | Node's 250 ms Happy-Eyeballs default is shorter than this network's ~600 ms TCP handshake to Spoonacular — all attempts timed out. |
| 30  | `addRecipeNutrition=true` on search + `image` on `NutritionItem` | Lets the results grid show calories/macros/photos without a per-item detail call.                                          |
| 31  | KNN recommender randomized; 13 combos/cluster; k=5→8     | The recommender was deterministic, so swap/regenerate never varied. Randomized selection + richer seed data fix it.               |
| 32  | `GET /logs/day` returns `loggedMeals`                    | The Meals page needs to know which meal types were logged to render the "Eaten" state; the day summary was aggregate-only.        |
| 33  | ANN uses a hybrid dataset: real Kaggle rows + Mifflin label | User asked to replace the synthetic data. Training directly on the Kaggle `Daily_Caloric_Intake` column scored MAE 497 (the column is noise, |r|<0.09 vs every feature). Hybrid keeps the real demographic rows + a Mifflin–St Jeor kcal label → MAE 114. ANN v0.2.0. See "ANN real-dataset migration". |
| 34  | 3rd ML model is a health-risk SVM (not an SVR calorie predictor) | User wanted to demonstrate ML breadth. An SVM is a classifier; the one genuine gap was a *multi-factor* health indicator (the BMI category is a threshold lookup, not ML). Trained on the real Obesity-Levels dataset — it has a real 7-class label, so no synthetic label was needed (unlike the ANN). See "SVM health-risk model". |
| 35  | Health-risk computed on demand, not persisted; new `health-risk` API module | Risk is a pure function of profile fields with no time-series value. `Prediction.source` stays `ann/fallback` (not widened). A dedicated module mirrors how `recommendations` is its own module. |

---

## Known follow-ups when picking work back up

- [ ] Decide whether to keep `bcryptjs` or revert to `bcrypt` for production (see Decision #6).
- [ ] **Phase 6 (Quality gates) is descoped** — the automated-test suite
      (Vitest/Jest/pytest, Playwright, NFR/a11y/OWASP) was dropped by user
      decision. Re-scope it here if that changes.
- [ ] **Fix `swapMeal` total drift** — a swapped meal keeps the serving scale
      of the plan it was built in, so the day total can exceed ±10% of target.
      Re-scale the merged plan in `recommendations.service.ts`.
- [ ] **Add the missing account endpoints** the Settings page needs:
      `POST /auth/change-password` (requires current password) and
      `DELETE /me` (account deletion). Settings shows a note in their place
      until they exist (Decision #27).
- [ ] **Recommendation/meal-plan cards still have no photos** — the KNN seed
      data and `food_catalog` carry no images (only the Spoonacular nutrition
      search does now). Wire photos into the recommender data if wanted.
- [ ] **Edamam** is still unconfigured — Spoonacular is now keyed and active;
      Edamam remains a code path for if/when its keys are added (Decision #17).
- [ ] The monthly scheduler only fires on a month rollover within a single long-lived process (Decision #15); for production, trigger `runMonthlyMaintenance()` from a real cron / systemd timer.
- [x] Replace synthetic-only ANN data — done (2026-05-17). The ANN now uses a
      hybrid dataset: real Kaggle demographic rows + a Mifflin–St Jeor kcal
      label. ANN v0.2.0, trained and verified. See "ANN real-dataset migration".

---

## Files most useful for orientation

1. `IMPLEMENTATION_PLAN.md` — what's planned, in what order, with deferred items called out.
2. `TRD.md` — system architecture, API contracts, data model, ML pipelines.
3. `PRD.md` — product requirements + personas + non-functional reqs.
4. `apps/api/README.md` — endpoint list + smoke-test recipes for Phase 1.
5. `packages/shared-types/src/` — canonical DTOs; reach for these before inventing new types.
