import { Settings } from "lucide-react";
import { PagePlaceholder } from "../components/PagePlaceholder";

export function SettingsPage() {
  return (
    <PagePlaceholder
      title="Settings"
      description="Edit your profile, water reminders and account preferences."
      icon={Settings}
      phaseNote="Editable profile, reminders toggle and account actions land in Phase 5."
    />
  );
}
