import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import {
  ACTIVITY_LEVELS,
  BUDGET_TIERS,
  DIET_PREFS,
  GENDERS,
  GOALS,
  type ActivityLevel,
  type BudgetTier,
  type DietPref,
  type Gender,
  type Goal,
  type ProfileInput,
} from "@nutrimate/shared-types";
import { ApiClientError } from "../lib/api";
import { cn } from "../lib/cn";
import {
  ACTIVITY_HINTS,
  ACTIVITY_LABELS,
  BUDGET_LABELS,
  DIET_LABELS,
  GENDER_LABELS,
  GOAL_HINTS,
  GOAL_LABELS,
} from "../lib/labels";
import { createProfile, profileKeys, useProfile } from "../features/profile/profile.api";
import { useToast } from "../components/toast/useToast";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Spinner } from "../components/ui/Spinner";
import { Logo } from "../layout/Logo";

const STEPS = ["Demographics", "Activity", "Goal", "Diet & budget"] as const;

/** A draft profile — every field optional until the wizard is complete. */
interface Draft {
  age: string;
  gender: Gender | "";
  heightCm: string;
  weightKg: string;
  activityLevel: ActivityLevel | "";
  goal: Goal | "";
  dietPref: DietPref | "";
  budgetTier: BudgetTier | "";
}

const EMPTY_DRAFT: Draft = {
  age: "",
  gender: "",
  heightCm: "",
  weightKg: "",
  activityLevel: "",
  goal: "",
  dietPref: "",
  budgetTier: "",
};

/** Selectable card used for the enum steps (gender, activity, goal, diet). */
function ChoiceCard({
  selected,
  title,
  hint,
  onClick,
}: {
  selected: boolean;
  title: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex items-center justify-between gap-sm rounded-md border p-sm text-left transition-all active:scale-[0.99]",
        selected
          ? "border-primary bg-primary-container/10 ring-2 ring-primary/30"
          : "border-outline-variant bg-surface-container-lowest hover:border-primary/40",
      )}
    >
      <span>
        <span className="block text-body-md font-semibold text-on-surface">{title}</span>
        {hint ? <span className="block text-caption text-on-surface-variant">{hint}</span> : null}
      </span>
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-primary bg-primary text-on-primary" : "border-outline-variant",
        )}
      >
        {selected ? <Check size={14} /> : null}
      </span>
    </button>
  );
}

/**
 * Four-step profile setup wizard (FR-2). Collects the physiological inputs the
 * calorie ANN needs, then `POST /profile` (which computes the first prediction)
 * before redirecting to the dashboard.
 */
