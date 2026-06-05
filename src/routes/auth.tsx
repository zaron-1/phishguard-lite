import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Open App — PhishGuard Lite" },
      { name: "description", content: "Open PhishGuard Lite and use the cybersecurity tools instantly." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  component: () => null,
});

