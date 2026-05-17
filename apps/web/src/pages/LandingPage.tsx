import { Link } from "react-router-dom";
import { ArrowRight, CircleCheck, Droplet, Flame, Sparkles, UtensilsCrossed } from "lucide-react";
import { useAuth } from "../features/auth/useAuth";
import { Button } from "../components/ui/Button";
import { ProgressRing } from "../components/ProgressRing";
import { Logo } from "../layout/Logo";

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
        <section className="grid items-center gap-lg py-lg md:grid-cols-2 md:gap-xl md:py-xl">
          <div className="flex flex-col gap-md">
            <h1 className="text-headline-lg-mobile text-on-surface md:text-display-lg">
              Smart Nutrition for <span className="text-primary">Real Life</span>
            </h1>
            <p className="max-w-md text-body-lg text-on-surface-variant">
              Achieve your vitality goals with AI-guided meal plans tailored to your lifestyle. From
              quick gym prep to budget-friendly local favorites, NutriMate makes tracking
              effortless.
            </p>
            <div className="flex flex-col gap-sm pt-xs sm:flex-row">
              <Link to={signedIn ? "/dashboard" : "/register"}>
                <Button size="lg" className="gap-xs">
                  {signedIn ? "Open dashboard" : "Get Started Free"}
                  <ArrowRight size={18} />
                </Button>
              </Link>
              {!signedIn ? (
                <Link to="/login">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="border border-outline-variant bg-surface-container-lowest"
                  >
                    Login
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>

          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-0 translate-x-3 translate-y-3 rounded-xl bg-primary-container/10"
            />
            <div className="relative overflow-hidden rounded-xl shadow-floating">
              <img
                src="/hero.png"
                alt="A fresh, balanced meal bowl with grilled chicken and vegetables"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>

            {/* Floating stat — daily calorie goal */}
            <div className="absolute -left-2 top-lg flex items-center gap-sm rounded-lg bg-surface-container-lowest p-sm shadow-floating sm:-left-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary">
                <Flame size={18} />
              </span>
              <span className="pr-xs">
                <span className="block text-caption text-on-surface-variant">
                  Daily Calorie Goal
                </span>
                <span className="block text-label-md text-on-surface">1,850 kcal</span>
              </span>
            </div>

            {/* Floating stat — logged meal */}
            <div className="absolute -right-2 bottom-lg flex items-center gap-sm rounded-lg bg-surface-container-lowest p-sm shadow-floating sm:-right-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container/15 text-primary">
                <CircleCheck size={20} />
              </span>
              <span className="pr-xs">
                <span className="block text-label-md text-on-surface">Daal Chawal Logged</span>
                <span className="block text-caption text-on-surface-variant">Budget Friendly</span>
              </span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-lg md:py-xl">
          <div className="mx-auto mb-lg max-w-xl text-center">
            <h2 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">
              Guided Vitality at Every Step
            </h2>
            <p className="mt-base text-body-md text-on-surface-variant">
              Powerful tools designed for clarity, approachability, and lasting habit formation.
            </p>
          </div>

          <div className="grid gap-md lg:grid-cols-3">
            {/* AI Calorie Prediction — wide */}
            <article className="relative flex flex-col gap-sm overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-lg shadow-card lg:col-span-2">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 w-2/5 bg-gradient-to-l from-tertiary-fixed/50 to-transparent"
              />
              <Sparkles size={28} className="text-primary" />
              <h3 className="text-headline-md text-on-surface">AI Calorie Prediction</h3>
              <p className="max-w-sm text-body-md text-on-surface-variant">
                Simply describe or snap a photo of your meal. Our advanced AI accurately estimates
                macros and calories instantly, removing the guesswork.
              </p>
              <Link
                to={signedIn ? "/dashboard" : "/register"}
                className="mt-auto inline-flex items-center gap-base pt-sm text-label-md font-semibold text-primary"
              >
                Try it out <ArrowRight size={16} />
              </Link>
            </article>

            {/* Hydration Tracking — narrow */}
            <article className="flex flex-col items-center justify-center gap-sm rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-lg text-center shadow-card">
              <ProgressRing
                value={1.5}
                max={2}
                color="tertiary"
                size={128}
                centerLabel={<Droplet size={28} className="text-tertiary" />}
                centerSublabel="1.5L / 2L"
              />
              <h3 className="text-body-lg font-bold text-on-surface">Hydration Tracking</h3>
              <p className="text-body-md text-on-surface-variant">
                Stay refreshed throughout your day.
              </p>
            </article>

            {/* Budget-Friendly Local Meals — narrow */}
            <article className="flex flex-col overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-lowest shadow-card">
              <img
                src="/feature.png"
                alt="A clay pot of steamed rice"
                className="h-40 w-full object-cover"
              />
              <div className="flex flex-1 flex-col gap-sm p-md">
                <h3 className="text-body-lg font-bold text-on-surface">
                  Budget-Friendly Local Meals
                </h3>
                <p className="text-body-md text-on-surface-variant">
                  Tailored plans featuring accessible, nourishing staples like daal chawal and
                  morning oats.
                </p>
                <div className="mt-auto flex flex-wrap gap-base pt-xs">
                  {["Low Cost", "High Protein"].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-surface-container px-sm py-base text-caption font-semibold text-on-surface-variant"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>

            {/* Personalized Meal Plans — wide, accent */}
            <article className="grid gap-md rounded-lg bg-primary p-lg text-on-primary shadow-card lg:col-span-2 md:grid-cols-2 md:items-center">
              <div className="flex flex-col gap-sm">
                <UtensilsCrossed size={28} className="text-on-primary" />
                <h3 className="text-headline-md">Personalized Meal Plans</h3>
                <p className="text-body-md text-on-primary/85">
                  Whether you're a student in Lahore or starting the gym in Karachi, get daily
                  recommendations that fit your unique macro needs and lifestyle constraints.
                </p>
                <Link to={signedIn ? "/dashboard" : "/register"} className="pt-xs">
                  <Button
                    size="lg"
                    className="bg-surface-container-lowest text-primary shadow-card hover:bg-surface-container-low"
                  >
                    View Sample Plans
                  </Button>
                </Link>
              </div>

              {/* Sample meal preview */}
              <div className="rounded-lg bg-on-primary/10 p-md">
                <div className="flex items-start justify-between gap-sm">
                  <span className="text-caption text-on-primary/80">Today's Dinner</span>
                  <span className="rounded-full bg-secondary-container px-sm py-base text-caption font-semibold text-on-secondary">
                    450 kcal
                  </span>
                </div>
                <p className="mt-base text-body-lg font-bold text-on-primary">
                  Grilled Chicken Wrap
                </p>
                <div className="mt-sm flex flex-wrap gap-base">
                  {["30g P", "40g C", "12g F"].map((macro) => (
                    <span
                      key={macro}
                      className="rounded-md bg-on-primary/15 px-sm py-base text-caption font-semibold text-on-primary"
                    >
                      {macro}
                    </span>
                  ))}
                </div>
              </div>
            </article>
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
