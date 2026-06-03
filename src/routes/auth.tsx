import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — PhishGuard Lite" },
      { name: "description", content: "Log in to PhishGuard Lite with your email and password, or create a verified account." },
    ],
  }),
  component: AuthPage,
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9\s()-]{7,20}$/;

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <span className="text-lg font-bold text-cyber-gradient">PhishGuard Lite</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-sm">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}>
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm onSuccess={() => navigate({ to: "/dashboard", replace: true })} />
            </TabsContent>
            <TabsContent value="signup">
              <SignupFlow onSuccess={() => navigate({ to: "/dashboard", replace: true })} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!emailRegex.test(trimmed)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!password) {
      toast.error("Please enter your password.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: trimmed, password });
    setLoading(false);
    if (error) {
      toast.error(
        error.message.includes("Email not confirmed")
          ? "Please verify your account first. Check your inbox for the code."
          : "Invalid email or password.",
      );
      return;
    }
    toast.success("Welcome back!");
    onSuccess();
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Log in with your email and password.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-email">Email address</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Log in
      </Button>
    </form>
  );
}

function SignupFlow({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState<"details" | "otp">("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const register = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (trimmedName.length < 2) {
      toast.error("Please enter your name.");
      return;
    }
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!phoneRegex.test(trimmedPhone)) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: { display_name: trimmedName, phone: trimmedPhone },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(
        error.message.includes("already registered")
          ? "An account with this email already exists. Try logging in."
          : error.message,
      );
      return;
    }
    setEmail(trimmedEmail);
    setStep("otp");
    setResendIn(45);
    toast.success("We sent a 6-digit verification code to your email.");
  };

  const resend = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setResendIn(45);
    toast.success("A new code is on its way.");
  };

  const verify = async (value: string) => {
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: value,
      type: "signup",
    });
    setLoading(false);
    if (error) {
      toast.error("That code is invalid or expired. Please try again.");
      setCode("");
      return;
    }
    toast.success("Account verified!");
    onSuccess();
  };

  if (step === "otp") {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => { setStep("details"); setCode(""); }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-bold">Verify your account</h1>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(v) => {
              setCode(v);
              if (v.length === 6) verify(v);
            }}
            disabled={loading}
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} className="h-11 w-11 text-base" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        {loading && (
          <div className="flex justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…
          </div>
        )}
        <div className="text-center text-sm text-muted-foreground">
          {resendIn > 0 ? (
            <span>Resend code in {resendIn}s</span>
          ) : (
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={resend}
            >
              Resend code
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={register} className="space-y-5">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          We'll send a 6-digit code to verify your email.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-name">Full name</Label>
        <Input
          id="signup-name"
          type="text"
          autoComplete="name"
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email address</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-phone">Phone number</Label>
        <Input
          id="signup-phone"
          type="tel"
          autoComplete="tel"
          placeholder="+1 555 000 1234"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Create account
      </Button>
    </form>
  );
}