export function ProfileSetupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const existing = useProfile();

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.detail, profile);
      toast("Profile saved — your plan is ready!", "success");
      navigate("/dashboard", { replace: true });
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "Could not save your profile.");
    },
  });

  // A user who already finished setup never sees the wizard.
  if (existing.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Spinner size="lg" />
      </div>
    );
  }
  if (existing.data) {
    return <Navigate to="/dashboard" replace />;
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setError(null);
  };

  /** Validates the current step; returns an error string or `null`. */
  function validateStep(): string | null {
    if (step === 0) {
      const age = Number(draft.age);
      const height = Number(draft.heightCm);
      const weight = Number(draft.weightKg);
      if (!draft.age || !Number.isInteger(age) || age < 13 || age > 80)
        return "Enter an age between 13 and 80.";
      if (!draft.gender) return "Select your gender.";
      if (!draft.heightCm || height < 100 || height > 250)
        return "Enter a height between 100 and 250 cm.";
      if (!draft.weightKg || weight < 30 || weight > 250)
        return "Enter a weight between 30 and 250 kg.";
    }
    if (step === 1 && !draft.activityLevel) return "Select an activity level.";
    if (step === 2 && !draft.goal) return "Select a goal.";
    if (step === 3) {
      if (!draft.dietPref) return "Select a diet preference.";
      if (!draft.budgetTier) return "Select a budget.";
    }
    return null;
  }

  const onNext = () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    // Final step — assemble the payload and submit.
    const payload: ProfileInput = {
      age: Number(draft.age),
      gender: draft.gender as Gender,
      heightCm: Number(draft.heightCm),
      weightKg: Number(draft.weightKg),
      activityLevel: draft.activityLevel as ActivityLevel,
      goal: draft.goal as Goal,
      dietPref: draft.dietPref as DietPref,
      budgetTier: (draft.budgetTier as BudgetTier) || undefined,
    };
    mutation.mutate(payload);
  };

  const onBack = () => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-outline-variant bg-surface-bright">
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center px-margin-mobile">
          <Logo />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-margin-mobile py-lg">
        {/* Progress */}
        <div className="mb-lg flex flex-col gap-base">
          <div className="flex items-center justify-between text-label-md text-on-surface-variant">
            <span>
              Step {step + 1} of {STEPS.length}
            </span>
            <span>{STEPS[step]}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-md rounded-lg bg-surface-container-lowest p-md shadow-card">
          {step === 0 ? (
            <>
              <div>
                <h1 className="text-headline-md text-on-surface">Tell us about yourself</h1>
                <p className="mt-base text-body-md text-on-surface-variant">
                  We use this to estimate your daily calorie needs.
                </p>
              </div>
              <Input
                label="Age"
                type="number"
                inputMode="numeric"
                min={13}
                max={80}
                value={draft.age}
                onChange={(e) => set("age", e.target.value)}
                placeholder="e.g. 24"
              />
              <div className="flex flex-col gap-base">
                <span className="text-label-md text-on-surface-variant">Gender</span>
                <div className="grid grid-cols-3 gap-sm">
                  {GENDERS.map((g) => (
                    <ChoiceCard
                      key={g}
                      selected={draft.gender === g}
                      title={GENDER_LABELS[g]}
                      onClick={() => set("gender", g)}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-sm">
                <Input
                  label="Height (cm)"
                  type="number"
                  inputMode="numeric"
                  min={100}
                  max={250}
                  value={draft.heightCm}
                  onChange={(e) => set("heightCm", e.target.value)}
                  placeholder="e.g. 170"
                />
                <Input
                  label="Weight (kg)"
                  type="number"
                  inputMode="numeric"
                  min={30}
                  max={250}
                  value={draft.weightKg}
                  onChange={(e) => set("weightKg", e.target.value)}
                  placeholder="e.g. 68"
                />
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div>
                <h1 className="text-headline-md text-on-surface">How active are you?</h1>
                <p className="mt-base text-body-md text-on-surface-variant">
                  Pick the option that best matches a typical week.
                </p>
              </div>
              <div className="flex flex-col gap-sm">
                {ACTIVITY_LEVELS.map((level) => (
                  <ChoiceCard
                    key={level}
                    selected={draft.activityLevel === level}
                    title={ACTIVITY_LABELS[level]}
                    hint={ACTIVITY_HINTS[level]}
                    onClick={() => set("activityLevel", level)}
                  />
                ))}
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div>
                <h1 className="text-headline-md text-on-surface">What's your goal?</h1>
                <p className="mt-base text-body-md text-on-surface-variant">
                  We adjust your calorie target around this.
                </p>
              </div>
              <div className="flex flex-col gap-sm">
                {GOALS.map((goal) => (
                  <ChoiceCard
                    key={goal}
                    selected={draft.goal === goal}
                    title={GOAL_LABELS[goal]}
                    hint={GOAL_HINTS[goal]}
                    onClick={() => set("goal", goal)}
                  />
                ))}
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div>
                <h1 className="text-headline-md text-on-surface">Diet & budget</h1>
                <p className="mt-base text-body-md text-on-surface-variant">
                  Your meal plans respect both of these.
                </p>
              </div>
              <div className="flex flex-col gap-base">
                <span className="text-label-md text-on-surface-variant">Diet preference</span>
                <div className="grid grid-cols-1 gap-sm sm:grid-cols-3">
                  {DIET_PREFS.map((d) => (
                    <ChoiceCard
                      key={d}
                      selected={draft.dietPref === d}
                      title={DIET_LABELS[d]}
                      onClick={() => set("dietPref", d)}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-base">
                <span className="text-label-md text-on-surface-variant">Budget</span>
                <div className="grid grid-cols-1 gap-sm sm:grid-cols-3">
                  {BUDGET_TIERS.map((b) => (
                    <ChoiceCard
                      key={b}
                      selected={draft.budgetTier === b}
                      title={BUDGET_LABELS[b]}
                      onClick={() => set("budgetTier", b)}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="rounded-md bg-error-container px-sm py-sm text-caption text-on-error-container"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-auto flex items-center justify-between gap-sm pt-base">
            <Button variant="ghost" onClick={onBack} disabled={step === 0 || mutation.isPending}>
              <ArrowLeft size={18} /> Back
            </Button>
            <Button onClick={onNext} loading={mutation.isPending} className="gap-xs">
              {step === STEPS.length - 1 ? "Finish setup" : "Continue"}
              {step === STEPS.length - 1 ? null : <ArrowRight size={18} />}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
