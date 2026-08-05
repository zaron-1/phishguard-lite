import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mail, ShieldCheck, Loader2, CheckCircle2, Send, Inbox, Clock, AlertTriangle } from "lucide-react";
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

const RESEND_SECONDS = 60;

type DeliveryStage = "queued" | "sent" | "waiting";

function formatCountdown(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
}

function AuthPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<DeliveryStage>("queued");
  const [cooldown, setCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null);
  const stageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // If already signed in, send them to the dashboard.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace("/dashboard");
    });
  }, []);

  // Countdown tick for the resend timer.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  useEffect(() => () => {
    if (stageTimer.current) clearTimeout(stageTimer.current);
  }, []);

  const sendLink = useCallback(async (address: string) => {
    setError(null);
    setLoading(true);
    setStage("queued");

    const { error: sendError } = await supabase.auth.signInWithOtp({
      email: address,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        shouldCreateUser: true,
      },
    });
    setLoading(false);

    if (sendError) {
      // Surface provider rate limits as a real wait time instead of a raw error.
      const seconds = Number(/(\d+)\s*second/i.exec(sendError.message)?.[1]);
      if (Number.isFinite(seconds) && seconds > 0) {
        setCooldown(seconds);
        setError(`Too many requests. You can try again in ${formatCountdown(seconds)}.`);
      } else {
        setError(sendError.message);
      }
      return;
    }

    setSent(true);
    setAttempts((a) => a + 1);
    setLastSentAt(new Date());
    setCooldown(RESEND_SECONDS);
    setStage("sent");
    if (stageTimer.current) clearTimeout(stageTimer.current);
    stageTimer.current = setTimeout(() => setStage("waiting"), 4000);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    await sendLink(trimmed);
  }

  const steps: { key: DeliveryStage; label: string; icon: typeof Send }[] = [
    { key: "queued", label: "Request accepted", icon: CheckCircle2 },
    { key: "sent", label: "Email handed to mail server", icon: Send },
    { key: "waiting", label: "Waiting for it to land in your inbox", icon: Inbox },
  ];
  const currentIndex = steps.findIndex((s) => s.key === stage);

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
          <p className="mt-1 text-sm text-muted-foreground">Sign in with a magic link</p>
        </div>

        {sent ? (
          <div className="flex flex-col gap-4">
            <div className="text-center">
              <p className="text-sm text-foreground">
                Login link sent to <span className="font-medium break-all">{email}</span>
              </p>
              {lastSentAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Sent at {lastSentAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {attempts > 1 ? ` · attempt ${attempts}` : ""}
                </p>
              )}
            </div>

            <ul className="flex flex-col gap-2 rounded-xl border bg-muted/40 p-3">
              {steps.map((step, i) => {
                const done = i < currentIndex;
                const active = i === currentIndex;
                const Icon = step.icon;
                return (
                  <li
                    key={step.key}
                    className={`flex items-center gap-2 text-xs ${
                      done || active ? "text-foreground" : "text-muted-foreground/60"
                    }`}
                  >
                    {active && step.key === "waiting" ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                    ) : (
                      <Icon className={`h-4 w-4 shrink-0 ${done || active ? "text-primary" : ""}`} />
                    )}
                    <span>{step.label}</span>
                  </li>
                );
              })}
            </ul>

            <p className="text-xs text-muted-foreground">
              Delivery usually takes under a minute. If it hasn't arrived, check your spam or promotions
              folder before resending.
            </p>

            {error && (
              <p className="flex items-start gap-2 text-xs text-destructive">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
              </p>
            )}

            <Button
              className="w-full"
              disabled={loading || cooldown > 0}
              onClick={() => sendLink(email.trim())}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Resending…
                </>
              ) : cooldown > 0 ? (
                <>
                  <Clock className="h-4 w-4" /> Resend in {formatCountdown(cooldown)}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Resend link
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                setSent(false);
                setError(null);
                setAttempts(0);
              }}
            >
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

            {error && (
              <p className="flex items-start gap-2 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </p>
            )}

            <Button type="submit" disabled={loading || cooldown > 0} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending link…
                </>
              ) : cooldown > 0 ? (
                <>
                  <Clock className="h-4 w-4" /> Try again in {formatCountdown(cooldown)}
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

