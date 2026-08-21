import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { LessonContent } from "@/lib/academy/generate.server";

const LessonInput = z.object({ lessonId: z.string().min(1).max(120) });

const ProfileInput = z.object({
  experienceLevel: z.enum(["beginner", "some-it", "switching", "professional"]),
  careerInterest: z.string().max(120).optional(),
  weeklyHours: z.number().int().min(1).max(40),
  learningGoal: z.string().max(400).optional(),
});

const ProgressInput = z.object({
  lessonId: z.string().min(1).max(120),
  completed: z.boolean().optional(),
  listenedSeconds: z.number().int().min(0).max(100000).optional(),
});

const BookmarkInput = z.object({
  lessonId: z.string().min(1).max(120),
  note: z.string().max(500).optional(),
});

const QuizResultInput = z.object({
  lessonId: z.string().min(1).max(120),
  score: z.number().int().min(0).max(100),
  total: z.number().int().min(1).max(100),
  weakTopics: z.array(z.string().max(120)).max(10).optional(),
});

export type AcademyProfile = {
  experienceLevel: string;
  careerInterest: string | null;
  weeklyHours: number;
  learningGoal: string | null;
  recommendedPath: string | null;
  onboarded: boolean;
};

export type ProgressRow = {
  lessonId: string;
  courseSlug: string;
  pathSlug: string;
  lessonTitle: string;
  completed: boolean;
  updatedAt: string;
};

export type BookmarkRow = {
  lessonId: string;
  courseSlug: string;
  lessonTitle: string;
  note: string | null;
  createdAt: string;
};

export type AcademyOverview = {
  profile: AcademyProfile | null;
  progress: ProgressRow[];
  bookmarks: BookmarkRow[];
  completedCount: number;
  quizAverage: number | null;
  lastLessonId: string | null;
};

