"""Curated seed data for the KNN meal recommender (TRD §6.2 cold start).

Defines a library of Pakistani dishes and builds ≥50 meal plans grouped into
4 profile clusters (low-cal/high-cal × veg/non-veg). The KNN is trained on the
per-plan profile vectors; the meal compositions are the payload returned at
inference time.

`build_meal_plans()` is the single entry point used by `train_knn.py` and is
re-exported so the Phase 3 food-catalog seeder can reuse `DISHES`.
"""

from __future__ import annotations

from typing import Literal, TypedDict

Diet = Literal["nonveg", "veg", "vegan"]
Goal = Literal["lose", "maintain", "gain"]
MealType = Literal["breakfast", "lunch", "dinner", "snack"]


class Macros(TypedDict):
    protein: float
    carbs: float
    fats: float


class Dish(TypedDict):
    name: str
    kcal: int
    macros: Macros
    diet: Diet
    costTier: Literal["low", "medium", "high"]
    hostelFriendly: bool
    meal: MealType


def _m(p: float, c: float, f: float) -> Macros:
    return {"protein": p, "carbs": c, "fats": f}


# --- Dish library -----------------------------------------------------------
# `diet` is the strictest category the dish belongs to: a 'veg' user can eat
# veg + vegan; a 'vegan' user only vegan; a 'nonveg' user eats anything.
DISHES: dict[str, Dish] = {
    # Breakfast
    "anda_paratha": {"name": "Egg Paratha", "kcal": 380, "macros": _m(12, 38, 19),
                     "diet": "nonveg", "costTier": "low", "hostelFriendly": True, "meal": "breakfast"},
    "halwa_puri": {"name": "Halwa Puri", "kcal": 700, "macros": _m(12, 90, 30),
                   "diet": "veg", "costTier": "medium", "hostelFriendly": False, "meal": "breakfast"},
    "aloo_paratha": {"name": "Aloo Paratha", "kcal": 320, "macros": _m(7, 45, 12),
                     "diet": "vegan", "costTier": "low", "hostelFriendly": True, "meal": "breakfast"},
    "chana_chaat": {"name": "Chana Chaat", "kcal": 280, "macros": _m(12, 40, 8),
                    "diet": "vegan", "costTier": "low", "hostelFriendly": True, "meal": "breakfast"},
    "omelette_bread": {"name": "Omelette with Bread", "kcal": 300, "macros": _m(16, 26, 15),
                       "diet": "nonveg", "costTier": "low", "hostelFriendly": True, "meal": "breakfast"},
    "oats_milk": {"name": "Oats with Milk & Banana", "kcal": 280, "macros": _m(10, 45, 7),
                  "diet": "veg", "costTier": "low", "hostelFriendly": True, "meal": "breakfast"},
    "sweet_lassi": {"name": "Sweet Lassi", "kcal": 220, "macros": _m(6, 30, 8),
                    "diet": "veg", "costTier": "low", "hostelFriendly": True, "meal": "breakfast"},
    "paneer_paratha": {"name": "Paneer Paratha", "kcal": 420, "macros": _m(16, 44, 20),
                       "diet": "veg", "costTier": "medium", "hostelFriendly": True, "meal": "breakfast"},
    "boiled_eggs": {"name": "Boiled Eggs (2)", "kcal": 156, "macros": _m(13, 1, 11),
                    "diet": "nonveg", "costTier": "low", "hostelFriendly": True, "meal": "breakfast"},
    # Lunch
    "chicken_biryani": {"name": "Chicken Biryani", "kcal": 600, "macros": _m(28, 65, 22),
                        "diet": "nonveg", "costTier": "medium", "hostelFriendly": False, "meal": "lunch"},
    "beef_pulao": {"name": "Beef Pulao", "kcal": 580, "macros": _m(25, 70, 20),
                   "diet": "nonveg", "costTier": "medium", "hostelFriendly": False, "meal": "lunch"},
    "daal_chawal": {"name": "Daal Chawal", "kcal": 450, "macros": _m(15, 75, 8),
                    "diet": "vegan", "costTier": "low", "hostelFriendly": True, "meal": "lunch"},
    "daal_roti": {"name": "Daal with 2 Roti", "kcal": 380, "macros": _m(14, 55, 10),
                  "diet": "vegan", "costTier": "low", "hostelFriendly": True, "meal": "lunch"},
    "chicken_karahi_roti": {"name": "Chicken Karahi with 2 Roti", "kcal": 600, "macros": _m(35, 50, 26),
                            "diet": "nonveg", "costTier": "high", "hostelFriendly": False, "meal": "lunch"},
    "sabzi_roti": {"name": "Mixed Vegetable Sabzi with 2 Roti", "kcal": 360, "macros": _m(11, 55, 11),
                   "diet": "vegan", "costTier": "low", "hostelFriendly": True, "meal": "lunch"},
    "veg_biryani": {"name": "Vegetable Biryani", "kcal": 470, "macros": _m(13, 72, 14),
                    "diet": "vegan", "costTier": "low", "hostelFriendly": False, "meal": "lunch"},
    "chana_masala_roti": {"name": "Chana Masala with 2 Roti", "kcal": 420, "macros": _m(15, 62, 12),
                          "diet": "vegan", "costTier": "low", "hostelFriendly": True, "meal": "lunch"},
    "palak_paneer_roti": {"name": "Palak Paneer with 2 Roti", "kcal": 500, "macros": _m(20, 46, 24),
                          "diet": "veg", "costTier": "medium", "hostelFriendly": False, "meal": "lunch"},
    "fish_curry_rice": {"name": "Fish Curry with Rice", "kcal": 520, "macros": _m(30, 60, 16),
                        "diet": "nonveg", "costTier": "medium", "hostelFriendly": False, "meal": "lunch"},
    "chicken_salad": {"name": "Grilled Chicken Salad", "kcal": 340, "macros": _m(32, 14, 16),
                      "diet": "nonveg", "costTier": "medium", "hostelFriendly": True, "meal": "lunch"},
    # Dinner
    "chapati_sabzi": {"name": "2 Chapati with Sabzi", "kcal": 360, "macros": _m(11, 55, 11),
                      "diet": "vegan", "costTier": "low", "hostelFriendly": True, "meal": "dinner"},
    "grilled_chicken_rice": {"name": "Grilled Chicken with Rice", "kcal": 480, "macros": _m(38, 50, 12),
                             "diet": "nonveg", "costTier": "medium", "hostelFriendly": False, "meal": "dinner"},
    "grilled_chicken_salad": {"name": "Grilled Chicken with Salad", "kcal": 320, "macros": _m(35, 12, 14),
                              "diet": "nonveg", "costTier": "medium", "hostelFriendly": True, "meal": "dinner"},
    "light_daal_roti": {"name": "Daal with 1 Roti", "kcal": 280, "macros": _m(12, 40, 7),
                        "diet": "vegan", "costTier": "low", "hostelFriendly": True, "meal": "dinner"},
    "mutton_karahi_roti": {"name": "Mutton Karahi with 2 Roti", "kcal": 680, "macros": _m(35, 45, 38),
                           "diet": "nonveg", "costTier": "high", "hostelFriendly": False, "meal": "dinner"},
    "veg_pulao_raita": {"name": "Veg Pulao with Raita", "kcal": 450, "macros": _m(12, 70, 12),
                        "diet": "veg", "costTier": "low", "hostelFriendly": False, "meal": "dinner"},
    "tofu_stirfry_rice": {"name": "Tofu Stir-fry with Rice", "kcal": 420, "macros": _m(20, 52, 14),
                          "diet": "vegan", "costTier": "medium", "hostelFriendly": True, "meal": "dinner"},
    "keema_roti": {"name": "Chicken Keema with 2 Roti", "kcal": 540, "macros": _m(30, 48, 24),
                   "diet": "nonveg", "costTier": "medium", "hostelFriendly": False, "meal": "dinner"},
    # Snacks
    "samosa": {"name": "Samosa", "kcal": 250, "macros": _m(5, 30, 12),
               "diet": "vegan", "costTier": "low", "hostelFriendly": True, "meal": "snack"},
    "almonds": {"name": "Almonds (handful)", "kcal": 145, "macros": _m(5, 5, 13),
                "diet": "vegan", "costTier": "medium", "hostelFriendly": True, "meal": "snack"},
    "banana": {"name": "Banana", "kcal": 105, "macros": _m(1, 27, 0),
               "diet": "vegan", "costTier": "low", "hostelFriendly": True, "meal": "snack"},
    "apple": {"name": "Apple", "kcal": 95, "macros": _m(0, 25, 0),
              "diet": "vegan", "costTier": "low", "hostelFriendly": True, "meal": "snack"},
    "plain_yogurt": {"name": "Plain Yogurt (1 cup)", "kcal": 150, "macros": _m(8, 12, 8),
                     "diet": "veg", "costTier": "low", "hostelFriendly": True, "meal": "snack"},
    "fruit_chaat": {"name": "Fruit Chaat", "kcal": 160, "macros": _m(2, 38, 1),
                    "diet": "vegan", "costTier": "low", "hostelFriendly": True, "meal": "snack"},
    "peanuts": {"name": "Roasted Peanuts (handful)", "kcal": 170, "macros": _m(7, 6, 14),
                "diet": "vegan", "costTier": "low", "hostelFriendly": True, "meal": "snack"},
    "boiled_egg_snack": {"name": "Boiled Egg (1)", "kcal": 78, "macros": _m(6, 1, 5),
                         "diet": "nonveg", "costTier": "low", "hostelFriendly": True, "meal": "snack"},
}

