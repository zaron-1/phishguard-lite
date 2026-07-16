import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  GraduationCap,
  Brain,
  User,
  History,
  Shield,
  KeyRound,
} from "lucide-react";
import type { ReactNode } from "react";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { InstallButton } from "@/components/install-button";
import { useRole } from "@/hooks/use-role";

const USER_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "My Profile", icon: User },
  { to: "/search-history", label: "Search History", icon: History },
  { to: "/analyzer", label: "Phishing Analyzer", icon: ShieldCheck },
  { to: "/vault", label: "Password Vault", icon: KeyRound },
  { to: "/tutor", label: "AI Tutor", icon: GraduationCap },
  { to: "/quiz", label: "Quiz", icon: Brain },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { isAdmin } = useRole();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = [
    ...USER_NAV,
    ...(isAdmin ? [{ to: "/admin", label: "Admin Panel", icon: Shield } as const] : []),
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
        <Link to="/dashboard" className="mb-8 flex items-center gap-2 px-2">
          <img src={logo} alt="PhishGuard" width={36} height={36} className="h-9 w-9" />
          <span className="text-lg font-bold text-cyber-gradient">PhishGuard</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map(({ to, label, icon: Icon }) => {
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
                {to === "/admin" && (
                  <span className="ml-auto rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    ADMIN
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <Button variant="ghost" className="justify-start gap-3" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 border-b px-3 py-3 md:px-4">
          <Link to="/dashboard" className="flex items-center gap-2 md:hidden">
            <img src={logo} alt="PhishGuard" width={28} height={28} className="h-7 w-7 shrink-0" />
            <span className="text-base font-bold text-cyber-gradient">PhishGuard</span>
          </Link>
          <span className="hidden text-sm text-muted-foreground md:block">Smart cybersecurity, simplified.</span>
          <div className="flex items-center gap-1.5">
            <InstallButton variant="outline" size="sm" />
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="md:hidden" onClick={handleSignOut} aria-label="Sign out">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Mobile scrollable tab nav */}
        <nav className="flex gap-1 overflow-x-auto border-b px-2 py-2 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex shrink-0 flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </nav>

        <main className="w-full min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
