import { LineChart } from "lucide-react";
import { PagePlaceholder } from "../components/PagePlaceholder";

export function ProgressPage() {
  return (
    <PagePlaceholder
      title="Progress"
      description="Trends, achievement badges and AI insights across your tracked history."
      icon={LineChart}
      phaseNote="Date-range charts, badges and insight cards land in Phase 5."
    />
  );
}
