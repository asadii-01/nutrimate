import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Download, LogOut, Save, ShieldAlert } from "lucide-react";
import {
  ACTIVITY_LEVELS,
  BUDGET_TIERS,
  DIET_PREFS,
  GENDERS,
  GOALS,
  type ProfilePatch,
} from "@nutrimate/shared-types";
import { ApiClientError } from "../lib/api";
import { isoDaysAgo, todayIso } from "../lib/dates";
import {
  ACTIVITY_LABELS,
  BUDGET_LABELS,
  DIET_LABELS,
  GENDER_LABELS,
  GOAL_LABELS,
} from "../lib/labels";
import { useAuth } from "../features/auth/useAuth";
import { useProfile, useUpdateProfile } from "../features/profile/profile.api";
import { getCaloriePrediction } from "../features/predictions/predictions.api";
import { getTodayPlan } from "../features/recommendations/recommendations.api";
import { getHealthRisk } from "../features/health-risk/health-risk.api";
import { getModelMetrics } from "../features/models/models.api";
import { getRange } from "../features/logs/logs.api";
import { useToast } from "../components/toast/useToast";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/states/Skeleton";
import { ErrorState } from "../components/states/ErrorState";

const WATER_REMINDER_KEY = "nutrimate.waterReminder";

/** Local-only preference toggle (no backend setting exists for this in the MVP). */
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={
        "relative h-7 w-12 shrink-0 rounded-full transition-colors " +
        (checked ? "bg-primary" : "bg-surface-container-highest")
      }
    >
      <span
        className={
          "absolute top-1 h-5 w-5 rounded-full bg-surface-container-lowest shadow-card transition-transform " +
          (checked ? "translate-x-6" : "translate-x-1")
        }
      />
    </button>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const profile = useProfile();
  const updateProfile = useUpdateProfile();

  // Editable copy of the profile fields.
  const [form, setForm] = useState<ProfilePatch>({});
  const [waterReminder, setWaterReminder] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (profile.data) {
      setForm({
        age: profile.data.age,
        gender: profile.data.gender,
        heightCm: profile.data.heightCm,
        weightKg: profile.data.weightKg,
        activityLevel: profile.data.activityLevel,
        goal: profile.data.goal,
        dietPref: profile.data.dietPref,
        budgetTier: profile.data.budgetTier,
      });
    }
  }, [profile.data]);

  useEffect(() => {
    setWaterReminder(localStorage.getItem(WATER_REMINDER_KEY) === "true");
  }, []);

  const dirty = useMemo(() => {
    if (!profile.data) return false;
    return (
      form.age !== profile.data.age ||
      form.gender !== profile.data.gender ||
      form.heightCm !== profile.data.heightCm ||
      form.weightKg !== profile.data.weightKg ||
      form.activityLevel !== profile.data.activityLevel ||
      form.goal !== profile.data.goal ||
      form.dietPref !== profile.data.dietPref ||
      form.budgetTier !== profile.data.budgetTier
    );
  }, [form, profile.data]);

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(form, {
      onSuccess: () => toast("Profile updated — your targets were recalculated.", "success"),
      onError: (err) =>
        toast(
          err instanceof ApiClientError ? err.message : "Could not save your profile.",
          "error",
        ),
    });
  };

  const onToggleReminder = (next: boolean) => {
    setWaterReminder(next);
    localStorage.setItem(WATER_REMINDER_KEY, String(next));
    toast(next ? "Water reminders on." : "Water reminders off.", "info");
  };

  const onExport = async () => {
    setExporting(true);
    try {
      // Each call is guarded — a 404 (no profile) or an offline ML service
      // degrades to a partial report rather than failing the whole export.
      const [{ buildExportPdf }, prediction, plan, healthRisk, metrics, days] = await Promise.all([
        // Lazy-loaded so jsPDF is only fetched when the user actually exports.
        import("../lib/pdfExport"),
        getCaloriePrediction().catch(() => null),
        getTodayPlan().catch(() => null),
        getHealthRisk().catch(() => null),
        getModelMetrics().catch(() => null),
        getRange(isoDaysAgo(6), todayIso())
          .then((r) => r.days)
          .catch(() => []),
      ]);
      buildExportPdf({
        email: user?.email,
        profile: profile.data,
        prediction,
        plan,
        healthRisk,
        metrics,
        days,
      });
      toast("Your data export has been downloaded.", "success");
    } catch {
      toast("Could not build the export. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  };

  const onLogout = async () => {
    await logout();
    toast("You have been signed out.", "info");
    navigate("/login", { replace: true });
  };

  return (
    <section className="flex flex-col gap-md">
      <header className="flex flex-col gap-base">
        <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">Settings</h1>
        <p className="text-body-md text-on-surface-variant">
          Manage your profile, preferences and account.
        </p>
      </header>

      {/* Account */}
      <Card className="flex flex-col gap-base">
        <h2 className="text-label-md uppercase text-on-surface-variant">Account</h2>
        <p className="text-body-md text-on-surface">{user?.email ?? "—"}</p>
      </Card>

      {/* Profile editor */}
      {profile.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : profile.isError || !profile.data ? (
        <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />
      ) : (
        <Card>
          <form onSubmit={onSave} className="flex flex-col gap-md">
            <h2 className="text-label-md uppercase text-on-surface-variant">Your profile</h2>
            <div className="grid grid-cols-1 gap-sm sm:grid-cols-2">
              <Input
                label="Age"
                type="number"
                inputMode="numeric"
                min={13}
                max={80}
                value={form.age ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, age: Number(e.target.value) }))}
              />
              <Select
                label="Gender"
                value={form.gender ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, gender: e.target.value as ProfilePatch["gender"] }))
                }
                options={GENDERS.map((g) => ({ value: g, label: GENDER_LABELS[g] }))}
              />
              <Input
                label="Height (cm)"
                type="number"
                inputMode="numeric"
                min={100}
                max={250}
                value={form.heightCm ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, heightCm: Number(e.target.value) }))}
              />
              <Input
                label="Weight (kg)"
                type="number"
                inputMode="numeric"
                min={30}
                max={250}
                value={form.weightKg ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, weightKg: Number(e.target.value) }))}
              />
              <Select
                label="Activity level"
                value={form.activityLevel ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    activityLevel: e.target.value as ProfilePatch["activityLevel"],
                  }))
                }
                options={ACTIVITY_LEVELS.map((a) => ({ value: a, label: ACTIVITY_LABELS[a] }))}
              />
              <Select
                label="Goal"
                value={form.goal ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, goal: e.target.value as ProfilePatch["goal"] }))
                }
                options={GOALS.map((g) => ({ value: g, label: GOAL_LABELS[g] }))}
              />
              <Select
                label="Diet preference"
                value={form.dietPref ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dietPref: e.target.value as ProfilePatch["dietPref"] }))
                }
                options={DIET_PREFS.map((d) => ({ value: d, label: DIET_LABELS[d] }))}
              />
              <Select
                label="Budget"
                value={form.budgetTier ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    budgetTier: e.target.value as ProfilePatch["budgetTier"],
                  }))
                }
                options={BUDGET_TIERS.map((b) => ({ value: b, label: BUDGET_LABELS[b] }))}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" loading={updateProfile.isPending} disabled={!dirty}>
                <Save size={18} /> Save changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Preferences */}
      <Card className="flex flex-col gap-sm">
        <h2 className="text-label-md uppercase text-on-surface-variant">Preferences</h2>
        <div className="flex items-center justify-between gap-sm">
          <div className="flex items-center gap-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-tertiary-container/15 text-tertiary">
              <Bell size={20} />
            </span>
            <div>
              <p className="text-body-md font-semibold text-on-surface">Water reminders</p>
              <p className="text-caption text-on-surface-variant">
                Gentle nudges to stay hydrated through the day.
              </p>
            </div>
          </div>
          <Toggle checked={waterReminder} onChange={onToggleReminder} label="Water reminders" />
        </div>
      </Card>

      {/* Data */}
      <Card className="flex flex-col gap-sm">
        <h2 className="text-label-md uppercase text-on-surface-variant">Your data</h2>
        <div className="flex items-center justify-between gap-sm">
          <p className="text-body-md text-on-surface-variant">
            Download your profile, each ML model's prediction and accuracy, and the last 7 days
            of logs as a PDF report.
          </p>
          <Button variant="secondary" onClick={onExport} loading={exporting}>
            <Download size={18} /> Export
          </Button>
        </div>
      </Card>

      {/* Account actions */}
      <Card className="flex flex-col gap-sm">
        <h2 className="flex items-center gap-base text-label-md uppercase text-on-surface-variant">
          <ShieldAlert size={14} /> Account
        </h2>
        <p className="text-caption text-on-surface-variant">
          Password change and account deletion aren't available in this build — they need
          dedicated API endpoints (see HANDOFF.md follow-ups).
        </p>
        <div className="flex justify-start">
          <Button variant="danger" onClick={onLogout}>
            <LogOut size={18} /> Sign out
          </Button>
        </div>
      </Card>
    </section>
  );
}
