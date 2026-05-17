# Product Requirements Document (PRD)
## NutriMate – AI Powered Diet & Meal Recommendation System

| Field | Value |
|---|---|
| Document Version | 1.0 |
| Date | 2026-05-13 |
| Product Name | NutriMate |
| Product Type | Web Application (ML-powered SaaS) |
| Status | Draft |

---

## 1. Executive Summary

NutriMate is an AI-powered web application that delivers personalized diet and meal recommendations using Machine Learning. It targets students, gym beginners, and budget-conscious users — particularly in the Pakistani market — by combining ANN-based calorie prediction, KNN-based meal recommendations, SVM-based health-risk classification, and external nutrition APIs in a clean, responsive interface.

**Primary value proposition:** Affordable, intelligent, localized nutrition guidance that replaces costly dietitian consultations.

---

## 2. Goals & Success Metrics

### 2.1 Product Goals
- Deliver accurate (>85%) calorie requirement predictions via ANN.
- Generate relevant meal recommendations via KNN with measurable user satisfaction.
- Grade multi-factor health risk via an SVM classifier.
- Provide a localized, budget-friendly food catalog for the Pakistani student demographic.


---

## 3. Target Users & Personas

### 3.1 Primary Personas

**Persona 1 — "Ali, the Hostel Student"**
- 20, computer science student, limited budget (~PKR 500/day for food).
- Pain: Doesn't know caloric needs; eats irregularly.
- Need: Cheap, healthy meal options using hostel-accessible ingredients.

**Persona 2 — "Sara, the Gym Beginner"**
- 24, junior office worker, joined gym recently.
- Pain: Confused by contradictory online diet advice.
- Need: Clear daily calorie target and a meal plan aligned with weight loss.

**Persona 3 — "Bilal, the Health-Conscious Professional"**
- 30, office worker, sedentary lifestyle.
- Pain: Gaining weight, no time to plan meals.
- Need: Quick recommendations and progress tracking.

### 3.2 Secondary Users
- University students broadly, weight gain/loss seekers, vegetarian/vegan users.

---

## 4. Problem Statement

Existing diet applications are expensive, complex, and not localized for the Pakistani context. Students and working individuals lack:
- Knowledge of personal caloric requirements.
- Access to affordable personalized diet plans.
- Recommendations grounded in locally available, budget-friendly foods.

NutriMate fills this gap with an ML-driven, localized, free-tier-accessible product.

---

## 5. Scope

### 5.1 In Scope (MVP)
- User authentication (JWT + bcrypt).
- Health profile capture.
- ANN-based daily calorie prediction.
- KNN-based meal recommendation engine.
- SVM-based health-risk classification (low/moderate/high).
- Food nutrition search (third-party API).
- Water intake tracker.
- Insights dashboard with charts.
- Budget-friendly meal catalog (Pakistani foods).
- Data export — downloadable 7-day PDF report (profile, predictions, logs, ML model report).

---

## 6. Functional Requirements

### 6.1 FR-1: User Authentication
| ID | Requirement |
|---|---|
| FR-1.1 | Users must register with email + password. |
| FR-1.2 | Passwords must be hashed using bcrypt (min 10 rounds). |
| FR-1.3 | Sessions managed via JWT (expiry 24h, refresh token support). |
| FR-1.4 | Logout invalidates the refresh token. |

### 6.2 FR-2: User Health Profile
| ID | Requirement |
|---|---|
| FR-2.1 | Capture: age (13–80), gender, height (cm), weight (kg). |
| FR-2.2 | Capture activity level: sedentary, light, moderate, active, very active. |
| FR-2.3 | Capture goal: weight loss, weight gain, maintain. |
| FR-2.4 | Capture dietary preference: vegetarian, non-vegetarian, vegan. |
| FR-2.5 | Capture optional budget tier: low, medium, high. |
| FR-2.6 | Profile must be editable; changes trigger recomputation of predictions. |
| FR-2.7 | Validate physiologically reasonable ranges; reject impossible values. |

