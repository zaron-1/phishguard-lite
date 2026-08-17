import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";

export type SecurityReport = {
  id: string | null;
  url: string;
  title: string;
  riskRating: string;
  summary: string;
  content: string;
  createdAt: string;
};

const Input = z.object({ url: z.string().trim().min(3).max(2048) });

const SYSTEM = `You are a senior offensive-security consultant producing a formal web application
security assessment report in the style of an OWASP ZAP / penetration-test deliverable.

Write in precise professional cybersecurity language for a technical audience. Use Markdown with these
exact top-level sections, in order:

# Web Application Security Assessment Report
## 1. Executive Summary
## 2. Scope and Methodology
## 3. Risk Rating Summary
(a Markdown table: Severity | Count | Representative Findings — covering High, Medium, Low, Informational)
## 4. Detailed Findings
For EACH finding use this structure:
### [Severity] Finding Title
- **CWE:** CWE-xx — name
- **OWASP Top 10 (2021):** Axx:2021 — name
- **CVSS v3.1:** score (vector)
- **Affected Component:** ...
- **Description:** technical explanation of the weakness
- **Evidence / Indicators:** what an automated scanner such as OWASP ZAP would flag (headers, cookies, TLS config, forms, redirects, reflected parameters)
- **Impact:** business and technical impact
- **Exploitation Scenario:** concise attacker narrative
- **Remediation:** concrete, actionable fix
Include at least 6 findings covering areas such as: TLS/HTTPS configuration, missing security headers
(CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), cookie
attributes (Secure, HttpOnly, SameSite), information disclosure / server banners, input handling
(XSS, injection, open redirect), authentication & session management, clickjacking, CORS
misconfiguration, phishing / brand-impersonation and domain-reputation risk.
## 5. Phishing & Social-Engineering Risk Assessment
## 6. Hardening Recommendations (Prioritised)
## 7. Conclusion
## 8. Disclaimer
State clearly that this is an AI-generated, non-intrusive passive assessment inferred from the URL and
publicly observable characteristics — no active scanning or exploitation was performed — and that it
should be validated with an authorised OWASP ZAP / manual penetration test.

Do not wrap the answer in code fences. Do not add any preamble before the first heading.`;

export const generateSecurityReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }): Promise<SecurityReport> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Reporting service is not configured.");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-3-flash-preview");

    let content = "";
    try {
      const { text } = await generateText({
        model,
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `Produce the full assessment report for this target URL: ${data.url}\nAssessment date: ${new Date().toISOString().slice(0, 10)}`,
          },
        ],
      });
      content = text.trim();
    } catch (err) {
      console.error("Report generation failed:", err);
      throw new Error("Report service is currently unavailable. Please try again.");
    }

    if (!content) throw new Error("Report service returned an empty report.");

    const ratingMatch = content.match(/\b(Critical|High|Medium|Low|Informational)\b/i);
    const riskRating = ratingMatch ? ratingMatch[1] : "Medium";
    const summary =
      content
        .split(/^## /m)
        .find((s) => /^1\.\s*Executive Summary/i.test(s))
        ?.replace(/^1\.\s*Executive Summary\s*/i, "")
        .trim()
        .slice(0, 800) ?? "";

    const row = {
      user_id: context.userId,
      url: data.url,
      title: `Security Assessment — ${data.url}`,
      risk_rating: riskRating,
      summary,
      content,
    };

    let id: string | null = null;
    let createdAt = new Date().toISOString();
    try {
      const { data: inserted, error } = await context.supabase
        .from("security_reports")
        .insert(row)
        .select("id, created_at")
        .maybeSingle();
      if (error) console.error("Failed to save report:", error.message);
      if (inserted) {
        id = inserted.id;
        createdAt = inserted.created_at;
      }
    } catch (error) {
      console.error("Failed to persist report:", error);
    }

    return {
      id,
      url: data.url,
      title: row.title,
      riskRating,
      summary,
      content,
      createdAt,
    };
  });

export const listMyReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SecurityReport[]> => {
    const { data } = await context.supabase
      .from("security_reports")
      .select("id, url, title, risk_rating, summary, content, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return (data ?? []).map((r: any) => ({
      id: r.id,
      url: r.url,
      title: r.title,
      riskRating: r.risk_rating ?? "Medium",
      summary: r.summary ?? "",
      content: r.content,
      createdAt: r.created_at,
    }));
  });
