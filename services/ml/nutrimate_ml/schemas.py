"""Pydantic request/response models — mirror `@nutrimate/shared-types`."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Gender = Literal["male", "female", "other"]
ActivityLevel = Literal["sedentary", "light", "moderate", "active", "very_active"]
Goal = Literal["lose", "maintain", "gain"]
DietPref = Literal["veg", "nonveg", "vegan"]
CostTier = Literal["low", "medium", "high"]
MealType = Literal["breakfast", "lunch", "dinner", "snack"]


# --- /ml/predict-calories ---------------------------------------------------
class CaloriePredictRequest(BaseModel):
    age: int = Field(ge=13, le=80)
    gender: Gender
    heightCm: float = Field(ge=100, le=250)
    weightKg: float = Field(ge=30, le=250)
    activityLevel: ActivityLevel


class CaloriePredictResponse(BaseModel):
    kcal: int = Field(gt=0)
    modelVersion: str
    confidence: float | None = Field(default=None, ge=0, le=1)


# --- /ml/recommend-meals ----------------------------------------------------
class RecommendFeatures(BaseModel):
    age: float
    bmi: float
    activityLevel: int = Field(ge=1, le=5)
    goal: Goal
    dietPref: DietPref


class MealRecommendRequest(BaseModel):
    features: RecommendFeatures
    kcalTarget: int = Field(gt=0)
    dietPref: DietPref
    budgetTier: CostTier | None = None


class Macros(BaseModel):
    protein: float = Field(ge=0)
    carbs: float = Field(ge=0)
    fats: float = Field(ge=0)


class FoodItem(BaseModel):
    foodId: str
    name: str
    kcal: float = Field(ge=0)
    macros: Macros
    servings: float = Field(gt=0)


class Meal(BaseModel):
    mealType: MealType
    items: list[FoodItem] = Field(min_length=1)
    totalKcal: float = Field(ge=0)


class MealRecommendResponse(BaseModel):
    meals: list[Meal] = Field(min_length=3)
    totalKcal: float = Field(ge=0)
    calorieTarget: int = Field(gt=0)
    matchedPlanIds: list[str]
    modelVersion: str


# --- /ml/predict-health-risk ------------------------------------------------
RiskLevel = Literal["low", "moderate", "high"]


class HealthRiskRequest(BaseModel):
    age: int = Field(ge=13, le=80)
    gender: Gender
    heightCm: float = Field(ge=100, le=250)
    weightKg: float = Field(ge=30, le=250)
    activityLevel: ActivityLevel
    bmi: float | None = Field(default=None, ge=10, le=60)


class HealthRiskResponse(BaseModel):
    riskLevel: RiskLevel
    confidence: float = Field(ge=0, le=1)
    probabilities: dict[str, float]
    modelVersion: str


# --- /ml/health -------------------------------------------------------------
class HealthResponse(BaseModel):
    status: Literal["ok", "degraded", "down"]
    annVersion: str | None
    knnVersion: str | None
    svmVersion: str | None
    annLoaded: bool
    knnLoaded: bool
    svmLoaded: bool
    loadedAt: str | None
