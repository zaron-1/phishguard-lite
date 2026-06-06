import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Home, LayoutDashboard, ShieldCheck, GraduationCap, Brain } from "lucide-react";
import type { ReactNode } from "react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/analyzer", label: "Phishing Analyzer", icon: ShieldCheck },
  { to: "/tutor", label: "AI Tutor", icon: GraduationCap },
  { to: "/quiz", label: "Quiz", icon: Brain },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 flex-col border-r bg-sidebar p-4 md:flex">
        <Link to="/dashboard" className="mb-8 flex items-center gap-2 px-2">
          <img src={logo} alt="PhishGuard" width={36} height={36} className="h-9 w-9" />
          <span className="text-lg font-bold text-cyber-gradient">PhishGuard</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <Button variant="ghost" className="justify-start gap-3" onClick={() => navigate({ to: "/" })}>
          <Home className="h-4 w-4" /> Home
        </Button>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <nav className="flex gap-1 md:hidden">
            {NAV.map(({ to, icon: Icon }) => (
              <Link key={to} to={to} className="rounded-lg p-2 text-sidebar-foreground hover:bg-sidebar-accent">
                <Icon className="h-5 w-5" />
              </Link>
            ))}
          </nav>
          <span className="hidden text-sm text-muted-foreground md:block">Smart cybersecurity, simplified.</span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => navigate({ to: "/" })} aria-label="Home">
              <Home className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