# --- Meal combos per cluster ------------------------------------------------
# Each combo: (breakfast, lunch, dinner, [snacks...]). One combo per profile
# (13 per cluster), so every seed plan is a distinct meal composition — this is
# what gives meal-plan swap/regenerate real variety.
_COMBOS: dict[str, list[tuple[str, str, str, list[str]]]] = {
    "low_nonveg": [
        ("omelette_bread", "fish_curry_rice", "grilled_chicken_salad", ["banana", "almonds"]),
        ("boiled_eggs", "chicken_salad", "grilled_chicken_rice", ["apple", "plain_yogurt"]),
        ("anda_paratha", "chicken_biryani", "light_daal_roti", ["fruit_chaat"]),
        ("oats_milk", "daal_roti", "grilled_chicken_salad", ["boiled_egg_snack", "banana"]),
        ("omelette_bread", "chicken_karahi_roti", "light_daal_roti", ["apple"]),
        ("boiled_eggs", "fish_curry_rice", "keema_roti", ["banana", "plain_yogurt"]),
        ("anda_paratha", "sabzi_roti", "grilled_chicken_rice", ["apple", "almonds"]),
        ("chana_chaat", "chicken_salad", "chapati_sabzi", ["boiled_egg_snack", "banana"]),
        ("omelette_bread", "daal_chawal", "grilled_chicken_salad", ["fruit_chaat", "peanuts"]),
        ("oats_milk", "fish_curry_rice", "tofu_stirfry_rice", ["banana"]),
        ("boiled_eggs", "chana_masala_roti", "grilled_chicken_rice", ["apple", "plain_yogurt"]),
        ("anda_paratha", "chicken_biryani", "grilled_chicken_salad", ["banana"]),
        ("sweet_lassi", "chicken_salad", "light_daal_roti", ["boiled_egg_snack", "fruit_chaat"]),
    ],
    "low_veg": [
        ("oats_milk", "palak_paneer_roti", "chapati_sabzi", ["apple", "plain_yogurt"]),
        ("aloo_paratha", "chana_masala_roti", "light_daal_roti", ["banana", "plain_yogurt"]),
        ("chana_chaat", "veg_biryani", "chapati_sabzi", ["apple", "fruit_chaat"]),
        ("paneer_paratha", "daal_roti", "veg_pulao_raita", ["apple"]),
        ("oats_milk", "sabzi_roti", "tofu_stirfry_rice", ["banana", "plain_yogurt"]),
        ("sweet_lassi", "chana_masala_roti", "tofu_stirfry_rice", ["fruit_chaat", "almonds"]),
        ("aloo_paratha", "daal_chawal", "light_daal_roti", ["banana"]),
        ("chana_chaat", "palak_paneer_roti", "chapati_sabzi", ["apple", "peanuts"]),
        ("paneer_paratha", "sabzi_roti", "veg_pulao_raita", ["banana", "plain_yogurt"]),
        ("oats_milk", "veg_biryani", "light_daal_roti", ["apple", "almonds"]),
        ("sweet_lassi", "daal_roti", "tofu_stirfry_rice", ["fruit_chaat", "banana"]),
        ("aloo_paratha", "palak_paneer_roti", "chapati_sabzi", ["apple"]),
        ("chana_chaat", "chana_masala_roti", "veg_pulao_raita", ["banana", "plain_yogurt"]),
    ],
    "high_nonveg": [
        ("halwa_puri", "chicken_biryani", "mutton_karahi_roti", ["samosa", "almonds", "banana"]),
        ("anda_paratha", "beef_pulao", "keema_roti", ["samosa", "peanuts", "plain_yogurt"]),
        ("paneer_paratha", "chicken_biryani", "grilled_chicken_rice", ["almonds", "banana", "plain_yogurt"]),
        ("halwa_puri", "chicken_karahi_roti", "keema_roti", ["samosa", "peanuts", "banana"]),
        ("anda_paratha", "fish_curry_rice", "mutton_karahi_roti", ["almonds", "banana", "fruit_chaat"]),
        ("paneer_paratha", "beef_pulao", "grilled_chicken_rice", ["samosa", "peanuts", "banana"]),
        ("omelette_bread", "chicken_biryani", "keema_roti", ["almonds", "banana", "plain_yogurt"]),
        ("anda_paratha", "chicken_karahi_roti", "mutton_karahi_roti", ["samosa", "peanuts", "fruit_chaat"]),
        ("halwa_puri", "beef_pulao", "grilled_chicken_rice", ["samosa", "almonds", "banana"]),
        ("paneer_paratha", "fish_curry_rice", "keema_roti", ["peanuts", "banana", "plain_yogurt"]),
        ("anda_paratha", "chicken_biryani", "grilled_chicken_salad", ["almonds", "fruit_chaat", "banana"]),
        ("aloo_paratha", "beef_pulao", "mutton_karahi_roti", ["samosa", "peanuts", "plain_yogurt"]),
        ("omelette_bread", "chicken_karahi_roti", "grilled_chicken_rice", ["samosa", "almonds", "banana"]),
    ],
    "high_veg": [
        ("halwa_puri", "palak_paneer_roti", "veg_pulao_raita", ["samosa", "almonds", "banana"]),
        ("paneer_paratha", "veg_biryani", "tofu_stirfry_rice", ["samosa", "peanuts", "plain_yogurt"]),
        ("paneer_paratha", "chana_masala_roti", "veg_pulao_raita", ["samosa", "almonds", "plain_yogurt"]),
        ("halwa_puri", "veg_biryani", "tofu_stirfry_rice", ["peanuts", "banana", "plain_yogurt"]),
        ("paneer_paratha", "palak_paneer_roti", "chapati_sabzi", ["samosa", "almonds", "fruit_chaat"]),
        ("oats_milk", "veg_biryani", "veg_pulao_raita", ["samosa", "peanuts", "banana"]),
        ("halwa_puri", "daal_chawal", "tofu_stirfry_rice", ["almonds", "banana", "plain_yogurt"]),
        ("paneer_paratha", "chana_masala_roti", "tofu_stirfry_rice", ["samosa", "peanuts", "fruit_chaat"]),
        ("aloo_paratha", "palak_paneer_roti", "veg_pulao_raita", ["samosa", "almonds", "banana"]),
        ("halwa_puri", "sabzi_roti", "tofu_stirfry_rice", ["peanuts", "banana", "plain_yogurt"]),
        ("paneer_paratha", "veg_biryani", "chapati_sabzi", ["almonds", "fruit_chaat", "banana"]),
        ("oats_milk", "daal_roti", "veg_pulao_raita", ["samosa", "peanuts", "plain_yogurt"]),
        ("halwa_puri", "palak_paneer_roti", "tofu_stirfry_rice", ["samosa", "almonds", "banana"]),
    ],
}

