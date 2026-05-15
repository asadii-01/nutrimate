# NutriMate – Handoff Notes

| Field          | Value                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------ |
| Last updated   | 2026-05-15 (Phase 4 verified — install, typecheck, build, auth smoke test green)                 |
| Author         | Claude (Opus 4.7) + Asad                                                                         |
| Current phase  | Phase 4 — complete and verified; ready to start Phase 5                                          |
| Repo location  | `~/develop/ml` (ext4) — moved off the NTFS partition on 2026-05-15                               |
| Companion docs | [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md), [`PRD.md`](./PRD.md), [`TRD.md`](./TRD.md) |

---

## TL;DR

- **Phase 0 (scaffolding):** complete and verified — lint, typecheck, build all green.
- **Phase 1 (API skeleton):** complete and verified — deps installed, register → login → `/me` smoke test passes.
- **Phase 2 (ML service):** complete and verified — ANN test MAE 87.9 kcal, KNN serving 52 seed plans, all 3 endpoints smoke-tested within SLA.
- **Phase 3 (API business logic):** complete and verified — profile, predictions, recommendations, logs, nutrition-search wired; food catalog seeded (36 dishes); end-to-end smoke test green against live Mongo + ML.
- **Phase 4 (frontend foundation):** **complete and verified.** Vite + React + TS + Tailwind shell — design-system theme, auth context, axios client with 401-refresh, responsive nav, reusable components, login/register page. `pnpm install` ran successfully once network was back; `pnpm --filter @nutrimate/web typecheck` and `build` are both green (vite build: 1719 modules, 493 kB JS); the auth smoke test (register → login → `/me`) passes against the live API and the web dev server serves the shell on `:5173`. The shell code needed **no fixes** — it typechecked clean as written.
- **Phases 5–6:** not started.
- **Project is now a git repo:** `git init` run on 2026-05-15; Phases 0–2 committed as the initial commit, Phase 3 as the second.
- **Relocated off NTFS (2026-05-15):** the repo was moved from
  `/run/media/.../Development/ML` (NTFS) to **`~/develop/ml`** (ext4) to escape
  the cross-filesystem install hangs. The copy excluded `services/ml/.venv` and
  `services/ml/.pip-cache` — **the ML venv must be recreated here** (see
  "Recreating the ML venv" below). `node_modules` + `.pnpm-store` were copied
  intact (hardlinks preserved) and verified working (`apps/api` typecheck green
  at the new location). The old NTFS copy is left in place until the move is
  confirmed; delete it once happy.
