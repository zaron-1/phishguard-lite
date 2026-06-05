import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ChatRequestBody = { messages?: unknown };

const GUEST_USER_ID = "00000000-0000-0000-0000-000000000000";

const SYSTEM_PROMPT = `You are the PhishGuard Cybersecurity AI Tutor, an expert, friendly instructor.
You teach cybersecurity from absolute beginner to advanced. Topics include: phishing & social engineering,
malware, networking, ethical hacking, penetration testing tools, cloud security, cryptography, certifications
(Security+, CEH, OSCP, CISSP, etc.), and security best practices.
Adapt explanations to the learner's level. Use clear structure, short paragraphs, and concrete examples.
Use markdown formatting. Keep answers focused. Never provide instructions that enable real-world illegal attacks;
explain concepts defensively and ethically.`;

function messageText(message: UIMessage | undefined): string {
  if (!message) return "";
  return message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

async function resolveUserId(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

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

        const userId = (await resolveUserId(request)) ?? GUEST_USER_ID;
        const conversationId = crypto.randomUUID();
        const lastUserText = messageText(
          (messages as UIMessage[]).filter((m) => m.role === "user").at(-1),
        );

        try {
          const gateway = createLovableAiGatewayProvider(key);
          const model = gateway("google/gemini-3-flash-preview");
          const result = streamText({
            model,
            system: SYSTEM_PROMPT,
            messages: await convertToModelMessages(messages as UIMessage[]),
            onFinish: async ({ text }) => {
              try {
                const { supabaseAdmin } = await import(
                  "@/integrations/supabase/client.server"
                );
                await supabaseAdmin.from("ai_chats").insert([
                  {
                    user_id: userId,
                    conversation_id: conversationId,
                    role: "user",
                    content: lastUserText,
                  },
                  {
                    user_id: userId,
                    conversation_id: conversationId,
                    role: "assistant",
                    content: text,
                  },
                ]);
              } catch (e) {
                console.error("Failed to persist chat:", e);
              }
            },
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
