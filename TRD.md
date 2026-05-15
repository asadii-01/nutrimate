# Technical Requirements Document (TRD)
## NutriMate – AI Powered Diet & Meal Recommendation System

| Field | Value |
|---|---|
| Document Version | 1.0 |
| Date | 2026-05-13 |
| Companion Document | PRD.md v1.0 |
| Status | Draft |

---

## 1. Purpose

This TRD translates the product requirements defined in `PRD.md` into a concrete technical specification: system architecture, service contracts, data models, ML pipelines, infrastructure, security, and operational requirements. It is the source of truth for engineering implementation.

---

## 2. System Architecture

### 2.1 High-Level Topology

```
                    ┌────────────────────┐
                    │   React Frontend   │
                    │  (Vercel, SPA)     │
                    └─────────┬──────────┘
                              │ HTTPS / JSON
                              ▼
                    ┌────────────────────┐
                    │  Express API GW    │
                    │  (Node.js, Render) │
                    └─────┬──────────┬───┘
                          │          │
              ┌───────────┘          └───────────────┐
              ▼                                      ▼
   ┌────────────────────┐                ┌──────────────────────┐
   │  MongoDB Atlas     │                │  ML Service (FastAPI)│
   │  (replica set)     │                │  ANN + KNN models    │
   └────────────────────┘                └──────────┬───────────┘
                                                    │
                                                    ▼
                                          ┌──────────────────┐
                                          │  Model Store     │
                                          │ (S3 / local FS)  │
                                          └──────────────────┘

   ┌────────────────────┐
   │  Nutrition API     │  (Spoonacular primary, Edamam fallback)
   │  (external)        │
   └────────────────────┘
```

### 2.2 Services & Responsibilities

| Service | Tech | Responsibilities |
|---|---|---|
| **Web client** | React 18 + Vite + Tailwind | UI, auth token storage, charts, API calls |
| **API gateway** | Node.js 20 + Express | REST endpoints, auth, request validation, orchestration, caching |
| **ML service** | Python 3.11 + FastAPI | Calorie prediction (ANN), meal recommendation (KNN) |
| **Database** | MongoDB 7 (Atlas M10+) | Persistent user, profile, log, catalog data |
| **Object storage** | local volume| Trained model artifacts |
| **External API** | Spoonacular REST | Food nutrition lookup |

### 2.3 Repository Layout

```
nutrimate/
├── apps/
│   ├── web/                 # React frontend
│   └── api/                 # Express API gateway
├── services/
│   └── ml/                  # FastAPI ML service
├── packages/
│   └── shared-types/        # TypeScript DTOs shared FE/BE
└── docs/
    ├── PRD.md
    └── TRD.md
```

---

## 3. Technology Stack (Pinned)

| Layer | Choice | Version | Rationale |
|---|---|---|---|
| FE framework | React | 18.x | Component model, mature ecosystem |
| FE build | Vite | 5.x | Fast HMR, modern bundling |
| FE styling | Tailwind CSS | 3.x | Utility-first, small bundle |
| FE charts | Recharts | 2.x | Declarative, fits React |
| FE state/data | TanStack Query | 5.x | Server-state caching, retries |
| Backend runtime | Node.js | 20 LTS | Stable, long support |
| Backend framework | Express | 4.x | Minimal, well-known |
| Auth | jsonwebtoken + bcrypt | latest | JWT + password hashing |
| Validation | Zod | 3.x | Shared schemas FE/BE |
| ORM/ODM | Mongoose | 8.x | Schema enforcement for MongoDB |
| ML runtime | Python | 3.11 | TF/sklearn compatibility |
| ML API | FastAPI | 0.110+ | Async, OpenAPI, fast |
| ML libs | TensorFlow/Keras 2.15, scikit-learn 1.4, pandas, numpy | — | ANN + KNN |
| DB | MongoDB | 7.x (Atlas) | Document-oriented fits profile/log |
| Cache | Redis | 7.x | API cache, rate limiting |
| CI/CD | GitHub Actions | — | Free tier, integrates with deploy targets |
| Container | Docker | — | Reproducible builds |
| Monitoring | Sentry + UptimeRobot | — | Errors + uptime |

---

## 4. API Specification

All endpoints under `/api/v1`. JSON request/response. Auth via `Authorization: Bearer <jwt>`.

### 4.1 Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create user `{email, password}` → returns `{accessToken, refreshToken}` |
| POST | `/auth/login` | — | Authenticate → tokens |
| POST | `/auth/refresh` | refresh token | New access token |
| POST | `/auth/logout` | bearer | Revoke refresh token |

