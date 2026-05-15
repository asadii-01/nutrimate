import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "../components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-md bg-surface px-margin-mobile text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-container/15 text-primary">
        <Compass size={40} />
      </span>
      <h1 className="text-display-lg text-on-surface">404</h1>
      <p className="max-w-sm text-body-lg text-on-surface-variant">
        We couldn&apos;t find that page. Let&apos;s get you back on track.
      </p>
      <Link to="/dashboard">
        <Button size="lg">Back to dashboard</Button>
      </Link>
    </div>
  );
}
