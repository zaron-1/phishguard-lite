import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type {
  AssessmentQuestion,
  LessonContent,
} from "@/lib/academy/generate.server";

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

const ModuleInput = z.object({
  courseSlug: z.string().min(1).max(120),
  moduleIndex: z.number().int().min(0).max(100),
});

const AssessmentSubmitInput = ModuleInput.extend({
  questionIds: z.array(z.string().min(1).max(80)).min(10).max(15),
  answers: z.array(z.string().min(1).max(500)).min(10).max(15),
});

export type AcademyProfile = {
  experienceLevel: string;
  careerInterest: string | null;
  weeklyHours: number;
  learningGoal: string | null;
  recommendedPath: string | null;
  onboarded: boolean;
  activePathSlug: string | null;
  pathCompleted: boolean;
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
  moduleProgress: Array<{
    courseSlug: string;
    moduleIndex: number;
    lessonsCompleted: number;
    lessonCount: number;
    assessmentScore: number | null;
    assessmentPassed: boolean;
  }>;
};

export const getAcademyOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AcademyOverview> => {
    const { supabase, userId } = context;

    const [profileRes, progressRes, bookmarkRes, quizRes, moduleRes] = await Promise.all([
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
      supabase
        .from("academy_module_progress")
        .select("course_slug, module_index, lessons_completed, lesson_count, assessment_score, assessment_passed")
        .eq("user_id", userId)
        .order("course_slug")
        .order("module_index"),
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
      (acc: { s: number; t: number }, q: any) => ({
        s: acc.s + (q.score ?? 0),
        t: acc.t + (q.total ?? 0),
      }),
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
            activePathSlug: p.active_path_slug,
            pathCompleted: p.path_completed,
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
      moduleProgress: (moduleRes.data ?? []).map((row) => ({
        courseSlug: row.course_slug,
        moduleIndex: row.module_index,
        lessonsCompleted: row.lessons_completed,
        lessonCount: row.lesson_count,
        assessmentScore: row.assessment_score,
        assessmentPassed: row.assessment_passed,
      })),
    };
  });

