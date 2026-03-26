import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

const navLinks = [
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Docs", to: "/docs" },
  { label: "Blog", to: "/blog" },
];

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${isLanding ? "bg-transparent" : "bg-background/80 backdrop-blur-lg border-b"}`}>
        <div className="container mx-auto flex items-center justify-between h-16 px-3 sm:px-4">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className={`hidden sm:inline ${isLanding ? "text-primary-foreground" : "text-foreground"}`}>AI Command Center</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <NavLink
                key={l.label}
                to={l.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors hover:text-primary ${
                    isLanding ? "hover:text-primary-foreground" : "hover:text-foreground"
                  } ${
                    isActive
                      ? isLanding
                        ? "text-primary-foreground"
                        : "text-foreground"
                      : isLanding
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Button variant={isLanding ? "hero-outline" : "ghost"} size="sm" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button variant={isLanding ? "hero" : "default"} size="sm" asChild>
              <Link to="/login">Get Started</Link>
            </Button>
          </div>

          <button
            className={`md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border ${
              isLanding ? "border-primary-foreground/30 text-primary-foreground" : "border-border text-foreground"
            }`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle mobile navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-background border-b p-4 space-y-3 animate-fade-in">
            {navLinks.map((l) => (
              <NavLink
                key={l.label}
                to={l.to}
                className={({ isActive }) =>
                  `block text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`
                }
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </NavLink>
            ))}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <ThemeToggle />
              <Button variant="outline" size="sm" asChild className="flex-1">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild className="flex-1">
                <Link to="/login">Get Started</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className={isLanding ? "flex-1" : "flex-1 pt-16"}>
        <Outlet />
      </main>
    </div>
  );
}
