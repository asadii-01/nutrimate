# NutriMate – Implementation Plan

| Field               | Value                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| Document Version    | 1.0                                                                   |
| Date                | 2026-05-13                                                            |
| Companion Documents | `project-description.md`, `PRD.md`, `TRD.md`, `design.md`, `designs/` |
| Status              | Draft                                                                 |

---

## Scope Notes (Deferred for MVP)

The following items are explicitly **out of scope** for this implementation:

- **Docker / containerization** — local dev runs services directly (Node, Python, MongoDB installed on host).
- **Sentry / external error monitoring** — rely on application logs only for MVP.
- **CI/CD pipelines (GitHub Actions, deploy automation)** — manual builds and deploys for MVP.
- **Password reset flow** — removed from PRD. Users cannot self-recover accounts in MVP.

These can be revisited post-MVP.

---

## Phase Overview

```
Phase 0 ─┬─ Phase 1 (API skeleton) ─┐
         └─ Phase 2 (ML service)  ──┴─ Phase 3 (API logic) ─┐
                                                            ├─ Phase 5 (Pages) ─ Phase 6
         └─ Phase 4 (FE shell) ─────────────────────────────┘
```

---

## Phase 0 · Repo & Tooling Foundation (Day 1)

Set up the monorepo per TRD §2.3 so all three services can be developed in lockstep.

- Initialize root `nutrimate/` with `apps/web`, `apps/api`, `services/ml`, `packages/shared-types`.
- Configure pnpm workspaces (JS) + uv/pip (Python).
- Local services run natively: install **MongoDB 7** and (optionally) **Redis 7** on the dev machine; document install steps in `README.md`.
- Root tooling: ESLint, Prettier, TS strict, `.env.example`, `.editorconfig`.
- `packages/shared-types`: Zod schemas for `Profile`, `Prediction`, `MealPlan`, `LogEntry` (single source of truth FE↔BE).

**Exit criteria:** `pnpm install` succeeds; `mongosh` connects locally; shared types compile.

---

## Phase 1 · API Gateway Skeleton (Days 2–3)

The Express API in TRD §3 is the orchestrator everything else talks to.

