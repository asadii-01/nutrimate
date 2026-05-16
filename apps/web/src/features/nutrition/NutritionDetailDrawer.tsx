import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { MEAL_TYPES, type MealType } from "@nutrimate/shared-types";
import { MEAL_LABELS } from "../../lib/labels";
import { Drawer } from "../../components/Drawer";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { useToast } from "../../components/toast/useToast";
import { useLogMeal } from "../logs/logs.api";
import type { NutritionItem } from "./nutrition.api";

const SERVING_MIN = 0.5;
const SERVING_MAX = 5;
const SERVING_STEP = 0.5;

const ZERO_MACROS = { protein: 0, carbs: 0, fats: 0 };

/** Detail panel for a searched food, with a serving stepper and meal logger. */
export function NutritionDetailDrawer({
  item,
  open,
  onClose,
}: {
  item: NutritionItem | null;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const logMeal = useLogMeal();
  const [servings, setServings] = useState(1);
  const [mealType, setMealType] = useState<MealType>("lunch");

  // Scale kcal + macros by the chosen serving count.
  const scaled = useMemo(() => {
    const macros = item?.macros ?? ZERO_MACROS;
    return {
      kcal: (item?.kcal ?? 0) * servings,
      protein: macros.protein * servings,
      carbs: macros.carbs * servings,
      fats: macros.fats * servings,
    };
  }, [item, servings]);

  if (!item) return null;

  const step = (delta: number) => {
    setServings((s) => {
      const next = Math.round((s + delta) / SERVING_STEP) * SERVING_STEP;
      return Math.min(Math.max(next, SERVING_MIN), SERVING_MAX);
    });
  };

  const onLog = () => {
    logMeal.mutate(
      {
        mealType,
        items: [
          {
            foodId: item.id,
            name: item.name,
            kcal: scaled.kcal,
            macros: { protein: scaled.protein, carbs: scaled.carbs, fats: scaled.fats },
            servings,
          },
        ],
        totalKcal: scaled.kcal,
      },
      {
        onSuccess: () => {
          toast(`Logged ${item.name} to ${MEAL_LABELS[mealType].toLowerCase()}.`, "success");
          setServings(1);
          onClose();
        },
        onError: () => toast("Could not log this food.", "error"),
      },
    );
  };

  return (
    <Drawer open={open} onClose={onClose} title={item.name} side="right">
      <div className="flex flex-col gap-md">
        {/* Recipe image */}
        {item.image ? (
          <img
            src={item.image}
            alt=""
            className="h-44 w-full rounded-lg object-cover"
          />
        ) : null}

        {/* Per-serving summary */}
        <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-md">
          <div>
            <p className="text-caption uppercase text-on-surface-variant">Per serving</p>
            <p className="text-headline-md text-on-surface">{Math.round(item.kcal)} kcal</p>
          </div>
          <p className="text-caption text-on-surface-variant">{item.servingSize ?? "1 serving"}</p>
        </div>

        {/* Serving stepper */}
        <div className="flex flex-col gap-base">
          <span className="text-label-md text-on-surface-variant">Servings</span>
          <div className="flex items-center gap-sm">
            <button
              type="button"
              onClick={() => step(-SERVING_STEP)}
              aria-label="Fewer servings"
              className="flex h-11 w-11 items-center justify-center rounded-md border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-low"
            >
              <Minus size={18} />
            </button>
            <span className="flex-1 text-center text-headline-md text-on-surface">{servings}</span>
            <button
              type="button"
              onClick={() => step(SERVING_STEP)}
              aria-label="More servings"
              className="flex h-11 w-11 items-center justify-center rounded-md border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-low"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Scaled totals */}
        <div className="grid grid-cols-4 gap-base">
          {[
            { label: "Calories", value: `${Math.round(scaled.kcal)}` },
            { label: "Protein", value: `${Math.round(scaled.protein)}g` },
            { label: "Carbs", value: `${Math.round(scaled.carbs)}g` },
            { label: "Fats", value: `${Math.round(scaled.fats)}g` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-base rounded-md bg-surface-container-low py-sm"
            >
              <span className="text-body-md font-bold text-on-surface">{stat.value}</span>
              <span className="text-caption text-on-surface-variant">{stat.label}</span>
            </div>
          ))}
        </div>

        {!item.macros ? (
          <p className="text-caption text-on-surface-variant">
            Macro breakdown isn't available for this item — calories are logged as-is.
          </p>
        ) : null}

        <Select
          label="Log to meal"
          value={mealType}
          onChange={(e) => setMealType(e.target.value as MealType)}
          options={MEAL_TYPES.map((m) => ({ value: m, label: MEAL_LABELS[m] }))}
        />

        <Button onClick={onLog} loading={logMeal.isPending} block size="lg">
          Log this food
        </Button>
      </div>
    </Drawer>
  );
}
