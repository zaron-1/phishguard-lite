import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/analyzer")({
  head: () => ({ meta: [{ title: "Phishing Analyzer — PhishGuard Lite" }] }),
  component: Analyzer,
});

function Analyzer() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Phishing Analyzer</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Paste a URL to analyze it for phishing risk. (Coming up next.)
      </p>
    </div>
  );
}
