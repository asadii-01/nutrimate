# @nutrimate/web

React + Vite + TypeScript + Tailwind front-end for NutriMate. **Phase 4
deliverable:** the application shell — design-system theme, auth flow, and
responsive navigation. Feature pages land in Phase 5.

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
```

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
│   └── cn.ts                 # className joiner
├── features/auth/            # AuthContext/Provider, useAuth, route guards
├── components/
│   ├── ui/                   # Button, Input, Card, Spinner primitives
│   ├── toast/                # ToastProvider + useToast
│   ├── MealCard, ProgressRing, StatCard, MotivationalChip, Drawer
│   └── PagePlaceholder       # Phase-4 stub for not-yet-built pages
├── layout/                   # AppShell, TopNav, SideNav, BottomNav, Logo
└── pages/                    # AuthPage + placeholder destinations
```

## Design system

`tailwind.config.js` is a hand-translation of
`designs/nutrimate_design_system/DESIGN.md` — colour tokens, the Plus Jakarta
Sans typography scale, spacing (4/8px grid), radius and the Level 1/2 shadow
tokens. Keep the two in sync.