### 4.2 Profile

| Method | Path | Description |
|---|---|---|
| GET | `/profile` | Current user's profile |
| POST | `/profile` | Create initial profile |
| PATCH | `/profile` | Update profile (triggers recompute) |

### 4.3 Predictions

| Method | Path | Description |
|---|---|---|
| GET | `/predictions/calories` | Latest calorie target + BMI |
| POST | `/predictions/recompute` | Force recomputation |

### 4.4 Recommendations

| Method | Path | Description |
|---|---|---|
| GET | `/recommendations/today` | Today's meal plan |
| POST | `/recommendations/swap` | Swap a meal `{mealType}` |
| POST | `/recommendations/regenerate` | Regenerate entire day |

### 4.5 Nutrition Search

| Method | Path | Description |
|---|---|---|
| GET | `/nutrition/search?q=<food>` | Proxied search, cached 24h |
| GET | `/nutrition/item/:id` | Item detail |

### 4.6 Logs

| Method | Path | Description |
|---|---|---|
| POST | `/logs/meal` | Log a meal `{mealType, items, totalKcal}` |
| POST | `/logs/water` | Log glasses `{glasses}` |
| GET | `/logs/day?date=YYYY-MM-DD` | Day summary |
| GET | `/logs/range?from=&to=` | Date range (for charts) |

### 4.7 ML Service (internal, called by API only)

| Method | Path | Description |
|---|---|---|
| POST | `/ml/predict-calories` | `{age, gender, height, weight, activity}` → `{kcal, confidence}` |
| POST | `/ml/recommend-meals` | `{features, kcalTarget, dietPref, budget}` → `{meals[]}` |
| GET | `/ml/health` | Liveness + model version |

### 4.8 Error Format (RFC 7807-like)

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Height must be between 100 and 250 cm.",
    "details": { "field": "height", "value": 350 }
  }
}
```

### 4.9 Standard Response Codes
`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `429 Too Many Requests`, `500 Server Error`, `503 Service Unavailable` (ML down → fallback path triggers).

---

## 5. Data Model

### 5.1 MongoDB Collections

#### `users`
```js
{
  _id: ObjectId,
  email: String,           // unique, lowercased, indexed
  passwordHash: String,    // bcrypt, cost 12
  emailVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### `profiles`
```js
{
  _id: ObjectId,
  userId: ObjectId,        // unique, indexed
  age: Number,             // 13–80
  gender: String,          // 'male'|'female'|'other'
  heightCm: Number,        // 100–250
  weightKg: Number,        // 30–250
  activityLevel: String,   // 'sedentary'|'light'|'moderate'|'active'|'very_active'
  goal: String,            // 'lose'|'gain'|'maintain'
  dietPref: String,        // 'veg'|'nonveg'|'vegan'
  budgetTier: String,      // 'low'|'medium'|'high'
  updatedAt: Date
}
```

#### `predictions`
```js
{
  _id: ObjectId,
  userId: ObjectId,        // indexed
  date: Date,              // indexed
  calorieTarget: Number,
  bmi: Number,
  bmiCategory: String,
  source: String,          // 'ann'|'fallback'
  modelVersion: String,
  createdAt: Date
}
```

#### `meal_logs`
```js
{
  _id: ObjectId,
  userId: ObjectId,        // indexed
  date: Date,              // YYYY-MM-DD
  mealType: String,        // 'breakfast'|'lunch'|'dinner'|'snack'
  items: [{ foodId, name, kcal, protein, carbs, fats, servings }],
  totalKcal: Number,
  createdAt: Date
}
```
Compound index: `{ userId: 1, date: 1 }`.

#### `water_logs`
```js
{
  _id: ObjectId,
  userId: ObjectId,
  date: Date,
  glasses: Number,
  mlPerGlass: Number,
  totalMl: Number
}
```

#### `food_catalog`
```js
{
  _id: ObjectId,
  name: String,             // text-indexed
  kcal: Number,
  macros: { protein, carbs, fats },
  vitamins: Object,
  costTier: String,         // 'low'|'medium'|'high'
  hostelFriendly: Boolean,
  dietTags: [String],       // ['veg','vegan','halal',...]
  region: String,           // 'pakistani'|'general'
  source: String            // 'curated'|'spoonacular'
}
```

#### `nutrition_cache`
```js
{
  _id: String,              // cacheKey (e.g. 'search:chicken_biryani')
  payload: Object,
  fetchedAt: Date,          // TTL index → expires after 24h
  source: String            // 'spoonacular'|'edamam'
}
```

### 5.2 Indexes Summary
- `users.email` — unique
- `profiles.userId` — unique
- `predictions.{userId, date}` — compound
- `meal_logs.{userId, date}` — compound
- `food_catalog.name` — text
- `nutrition_cache.fetchedAt` — TTL 86400s

---

## 6. ML Pipeline

### 6.1 ANN — Calorie Prediction

**Inputs (preprocessed):**
- `age` (int, scaled)
- `gender` (one-hot: male/female/other → 3 dims)
- `heightCm` (scaled)
- `weightKg` (scaled)
- `activityLevel` (ordinal 1–5, scaled)

**Architecture:**
```
Input(8) → Dense(64, relu) → Dropout(0.2)
        → Dense(32, relu) → Dropout(0.2)
        → Dense(16, relu)
        → Dense(1, linear)
