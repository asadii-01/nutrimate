"""Meal recommendation — KNN lookup over seed profiles, then composition of a
diet/budget-filtered plan scaled to the caller's kcal target (TRD §6.2)."""

from __future__ import annotations

import logging
import random
from typing import Any

from .artifacts import ModelStore
from .config import settings
from .schemas import FoodItem, Macros, Meal, MealRecommendRequest, MealRecommendResponse

logger = logging.getLogger("nutrimate_ml.recommender")

_GOAL_ENCODING = {"lose": 0, "maintain": 1, "gain": 2}
_DIET_ENCODING = {"nonveg": 0, "veg": 1, "vegan": 2}
# A user with dietPref X may eat dishes tagged with any of these diets.
_DIET_ALLOWS = {
    "nonveg": {"nonveg", "veg", "vegan"},
    "veg": {"veg", "vegan"},
    "vegan": {"vegan"},
}
_COST_RANK = {"low": 1, "medium": 2, "high": 3}
_MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"]


class RecommendationError(RuntimeError):
    """Raised when no diet/budget-compatible plan can be composed."""


def _diet_ok(user_pref: str, dish_diet: str) -> bool:
    return dish_diet in _DIET_ALLOWS[user_pref]


def _cost_ok(budget: str | None, dish_cost: str) -> bool:
    return budget is None or _COST_RANK[dish_cost] <= _COST_RANK[budget]


def _substitute(
    dishes: dict[str, Any], meal_type: str, target_kcal: float,
    user_pref: str, budget: str | None,
) -> tuple[str, dict] | None:
    """Pick a diet/budget-compatible dish of `meal_type` near `target_kcal`,
    randomized over the closest few so repeated swaps produce variety."""
    pool = [
        (did, d) for did, d in dishes.items()
        if d["meal"] == meal_type and _diet_ok(user_pref, d["diet"]) and _cost_ok(budget, d["costTier"])
    ]
    if not pool:
        return None
    pool.sort(key=lambda kv: abs(kv[1]["kcal"] - target_kcal))
    return random.choice(pool[:3])


def _filter_meal(
    meal: dict, dishes: dict[str, Any], user_pref: str, budget: str | None,
) -> list[tuple[str, dict]]:
    """Keep a meal's compatible dishes; if all are dropped, substitute one so
    the meal never ends up empty (Meal.items requires ≥1)."""
    kept: list[tuple[str, dict]] = []
    for item in meal["items"]:
        d = dishes.get(item["foodId"])
        if d is None:
            continue
        if _diet_ok(user_pref, d["diet"]) and _cost_ok(budget, d["costTier"]):
            kept.append((item["foodId"], d))
    if not kept:
        sub = _substitute(dishes, meal["mealType"], meal["totalKcal"], user_pref, budget)
        if sub is not None:
            kept.append(sub)
    return kept


def _encode_query(req: MealRecommendRequest) -> list[float]:
    f = req.features
    return [
        float(f.age),
        float(f.bmi),
        float(f.activityLevel),
        float(_GOAL_ENCODING[f.goal]),
        float(_DIET_ENCODING[f.dietPref]),
    ]


def recommend_meals(store: ModelStore, req: MealRecommendRequest) -> MealRecommendResponse:
    """Run the KNN and compose a plan. Caller must ensure `store.knn_ready`."""
    artifact = store.knn
    assert artifact is not None  # guarded by caller
    plans: list[dict] = artifact["plans"]
    dishes: dict[str, Any] = artifact["dishes"]
    scaler = artifact["scaler"]
    nn = artifact["nn"]

    query = scaler.transform([_encode_query(req)])
    _, indices = nn.kneighbors(query)
    candidates = [plans[i] for i in indices[0]]
    matched_ids = [p["id"] for p in candidates]

    # Filter each candidate's meals; keep every plan that can be fully composed.
    viable: list[tuple[dict, list[list[tuple[str, dict]]], float]] = []
    for plan in candidates:
        filtered = [
            _filter_meal(m, dishes, req.dietPref, req.budgetTier) for m in plan["meals"]
        ]
        if any(len(fm) == 0 for fm in filtered):
            continue  # a meal could not be satisfied at all
        total = sum(d["kcal"] for fm in filtered for _, d in fm)
        viable.append((plan, filtered, total))

    if not viable:
        raise RecommendationError(
            f"no plan satisfies dietPref={req.dietPref} budgetTier={req.budgetTier}"
        )

    # Any plan whose base total sits in the 0.5–2.0× serving-scale window can be
    # scaled onto the target, so pick one at random — this is what gives
    # swap/regenerate their variety. Fall back to the closest plan otherwise.
    scalable = [v for v in viable if req.kcalTarget * 0.5 <= v[2] <= req.kcalTarget * 2.0]
    chosen, filtered_meals, base_total = (
        random.choice(scalable)
        if scalable
        else min(viable, key=lambda v: abs(v[2] - req.kcalTarget))
    )

    # Scale servings so the plan lands near the target, clamped to a sane band.
    # 0.1-step rounding keeps the total within ±10% across the clamp range
    # (coarser steps collapse most scale factors to 1.0 and miss the band).
    scale = req.kcalTarget / base_total if base_total > 0 else 1.0
    scale = min(2.0, max(0.5, scale))
    servings = round(scale, 1)

    meals: list[Meal] = []
    for fm, plan_meal in zip(filtered_meals, chosen["meals"]):
        items: list[FoodItem] = []
        for dish_id, d in fm:
            items.append(FoodItem(
                foodId=dish_id,
                name=d["name"],
                kcal=round(d["kcal"] * servings, 1),
                macros=Macros(
                    protein=round(d["macros"]["protein"] * servings, 1),
                    carbs=round(d["macros"]["carbs"] * servings, 1),
                    fats=round(d["macros"]["fats"] * servings, 1),
                ),
                servings=servings,
            ))
        meals.append(Meal(
            mealType=plan_meal["mealType"],
            items=items,
            totalKcal=round(sum(it.kcal for it in items), 1),
        ))

    meals.sort(key=lambda m: _MEAL_ORDER.index(m.mealType))
    total_kcal = round(sum(m.totalKcal for m in meals), 1)

    tol = settings.kcal_tolerance
    if not (req.kcalTarget * (1 - tol) <= total_kcal <= req.kcalTarget * (1 + tol)):
        logger.info(
            "composed plan %s at %d kcal is outside ±%.0f%% of target %d",
            chosen["id"], total_kcal, tol * 100, req.kcalTarget,
        )

    return MealRecommendResponse(
        meals=meals,
        totalKcal=total_kcal,
        calorieTarget=req.kcalTarget,
        matchedPlanIds=matched_ids,
        modelVersion=store.knn_version or "unknown",
    )