### 6.3 FR-3: Calorie Prediction (ANN)
| ID | Requirement |
|---|---|
| FR-3.1 | Predict daily calorie requirement from profile inputs. |
| FR-3.2 | Display BMI value and category (underweight/normal/overweight/obese). |
| FR-3.3 | Display estimated weekly weight trend based on intake vs. target. |
| FR-3.4 | Model MAE must be ≤ 150 kcal on holdout test set. |
| FR-3.5 | Inference latency ≤ 500 ms p95. |
| FR-3.6 | Fall back to Mifflin–St Jeor formula if ML service is unavailable. |

### 6.4 FR-4: Meal Recommendation (KNN)
| ID | Requirement |
|---|---|
| FR-4.1 | Recommend daily plan: breakfast, lunch, dinner, 1–2 snacks. |
| FR-4.2 | Total recommended calories must match target within ±10%. |
| FR-4.3 | Respect dietary preference strictly (no non-veg for vegetarians). |
| FR-4.4 | Respect budget tier when selected. |
| FR-4.5 | User can regenerate / swap individual meals. |
| FR-4.6 | User can mark meals as eaten; data feeds dashboard. |
| FR-4.7 | KNN uses k=5 nearest profiles; tunable post-launch. |

### 6.5 FR-5: Food Nutrition Search
| ID | Requirement |
|---|---|
| FR-5.1 | Search food by name via external API (Spoonacular/Edamam/Nutritionix). |
| FR-5.2 | Display calories, protein, carbs, fats, key vitamins per serving. |
| FR-5.3 | Cache API responses for 24h to mitigate rate limits. |
| FR-5.4 | Graceful empty state on no results / API failure. |

### 6.6 FR-6: Water Intake Tracker
| ID | Requirement |
|---|---|
| FR-6.1 | Compute recommended daily water intake (35 ml × kg body weight, baseline). |
| FR-6.2 | Allow user to log glasses (configurable serving size). |
| FR-6.3 | Show progress bar against daily goal. |
| FR-6.4 | Optional in-app reminder notifications (Phase 1.5). |

### 6.7 FR-7: Insights Dashboard
| ID | Requirement |
|---|---|
| FR-7.1 | Show today's calorie intake vs. target. |
| FR-7.2 | Show macronutrient breakdown pie chart (protein/carbs/fats). |
| FR-7.3 | Show BMI card. |
| FR-7.3a | Show health-risk card (low/moderate/high, from the SVM classifier). |
| FR-7.4 | Show hydration progress. |
| FR-7.5 | Show 7-day weight & calorie trend line chart. |
| FR-7.6 | Fully responsive (mobile, tablet, desktop). |

### 6.8 FR-8: Budget-Friendly Meal Catalog
| ID | Requirement |
|---|---|
| FR-8.1 | Curated catalog of ≥ 50 Pakistani/student-friendly meals at launch. |
| FR-8.2 | Each meal tagged: cost tier, prep time, hostel-friendly flag. |
| FR-8.3 | Meals integrate into KNN candidate pool when budget tier = low. |

### 6.9 FR-9: Health-Risk Classification (SVM)
| ID | Requirement |
|---|---|
| FR-9.1 | Grade the user's overall health risk as low / moderate / high. |
| FR-9.2 | Use a multi-factor model (age, gender, height, weight, BMI, activity) — distinct from the single-factor BMI category. |
| FR-9.3 | Surface the risk grade on the dashboard with a confidence indicator. |
| FR-9.4 | Fall back to a BMI-band heuristic if the ML service is unavailable. |
| FR-9.5 | SVM test accuracy must be ≥ 80% on the holdout set. |

### 6.10 FR-10: Data Export
| ID | Requirement |
|---|---|
| FR-10.1 | User can export their data as a downloadable PDF report from Settings. |
| FR-10.2 | Report covers the last 7 days of logs plus the current profile. |
| FR-10.3 | Report includes an ML model section — each model's prediction and the ANN/SVM training accuracy. |

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | API p95 latency ≤ 800 ms; ML inference p95 ≤ 500 ms. |
| Availability | 99% uptime target post-launch. |
| Security | Passwords hashed (bcrypt); JWT secrets in env vars; HTTPS only; OWASP Top 10 compliance. |
| Privacy | Health data encrypted at rest; user can export/delete account. |
| Scalability | Support 1,000 concurrent users on MVP infrastructure. |
| Accessibility | WCAG 2.1 AA for core flows. |
| Browser support | Latest 2 versions: Chrome, Firefox, Edge, Safari. |
| Localization | English (Phase 1); architecture must allow Urdu addition later. |

