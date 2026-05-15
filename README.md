# NutriMate

> AI-powered diet & meal recommendation system — personalized calorie targets
> and meal plans for students, gym beginners, and budget-conscious users
> (with a Pakistani-market focus).

See [`PRD.md`](./PRD.md), [`TRD.md`](./TRD.md), and
[`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) for full product and
technical specifications.

---

## Monorepo Layout

```
nutrimate/
├── apps/
│   ├── web/                # React + Vite frontend           (Phase 4)
│   └── api/                # Express API gateway             (Phase 1)
├── services/
│   └── ml/                 # FastAPI ANN + KNN service       (Phase 2)
├── packages/
│   └── shared-types/       # Zod schemas + TS types (FE↔BE)
├── designs/                # Stitch design exports + design system
├── PRD.md                  # Product requirements
├── TRD.md                  # Technical requirements
└── IMPLEMENTATION_PLAN.md  # Phased build plan
```

---

## Prerequisites

| Tool               | Version         | Install                                                      |
| ------------------ | --------------- | ------------------------------------------------------------ |
| Node.js            | 20 LTS or newer | https://nodejs.org / via `nvm install 20`                    |
| pnpm               | 9.x             | `corepack enable && corepack prepare pnpm@9.15.0 --activate` |
| Python             | 3.11 or 3.12    | https://www.python.org (TF 2.15 needs <3.13)                 |
| MongoDB            | 7.x             | https://www.mongodb.com/docs/manual/installation/            |
| Redis _(optional)_ | 7.x             | https://redis.io/docs/install/install-redis/                 |

Verify after installing:

```bash
node --version    # v20+ (we run v24 locally)
pnpm --version    # 9.x
python3 --version # 3.11.x or 3.12.x
mongosh --version
```

> **No Docker is used for MVP.** All services run directly on the host.

---

## First-Time Setup

```bash
# 1. Clone and install JS dependencies
pnpm install

# 2. Copy env template and fill in secrets / DB URI
cp .env.example .env

# 3. Build the shared types package
pnpm --filter @nutrimate/shared-types build

# 4. Start MongoDB (one-time service start)
sudo systemctl start mongod   # or:  mongod --dbpath ~/data/db

# 5. Confirm Mongo is reachable
mongosh "mongodb://127.0.0.1:27017"
```

The ML service has its own Python virtualenv — set up separately when starting Phase 2:

```bash
cd services/ml
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

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

Per-package commands (once each phase implements them):

```bash
pnpm --filter @nutrimate/api dev
pnpm --filter @nutrimate/web dev
```

---

## Current Status

| Phase | Description                | Status      |
| ----- | -------------------------- | ----------- |
| 0     | Scaffolding & shared types | **Done**    |
| 1     | API skeleton + auth        | Not started |
| 2     | ML service (ANN + KNN)     | Not started |
| 3     | API business logic         | Not started |
| 4     | Frontend foundation        | Not started |
| 5     | Pages                      | Not started |
| 6     | Quality gates              | Not started |

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for what each phase delivers.