- **NTFS workarounds removed (2026-05-15):** now on ext4, the two store-pinning
  workarounds were deleted — `store-dir=./.pnpm-store` is gone from `.npmrc`
  (pnpm uses the default `~/.local/share/pnpm/store`), and the
  `PIP_CACHE_DIR` export is gone from `services/ml/README.md` (pip uses
  `~/.cache/pip`). The old `./.pnpm-store/` dir was deleted after the
  `pnpm install` that resolved the `apps/web` deps rebuilt `node_modules` from
  the global store. The ML `.venv` was also recreated at the ext4 location.
  `bcryptjs` (Decision #6) is kept as-is: it works and reverting to native
  `bcrypt` would reintroduce build risk for ~40 ms of hashing cost.

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
│   └── web/                               # 🟡 Phase 4 — code complete, deps not installed (no network)
│       ├── package.json, vite.config.ts, tailwind.config.js, tsconfig.json
│       └── src/                           # shell: theme, auth, api client, nav, components
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
| 4     | Frontend foundation       | ✅ Done        | Shell built (theme, auth, client, nav, components). `pnpm install`, typecheck, `vite build`, and auth smoke test all green. |
| 5     | Pages                     | ⬜ Not started |                                                                                                 |
| 6     | Quality gates             | ⬜ Not started |                                                                                                 |

---

## Environment notes (important)

### NTFS hang on cross-filesystem pnpm installs — RESOLVED (repo moved to ext4)

Historical context — the repo originally lived on an NTFS partition
(`/dev/nvme0n1p1`, `ntfs3`). pnpm's default store is on `~/.local/share/pnpm/store`
(ext4); hardlinks can't cross filesystems, so pnpm fell back to copying every
file, which hung indefinitely on NTFS (a 4h 43m hang was observed). The
workaround was `store-dir=./.pnpm-store` in `.npmrc` (keep the store on the
NTFS partition so hardlinks work).

**Resolved on 2026-05-15:** the repo moved to `~/develop/ml` (ext4) and the
`store-dir` line was removed from `.npmrc`. pnpm uses the default global store
again. No workaround needed. (See the "NTFS workarounds removed" bullet at the
top of this file for the `.pnpm-store/` cleanup leftover.)

### bcrypt → bcryptjs swap

- Original Phase 1 plan: `bcrypt` (native).
- `bcrypt`'s postinstall downloads a prebuilt binary; on NTFS this hung the install for hours.
- **Switched to `bcryptjs`** (pure JS, no postinstall). Performance at cost 12: ~50 ms vs ~10 ms — fine for our scale.
- Code already uses `bcryptjs` in `apps/api/src/lib/password.ts`; `apps/api/package.json` already lists it. No further action needed.

### Toolchain pinned during dev

- Node v24.15.0 (via nvm) — `package.json` engines pin is `>=20`.
- pnpm 9.15.0 (via corepack).
- Python 3.11.15 installed via **pyenv** (host default is 3.14, which TF can't use). pyenv init lines were appended to `~/.bashrc`. `services/ml/.python-version` pins `3.11.15`.
- ML venv at `services/ml/.venv`, beside the code. pip uses the default `~/.cache/pip` (the `PIP_CACHE_DIR=services/ml/.pip-cache` NTFS workaround was removed on 2026-05-15 when the repo moved to ext4).
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
│   ├── preprocess.py              # Mifflin–St Jeor synthetic dataset (20k rows)
│   ├── train_ann.py               # calorie ANN
│   ├── train_knn.py               # meal-recommendation KNN
│   └── seed_data.py               # 36 Pakistani dishes + 52 seed meal plans
├── data/                          # synthetic_dataset.csv (gitignored)
└── models/                        # calorie_ann_v0.1.0.keras, scaler.pkl, knn_v0.1.0.pkl (gitignored)
```

### Models

- **ANN** — 8-dim input `[age, gender×3 one-hot, heightCm, weightKg, activityOrdinal, bmi]`.
  BMI is the engineered 8th feature (TRD §6.1 lists 7 raw fields but specifies `Input(8)`).
  Trained on a Mifflin–St Jeor synthetic grid with 5% Gaussian noise.
  **Test MAE 87.9 kcal** (acceptance ≤ 150), mean deviation −4.6 kcal.
- **KNN** — `NearestNeighbors(k=5)`, Euclidean on StandardScaler-normalized
  `[age, bmi, activityLevel, goalEnc, dietEnc]`. 52 seed plans across 4 clusters
  (low/high-cal × veg/non-veg), 13 each. Dish catalog bundled into the artifact
  so the recommender can filter/substitute at inference.

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

### Recreating the ML venv (required after the NTFS move)

The `.venv` was **not** copied during the relocation (its scripts had absolute
paths baked to the old NTFS location). Recreate it once — needs network:

```bash
cd services/ml
python -m venv .venv                 # pyenv pins Python 3.11.15 via .python-version
source .venv/bin/activate
pip install -e .                     # installs from pyproject.toml
```

The trained model artifacts under `services/ml/models/` **were** copied, so the
service can serve immediately — no retraining needed unless you want it.

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

## Phase 4 — what got built (complete and verified)

The whole `apps/web` shell was written, then verified on 2026-05-15:
`pnpm install` resolved the front-end deps, `tsc --noEmit` typecheck and
`vite build` both pass clean (no code fixes were needed), and the auth flow
works against the live API.

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

### Verification (2026-05-15)

- `pnpm install` resolved all `apps/web` deps from the global store.
- `pnpm --filter @nutrimate/web typecheck` — clean (`tsc --noEmit`).
- `pnpm --filter @nutrimate/web build` — `vite build` green: 1719 modules,
  493 kB JS / 21.7 kB CSS.
- Auth smoke test against the live stack (Mongo + ML + API): register →
  login → `GET /me` with bearer all return correct payloads.
- Web dev server serves the NutriMate shell on `:5173` (HTTP 200).

### How to re-run

```bash
pnpm --filter @nutrimate/web typecheck
pnpm --filter @nutrimate/web build

# Auth smoke test — needs Mongo + ML + API up (see Phase 3 resume steps)
pnpm --filter @nutrimate/api dev               # API on :4000
pnpm --filter @nutrimate/web dev               # web on :5173
# → open http://localhost:5173, register/login, confirm the shell renders
#   and the bottom/side nav switches responsively.
```

**Phase 4 exit criteria:** auth flow works against the live API; shell renders
responsive nav. ✅ Verified (responsive-nav check is a manual browser look —
the layout components compile and the shell mounts).

---

## Decisions log (since the original plan)

| #   | Decision                                              | Why                                                                                                                                |
| --- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Docker skipped for MVP                                | User instruction.                                                                                                                  |
| 2   | Sentry skipped for MVP                                | User instruction. Structured logs via pino only.                                                                                   |
| 3   | CI/CD skipped for MVP                                 | User instruction. Deploys are manual.                                                                                              |
| 4   | Password reset removed                                | User instruction; PRD already updated. No `/auth/forgot-password` or `/auth/reset`.                                                |
| 5   | Project-local pnpm store                              | ~~NTFS hang fix.~~ **Reverted 2026-05-15** — repo moved to ext4; `store-dir` removed from `.npmrc`, default global store back in use. |
| 6   | bcryptjs over bcrypt                                  | Avoided native postinstall hang on NTFS. **Kept** post-move: works fine, ~40 ms hashing cost not worth reverting.                   |
| 7   | Hand-authored docs added to `.prettierignore`         | Don't reformat user-curated docs (PRD, TRD, design, project-description, designs/.../DESIGN.md).                                   |
| 8   | `engine-strict=false` in .npmrc                       | Allow Node 24 even though engines pin says `>=20` (would otherwise warn).                                                          |
| 9   | Python 3.11 via **pyenv** (3.11.15)                   | User chose pyenv over uv / system apt. Compiled from source; build deps installed via apt.                                         |
| 10  | ML venv + pip cache on the NTFS partition             | ~~Same cross-fs reasoning as the pnpm store.~~ **Reverted 2026-05-15** — `PIP_CACHE_DIR` workaround removed; pip uses `~/.cache/pip`. |
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

---

## Known follow-ups when picking work back up

- [ ] Decide whether to keep `bcryptjs` or revert to `bcrypt` for production (see Decision #6).
- [ ] Begin **Phase 5 (Pages)** — replace the `<PagePlaceholder>` stubs with the
      9 real screens (landing, auth split-layout polish, profile wizard,
      dashboard, recommendations, nutrition search, analytics, settings,
      empty/loading/error states). HTML mocks live in `designs/*/code.html`.
- [ ] Phase 6 (Quality gates).
- [ ] Wire up real Spoonacular/Edamam keys when available — the nutrition module already proxies + caches; without keys it falls back to `food_catalog` (Decision #17).
- [ ] The monthly scheduler only fires on a month rollover within a single long-lived process (Decision #15); for production, trigger `runMonthlyMaintenance()` from a real cron / systemd timer.
- [ ] Optional: replace synthetic-only ANN data with real Kaggle datasets (TRD §6.1 mentions them; not shipped — synthetic augmentation alone meets the MAE target).

---

## Files most useful for orientation

1. `IMPLEMENTATION_PLAN.md` — what's planned, in what order, with deferred items called out.
2. `TRD.md` — system architecture, API contracts, data model, ML pipelines.
3. `PRD.md` — product requirements + personas + non-functional reqs.
4. `apps/api/README.md` — endpoint list + smoke-test recipes for Phase 1.
5. `packages/shared-types/src/` — canonical DTOs; reach for these before inventing new types.
