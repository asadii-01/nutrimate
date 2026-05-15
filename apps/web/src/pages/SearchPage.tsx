import { Search } from "lucide-react";
import { PagePlaceholder } from "../components/PagePlaceholder";

export function SearchPage() {
  return (
    <PagePlaceholder
      title="Nutrition Search"
      description="Look up any food and inspect its calories, macros and serving sizes."
      icon={Search}
      phaseNote="Results grid and the detail drawer with a serving selector land in Phase 5."
    />
  );
}
