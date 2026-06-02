import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ChatRequestBody = { messages?: unknown };

const SYSTEM_PROMPT = `You are the PhishGuard Cybersecurity AI Tutor, an expert, friendly instructor.
You teach cybersecurity from absolute beginner to advanced. Topics include: phishing & social engineering,
malware, networking, ethical hacking, penetration testing tools, cloud security, cryptography, certifications
(Security+, CEH, OSCP, CISSP, etc.), and security best practices.
Adapt explanations to the learner's level. Use clear structure, short paragraphs, and concrete examples.
Use markdown formatting. Keep answers focused. Never provide instructions that enable real-world illegal attacks;
explain concepts defensively and ethically.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        try {
          const gateway = createLovableAiGatewayProvider(key);
          const model = gateway("google/gemini-3-flash-preview");
          const result = streamText({
            model,
            system: SYSTEM_PROMPT,
            messages: await convertToModelMessages(messages as UIMessage[]),
          });
          return result.toUIMessageStreamResponse({
            originalMessages: messages as UIMessage[],
          });
        } catch (err) {
          console.error("Tutor chat error:", err);
          return new Response("AI service error", { status: 500 });
        }
      },
    },
  },
});
