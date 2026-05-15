import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import { ApiClientError } from "../lib/api";
import { useAuth } from "../features/auth/useAuth";
import { useToast } from "../components/toast/useToast";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Logo } from "../layout/Logo";

type Mode = "login" | "register";

interface LocationState {
  from?: { pathname: string };
}

/**
 * Combined sign-in / create-account screen. Split layout on desktop (brand
 * panel + form card) with a tab switcher. No password-reset link — that flow
 * is out of scope for the MVP.
 */
export function AuthPage({ initialMode = "login" }: { initialMode?: Mode }) {
  const { login, register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? "/dashboard";

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "register" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
        toast("Welcome back!", "success");
      } else {
        await register(email, password);
        toast("Account created — welcome to NutriMate!", "success");
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Brand panel — desktop only */}
      <aside className="hidden w-1/2 flex-col justify-between bg-primary p-xl text-on-primary lg:flex">
        <Logo className="[&_span]:text-on-primary" />
        <div className="flex flex-col gap-sm">
          <h2 className="text-display-lg">Eat smarter, every day.</h2>
          <p className="max-w-md text-body-lg text-on-primary/85">
            AI-powered calorie targets and meal plans built for real Pakistani kitchens and real
            budgets.
          </p>
        </div>
        <p className="text-caption text-on-primary/70">© {new Date().getFullYear()} NutriMate</p>
      </aside>

      {/* Form panel */}
      <main className="flex w-full flex-col items-center justify-center px-margin-mobile py-xl lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-lg flex justify-center lg:hidden">
            <Logo />
          </div>

          {/* Tab switcher */}
          <div className="mb-lg flex rounded-md bg-surface-container-high p-base">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={
                  "flex-1 rounded-[0.5rem] py-sm text-label-md transition-colors " +
                  (mode === m
                    ? "bg-surface-container-lowest text-primary shadow-card"
                    : "text-on-surface-variant")
                }
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <h1 className="mb-base text-headline-md text-on-surface">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mb-lg text-body-md text-on-surface-variant">
            {mode === "login"
              ? "Sign in to see today's plan and progress."
              : "Start tracking in under a minute."}
          </p>

          <form onSubmit={onSubmit} className="flex flex-col gap-md" noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leadingIcon={<Mail size={18} />}
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leadingIcon={<Lock size={18} />}
              placeholder="••••••••"
              hint={mode === "register" ? "At least 8 characters." : undefined}
            />

            {error ? (
              <p role="alert" className="rounded-md bg-error-container px-sm py-sm text-caption text-on-error-container">
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" block loading={submitting}>
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="mt-md text-center text-body-md text-on-surface-variant">
            {mode === "login" ? "New to NutriMate? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "register" : "login")}
              className="font-semibold text-primary hover:underline"
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
