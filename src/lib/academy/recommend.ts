import { PATHS } from "./catalog";

const INTEREST_MAP: Array<{ match: RegExp; path: string }> = [
  { match: /soc|analyst|blue|defen|monitor/i, path: "blue-team" },
  { match: /pentest|hack|red team|offensive|bug bounty/i, path: "ethical-hacking" },
  { match: /web|app sec|appsec|developer|owasp/i, path: "web-security" },
  { match: /cloud|aws|azure|gcp|devops|kubernetes|container/i, path: "cloud-security" },
  { match: /forensic|incident|dfir|malware/i, path: "dfir" },
  { match: /grc|risk|compliance|audit|policy|iso|governance/i, path: "grc" },
  { match: /ai|machine learning|llm|prompt/i, path: "ai-security" },
  { match: /network|ccna|firewall|infrastructure/i, path: "networking" },
  { match: /linux|system admin|sysadmin/i, path: "linux" },
];

/** Pick the learning path that best matches a learner's stated background and goal. */
export function recommendPath(experienceLevel: string, careerInterest?: string | null): string {
  const interest = (careerInterest ?? "").trim();
  if (interest) {
    const hit = INTEREST_MAP.find((entry) => entry.match.test(interest));
    if (hit && PATHS.some((p) => p.slug === hit.path)) {
      // Send true beginners through foundations first unless they already have IT experience.
      if (experienceLevel === "beginner") return "foundations";
      return hit.path;
    }
  }

  switch (experienceLevel) {
    case "professional":
      return "blue-team";
    case "switching":
      return "networking";
    case "some-it":
      return "linux";
    default:
      return "foundations";
  }
}
