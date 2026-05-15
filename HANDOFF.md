# NutriMate – Handoff Notes

| Field | Value |
|---|---|
| Last updated | 2026-05-15 |
| Author | Claude (Opus 4.7) + Asad |
| Current phase | Phase 2 — complete and verified |
| Companion docs | [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md), [`PRD.md`](./PRD.md), [`TRD.md`](./TRD.md) |

---

## TL;DR

- **Phase 0 (scaffolding):** complete and verified — lint, typecheck, build all green.
- **Phase 1 (API skeleton):** complete and verified — deps installed, register → login → `/me` smoke test passes.
- **Phase 2 (ML service):** complete and verified — ANN test MAE 87.9 kcal, KNN serving 52 seed plans, all 3 endpoints smoke-tested within SLA.
- **Phases 3–6:** not started.
- **Environment quirk that bit us:** the repo lives on an **NTFS partition** mounted via `ntfs3`. Cross-filesystem installs hang for hours. Fixes in place: `.npmrc` (project-local pnpm store) and the Python venv + pip cache pinned to the NTFS partition. Keep both.

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
│   ├── api/                               # ✅ Phase 1 — deps installed, smoke test passes
│   │   ├── package.json, tsconfig.json, README.md
│   │   └── src/                           # 26 .ts files (see “Phase 1 layout” below)
│   └── web/                               # Phase 4 placeholder
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

| Phase | Description | Status | Notes |
|---|---|---|---|
| 0 | Repo & tooling foundation | ✅ Done | `pnpm install` 47s, `pnpm build/typecheck/lint/format:check` all green. |
| 1 | API skeleton + auth | ✅ Done | Deps installed; register → login → `/me` smoke test passes. |
| 2 | ML service (ANN + KNN) | ✅ Done | ANN MAE 87.9 kcal; KNN 52 seed plans; `/ml/*` endpoints verified, p95 well under SLA. |
| 3 | API business logic | ⬜ Not started | Next up. |
| 4 | Frontend foundation | ⬜ Not started | |
| 5 | Pages | ⬜ Not started | |
| 6 | Quality gates | ⬜ Not started | |

---

## Environment notes (important)

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

| File | Exports |
|---|---|
| `common.ts` | enums (Gender, ActivityLevel, Goal, DietPref, BudgetTier, MealType, BmiCategory, PredictionSource, CostTier), IsoDate, ObjectId, ApiError shape |
| `auth.ts` | Email/Password schemas, Register/Login/Refresh requests, AuthTokens |
| `profile.ts` | ProfileInput / Profile / ProfilePatch (PRD physiological ranges) |
| `prediction.ts` | Prediction + ML request/response DTOs |
| `meal.ts` | Macros, FoodItem, Meal, MealPlan, MealRecommendRequest, FoodCatalogItem |
| `log.ts` | MealLogEntry, WaterLogEntry, MealLogInput, WaterLogInput, DaySummary |

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

### How to resume / re-run

```bash
cd services/ml && source .venv/bin/activate
python pipelines/preprocess.py && python pipelines/train_ann.py && python pipelines/train_knn.py
uvicorn nutrimate_ml.main:app --host 0.0.0.0 --port 8000
```

---

## Decisions log (since the original plan)

| # | Decision | Why |
|---|---|---|
| 1 | Docker skipped for MVP | User instruction. |
| 2 | Sentry skipped for MVP | User instruction. Structured logs via pino only. |
| 3 | CI/CD skipped for MVP | User instruction. Deploys are manual. |
| 4 | Password reset removed | User instruction; PRD already updated. No `/auth/forgot-password` or `/auth/reset`. |
| 5 | Project-local pnpm store | NTFS hang fix. |
| 6 | bcryptjs over bcrypt | Avoids native postinstall hang on NTFS. |
| 7 | Hand-authored docs added to `.prettierignore` | Don't reformat user-curated docs (PRD, TRD, design, project-description, designs/.../DESIGN.md). |
| 8 | `engine-strict=false` in .npmrc | Allow Node 24 even though engines pin says `>=20` (would otherwise warn). |
| 9 | Python 3.11 via **pyenv** (3.11.15) | User chose pyenv over uv / system apt. Compiled from source; build deps installed via apt. |
| 10 | ML venv + pip cache on the NTFS partition | Same cross-fs reasoning as the pnpm store. `PIP_CACHE_DIR=services/ml/.pip-cache`. |
| 11 | BMI is the engineered 8th ANN feature | TRD §6.1 lists 7 raw inputs but specifies `Input(8)`; BMI is the natural fill and the API already computes it. |
| 12 | TensorFlow 2.16.2 (not 2.15) | `pyproject.toml` allows `>=2.15,<2.17`; pip resolved 2.16.2 on Python 3.11. Uses Keras 3. |
| 13 | Recommender scales servings in 0.1 steps | Coarser (0.5) steps collapsed most scale factors to 1.0 and missed the ±10% kcal band. |

---

## Known follow-ups when picking work back up

- [ ] Decide whether to keep `bcryptjs` or revert to `bcrypt` for production (see Decision #6).
- [ ] Begin **Phase 3 (API business logic)** — wire profile / predictions / recommendations / logs / nutrition-search on top of the Phase 1 skeleton; the API calls the ML endpoints built in Phase 2, with a Mifflin–St Jeor fallback on 5xx/timeout.
- [ ] Phase 3 also seeds the Mongo `food_catalog` — reuse `services/ml/pipelines/seed_data.py` `DISHES` (36 Pakistani dishes already tagged with `costTier` / `hostelFriendly` / diet).
- [ ] Phases 4 (FE foundation), 5 (Pages), 6 (Quality gates).
- [ ] Optional: replace synthetic-only ANN data with real Kaggle datasets (TRD §6.1 mentions them; not shipped — synthetic augmentation alone meets the MAE target).

---

## Files most useful for orientation

1. `IMPLEMENTATION_PLAN.md` — what's planned, in what order, with deferred items called out.
2. `TRD.md` — system architecture, API contracts, data model, ML pipelines.
3. `PRD.md` — product requirements + personas + non-functional reqs.
4. `apps/api/README.md` — endpoint list + smoke-test recipes for Phase 1.
5. `packages/shared-types/src/` — canonical DTOs; reach for these before inventing new types.
