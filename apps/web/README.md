# @nutrimate/web

React + Vite + TypeScript + Tailwind front-end for NutriMate — the full
single-page application: a public landing page, auth, a 4-step profile wizard,
and six authenticated screens, all wired to the live API.

## Stack

| Concern        | Library                       |
| -------------- | ----------------------------- |
| Build / dev    | Vite 5                        |
| UI             | React 18 + TypeScript         |
| Styling        | Tailwind 3 (theme ← DESIGN.md) |
| Server state   | TanStack Query 5              |
| Routing        | React Router 6                |
| HTTP           | axios (bearer + 401 refresh)  |
| Charts         | Recharts 2                    |
| PDF export     | jsPDF + jspdf-autotable       |
| Icons          | lucide-react                  |

## Running locally

```bash
# From the repo root — the API must be running on :4000 (see apps/api/README.md)
pnpm --filter @nutrimate/web dev      # → http://localhost:5173
```

`VITE_API_BASE_URL` is read from the repo-root `.env` (default
`http://localhost:4000/api/v1`). The API enables permissive CORS in dev, so no
proxy is needed.

```bash
pnpm --filter @nutrimate/web build       # tsc --noEmit + vite build → dist/
pnpm --filter @nutrimate/web preview     # serve the production build
pnpm --filter @nutrimate/web typecheck
pnpm --filter @nutrimate/web lint
```

## Pages

| Route        | Page              | Notes                                                       |
| ------------ | ----------------- | ----------------------------------------------------------- |
| `/`          | Landing           | Public — two-column hero, bento-grid features               |
| `/login`     | Auth              | Split-screen login/register; password show/hide             |
| `/setup`     | Profile wizard    | 4 steps — demographics → activity → goal → diet+budget      |
| `/dashboard` | Dashboard         | Calorie/hydration rings, BMI + health-risk cards, charts    |
| `/meals`     | Meal recommendations | 4 meal cards; per-meal swap, mark-eaten; regenerate day  |
| `/search`    | Nutrition search  | `?q=`-synced search → detail drawer with serving scaler     |
| `/progress`  | Progress analytics| 7/30/90-day charts, achievement badges, insight cards       |
| `/settings`  | Settings          | Editable profile, water reminder, 7-day PDF export, sign out|

App pages sit behind `<ProtectedRoute>` + `<RequireProfile>` — a signed-in user
with no profile is redirected to `/setup`. Every data-driven view has explicit
loading / empty / error states.

## Layout

```
src/
├── main.tsx                  # entry — providers (Query, Router, Auth, Toast)
├── App.tsx                   # route map (public vs. protected)
├── index.css                 # Tailwind layers + base styles
├── lib/
│   ├── env.ts                # VITE_API_BASE_URL resolution
│   ├── api.ts                # axios client — bearer + single-flight refresh
│   ├── tokenStore.ts         # localStorage token storage (TRD Q1)
│   ├── queryClient.ts        # TanStack Query defaults
│   ├── dates.ts / labels.ts  # UTC-date helpers + enum labels
│   ├── pdfExport.ts          # 7-day PDF report builder (jsPDF)
│   └── cn.ts                 # className joiner
├── features/                 # TanStack Query API layer (one folder per domain)
│   ├── auth/  profile/  predictions/  recommendations/
│   ├── health-risk/  logs/  nutrition/  models/
├── components/
│   ├── ui/                   # Button, Input, Card, Select, Spinner
│   ├── toast/                # ToastProvider + useToast
│   ├── states/               # EmptyState, ErrorState, Skeleton
│   ├── charts/               # MacroDonut, CalorieTrendChart, chart theme
│   └── MealCard, ProgressRing, StatCard, MotivationalChip, Drawer
├── layout/                   # AppShell, TopNav, SideNav, BottomNav, Logo
└── pages/                    # 9 screens (Landing, Auth, ProfileSetup,
                              #   Dashboard, Meals, Search, Progress, Settings, NotFound)
```

## Behaviours worth knowing

- **Token refresh:** `lib/api.ts` attaches the bearer and, on a 401, runs a
  single-flight `/auth/refresh`; a failed refresh clears storage and signs out.
- **Charts** (Recharts) and **jsPDF** are split into their own Vite
  `manualChunks` bundles; `pdfExport` is dynamic-imported so jsPDF loads only on
  the Settings export click.
- **Settings export** produces a 7-day PDF with the profile, an ANN/KNN/SVM
  model report, recommended meals, and the log table.