# --- Profiles per cluster: (age, bmi, activityLevel 1-5, goal) --------------
_PROFILES: dict[str, tuple[Diet, list[tuple[int, float, int, Goal]]]] = {
    "low_nonveg": ("nonveg", [
        (24, 28, 2, "lose"), (27, 31, 1, "lose"), (31, 27, 2, "lose"),
        (35, 33, 1, "lose"), (29, 26, 3, "maintain"), (42, 30, 2, "lose"),
        (38, 29, 2, "lose"), (45, 32, 1, "lose"), (33, 27, 3, "maintain"),
        (52, 31, 2, "lose"), (26, 34, 1, "lose"), (48, 28, 2, "maintain"),
        (58, 30, 1, "lose"),
    ]),
    "low_veg": ("veg", [
        (25, 29, 2, "lose"), (28, 32, 1, "lose"), (30, 27, 2, "lose"),
        (36, 30, 1, "lose"), (33, 26, 3, "maintain"), (41, 31, 2, "lose"),
        (39, 28, 2, "lose"), (46, 33, 1, "lose"), (34, 27, 3, "maintain"),
        (50, 30, 2, "lose"), (27, 34, 1, "lose"), (44, 29, 2, "maintain"),
        (55, 31, 1, "lose"),
    ]),
    "high_nonveg": ("nonveg", [
        (19, 18, 4, "gain"), (22, 20, 5, "gain"), (25, 21, 4, "gain"),
        (20, 19, 5, "gain"), (27, 22, 3, "maintain"), (23, 20, 4, "gain"),
        (21, 18, 5, "gain"), (29, 23, 4, "maintain"), (24, 21, 4, "gain"),
        (26, 22, 5, "gain"), (18, 17, 4, "gain"), (31, 23, 3, "maintain"),
        (28, 22, 5, "gain"),
    ]),
    "high_veg": ("veg", [
        (20, 19, 4, "gain"), (23, 21, 5, "gain"), (26, 22, 4, "gain"),
        (21, 18, 5, "gain"), (28, 23, 3, "maintain"), (24, 20, 4, "gain"),
        (22, 19, 5, "gain"), (30, 23, 4, "maintain"), (25, 21, 4, "gain"),
        (27, 22, 5, "gain"), (19, 18, 4, "gain"), (32, 23, 3, "maintain"),
        (29, 22, 5, "gain"),
    ]),
}


