import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Droplet, Search, UtensilsCrossed } from "lucide-react";
import { Drawer } from "../../components/Drawer";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/toast/useToast";
import { useLogWater } from "./logs.api";

const ML_PER_GLASS = 250;
const GLASS_OPTIONS = [1, 2, 3] as const;

/**
 * Quick-action sheet behind the dashboard FAB: log water in one tap, or jump
 * to the fuller meal-logging flows.
 */
export function QuickLogDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const logWater = useLogWater();
  const [glasses, setGlasses] = useState<number>(1);

  const onLogWater = () => {
    logWater.mutate(
      { glasses, mlPerGlass: ML_PER_GLASS },
      {
        onSuccess: () => {
          toast(`Logged ${glasses} glass${glasses > 1 ? "es" : ""} of water.`, "success");
          onClose();
        },
        onError: () => toast("Could not log water. Please try again.", "error"),
      },
    );
  };

  const goTo = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Drawer open={open} onClose={onClose} title="Quick log" side="bottom">
      <div className="flex flex-col gap-md">
        {/* Water */}
        <section className="flex flex-col gap-sm rounded-lg bg-surface-container-low p-md">
          <div className="flex items-center gap-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-tertiary-container/15 text-tertiary">
              <Droplet size={20} />
            </span>
            <div>
              <h3 className="text-body-lg font-bold text-on-surface">Log water</h3>
              <p className="text-caption text-on-surface-variant">{ML_PER_GLASS} ml per glass</p>
            </div>
          </div>
          <div className="flex gap-sm">
            {GLASS_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setGlasses(n)}
                aria-pressed={glasses === n}
                className={
                  "flex-1 rounded-md border py-sm text-label-md transition-colors " +
                  (glasses === n
                    ? "border-tertiary bg-tertiary-container/15 text-tertiary"
                    : "border-outline-variant text-on-surface-variant")
                }
              >
                {n} glass{n > 1 ? "es" : ""}
              </button>
            ))}
          </div>
          <Button onClick={onLogWater} loading={logWater.isPending} block>
            Add {glasses * ML_PER_GLASS} ml
          </Button>
        </section>

        {/* Meal shortcuts */}
        <section className="flex flex-col gap-sm">
          <h3 className="text-label-md text-on-surface-variant">Log a meal</h3>
          <button
            type="button"
            onClick={() => goTo("/meals")}
            className="flex items-center gap-sm rounded-md border border-outline-variant bg-surface-container-lowest p-sm text-left transition-colors hover:border-primary/40"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-container/15 text-primary">
              <UtensilsCrossed size={20} />
            </span>
            <span>
              <span className="block text-body-md font-semibold text-on-surface">
                From today's plan
              </span>
              <span className="block text-caption text-on-surface-variant">
                Mark a recommended meal as eaten
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => goTo("/search")}
            className="flex items-center gap-sm rounded-md border border-outline-variant bg-surface-container-lowest p-sm text-left transition-colors hover:border-primary/40"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary-container/20 text-secondary">
              <Search size={20} />
            </span>
            <span>
              <span className="block text-body-md font-semibold text-on-surface">
                Search a food
              </span>
              <span className="block text-caption text-on-surface-variant">
                Look it up and log a serving
              </span>
            </span>
          </button>
        </section>
      </div>
    </Drawer>
  );
}