export const saveAcademyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProfileInput.parse(input))
  .handler(async ({ context, data }): Promise<{ recommendedPath: string }> => {
    const { recommendPath } = await import("@/lib/academy/recommend");
    const recommendedPath = recommendPath(data.experienceLevel, data.careerInterest);
    const { data: existing } = await context.supabase
      .from("academy_profiles")
      .select("active_path_slug, path_completed")
      .eq("user_id", context.userId)
      .maybeSingle();

    const { error } = await context.supabase.from("academy_profiles").upsert(
      {
        user_id: context.userId,
        experience_level: data.experienceLevel,
        career_interest: data.careerInterest ?? null,
        weekly_hours: data.weeklyHours,
        learning_goal: data.learningGoal ?? null,
        recommended_path: recommendedPath,
        onboarded_at: new Date().toISOString(),
        ...(existing
          ? {}
          : { active_path_slug: recommendedPath, path_completed: false }),
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
        narrationAudioBase64: cached.narration_audio_base64 ?? undefined,
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
          glossary: lesson.glossary as unknown as any,
          tools: lesson.tools,
          knowledge_check: lesson.knowledgeCheck as unknown as any,
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
      .select("narration, content, narration_audio_base64")
      .eq("lesson_id", ref.id)
      .maybeSingle();

    if (row?.narration_audio_base64) return { audioBase64: row.narration_audio_base64 };

    const script = (row?.narration || row?.content || "").replace(/[#*`>|]/g, " ").trim();
    if (!script) throw new Error("Open the lesson first, then play the narration.");

    const audioBase64 = await synthesizeNarration(script);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("academy_lessons")
      .update({ narration_audio_base64: audioBase64 })
      .eq("lesson_id", ref.id);
    return { audioBase64 };
  });

export const setLessonProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProgressInput.parse(input))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { lessonRefOrThrow } = await import("@/lib/academy/generate.server");
    const ref = lessonRefOrThrow(data.lessonId);

    const { data: profile } = await context.supabase
      .from("academy_profiles")
      .select("active_path_slug")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (profile?.active_path_slug && profile.active_path_slug !== ref.pathSlug) {
      throw new Error("Finish your active learning path before opening another path.");
    }

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

    const { courseLessons, getCourse } = await import("@/lib/academy/catalog");
    const course = getCourse(ref.courseSlug)?.course;
    const moduleLessons = courseLessons(ref.courseSlug).filter(
      (lesson) => lesson.moduleIndex === ref.moduleIndex,
    );
    const { count } = await context.supabase
      .from("academy_progress")
      .select("lesson_id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .eq("course_slug", ref.courseSlug)
      .eq("completed", true)
      .in("lesson_id", moduleLessons.map((lesson) => lesson.id));
    await context.supabase.from("academy_module_progress").upsert(
      {
        user_id: context.userId,
        path_slug: ref.pathSlug,
        course_slug: ref.courseSlug,
        module_index: ref.moduleIndex,
        lessons_completed: count ?? 0,
        lesson_count: moduleLessons.length,
        last_lesson_id: ref.id,
      },
      { onConflict: "user_id,course_slug,module_index" },
    );
    return { ok: true };
  });

export const getModuleAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ModuleInput.parse(input))
  .handler(async ({ context, data }): Promise<{
    courseSlug: string;
    moduleIndex: number;
    moduleTitle: string;
    passPercent: number;
    questions: Array<Pick<AssessmentQuestion, "id" | "scenario" | "question" | "options">>;
  }> => {
    const { getCourse } = await import("@/lib/academy/catalog");
    const entry = getCourse(data.courseSlug);
    const module = entry?.course.modules[data.moduleIndex];
    if (!entry || !module) throw new Error("That module does not exist.");
    const { data: profile } = await context.supabase
      .from("academy_profiles")
      .select("active_path_slug")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (profile?.active_path_slug && profile.active_path_slug !== entry.path.slug) {
      throw new Error("This learning path is locked until your active path is complete.");
    }
    if (data.moduleIndex > 0) {
      const { data: previous } = await context.supabase
        .from("academy_module_progress")
        .select("assessment_passed")
        .eq("user_id", context.userId)
        .eq("course_slug", data.courseSlug)
        .eq("module_index", data.moduleIndex - 1)
        .maybeSingle();
      if (!previous?.assessment_passed) throw new Error("Pass the previous module assessment first.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let { data: bank } = await supabaseAdmin
      .from("academy_module_assessments")
      .select("questions, question_count, pass_percent")
      .eq("course_slug", data.courseSlug)
      .eq("module_index", data.moduleIndex)
      .maybeSingle();
    if (!bank) {
      const { generateModuleAssessment } = await import("@/lib/academy/generate.server");
      const generated = await generateModuleAssessment(data.courseSlug, data.moduleIndex);
      const inserted = await supabaseAdmin
        .from("academy_module_assessments")
        .insert({
          path_slug: entry.path.slug,
          course_slug: data.courseSlug,
          module_index: data.moduleIndex,
          module_title: module.title,
          questions: generated.questions,
          question_count: generated.questionCount,
          pass_percent: generated.passPercent,
        })
        .select("questions, question_count, pass_percent")
        .single();
      if (inserted.error || !inserted.data) throw new Error("The module assessment is unavailable.");
      bank = inserted.data;
    }
    const questions = (bank.questions as unknown as AssessmentQuestion[])
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(15, bank.question_count))
      .map(({ id, scenario, question, options }) => ({
        id,
        scenario,
        question,
        options: [...options].sort(() => Math.random() - 0.5),
      }));
    return {
      courseSlug: data.courseSlug,
      moduleIndex: data.moduleIndex,
      moduleTitle: module.title,
      passPercent: bank.pass_percent,
      questions,
    };
  });

export const submitModuleAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AssessmentSubmitInput.parse(input))
  .handler(async ({ context, data }): Promise<{ score: number; total: number; passed: boolean }> => {
    const { getCourse } = await import("@/lib/academy/catalog");
    const entry = getCourse(data.courseSlug);
    const module = entry?.course.modules[data.moduleIndex];
    if (!entry || !module) throw new Error("That module does not exist.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: bank } = await supabaseAdmin
      .from("academy_module_assessments")
      .select("questions, pass_percent")
      .eq("course_slug", data.courseSlug)
      .eq("module_index", data.moduleIndex)
      .maybeSingle();
    if (!bank) throw new Error("Open the assessment before submitting it.");
    const questions = bank.questions as unknown as AssessmentQuestion[];
    const byId = new Map(questions.map((question) => [question.id, question]));
    const pairs = data.questionIds.map((id, index) => ({ question: byId.get(id), answer: data.answers[index] }));
    if (pairs.some((pair) => !pair.question)) throw new Error("Assessment answers are invalid.");
    const correct = pairs.filter((pair) => pair.question?.correctAnswer === pair.answer).length;
    const total = pairs.length;
    const score = Math.round((correct / total) * 100);
    const passed = score >= bank.pass_percent;
    await supabaseAdmin.from("academy_assessment_attempts").insert({
      user_id: context.userId,
      path_slug: entry.path.slug,
      course_slug: data.courseSlug,
      module_index: data.moduleIndex,
      question_ids: data.questionIds,
      answers: data.answers,
      score,
      total,
      passed,
    });
    const moduleLessons = (await import("@/lib/academy/catalog")).courseLessons(data.courseSlug).filter(
      (lesson) => lesson.moduleIndex === data.moduleIndex,
    );
    const { count } = await context.supabase
      .from("academy_progress")
      .select("lesson_id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .eq("course_slug", data.courseSlug)
      .eq("completed", true)
      .in("lesson_id", moduleLessons.map((lesson) => lesson.id));
    await supabaseAdmin.from("academy_module_progress").upsert(
      {
        user_id: context.userId,
        path_slug: entry.path.slug,
        course_slug: data.courseSlug,
        module_index: data.moduleIndex,
        lessons_completed: count ?? 0,
        lesson_count: moduleLessons.length,
        assessment_score: score,
        assessment_passed: passed,
      },
      { onConflict: "user_id,course_slug,module_index" },
    );
    return { score, total, passed };
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
