import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const AnalyzeInput = z.object({
  url: z.string().trim().min(3).max(2048),
});

export type AnalysisResult = {
  url: string;
  verdict: "Safe" | "Suspicious" | "Dangerous";
  riskScore: number;
  explanation: string;
  recommendedAction: string;
  checks: { name: string; status: "pass" | "warn" | "fail"; detail: string }[];
};

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in model response");
  return JSON.parse(raw.slice(start, end + 1));
}

export const analyzeUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-3-flash-preview");

    const system = `You are a cybersecurity phishing detection engine. Analyze the given URL for phishing risk.
Examine: SSL/HTTPS usage, domain reputation, redirects, typosquatting, suspicious keywords, shortened links, brand impersonation, and overall URL structure.
Respond ONLY with a JSON object of this exact shape (no prose):
{
  "verdict": "Safe" | "Suspicious" | "Dangerous",
  "riskScore": <integer 0-100>,
  "explanation": "<2-4 sentence plain-English explanation>",
  "recommendedAction": "<one short actionable recommendation>",
  "checks": [
    { "name": "SSL/HTTPS", "status": "pass"|"warn"|"fail", "detail": "<short>" },
    { "name": "Domain Reputation", "status": "pass"|"warn"|"fail", "detail": "<short>" },
    { "name": "Typosquatting", "status": "pass"|"warn"|"fail", "detail": "<short>" },
    { "name": "Suspicious Keywords", "status": "pass"|"warn"|"fail", "detail": "<short>" },
    { "name": "Shortened Link", "status": "pass"|"warn"|"fail", "detail": "<short>" },
    { "name": "Impersonation", "status": "pass"|"warn"|"fail", "detail": "<short>" },
    { "name": "URL Structure", "status": "pass"|"warn"|"fail", "detail": "<short>" }
  ]
}`;

    let parsed: any;
    try {
      const { text } = await generateText({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Analyze this URL: ${data.url}` },
        ],
      });
      parsed = extractJson(text);
    } catch (err) {
      console.error("Phishing analysis failed:", err);
      throw new Error("Analysis service is currently unavailable. Please try again.");
    }

    const verdict: AnalysisResult["verdict"] =
      parsed.verdict === "Safe" || parsed.verdict === "Suspicious" || parsed.verdict === "Dangerous"
        ? parsed.verdict
        : "Suspicious";
    const riskScore = Math.max(0, Math.min(100, Math.round(Number(parsed.riskScore) || 0)));

    const result: AnalysisResult = {
      url: data.url,
      verdict,
      riskScore,
      explanation: String(parsed.explanation ?? ""),
      recommendedAction: String(parsed.recommendedAction ?? ""),
      checks: Array.isArray(parsed.checks) ? parsed.checks.slice(0, 12) : [],
    };

    const { error } = await context.supabase.from("phishing_analyses").insert({
      user_id: context.userId,
      url: result.url,
      verdict: result.verdict,
      risk_score: result.riskScore,
      explanation: result.explanation,
      recommended_action: result.recommendedAction,
      details: { checks: result.checks } as any,
    });
    if (error) console.error("Failed to save analysis:", error.message);

    return result;
  });
