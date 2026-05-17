import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, Search, User } from "lucide-react";
import { useAuth } from "../features/auth/useAuth";
import { useToast } from "../components/toast/useToast";
import { Logo } from "./Logo";

/**
 * Top navigation bar — brand mark (mobile only), a nutrition search box, a
 * notifications bell, and an avatar menu with sign-out.
 */
export function TopNav() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the avatar menu on any outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  const onLogout = async () => {
    setMenuOpen(false);
    await logout();
    toast("You have been signed out.", "info");
    navigate("/", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-sm border-b border-outline-variant bg-surface-bright/95 px-margin-mobile backdrop-blur md:px-lg">
      <div className="md:hidden">
        <Logo compact />
      </div>

      <form onSubmit={onSearch} className="relative ml-auto w-full max-w-md md:ml-8">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm text-outline">
          <Search size={18} />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods, dishes…"
          aria-label="Search nutrition"
          className="h-10 w-full rounded-md border border-outline-variant bg-surface-container-lowest pl-10 pr-sm text-body-md text-on-surface placeholder:text-outline transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </form>

      <div className="ml-auto flex items-center gap-xs md:me-8 md:gap-sm">
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => toast("No new notifications.", "info")}
          className="relative rounded-full p-sm text-on-surface-variant transition-colors hover:bg-surface-container-low"
        >
          <Bell size={20} />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="Account menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-surface-container-high text-primary transition-transform active:scale-95"
          >
            <User size={20} />
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 mt-xs w-60 overflow-hidden rounded-md border border-outline-variant bg-surface-container-lowest shadow-floating"
            >
              <div className="border-b border-outline-variant px-md py-sm">
                <p className="text-label-md text-on-surface-variant">Signed in as</p>
                <p className="truncate text-body-md font-semibold text-on-surface">
                  {user?.email ?? "—"}
                </p>
              </div>
              <button
                role="menuitem"
                onClick={onLogout}
                className="flex w-full items-center gap-sm px-md py-sm text-body-md text-error transition-colors hover:bg-error-container/40"
              >
                <LogOut size={18} />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