def _food_item(dish_id: str) -> dict:
    d = DISHES[dish_id]
    return {
        "foodId": dish_id,
        "name": d["name"],
        "kcal": d["kcal"],
        "macros": dict(d["macros"]),
        "servings": 1,
    }


def _meal(meal_type: MealType, dish_ids: list[str]) -> dict:
    items = [_food_item(i) for i in dish_ids]
    return {
        "mealType": meal_type,
        "items": items,
        "totalKcal": sum(it["kcal"] for it in items),
    }


def build_meal_plans() -> list[dict]:
    """Return ≥50 seed meal plans, each with a profile vector + meal composition."""
    plans: list[dict] = []
    idx = 1
    for cluster, (diet, profiles) in _PROFILES.items():
        combos = _COMBOS[cluster]
        for i, (age, bmi, activity, goal) in enumerate(profiles):
            bfast, lunch, dinner, snacks = combos[i % len(combos)]
            meals = [
                _meal("breakfast", [bfast]),
                _meal("lunch", [lunch]),
                _meal("dinner", [dinner]),
                _meal("snack", snacks),
            ]
            total = sum(m["totalKcal"] for m in meals)
            plans.append({
                "id": f"plan_{idx:03d}",
                "cluster": cluster,
                "profile": {
                    "age": age,
                    "bmi": float(bmi),
                    "activityLevel": activity,
                    "goal": goal,
                    "dietPref": diet,
                },
                "calorieTarget": round(total / 50) * 50,
                "meals": meals,
                "totalKcal": total,
            })
            idx += 1
    return plans


if __name__ == "__main__":
    built = build_meal_plans()
    print(f"{len(built)} meal plans across {len(_PROFILES)} clusters, {len(DISHES)} dishes")
    by_cluster: dict[str, int] = {}
    for p in built:
        by_cluster[p["cluster"]] = by_cluster.get(p["cluster"], 0) + 1
    for c, n in by_cluster.items():
        print(f"  {c:14s} {n} plans")
