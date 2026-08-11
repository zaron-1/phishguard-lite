import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, GraduationCap, LayoutDashboard, ArrowRight, KeyRound, Lock, Sparkles, Shield, Search } from "lucide-react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { InstallButton } from "@/components/install-button";
import { AnimatedBackground } from "@/components/animated-background";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PhishGuard Lite — AI Phishing Detection & Cyber Learning" },
      { name: "description", content: "Detect phishing links instantly, learn cybersecurity with an AI tutor, and store your passwords securely — all in one smart, lightweight app." },
      { property: "og:title", content: "PhishGuard Lite" },
      { property: "og:description", content: "AI-powered phishing detection, cybersecurity learning, and a secure password vault." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Phishing Analyzer",
    desc: "AI checks SSL, domain reputation, typosquatting, impersonation and more — with a 0–100 risk score.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: GraduationCap,
    title: "AI Tutor",
    desc: "Ask anything from beginner to expert: attacks, tools, networking, ethical hacking and certifications.",
    color: "text-chart-2",
    bg: "bg-chart-2/10",
  },
  {
    icon: LayoutDashboard,
    title: "Smart Dashboard",
    desc: "Track your analyses, learning activity, search history and progress in clean, modern charts.",
    color: "text-chart-3",
    bg: "bg-chart-3/10",
  },
  {
    icon: KeyRound,
    title: "Password Vault",
    desc: "Generate, store and manage strong passwords with encrypted storage. Your secrets stay yours.",
    color: "text-chart-5",
    bg: "bg-chart-5/10",
  },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Rich multicolour animated background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-blob absolute -left-20 -top-20 h-80 w-80 rounded-full bg-primary/50 blur-3xl sm:h-[28rem] sm:w-[28rem]" />
        <div className="animate-blob-slow absolute -right-20 top-1/4 h-80 w-80 rounded-full bg-chart-5/55 blur-3xl sm:h-[28rem] sm:w-[28rem]" />
        <div className="animate-blob absolute bottom-12 left-1/4 h-72 w-72 rounded-full bg-chart-2/45 blur-3xl sm:h-96 sm:w-96" style={{ animationDelay: "-6s" }} />
        <div className="animate-blob-slow absolute -bottom-16 right-0 h-72 w-72 rounded-full bg-[var(--color-violet)]/50 blur-3xl sm:h-[26rem] sm:w-[26rem]" style={{ animationDelay: "-11s" }} />
        <div className="animate-blob absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-[var(--color-amber)]/40 blur-3xl sm:h-[22rem] sm:w-[22rem]" style={{ animationDelay: "-3s" }} />
        <div className="animate-blob-slow absolute right-1/4 -top-12 h-60 w-60 rounded-full bg-[var(--color-rose)]/45 blur-3xl sm:h-80 sm:w-80" style={{ animationDelay: "-15s" }} />
        <div className="animate-blob absolute left-1/3 top-1/3 h-52 w-52 rounded-full bg-[var(--color-cyan)]/40 blur-3xl sm:h-72 sm:w-72" style={{ animationDelay: "-9s" }} />
        <div className="animate-blob-slow absolute bottom-1/4 left-0 h-48 w-48 rounded-full bg-[var(--color-emerald)]/40 blur-3xl sm:h-64 sm:w-64" style={{ animationDelay: "-20s" }} />
      </div>
      <AnimatedBackground />

      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <img src={logo} alt="PhishGuard" width={36} height={36} className="h-9 w-9" />
          <span className="text-lg font-bold text-cyber-gradient">PhishGuard Lite</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <InstallButton variant="outline" size="sm" className="hidden sm:inline-flex" />
          <Button asChild>
            <Link to="/auth">Open app</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 pb-12 pt-10 text-center sm:px-6 sm:pt-14">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          AI-powered cybersecurity platform
        </span>
        <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight sm:text-6xl headline-float">
          <span className="animate-word" style={{ animationDelay: "0.05s" }}>Stop</span>{" "}
          <span className="animate-word" style={{ animationDelay: "0.22s" }}>
            <span className="shimmer-word text-cyber-animated">phishing</span>
          </span>{" "}
          <span className="animate-word" style={{ animationDelay: "0.42s" }}>before</span>{" "}
          <span className="animate-word" style={{ animationDelay: "0.56s" }}>it</span>{" "}
          <span className="animate-word" style={{ animationDelay: "0.7s" }}>hooks</span>{" "}
          <span className="animate-word" style={{ animationDelay: "0.84s" }}>you.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Paste any link to get an instant AI risk verdict, sharpen your skills with a cybersecurity AI tutor, and keep your passwords safe — all in one secure, lightweight app.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="glow">
            <Link to="/analyzer">
              Analyze a link <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <InstallButton size="lg" variant="outline" />
        </div>
      </section>

      {/* Decorative floating app orbit */}
      <section className="relative mx-auto max-w-3xl px-4 pb-6 sm:px-6">
        <div className="relative mx-auto aspect-[4/3] w-full max-w-lg rounded-3xl border bg-card/70 p-6 shadow-2xl backdrop-blur-sm sm:aspect-[16/10] sm:p-8">
          <div className="absolute -right-4 -top-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-amber)]/90 text-white shadow-lg sm:-right-6 sm:-top-6 sm:h-16 sm:w-16">
            <Shield className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <div className="absolute -bottom-4 -left-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-violet)]/90 text-white shadow-lg sm:-bottom-6 sm:-left-6 sm:h-16 sm:w-16">
            <Lock className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <div className="absolute -bottom-8 right-1/4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-emerald)]/90 text-white shadow-lg sm:h-14 sm:w-14">
            <Search className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="inline-flex rounded-2xl bg-gradient-to-br from-primary/20 to-chart-5/20 p-4">
              <img src={logo} alt="PhishGuard" width={64} height={64} className="h-16 w-16 sm:h-20 sm:w-20" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold sm:text-xl">Your all-in-one cyber shield</p>
              <p className="max-w-xs text-sm text-muted-foreground sm:max-w-sm">
                Analyze suspicious links, learn security skills, and lock your passwords away safely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="relative mx-auto grid max-w-5xl gap-5 px-4 pb-10 sm:px-6 sm:pb-14 md:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
          <div key={title} className="group rounded-2xl border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className={`mb-4 inline-flex rounded-xl ${bg} p-3 ${color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </section>

      {/* Vault advertisement */}
      <section className="relative mx-auto max-w-5xl px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-[var(--color-violet)]/10 via-card to-[var(--color-cyan)]/10 p-6 sm:p-10">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--color-amber)]/20 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[var(--color-emerald)]/20 blur-3xl" />
          <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-violet)]/15 px-3 py-1 text-sm font-medium text-[var(--color-violet)]">
                <Lock className="h-4 w-4" />
                New: Password Vault
              </div>
              <h2 className="text-2xl font-bold sm:text-3xl">Never forget a password again.</h2>
              <p className="mt-3 text-base text-muted-foreground sm:text-lg">
                Generate strong, unique passwords and store them securely in your personal vault. One master sign-in, total peace of mind.
              </p>
              <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <li className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-emerald)]" />
                  Encrypted storage
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-emerald)]" />
                  One-click copy & reveal
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-emerald)]" />
                  Built-in generator
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-emerald)]" />
                  Instant search
                </li>
              </ul>
            </div>
            <Button asChild size="lg" className="shrink-0 glow">
              <Link to="/auth">
                Open Vault <KeyRound className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
