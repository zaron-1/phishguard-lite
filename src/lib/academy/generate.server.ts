import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { getLessonRef, getCourse, type LessonRef } from "./catalog";

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface CheckQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonContent {
  lessonId: string;
  title: string;
  courseSlug: string;
  pathSlug: string;
  content: string;
  objectives: string[];
  keyTakeaways: string[];
  glossary: GlossaryTerm[];
  tools: string[];
  knowledgeCheck: CheckQuestion[];
  narration: string;
}

function extractJson(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in model response");
  return JSON.parse(raw.slice(start, end + 1));
}

function asStringArray(v: unknown, max = 12): string[] {
  return Array.isArray(v)
    ? v
        .map((x) => String(x))
        .filter(Boolean)
        .slice(0, max)
    : [];
}

export function requireApiKey() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("The Academy AI service is not configured.");
  return key;
}

/** Ask the model to write a full, teaching-quality lesson. */
export async function writeLesson(ref: LessonRef): Promise<LessonContent> {
  const key = requireApiKey();
  const entry = getCourse(ref.courseSlug);
  const course = entry?.course;

  const gateway = createLovableAiGatewayProvider(key);
  const model = gateway("google/gemini-3-flash-preview");

  const system = `You are the lead curriculum author for the PhishGuard Cyber Academy, an online cybersecurity school.
You write long-form, self-contained lessons that teach a topic from zero to confident understanding.

Rules:
- Teach, do not summarise. Assume the learner has only the prerequisites of this course.
- Use plain English first, then the correct industry terminology.
- Include concrete real-world examples, analogies, and at least one short worked scenario.
- Where a command line or configuration snippet genuinely helps, include it in a fenced code block.
- Never give operational instructions that enable attacking systems the learner does not own. Frame offensive topics as authorised testing and defence.
- Markdown only inside "content": use ## headings, short paragraphs, bullet lists and tables where useful. Aim for 900-1400 words.
- "narration" is a spoken-word script of the same lesson: no markdown, no code, no bullet characters, 250-400 words, warm and instructional, as if a teacher were reading it aloud.

Respond ONLY with a JSON object of exactly this shape:
{
  "content": "<markdown lesson body>",
  "objectives": ["<3-5 learning objectives>"],
  "keyTakeaways": ["<4-6 takeaways>"],
  "glossary": [{"term": "<term>", "definition": "<one sentence>"}],
  "tools": ["<tools or commands mentioned, may be empty>"],
  "knowledgeCheck": [
    {"question": "<question>", "options": ["<a>","<b>","<c>","<d>"], "correctIndex": 0, "explanation": "<why>"}
  ],
  "narration": "<spoken script>"
}
Provide exactly 3 knowledgeCheck questions, each with exactly 4 options.`;

  const prompt = `Learning path: ${ref.pathTitle}
Course: ${ref.courseTitle} (${course?.level ?? "Beginner"} level)
Course description: ${course?.description ?? ""}
Module: ${ref.moduleTitle}
Lesson title: ${ref.title}
Lesson position: ${ref.index + 1} of the course.
Tools commonly used in this course: ${(course?.tools ?? []).join(", ") || "none"}

Write this lesson now.`;

  const { text } = await generateText({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
  });

  const parsed = extractJson(text);

  const knowledgeCheck: CheckQuestion[] = Array.isArray(parsed.knowledgeCheck)
    ? parsed.knowledgeCheck
        .map((q: any) => {
          const options = asStringArray(q?.options, 4);
          if (options.length !== 4) return null;
          let correctIndex = Math.round(Number(q?.correctIndex));
          if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3)
            correctIndex = 0;
          return {
            question: String(q?.question ?? ""),
            options,
            correctIndex,
            explanation: String(q?.explanation ?? ""),
          };
        })
        .filter(Boolean)
        .slice(0, 5)
    : [];

  const glossary: GlossaryTerm[] = Array.isArray(parsed.glossary)
    ? parsed.glossary
        .map((g: any) => ({
          term: String(g?.term ?? "").trim(),
          definition: String(g?.definition ?? "").trim(),
        }))
        .filter((g: GlossaryTerm) => g.term && g.definition)
        .slice(0, 12)
    : [];

  const content = String(parsed.content ?? "").trim();
  if (!content) throw new Error("The lesson could not be generated. Please try again.");

  return {
    lessonId: ref.id,
    title: ref.title,
    courseSlug: ref.courseSlug,
    pathSlug: ref.pathSlug,
    content,
    objectives: asStringArray(parsed.objectives, 6),
    keyTakeaways: asStringArray(parsed.keyTakeaways, 8),
    glossary,
    tools: asStringArray(parsed.tools, 10),
    knowledgeCheck,
    narration: String(parsed.narration ?? "").trim(),
  };
}

/** Narrate a script with the Lovable AI text-to-speech model. Returns base64 mp3. */
export async function synthesizeNarration(script: string): Promise<string> {
  const key = requireApiKey();
  const input = script.slice(0, 4000);

  const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini-tts",
      voice: "alloy",
      input,
      response_format: "mp3",
      instructions:
        "Speak like a warm, clear cybersecurity instructor. Steady pace, friendly tone.",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[academy] TTS failed", res.status, body.slice(0, 300));
    if (res.status === 429) throw new Error("Narration is busy right now. Try again in a moment.");
    if (res.status === 402)
      throw new Error("AI credits are exhausted. Add credits to keep narrating lessons.");
    throw new Error("Narration is unavailable right now.");
  }

  const buffer = new Uint8Array(await res.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < buffer.length; i += chunk) {
    binary += String.fromCharCode(...buffer.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function lessonRefOrThrow(lessonId: string): LessonRef {
  const ref = getLessonRef(lessonId);
  if (!ref) throw new Error("That lesson does not exist.");
  return ref;
}
