import type { LucideIcon } from "lucide-react";
import { Card } from "./ui/Card";

export interface PagePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  /** Which Phase 5 page will replace this stub. */
  phaseNote?: string;
}

/**
 * Stub page used while the app shell is being verified (Phase 4). Each routed
 * destination renders one of these until its real screen lands in Phase 5.
 */
export function PagePlaceholder({
  title,
  description,
  icon: Icon,
  phaseNote = "Full screen arrives in Phase 5.",
}: PagePlaceholderProps) {
  return (
    <section className="flex flex-col gap-md">
      <header className="flex flex-col gap-base">
        <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">{title}</h1>
        <p className="text-body-md text-on-surface-variant">{description}</p>
      </header>

      <Card className="flex flex-col items-center gap-sm py-xl text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-container/15 text-primary">
          <Icon size={30} />
        </span>
        <p className="text-body-lg font-semibold text-on-surface">{title}</p>
        <p className="max-w-md text-body-md text-on-surface-variant">{phaseNote}</p>
      </Card>
    </section>
  );
}
