import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, GraduationCap, LayoutDashboard, ArrowRight } from "lucide-react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { InstallButton } from "@/components/install-button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PhishGuard Lite — AI Phishing Detection & Cyber Learning" },
      { name: "description", content: "Detect phishing links instantly and learn cybersecurity with an AI tutor. Smart, lightweight, and secure." },
      { property: "og:title", content: "PhishGuard Lite" },
      { property: "og:description", content: "AI-powered phishing detection and cybersecurity learning." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-blob absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl sm:h-96 sm:w-96" />
        <div className="animate-blob-slow absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-chart-5/25 blur-3xl sm:h-96 sm:w-96" />
        <div className="animate-blob absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-chart-2/20 blur-3xl sm:h-80 sm:w-80" />
      </div>

      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <img src={logo} alt="PhishGuard" width={36} height={36} className="h-9 w-9" />
          <span className="text-lg font-bold text-cyber-gradient">PhishGuard Lite</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <InstallButton variant="outline" size="sm" className="hidden sm:inline-flex" />
          <Button asChild>
            <Link to="/dashboard">Open app</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 pb-16 pt-12 text-center sm:px-6 sm:pt-16">
        <span className="inline-block rounded-full border border-primary/30 bg-accent px-4 py-1 text-xs font-medium text-accent-foreground">
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
          Paste any link to get an instant AI risk verdict, then sharpen your skills with a cybersecurity AI tutor — all in one secure, lightweight app.
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


      <section className="relative mx-auto grid max-w-5xl gap-6 px-4 pb-24 sm:px-6 md:grid-cols-3">
        {[
          { icon: ShieldCheck, title: "Phishing Analyzer", desc: "AI checks SSL, domain reputation, typosquatting, impersonation and more — with a 0–100 risk score." },
          { icon: GraduationCap, title: "AI Tutor", desc: "Ask anything from beginner to expert: attacks, tools, networking, ethical hacking and certifications." },
          { icon: LayoutDashboard, title: "Smart Dashboard", desc: "Track your analyses, learning activity and progress in clean, modern charts." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border bg-card p-6 transition-shadow hover:shadow-lg">
            <div className="mb-4 inline-flex rounded-xl bg-accent p-3 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
