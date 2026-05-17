import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Leaf, Lock, Mail } from "lucide-react";
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

/** Multicolour Google "G" mark for the social sign-in button. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.83z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

/** Apple logo glyph for the social sign-in button. */
function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M17.05 12.04c-.03-2.73 2.23-4.04 2.33-4.1-1.27-1.86-3.25-2.11-3.96-2.14-1.69-.17-3.29.99-4.15.99-.85 0-2.17-.97-3.57-.94-1.84.03-3.53 1.07-4.48 2.72-1.91 3.32-.49 8.23 1.37 10.93.91 1.32 2 2.81 3.43 2.75 1.37-.05 1.89-.89 3.55-.89 1.66 0 2.13.89 3.58.86 1.48-.03 2.42-1.35 3.33-2.68 1.05-1.54 1.49-3.03 1.51-3.11-.03-.01-2.9-1.11-2.93-4.41zM14.5 4.21c.76-.92 1.27-2.2 1.13-3.46-1.09.04-2.41.73-3.19 1.64-.7.81-1.31 2.1-1.15 3.34 1.21.09 2.45-.62 3.21-1.52z" />
    </svg>
  );
}

/**
 * Combined sign-in / create-account screen. Split layout on desktop (image
 * brand panel + form) with a tab switcher. Password reset and social sign-in
 * have no backend yet — those controls surface a "coming soon" toast.
 */
export function AuthPage({ initialMode = "login" }: { initialMode?: Mode }) {
  const { login, register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? "/dashboard";
  const isLogin = mode === "login";

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const comingSoon = (label: string) => toast(`${label} is coming soon.`, "info");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLogin && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      if (isLogin) {
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
      {/* Brand panel — image, desktop only */}
      <aside className="relative hidden w-1/2 lg:block">
        <img
          src="/login.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-on-surface/85 via-on-surface/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-sm p-xl text-white">
          <div className="flex items-center gap-base">
            <Leaf size={28} className="text-primary-fixed" />
            <span className="text-headline-md font-bold">NutriMate</span>
          </div>
          <h2 className="text-display-lg">Guided Vitality</h2>
          <p className="max-w-md text-body-md text-white/85">
            Start tracking your culturally tailored meals today. AI-powered insights for a
            healthier you, without sacrificing the flavors you love.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex w-full flex-col justify-center px-margin-mobile py-xl lg:w-1/2 lg:px-xl">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-lg flex justify-center lg:hidden">
            <Logo />
          </div>

          <h1 className="text-headline-lg text-on-surface md:text-display-lg">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="mt-base text-body-md text-on-surface-variant">
            {isLogin
              ? "Enter your details to access your dashboard."
              : "Start tracking your culturally tailored meals in under a minute."}
          </p>

          {/* Tab switcher */}
          <div className="mt-lg flex rounded-md bg-surface-container-high p-base">
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
                {m === "login" ? "Login" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="mt-lg flex flex-col gap-md" noValidate>
            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leadingIcon={<Mail size={18} />}
              placeholder="e.g., ali.khan@example.com"
            />
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leadingIcon={<Lock size={18} />}
              placeholder="••••••••"
              hint={!isLogin ? "At least 8 characters." : undefined}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="pointer-events-auto flex items-center text-outline transition-colors hover:text-on-surface"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            {isLogin ? (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-base text-body-md text-on-surface-variant">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded-sm accent-primary"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => comingSoon("Password reset")}
                  className="text-label-md font-semibold text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            ) : null}

            {error ? (
              <p
                role="alert"
                className="rounded-md bg-error-container px-sm py-sm text-caption text-on-error-container"
              >
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" block loading={submitting} className="gap-xs">
              {isLogin ? "Log In" : "Create Account"}
              <ArrowRight size={18} />
            </Button>
          </form>

          {/* Divider */}
          <div className="my-lg flex items-center gap-sm">
            <span className="h-px flex-1 bg-outline-variant/60" />
            <span className="text-caption uppercase tracking-wider text-on-surface-variant">
              Or continue with
            </span>
            <span className="h-px flex-1 bg-outline-variant/60" />
          </div>

          {/* Social sign-in */}
          <div className="grid grid-cols-2 gap-sm">
            <Button
              type="button"
              size="lg"
              variant="secondary"
              onClick={() => comingSoon("Google sign-in")}
              className="border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low"
            >
              <GoogleMark />
              Google
            </Button>
            <Button
              type="button"
              size="lg"
              variant="secondary"
              onClick={() => comingSoon("Apple sign-in")}
              className="border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low"
            >
              <AppleMark />
              Apple
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
