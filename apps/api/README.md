# @nutrimate/api

Express API gateway for NutriMate. Phase 1 deliverable: auth skeleton +
`/healthz` + protected echo route (`/api/v1/me`).

## Running locally

From the repo root:

```bash
# 1. Make sure Mongo is running
sudo systemctl start mongod   # or: mongod --dbpath ~/data/db

# 2. Copy env template and fill in JWT secrets (must be ≥ 32 chars each)
cp .env.example .env
# Edit JWT_ACCESS_SECRET / JWT_REFRESH_SECRET

# 3. Dev server (auto-reload)
pnpm --filter @nutrimate/api dev

# Or one-shot build + run
pnpm --filter @nutrimate/api build
pnpm --filter @nutrimate/api start
```

The API listens on `http://localhost:4000` by default.

## Endpoints (Phase 1)

| Method | Path                    | Notes                                                      |
| ------ | ----------------------- | ---------------------------------------------------------- |
| GET    | `/healthz`              | Liveness + Mongo connectivity                              |
| POST   | `/api/v1/auth/register` | `{ email, password }` → `{ accessToken, refreshToken, … }` |
| POST   | `/api/v1/auth/login`    | `{ email, password }` → tokens                             |
| POST   | `/api/v1/auth/refresh`  | `{ refreshToken }` → new tokens, revokes old jti           |
| POST   | `/api/v1/auth/logout`   | `{ refreshToken }` → 204; idempotent                       |
| GET    | `/api/v1/me`            | Protected echo: returns the bearer's user info             |

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

# Call protected route
curl -s http://localhost:4000/api/v1/me -H "authorization: Bearer $TOKEN" | jq
```

## Layout

```
src/
├── server.ts          # entry point — connects Mongo, starts HTTP
├── app.ts             # composes middleware + routes
├── config/env.ts      # Zod-validated env vars
├── db/mongo.ts        # mongoose connection helpers
├── lib/               # logger, errors, password, jwt
├── middleware/        # errorHandler, validate, auth, rateLimit
├── models/            # 8 Mongoose models (TRD §5.1 + RefreshToken)
├── modules/auth/      # register / login / refresh / logout
└── routes/            # /healthz, /api/v1/me, /api/v1 router
```

Subsequent phases (profile, predictions, recommendations, logs, nutrition
search) land under `modules/` following the same pattern.