- Express 4 + TypeScript + Mongoose 8 + Zod + jsonwebtoken + bcrypt.
- Mongoose models for the 7 collections in TRD §5.1 with indexes (incl. TTL on `nutrition_cache`).
- Middleware: error formatter (RFC-7807 shape from TRD §4.8), Zod request validator, JWT auth guard, in-memory rate limiter (Redis-backed if Redis is installed locally).
- Auth routes:
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`
  - **No `/auth/forgot-password` or `/auth/reset` — out of scope.**
- bcrypt cost 12; JWT 24h access + refresh (refresh stored in DB so logout can revoke); tokens delivered for **localStorage** per TRD Q1.
- Health endpoint `/healthz`.

**Exit criteria:** can register → login → call a protected echo route with a bearer token.

---

## Phase 2 · ML Service (Days 4–7)

Parallelizable with Phase 1 once shared types exist.

- FastAPI 0.110 scaffold on Python 3.11. Co-located with API in Phase 1 per TRD Q2.
- **Data pipeline** (`services/ml/pipelines/`): `preprocess.py` to normalize Kaggle datasets + Mifflin–St Jeor synthetic augmentation across an age × gender × weight × height × activity grid.
- **ANN** (`train_ann.py`):
  - 8-dim input → 64/32/16 ReLU + dropout → linear.
  - Adam 1e-3, MSE, 100 epochs, EarlyStopping(patience=10).
  - Acceptance: **MAE ≤ 150 kcal** on holdout (FR-3.4).
  - Save `models/calorie_ann_v0.1.0.keras` + `scaler.pkl`.
- **KNN** (`train_knn.py`):
  - `NearestNeighbors(k=5)` on StandardScaler-normalized `[age, bmi, activity, goal, dietPref]`.
  - Pickled artifact.
  - Seeded with **≥50 curated Pakistani meal plans** across 4 profile clusters (FR-8.1, TRD §6.2 cold start).
- Endpoints: `/ml/predict-calories`, `/ml/recommend-meals`, `/ml/health` (returns model version + load time).
- SLAs: ANN p95 ≤ 500 ms, KNN p95 ≤ 300 ms.
- Loads models on startup; gracefully 503s if missing (API will fall back).

**Exit criteria:** both endpoints serve from a saved model; `/ml/health` reports loaded version.

---

## Phase 3 · API Business Logic (Days 8–11)

Wire endpoints in TRD §4.2–4.6 on top of the skeleton.

- **Profile** (`GET/POST/PATCH /profile`) — physiological range validation (FR-2.7); PATCH triggers async recompute.
- **Predictions** — calls ML `/ml/predict-calories`; on 5xx or timeout, executes **Mifflin–St Jeor + activity multiplier fallback** locally and persists with `source:"fallback"` (FR-3.6).
- **Recommendations** — `/today`, `/swap`, `/regenerate`. Filters KNN candidate pool by `dietPref` strictly, by `budgetTier` when set, composes 3 meals + 1–2 snacks within ±10% of kcal target (FR-4.2).
- **Logs** — `meal`, `water`, `day`, `range` endpoints feeding the dashboard charts.
- **Nutrition search** — Spoonacular proxy with **24h `nutrition_cache` lookup before outbound call** (FR-5.3); Edamam fallback adapter behind same interface.
- **Food catalog seeder** — script populating ≥50 Pakistani meals tagged with `costTier`, `hostelFriendly`, `dietTags`.
- **Background job** — monthly KNN index rebuild + 3-month rollup of `meal_logs` / `water_logs` (TRD Q4). Run via node-cron in-process for MVP.

**Exit criteria:** end-to-end profile → prediction → recommendation works against real data.

---

## Phase 4 · Frontend Foundation (Days 12–13)

Build the shell before any feature pages.

- Vite 5 + React 18 + TS + Tailwind 3 + TanStack Query 5 + Recharts 2 + React Router 6.
- **Translate `designs/nutrimate_design_system/DESIGN.md` into Tailwind theme**: color tokens, typography (Plus Jakarta Sans), spacing scale, radius scale, shadow tokens (Level 0/1/2). Match the YAML frontmatter exactly.
- Auth context + axios client with bearer interceptor + 401 refresh flow (localStorage).
- App shell: top navbar (logo, search, avatar, bell), responsive sidebar (desktop) / bottom tab bar (mobile, 5 icons).
- **Reusable components** per `designs/` spec: `MealCard`, `ProgressRing`, `StatCard`, `MotivationalChip`, `Drawer`, `Toast`, button/input primitives.

**Exit criteria:** auth flow works against live API; shell renders responsive nav.

---

## Phase 5 · Pages (Days 14–20)

Build in user-flow order so each is testable end-to-end against the running backend. The HTML mocks in `designs/landing_page_public/code.html` and `designs/dashboard/code.html` are the visual reference.

1. **Landing** — hero, 4 feature highlights, 3 testimonials, footer.
2. **Login / Register** — split layout, tab switcher. **No "Forgot password" link** (deferred).
3. **Profile Setup Wizard** — 4 steps with progress bar (demographics → activity → goal → diet+budget); final step calls `POST /profile` then redirects to dashboard.
4. **Dashboard** — calorie ring, BMI card, hydration ring, macro donut, 7-day trend line, today's meal preview, FAB for quick logging.
5. **Meal Recommendations** — 4 horizontal-scroll rows, swap/eaten/recipe actions, Regenerate Day, filter chips.
6. **Nutrition Search** — search bar, results grid, detail drawer with serving selector.
7. **Progress Analytics** — date-range selector, 4 chart types, achievement badges, AI insight cards.
8. **Profile / Settings** — editable profile, water-reminder toggle, change password, export, delete. **No "Reset via email"**; password change requires the current password.
9. **States** — empty / loading / error variants for every data-driven view.

**Exit criteria:** all 9 screens reachable, responsive, hitting real endpoints.

---

## Phase 6 · Quality Gates (Days 21–23)

Before calling MVP done.

- **Testing**
  - Vitest unit (FE).
  - Jest + supertest integration (API).
  - pytest (ML).
  - Playwright happy-path e2e: register → profile setup → dashboard → log meal.
- **NFR verification**
  - API p95 ≤ 800 ms, ML p95 within SLA (measured via local load test, e.g. autocannon / k6).
  - axe-core WCAG 2.1 AA pass on core flows.
  - Cross-browser smoke: Chrome / Firefox / Edge / Safari latest 2.
- **Security**
  - Helmet, CORS allowlist.
  - Secrets only via env vars.
  - OWASP Top 10 review on auth + nutrition proxy.
  - bcrypt cost 12; document JWT secret rotation procedure.
- **Observability (lightweight, MVP-only)**
  - Structured JSON logs (pino on API, Python `logging` on ML).
  - Local log retention only — **no Sentry, no external APM**.
  - `/healthz` and `/ml/health` endpoints exist; document a manual check procedure.

**Exit criteria:** all happy-path tests green; NFRs measured and documented.

---

## Deployment (Manual, Post-MVP Hardening Optional)

CI/CD is deferred. For the first deploy:

- **Web:** `pnpm --filter web build` → upload `dist/` to chosen static host (Vercel/Netlify manual deploy, or a plain VPS + Nginx).
- **API + ML:** run as long-lived `node` and `uvicorn` processes on a single host (per TRD Q2). Use `pm2` or `systemd` units; document the commands in `DEPLOY.md`.
- **DB:** MongoDB Atlas free tier or a managed instance.

When the team is ready, add GitHub Actions back in a later phase.

---

## Critical-Path Dependencies

```
Phase 0 ─┬─ Phase 1 (API skeleton) ─┐
         └─ Phase 2 (ML service)  ──┴─ Phase 3 (API logic) ─┐
                                                            ├─ Phase 5 (Pages) ─ Phase 6
         └─ Phase 4 (FE shell) ─────────────────────────────┘
```

---

## Open Items

1. Confirm Spoonacular API key budget before Phase 3 starts.
2. KNN cold-start seeds from curated `food_catalog` clusters until real user volume ≥ 100 (per TRD §6.2).
3. Decide whether Redis is required at MVP or whether in-memory rate limiting + Mongo-backed `nutrition_cache` is sufficient (current plan: Mongo-only, install Redis only if rate limits bite).
