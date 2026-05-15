# NutriMate – Google Stitch UI Design Prompt

This document contains the master prompt for generating UI designs for **NutriMate**
(AI-powered diet & meal recommendation system) using [Google Stitch](https://stitch.withgoogle.com).

---

## How to Use

1. Paste the full **Master Prompt** below as your initial input in Stitch to establish
   the design system.
2. Iterate screen-by-screen using shorter prompts that reference the established style
   (e.g., *"Same style as previous, now design the Meal Recommendations page"*).
3. If Stitch's character limit is tight, start with the **Visual Style** block +
   Dashboard, then generate other screens one at a time.

---

## Master Prompt

```
Design a clean, modern, mobile-first responsive web application called "NutriMate" — an
AI-powered diet and meal recommendation platform for university students, gym beginners,
and budget-conscious users (with a Pakistani-market focus).

VISUAL STYLE
- Light theme, generous white space, soft rounded corners (12–16px radius), subtle
  drop-shadows, friendly but professional.
- Primary accent: fresh leaf-green (#16A34A or similar) signaling health and freshness.
- Secondary accents: warm orange for calories, calm blue for hydration, neutral grays
  for text/surfaces.
- Typography: a clean modern sans-serif (Inter / Plus Jakarta Sans). Large readable
  headings, comfortable body text.
- Iconography: outlined, minimal (Lucide / Phosphor style).
- Charts: smooth, modern (Recharts-style) — donut/pie for macros, line for trends,
  progress rings/bars for goals.
- Tone: motivating, approachable, not clinical. Use friendly food and fitness imagery,
  with localized Pakistani meal photos where appropriate (daal chawal, chicken karahi,
  oats, boiled eggs, chapati, etc.).
- Fully responsive: design for mobile first, then tablet, then desktop.

SCREENS TO GENERATE

1. LANDING PAGE (public)
   - Hero with tagline "Smart Nutrition for Real Life", short subhead, primary CTA
     "Get Started Free" and secondary "Login".
   - Feature highlights: AI Calorie Prediction, Personalized Meal Plans, Budget-Friendly
     Pakistani Meals, Hydration Tracking.
   - Persona testimonials (student, gym beginner, professional).
   - Footer with About / Privacy / Contact.

2. LOGIN & REGISTER
   - Split layout: friendly illustration of healthy food on one side, form on the other.
   - Email + password fields, "Forgot password" link, social login placeholder, switch
     between login/register tabs.

3. PROFILE SETUP (multi-step wizard, 4 steps with progress bar)
   - Step 1: Age, Gender, Height (cm), Weight (kg).
   - Step 2: Activity level (5 illustrated cards: sedentary → very active).
   - Step 3: Goal (3 large cards: Lose / Maintain / Gain weight).
   - Step 4: Dietary preference (Veg / Non-veg / Vegan) and Budget tier (Low / Medium /
     High) with friendly icons.
   - "Back" and "Continue" buttons; final step shows "Generate My Plan".

4. DASHBOARD (main authenticated home)
   - Greeting header with user name and date.
   - Top row cards: Today's Calorie Target vs Consumed (progress ring), BMI card with
     category badge, Hydration progress ring (glasses of water).
   - Macronutrient donut chart (protein/carbs/fats).
   - 7-day weight & calorie trend line chart.
   - Today's meal plan preview (breakfast/lunch/dinner/snack cards with food photos and
     calorie counts, each with "Mark as Eaten" / "Swap" buttons).
   - Quick-action floating button: "Log Meal" / "Log Water".
   - Left sidebar nav (desktop) / bottom tab bar (mobile): Dashboard, Meals, Search,
     Progress, Profile.

5. MEAL RECOMMENDATIONS PAGE
   - Header showing daily calorie target and remaining calories.
   - Four sections (Breakfast, Lunch, Dinner, Snacks), each a horizontally scrollable
     row of meal cards with image, name, kcal, prep time, cost-tier badge, hostel-
     friendly tag, and macro pills.
   - Per-meal actions: "Swap Meal", "Mark as Eaten", "View Recipe".
   - Top-right "Regenerate Day" button.
   - Filter chips: Vegetarian, Vegan, Low Budget, Hostel-friendly.

6. NUTRITION SEARCH PAGE
   - Prominent search bar with placeholder "Search any food…".
   - Results as cards: food image, name, calories, macros, "Add to log" button.
   - Empty state with a friendly illustration.
   - Detail drawer/modal: full nutrition facts (calories, protein, carbs, fats, key
     vitamins), serving size selector, "Add to today" CTA.

7. PROGRESS ANALYTICS PAGE
   - Date-range selector (Week / Month / Custom).
   - Charts: weight trend line, daily calorie bars (target vs actual), macro breakdown
     stacked bar, hydration heatmap.
   - Achievement badges row (e.g., "7-Day Streak", "Hydration Hero").
   - Insights cards: short AI-generated tips ("You're 15% under protein goal this week").

8. PROFILE / SETTINGS PAGE
   - Avatar + name header with edit.
   - Editable profile fields (age, height, weight, activity, goal, diet, budget).
   - Notification preferences (water reminders toggle).
   - Account: change password, export data, delete account.
   - Logout button.

9. EMPTY / LOADING / ERROR STATES
   - For each data-driven view, design empty state (friendly illustration + CTA),
     skeleton loading state, and error state ("Couldn't reach our nutrition service —
     showing your offline plan").

KEY REUSABLE COMPONENTS
- Top navbar with logo, search, profile avatar, notification bell.
- Bottom tab bar (mobile) with 5 icons.
- Meal card (image, title, kcal, macros, tags, actions).
- Progress ring component (calories, water).
- Stat card (label, big number, delta indicator).
- Modal/drawer for meal details and meal swap.
- Toast notifications (success / warning / error).

ACCESSIBILITY
- WCAG 2.1 AA contrast.
- Large tap targets (min 44px).
- Clear focus states on all interactive elements.

Output: a coherent design system across all screens — consistent spacing, color usage,
typography, and component styling. Prioritize a calm, motivating feel that makes
healthy eating feel achievable and affordable.
```

---

## Per-Screen Follow-up Prompts

Use these after the master prompt to refine individual screens:

- **Landing:** *"Generate the landing page only, in the established style. Emphasize the hero CTA and three feature cards in a row on desktop, stacked on mobile."*
- **Dashboard:** *"Generate the authenticated Dashboard in the established style. Show calorie ring, BMI card, hydration ring as the top row; macro donut and trend line below; meal preview at the bottom."*
- **Meals:** *"Generate the Meal Recommendations page in the established style with four horizontally scrollable meal rows."*
- **Search:** *"Generate the Nutrition Search page with results grid and a detail drawer."*
- **Progress:** *"Generate the Progress Analytics page with weight trend, calorie bars, macro stack, and hydration heatmap."*
- **Profile:** *"Generate the Profile/Settings page with editable fields and account actions."*

---

## Source Documents

This prompt is derived from:
- `project-description.md` — feature list, user flow, target users
- `PRD.md` — functional requirements, personas, UI/UX principles
- `TRD.md` — tech stack (React + Tailwind + Recharts), data model
