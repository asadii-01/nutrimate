import { UtensilsCrossed } from "lucide-react";
import { PagePlaceholder } from "../components/PagePlaceholder";

export function MealsPage() {
  return (
    <PagePlaceholder
      title="Meal Plans"
      description="AI-recommended meals tuned to your calorie target, diet and budget."
      icon={UtensilsCrossed}
      phaseNote="Recommendation rows, swap / eaten actions and Regenerate Day land in Phase 5."
    />
  );
}