export const getAcademyOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AcademyOverview> => {
    const { supabase, userId } = context;

    const [profileRes, progressRes, bookmarkRes, quizRes] = await Promise.all([
      supabase.from("academy_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("academy_progress")
        .select("lesson_id, course_slug, path_slug, lesson_title, completed, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(500),
      supabase
        .from("academy_bookmarks")
        .select("lesson_id, course_slug, lesson_title, note, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("academy_quiz_results").select("score, total").eq("user_id", userId).limit(500),
    ]);

    const p = profileRes.data;
    const progress: ProgressRow[] = (progressRes.data ?? []).map((r: any) => ({
      lessonId: r.lesson_id,
      courseSlug: r.course_slug,
      pathSlug: r.path_slug,
      lessonTitle: r.lesson_title,
      completed: r.completed,
      updatedAt: r.updated_at,
    }));

    const quizzes = quizRes.data ?? [];
    const totals = quizzes.reduce(
      (acc: { s: number; t: number }, q: any) => ({ s: acc.s + (q.score ?? 0), t: acc.t + (q.total ?? 0) }),
      { s: 0, t: 0 },
    );

    return {
      profile: p
        ? {
            experienceLevel: p.experience_level,
            careerInterest: p.career_interest,
            weeklyHours: p.weekly_hours,
            learningGoal: p.learning_goal,
            recommendedPath: p.recommended_path,
            onboarded: !!p.onboarded_at,
          }
        : null,
      progress,
      bookmarks: (bookmarkRes.data ?? []).map((r: any) => ({
        lessonId: r.lesson_id,
        courseSlug: r.course_slug,
        lessonTitle: r.lesson_title,
        note: r.note,
        createdAt: r.created_at,
      })),
      completedCount: progress.filter((r) => r.completed).length,
      quizAverage: totals.t > 0 ? Math.round((totals.s / totals.t) * 100) : null,
      lastLessonId: progress[0]?.lessonId ?? null,
    };
  });

export const saveAcademyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProfileInput.parse(input))
  .handler(async ({ context, data }): Promise<{ recommendedPath: string }> => {
    const { recommendPath } = await import("@/lib/academy/recommend");
    const recommendedPath = recommendPath(data.experienceLevel, data.careerInterest);

    const { error } = await context.supabase.from("academy_profiles").upsert(
      {
        user_id: context.userId,
        experience_level: data.experienceLevel,
        career_interest: data.careerInterest ?? null,
        weekly_hours: data.weeklyHours,
        learning_goal: data.learningGoal ?? null,
        recommended_path: recommendedPath,
        onboarded_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error("Could not save your learning profile.");
    return { recommendedPath };
  });

export const getAcademyLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => LessonInput.parse(input))
  .handler(async ({ context, data }): Promise<LessonContent> => {
    const { lessonRefOrThrow, writeLesson } = await import("@/lib/academy/generate.server");
    const ref = lessonRefOrThrow(data.lessonId);

    const { data: cached } = await context.supabase
      .from("academy_lessons")
      .select("*")
      .eq("lesson_id", ref.id)
      .maybeSingle();

    if (cached) {
      return {
        lessonId: cached.lesson_id,
        title: cached.title,
        courseSlug: cached.course_slug,
        pathSlug: cached.path_slug,
        content: cached.content,
        objectives: (cached.objectives as any) ?? [],
        keyTakeaways: (cached.key_takeaways as any) ?? [],
        glossary: (cached.glossary as any) ?? [],
        tools: (cached.tools as any) ?? [],
        knowledgeCheck: (cached.knowledge_check as any) ?? [],
        narration: cached.narration ?? "",
      };
    }

    const lesson = await writeLesson(ref);

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("academy_lessons").upsert(
        {
          lesson_id: lesson.lessonId,
          course_slug: lesson.courseSlug,
          path_slug: lesson.pathSlug,
          title: lesson.title,
          content: lesson.content,
          objectives: lesson.objectives,
          key_takeaways: lesson.keyTakeaways,
          glossary: lesson.glossary,
          tools: lesson.tools,
          knowledge_check: lesson.knowledgeCheck,
          narration: lesson.narration,
        },
        { onConflict: "lesson_id" },
      );
    } catch (e) {
      console.error("[academy] failed to cache lesson", e);
    }

    return lesson;
  });

export const narrateLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => LessonInput.parse(input))
  .handler(async ({ context, data }): Promise<{ audioBase64: string }> => {
    const { lessonRefOrThrow, synthesizeNarration } = await import("@/lib/academy/generate.server");
    const ref = lessonRefOrThrow(data.lessonId);

    const { data: row } = await context.supabase
      .from("academy_lessons")
      .select("narration, content")
      .eq("lesson_id", ref.id)
      .maybeSingle();

    const script = (row?.narration || row?.content || "").replace(/[#*`>|]/g, " ").trim();
    if (!script) throw new Error("Open the lesson first, then play the narration.");

    return { audioBase64: await synthesizeNarration(script) };
  });

export const setLessonProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProgressInput.parse(input))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { lessonRefOrThrow } = await import("@/lib/academy/generate.server");
    const ref = lessonRefOrThrow(data.lessonId);

    const patch: Record<string, unknown> = {
      user_id: context.userId,
      lesson_id: ref.id,
      course_slug: ref.courseSlug,
      path_slug: ref.pathSlug,
      lesson_title: ref.title,
    };
    if (data.completed !== undefined) {
      patch.completed = data.completed;
      patch.completed_at = data.completed ? new Date().toISOString() : null;
    }
    if (data.listenedSeconds !== undefined) patch.listened_seconds = data.listenedSeconds;

    const { error } = await context.supabase
      .from("academy_progress")
      .upsert(patch as any, { onConflict: "user_id,lesson_id" });
    if (error) throw new Error("Could not save your progress.");
    return { ok: true };
  });

export const toggleLessonBookmark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BookmarkInput.parse(input))
  .handler(async ({ context, data }): Promise<{ bookmarked: boolean }> => {
    const { lessonRefOrThrow } = await import("@/lib/academy/generate.server");
    const ref = lessonRefOrThrow(data.lessonId);
    const { supabase, userId } = context;

    const { data: existing } = await supabase
      .from("academy_bookmarks")
      .select("id")
      .eq("user_id", userId)
      .eq("lesson_id", ref.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("academy_bookmarks").delete().eq("id", existing.id);
      return { bookmarked: false };
    }

    const { error } = await supabase.from("academy_bookmarks").insert({
      user_id: userId,
      lesson_id: ref.id,
      course_slug: ref.courseSlug,
      lesson_title: ref.title,
      note: data.note ?? null,
    });
    if (error) throw new Error("Could not bookmark this lesson.");
    return { bookmarked: true };
  });

export const saveLessonQuizResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => QuizResultInput.parse(input))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { lessonRefOrThrow } = await import("@/lib/academy/generate.server");
    const ref = lessonRefOrThrow(data.lessonId);

    const { error } = await context.supabase.from("academy_quiz_results").insert({
      user_id: context.userId,
      lesson_id: ref.id,
      course_slug: ref.courseSlug,
      kind: "lesson",
      score: data.score,
      total: data.total,
      weak_topics: data.weakTopics ?? [],
    });
    if (error) throw new Error("Could not save your quiz score.");
    return { ok: true };
  });
