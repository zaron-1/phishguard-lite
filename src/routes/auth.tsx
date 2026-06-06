import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — PhishGuard Lite" },
      { name: "description", content: "Sign in to PhishGuard Lite with a passwordless magic link." },
    ],
  }),
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If already signed in, send them to the dashboard.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace("/dashboard");
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        shouldCreateUser: true,
      },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-blob absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
        <div className="animate-blob-slow absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-chart-5/25 blur-3xl" />
      </div>

      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm rounded-2xl border bg-card/80 p-8 shadow-xl backdrop-blur">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={logo} alt="PhishGuard" width={48} height={48} className="h-12 w-12" />
          <h1 className="mt-3 text-xl font-bold text-cyber-gradient">PhishGuard Lite</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in with a magic link</p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-12 w-12 text-primary" />
            <p className="text-sm text-foreground">
              We sent a login link to <span className="font-medium">{email}</span>.
            </p>
            <p className="text-xs text-muted-foreground">
              Click the link in your inbox to sign in. You can close this tab.
            </p>
            <Button variant="ghost" className="mt-2" onClick={() => setSent(false)}>
              Use a different email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending link…
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Send magic link
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              No password needed — we'll email you a secure sign-in link.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
