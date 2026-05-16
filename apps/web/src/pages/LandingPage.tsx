import { Link } from "react-router-dom";
import {
  ArrowRight,
  Droplet,
  Sparkles,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../features/auth/useAuth";
import { Button } from "../components/ui/Button";
import { Logo } from "../layout/Logo";

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    icon: Sparkles,
    title: "AI calorie targets",
    body: "A trained model turns your age, body metrics and activity into a daily calorie goal — no guesswork.",
  },
  {
    icon: UtensilsCrossed,
    title: "Personalised meal plans",
    body: "Daily breakfast, lunch, dinner and snack picks tuned to your target, diet and budget.",
  },
  {
    icon: Wallet,
    title: "Budget-friendly & local",
    body: "Plans built around accessible Pakistani staples like daal chawal, oats and seasonal produce.",
  },
  {
    icon: Droplet,
    title: "Hydration & progress",
    body: "Track water, calories and macros, and watch your trends improve over time.",
  },
];

interface Testimonial {
  initial: string;
  name: string;
  role: string;
  quote: string;
  tint: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    initial: "S",
    name: "Sara A.",
    role: "University student",
    quote:
      "NutriMate showed me that eating healthy doesn't mean expensive salads — it balanced my canteen meals within my budget.",
    tint: "bg-tertiary-fixed text-on-tertiary-fixed",
  },
  {
    initial: "A",
    name: "Ali K.",
    role: "Gym beginner",
    quote:
      "The calorie target finally made sense of my macros. I just follow the plan and log what I eat — that's it.",
    tint: "bg-secondary-fixed text-on-secondary-fixed",
  },
  {
    initial: "F",
    name: "Fatima R.",
    role: "Working professional",
    quote:
      "Hydration nudges and quick-prep meals keep my energy steady through back-to-back meetings.",
    tint: "bg-primary-fixed text-on-primary-fixed",
  },
];

/** Public marketing landing page — the app's front door at `/`. */
export function LandingPage() {
  const { status } = useAuth();
  const signedIn = status === "authenticated";

  return (
    <div className="flex min-h-screen flex-col bg-surface-bright">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-outline-variant/60 bg-surface-bright/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-container-max items-center justify-between px-margin-mobile md:px-lg">
          <Logo />
          <nav className="flex items-center gap-sm">
            {signedIn ? (
              <Link to="/dashboard">
                <Button>Go to dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link to="/register">
                  <Button>Get started free</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-container-max flex-1 px-margin-mobile py-xl md:px-lg">
        {/* Hero */}
        <section className="flex flex-col items-center gap-md py-lg text-center md:py-xl">
          <span className="inline-flex items-center gap-base rounded-full bg-primary-container/15 px-sm py-base text-label-md text-primary">
            <Sparkles size={14} /> AI-guided nutrition
          </span>
          <h1 className="max-w-3xl text-headline-lg-mobile text-on-surface md:text-display-lg">
            Smart nutrition for <span className="text-primary">real life</span>
          </h1>
          <p className="max-w-xl text-body-lg text-on-surface-variant">
            Reach your vitality goals with calorie targets and meal plans built for real Pakistani
            kitchens and real budgets. Tracking, finally made effortless.
          </p>
          <div className="flex flex-col gap-sm pt-xs sm:flex-row">
            <Link to={signedIn ? "/dashboard" : "/register"}>
              <Button size="lg" className="gap-xs">
                {signedIn ? "Open dashboard" : "Get started free"}
                <ArrowRight size={18} />
              </Button>
            </Link>
            {!signedIn ? (
              <Link to="/login">
                <Button size="lg" variant="secondary">
                  Sign in
                </Button>
              </Link>
            ) : null}
          </div>
        </section>

        {/* Features */}
        <section className="py-lg">
          <div className="mb-lg text-center">
            <h2 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">
              Guided vitality at every step
            </h2>
            <p className="mt-base text-body-md text-on-surface-variant">
              Powerful tools designed for clarity and lasting habits.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex flex-col gap-sm rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-md shadow-card"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-md bg-primary-container/15 text-primary">
                  <Icon size={24} />
                </span>
                <h3 className="text-body-lg font-bold text-on-surface">{title}</h3>
                <p className="text-body-md text-on-surface-variant">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-lg">
          <div className="mb-lg text-center">
            <h2 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">
              Real people, real vitality
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-md md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.name}
                className="flex flex-col gap-sm rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-md shadow-card"
              >
                <div className="flex items-center gap-sm">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-label-md font-bold ${t.tint}`}
                  >
                    {t.initial}
                  </span>
                  <figcaption>
                    <p className="text-label-md text-on-surface">{t.name}</p>
                    <p className="text-caption text-on-surface-variant">{t.role}</p>
                  </figcaption>
                </div>
                <blockquote className="text-body-md italic text-on-surface-variant">
                  “{t.quote}”
                </blockquote>
              </figure>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        {!signedIn ? (
          <section className="my-lg flex flex-col items-center gap-sm rounded-xl bg-primary-container px-md py-xl text-center text-on-primary-container">
            <h2 className="text-headline-md">Ready to eat smarter?</h2>
            <p className="max-w-md text-body-md opacity-90">
              Create your free account and get a personalised plan in under a minute.
            </p>
            <Link to="/register" className="mt-base">
              <Button size="lg" variant="secondary">
                Create your account
              </Button>
            </Link>
          </section>
        ) : null}
      </main>

      <footer className="bg-inverse-surface py-lg text-inverse-on-surface">
        <div className="mx-auto flex w-full max-w-container-max flex-col items-center gap-base px-margin-mobile text-center md:px-lg">
          <Logo className="[&_span]:text-inverse-on-surface" />
          <p className="text-caption text-inverse-on-surface/70">
            © {new Date().getFullYear()} NutriMate · Guided vitality for everyday life.
          </p>
        </div>
      </footer>
    </div>
  );
}
