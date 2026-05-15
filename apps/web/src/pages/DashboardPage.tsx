import { LayoutGrid } from "lucide-react";
import { useAuth } from "../features/auth/useAuth";
import { PagePlaceholder } from "../components/PagePlaceholder";

export function DashboardPage() {
  const { user } = useAuth();
  return (
    <PagePlaceholder
      title="Dashboard"
      description={
        user ? `Signed in as ${user.email}.` : "Your daily calorie, hydration and macro summary."
      }
      icon={LayoutGrid}
      phaseNote="Calorie ring, BMI card, hydration ring, macro donut and the 7-day trend land in Phase 5."
    />
  );
}