```
- Loss: MSE
- Optimizer: Adam (lr=1e-3)
- Batch: 32, Epochs: 100 with EarlyStopping (patience=10)
- Target: daily kcal (regression)

**Data sources:**
- Kaggle nutrition/calorie datasets.
- Synthetic augmentation via Mifflin–St Jeor formula across plausible feature grid.

**Validation:**
- 80/10/10 split (train/val/test).
- Acceptance: MAE ≤ 150 kcal on test.
- Calibrated against Mifflin–St Jeor; mean deviation reported.

**Artifact:**
- Saved as `models/calorie_ann_v{semver}.keras` + `scaler.pkl`.
- Versioned; `modelVersion` recorded on every prediction.

### 6.2 KNN — Meal Recommendation

**Feature vector (normalized):**
`[age, bmi, activityLevel, goalEncoded, dietPrefEncoded]` → 5 dims.

**Setup:**
- `k = 5` (configurable via env).
- Distance: Euclidean on StandardScaler-normalized features.
- Index: scikit-learn `NearestNeighbors` rebuilt on profile additions (nightly batch).

**Recommendation flow:**
1. Build query vector from current user's profile.
2. Retrieve k nearest historical profiles.
3. Pull their accepted meal plans → candidate pool.
4. Filter by `dietPref` and `budgetTier`.
5. Compose breakfast/lunch/dinner/snack subset whose total kcal is within ±10% of target.
6. If no candidate satisfies, fall back to curated `food_catalog` filtered by same constraints.

**Cold start:**
- Seed 50+ curated meal plans grouped by 4 profile clusters (low-cal/high-cal × veg/non-veg).
- KNN backed by seeded data until user volume ≥ 100.

### 6.3 Training Pipeline

```
raw/  →  preprocess.py  →  features/  →  train_ann.py / train_knn.py
                                        ↓
                                   models/ (versioned)
                                        ↓
                                  upload to S3 / model dir
                                        ↓
                              FastAPI loads on startup
```

- Training is offline (notebook + script).
- Reproducibility: fixed `random_state`, pinned `requirements.txt`.
- Retraining cadence: monthly, or when user count doubles.

### 6.4 Inference SLAs
- ANN: ≤ 500 ms p95.
- KNN: ≤ 300 ms p95.
- ML service exposes `/ml/health` returning `{status, modelVersion, loadedAt}`.

### 6.5 Fallback Logic
If ML service is unreachable or returns 5xx:
- API computes BMR via Mifflin–St Jeor + activity multiplier.
- Meal recommendations served from curated `food_catalog` only.
- Response sets `source: "fallback"`.

---

## 7. Open Technical Questions

1. Refresh-token storage: `httpOnly` cookie vs. localStorage — what's the security/UX tradeoff acceptable here? (Ans: Localstorage)
2. Should ML service be co-located with API (single host) for Phase 1 to cut latency, or kept separate from day one for scaling? (Ans: single host)
3. Do we need a feature flag system in MVP (e.g., LaunchDarkly), or are env vars sufficient? (Ans: env vars sufficent)
4. Retention policy on `meal_logs` / `water_logs` — keep forever or roll up after N months? (Ans: roll up after 3 months)

---

## 8. Appendix — Glossary

| Term | Meaning |
|---|---|
| ANN | Artificial Neural Network |
| KNN | K-Nearest Neighbors |
| BMR | Basal Metabolic Rate |
| BMI | Body Mass Index |
| TDEE | Total Daily Energy Expenditure |
| MAE | Mean Absolute Error |
| MVP | Minimum Viable Product |
| TTI | Time To Interactive |
| LCP | Largest Contentful Paint |
