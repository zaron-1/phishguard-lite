import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — PhishGuard Lite" },
      { name: "description", content: "Sign in to PhishGuard Lite in one click with your Google account." },
      { property: "og:title", content: "Sign in — PhishGuard Lite" },
      { property: "og:description", content: "One-click Google sign-in. No email codes, and you stay signed in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  component: AuthPage,
});

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.6 3-2.3 5.5-4.9 7.2l7.6 5.9c4.4-4.1 7.1-10.2 7.1-17.4z" />
      <path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.4 0-11.7-3.7-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace("/dashboard");
    });
  }, []);

  async function signInWithGoogle() {
    setError(null);
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth/callback`,
        extraParams: { prompt: "select_account" },
      });
      if (result.error) {
        setError("Could not sign in with Google. Please try again.");
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      window.location.replace("/dashboard");
    } catch {
      setError("Could not sign in with Google. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-blob absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
        <div className="animate-blob-slow absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-chart-5/25 blur-3xl" />
      </div>

      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm rounded-2xl border bg-card/80 p-6 shadow-xl backdrop-blur sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={logo} alt="PhishGuard" width={48} height={48} className="h-12 w-12" />
          <h1 className="mt-3 text-xl font-bold text-cyber-gradient">PhishGuard Lite</h1>
          <p className="mt-1 text-sm text-muted-foreground">Welcome back — sign in to continue</p>
        </div>

        <Button
          onClick={signInWithGoogle}
          disabled={loading}
          variant="outline"
          className="h-12 w-full gap-3 text-base font-medium"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleMark />}
          {loading ? "Opening Google…" : "Sign in with Google"}
        </Button>

        <p className="mt-3 text-center text-sm text-muted-foreground">
          Skip the email codes. One click, you're in — and you'll stay logged in.
        </p>

        {error && (
          <p className="mt-4 flex items-start gap-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </p>
        )}

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> Secured by Google — we never see your password.
        </p>
      </div>
    </div>
  );
}
