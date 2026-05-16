import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Flame, Search as SearchIcon, UtensilsCrossed } from "lucide-react";
import { useNutritionSearch, type NutritionItem } from "../features/nutrition/nutrition.api";
import { NutritionDetailDrawer } from "../features/nutrition/NutritionDetailDrawer";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/states/EmptyState";
import { ErrorState } from "../components/states/ErrorState";
import { SkeletonGrid } from "../components/states/Skeleton";

/** A single search-result card. */
function ResultCard({ item, onOpen }: { item: NutritionItem; onOpen: () => void }) {
  return (
    <Card interactive onClick={onOpen} padded={false} className="flex flex-col overflow-hidden">
      {/* Recipe thumbnail — falls back to a tinted icon when none is available */}
      <div className="relative aspect-[16/10] bg-primary-container/15">
        {item.image ? (
          <img
            src={item.image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-primary">
            <UtensilsCrossed size={32} />
          </span>
        )}
        <span className="absolute right-sm top-sm flex items-center gap-base rounded-full bg-secondary-container px-sm py-base text-caption font-bold text-on-secondary shadow-card">
          <Flame size={12} /> {Math.round(item.kcal)} kcal
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-sm p-md">
        <h3 className="text-body-lg font-bold text-on-surface">{item.name}</h3>
        <p className="text-caption text-on-surface-variant">
          {item.macros
            ? `P ${Math.round(item.macros.protein)}g · C ${Math.round(item.macros.carbs)}g · F ${Math.round(item.macros.fats)}g`
            : "Macros not available"}
        </p>
        <span className="mt-auto pt-base text-label-md text-primary">View & log →</span>
      </div>
    </Card>
  );
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const [draft, setDraft] = useState(query);
  const [selected, setSelected] = useState<NutritionItem | null>(null);

  // Keep the input in sync when the URL query changes (e.g. via the top nav).
  useEffect(() => {
    setDraft(query);
  }, [query]);

  const search = useNutritionSearch(query);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = draft.trim();
    setParams(q ? { q } : {}, { replace: true });
  };

  return (
    <section className="flex flex-col gap-md">
      <header className="flex flex-col gap-base">
        <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">
          Nutrition Search
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Look up any food, inspect its macros, and log a serving.
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex gap-sm">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm text-outline">
            <SearchIcon size={18} />
          </span>
          <input
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search foods, dishes…"
            aria-label="Search nutrition"
            className="h-11 w-full rounded-md border border-outline-variant bg-surface-container-lowest pl-10 pr-sm text-body-md text-on-surface placeholder:text-outline transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* States */}
      {query.trim().length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="Search for a food"
          message="Try “daal chawal”, “oats”, or “chicken” to see calories and macros."
        />
      ) : search.isLoading ? (
        <SkeletonGrid count={6} />
      ) : search.isError ? (
        <ErrorState
          error={search.error}
          title="Search failed"
          onRetry={() => void search.refetch()}
        />
      ) : !search.data || search.data.items.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="No matches"
          message={`Nothing found for “${query}”. Try a different or simpler term.`}
        />
      ) : (
        <>
          <p className="text-caption text-on-surface-variant">
            {search.data.items.length} result{search.data.items.length === 1 ? "" : "s"} for “
            {search.data.query}”
            {search.data.cached ? " · cached" : ""}
          </p>
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
            {search.data.items.map((item) => (
              <ResultCard key={item.id} item={item} onOpen={() => setSelected(item)} />
            ))}
          </div>
        </>
      )}

      <NutritionDetailDrawer
        item={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
