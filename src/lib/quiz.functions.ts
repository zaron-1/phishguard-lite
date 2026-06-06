import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

const QuizInput = z.object({
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
});

export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
};

function extractJson(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in model response");
  return JSON.parse(raw.slice(start, end + 1));
}

const TOPICS = [
  "phishing & social engineering",
  "malware & ransomware",
  "network security & firewalls",
  "cryptography & encryption",
  "authentication & passwords",
  "cloud security",
  "web application security",
  "incident response",
  "security frameworks & compliance",
  "mobile & IoT security",
];

export const generateQuizQuestion = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => QuizInput.parse(input))
  .handler(async ({ data }): Promise<QuizQuestion> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-3-flash-preview");

    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    const nonce = Math.random().toString(36).slice(2, 10);

    const system = `You are a cybersecurity quiz generator. Create ONE unique multiple-choice question.
Difficulty: ${data.difficulty}.
Topic focus: ${topic}.
The question must be original and not generic. Provide exactly 4 plausible answer options with only one correct.
Respond ONLY with a JSON object of this exact shape (no prose):
{
  "question": "<the question text>",
  "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
  "correctIndex": <integer 0-3>,
  "explanation": "<2-4 sentence explanation of why the correct answer is right>"
}`;

    let parsed: any;
    try {
      const { text } = await generateText({
        model,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `Generate a fresh ${data.difficulty} cybersecurity question. Uniqueness token: ${nonce}.`,
          },
        ],
      });
      parsed = extractJson(text);
    } catch (err) {
      console.error("Quiz generation failed:", err);
      throw new Error("Quiz service is currently unavailable. Please try again.");
    }

    const options = Array.isArray(parsed.options)
      ? parsed.options.map((o: unknown) => String(o)).slice(0, 4)
      : [];
    if (options.length !== 4) throw new Error("Invalid question generated. Please try again.");

    let correctIndex = Math.round(Number(parsed.correctIndex));
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) correctIndex = 0;

    return {
      question: String(parsed.question ?? ""),
      options,
      correctIndex,
      explanation: String(parsed.explanation ?? ""),
      difficulty: data.difficulty,
    };
  });
