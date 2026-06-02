import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tutor")({
  head: () => ({ meta: [{ title: "AI Tutor — PhishGuard Lite" }] }),
  component: Tutor,
});

function Tutor() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">AI Tutor</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Chat with the cybersecurity tutor to learn how to stay safe. (Coming up next.)
      </p>
    </div>
  );
}