---

## 8. System Architecture

```
[ React Frontend ] --HTTPS--> [ Node.js / Express API ] --REST--> [ Python ML Service (FastAPI) ]
                                       |                                    |
                                       v                                    v
                                [ MongoDB Atlas ]                  [ ANN + KNN models ]
                                       |
                                       v
                            [ Nutrition API (Spoonacular) ]
```

### 8.1 Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React.js + Tailwind CSS (with MUI components where useful) |
| State management | React Query + Context API |
| Backend API | Node.js + Express.js |
| ML Service | Python FastAPI |
| ML Libraries | scikit-learn (KNN + SVM), TensorFlow/Keras (ANN), pandas, numpy |
| Database | MongoDB (Atlas managed) |
| Auth | JWT + bcrypt |
| External APIs | Spoonacular (primary), Edamam (fallback) |


### 8.2 Data Model (high-level)

- **users**: `{ _id, email, passwordHash, createdAt }`
- **profiles**: `{ userId, age, gender, height, weight, activityLevel, goal, dietPref, budgetTier }`
- **predictions**: `{ userId, date, calorieTarget, bmi, source: "ann"|"fallback" }`
- **meals_log**: `{ userId, date, mealType, foodItems[], totalKcal }`
- **water_log**: `{ userId, date, glasses, mlPerGlass }`
- **food_catalog**: `{ name, kcal, macros, costTier, hostelFriendly, dietTags[] }`

---

## 9. ML Specifications

### 9.1 ANN (Calorie Prediction)
- **Inputs:** age, gender (one-hot), height, weight, activity level (ordinal).
- **Output:** daily calorie requirement (regression).
- **Architecture:** 3 hidden layers (64/32/16), ReLU, Adam optimizer, MSE loss.
- **Training data:** hybrid — real Kaggle demographic rows with a Mifflin–St Jeor kcal label (BMI is the engineered 8th input feature).
- **Validation:** 80/10/10 split; target MAE ≤ 150 kcal.
- **Deployment:** Saved as a versioned `.keras` model + `scaler.pkl`; served via FastAPI endpoint.

### 9.2 KNN (Meal Recommendation)
- **Feature vector:** normalized {age, BMI, activity level, goal, diet pref}.
- **k:** 5 (tunable).
- **Distance:** Euclidean on normalized features.
- **Recommendation logic:** retrieve meal plans of k-nearest users; filter by dietary/budget constraints; rank by calorie-target proximity.
- **Cold start:** seed with curated meal plans per profile cluster.

### 9.3 SVM (Health-Risk Classification)
- **Inputs:** age, gender (one-hot), height, weight, BMI, activity level — 8 dims (same layout as the ANN).
- **Output:** health-risk class — low / moderate / high (with class probabilities).
- **Model:** scikit-learn `Pipeline` of `StandardScaler` + `SVC` (RBF kernel, balanced class weights).
- **Training data:** the real UCI/Kaggle "Obesity Levels" dataset; its 7 obesity classes collapsed to 3 risk levels.
- **Validation:** 80/10/10 stratified split; target accuracy ≥ 80%.

---

## 10. User Flow (End-to-End)

1. Visitor lands on marketing page → clicks **Sign Up**.
2. Registers → redirected to **Profile Setup** form.
3. Submits profile → ML service computes calorie target.
4. Lands on **Dashboard** with today's plan, BMI, hydration, charts.
5. Reviews/swaps meals on **Meal Recommendation** page.
6. Logs meals & water through the day.
7. Returns next day: dashboard reflects yesterday's log + new plan.

---

## 11. UI/UX Requirements

### 11.1 Pages
- **Public:** Landing, About, Login, Register.
- **Authenticated:** Dashboard, Meal Recommendations, Nutrition Search, Progress Analytics, Profile/Settings.

### 11.2 Design Principles
- Clean, light theme with a single accent color (suggest green for health).
- Mobile-first responsive layout.
- Charts via Recharts or Chart.js.
- Empty/loading/error states defined for every data-driven view.