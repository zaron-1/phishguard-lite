import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getLessonRef, getCourse, neighbours } from "@/lib/academy/catalog";
import {
  getAcademyLesson,
  getAcademyOverview,
  narrateLesson,
  saveLessonQuizResult,
  setLessonProgress,
  toggleLessonBookmark,
} from "@/lib/academy.functions";

export const Route = createFileRoute("/_authenticated/academy/lesson/$lessonId")({
  head: ({ params }) => {
    const lesson = getLessonRef(params.lessonId);
    const title = lesson ? `${lesson.title} — Cyber Academy` : "Lesson — Cyber Academy";
    const description = lesson
      ? `Learn ${lesson.title} in ${lesson.courseTitle}, a structured cybersecurity course inside PhishGuard.`
      : "AI-written cybersecurity lesson inside the PhishGuard Cyber Academy.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: LessonPage,
  notFoundComponent: () => <p className="text-sm text-muted-foreground">Lesson not found.</p>,
  errorComponent: () => (
    <p className="text-sm text-muted-foreground">
      This lesson could not be loaded. Please try again.
    </p>
  ),
});

function LessonPage() {
  const { lessonId } = Route.useParams();
  const ref = getLessonRef(lessonId);
  if (!ref) throw notFound();

  const qc = useQueryClient();
  const loadLesson = useServerFn(getAcademyLesson);
  const loadOverview = useServerFn(getAcademyOverview);
  const saveProgress = useServerFn(setLessonProgress);
  const bookmarkLesson = useServerFn(toggleLessonBookmark);
  const narrate = useServerFn(narrateLesson);
  const saveQuiz = useServerFn(saveLessonQuizResult);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["academy", "lesson", lessonId],
    queryFn: () => loadLesson({ data: { lessonId } }),
  });
  const { data: overview } = useQuery({
    queryKey: ["academy", "overview"],
    queryFn: () => loadOverview(),
  });

  const [selected, setSelected] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { prev, next } = neighbours(lessonId);
  const course = getCourse(ref.courseSlug)?.course;
  const lessonProgress = overview?.progress.find((p) => p.lessonId === lessonId);
  const completed = lessonProgress?.completed ?? false;
  const bookmarkExists = overview?.bookmarks.some((b) => b.lessonId === lessonId) ?? false;

  useEffect(() => {
    setBookmarked(bookmarkExists);
  }, [bookmarkExists]);

  useEffect(() => {
    setSelected({});
    setSubmitted(false);
    audioRef.current?.pause();
    setAudioUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
  }, [lessonId]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const narrationMutation = useMutation({
    mutationFn: () => narrate({ data: { lessonId } }),
    onSuccess: ({ audioBase64 }) => {
      window.localStorage.setItem(`phishguard:academy:narration:${lessonId}`, audioBase64);
      const bytes = Uint8Array.from(atob(audioBase64), (char) => char.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
      setAudioUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return url;
      });
      window.setTimeout(() => void audioRef.current?.play(), 0);
    },
    onError: (error: Error) => toast.error(error.message || "Narration is unavailable right now."),
  });

  useEffect(() => {
    if (!lesson) return;
    const cacheKey = `phishguard:academy:narration:${lessonId}`;
    const cachedAudio = lesson.narrationAudioBase64 || window.localStorage.getItem(cacheKey);
    if (cachedAudio) {
      if (!lesson.narrationAudioBase64) window.localStorage.setItem(cacheKey, cachedAudio);
      const bytes = Uint8Array.from(atob(cachedAudio), (char) => char.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
      setAudioUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return url;
      });
      window.setTimeout(() => void audioRef.current?.play().catch(() => undefined), 0);
      return;
    }
    narrationMutation.mutate();
  }, [lesson, lessonId]);

  const progressMutation = useMutation({
    mutationFn: (completedValue: boolean) =>
      saveProgress({ data: { lessonId, completed: completedValue } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["academy"] }),
    onError: () => toast.error("Your progress could not be saved."),
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => bookmarkLesson({ data: { lessonId } }),
    onSuccess: ({ bookmarked: nextValue }) => {
      setBookmarked(nextValue);
      qc.invalidateQueries({ queryKey: ["academy"] });
      toast.success(nextValue ? "Lesson saved for later." : "Lesson removed from saved lessons.");
    },
    onError: () => toast.error("This lesson could not be saved."),
  });

  const quizResult = useMemo(() => {
    if (!lesson?.knowledgeCheck.length) return { score: 0, total: 0 };
    const score = lesson.knowledgeCheck.reduce(
      (total, question, index) => total + (selected[index] === question.correctIndex ? 1 : 0),
      0,
    );
    return { score, total: lesson.knowledgeCheck.length };
  }, [lesson, selected]);

  const submitQuiz = async () => {
    if (!lesson || Object.keys(selected).length < lesson.knowledgeCheck.length) {
      toast.error("Answer every question before checking your knowledge.");
      return;
    }
    setSubmitted(true);
    try {
      await saveQuiz({
        data: {
          lessonId,
          score: quizResult.score,
          total: quizResult.total,
          weakTopics: quizResult.score < quizResult.total ? [ref.title] : [],
        },
      });
      qc.invalidateQueries({ queryKey: ["academy"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Quiz score could not be saved.");
    }
  };

  if (isLoading || !lesson) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-4xl items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Writing your lesson…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/academy/course/$courseSlug" params={{ courseSlug: ref.courseSlug }}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> {course?.title ?? "Course"}
          </Link>
        </Button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={bookmarked ? "Remove bookmark" : "Save lesson"}
            title={bookmarked ? "Remove bookmark" : "Save lesson"}
            onClick={() => bookmarkMutation.mutate()}
            disabled={bookmarkMutation.isPending}
          >
            {bookmarked ? (
              <BookmarkCheck className="h-5 w-5 text-primary" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => narrationMutation.mutate()}
            disabled={narrationMutation.isPending}
          >
            {narrationMutation.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Headphones className="mr-1.5 h-4 w-4" />
            )}
            Listen
          </Button>
        </div>
      </div>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">Module {ref.moduleIndex + 1}</Badge>
          <span>{ref.moduleTitle}</span>
          <span>·</span>
          <span>Lesson {ref.index + 1}</span>
        </div>
        <h1 className="text-3xl font-bold leading-tight md:text-4xl">{lesson.title}</h1>
        <p className="text-sm text-muted-foreground">
          {ref.courseTitle} · {ref.pathTitle}
        </p>
        {audioUrl && (
          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <Volume2 className="h-4 w-4 shrink-0 text-primary" />
            <audio ref={audioRef} src={audioUrl} controls className="h-9 w-full" />
          </div>
        )}
      </header>

      {lesson.objectives.length > 0 && (
        <Card className="border-primary/25 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" /> By the end of this lesson
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 text-sm sm:grid-cols-2">
              {lesson.objectives.map((objective) => (
                <li key={objective} className="flex gap-2 text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {objective}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <article className="prose prose-sm max-w-none dark:prose-invert md:prose-base">
        <ReactMarkdown>{lesson.content}</ReactMarkdown>
      </article>

      {lesson.keyTakeaways.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key takeaways</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {lesson.keyTakeaways.map((takeaway) => (
                <li key={takeaway} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {takeaway}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {lesson.glossary.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Glossary</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            {lesson.glossary.map((entry) => (
              <div key={entry.term} className="rounded-lg border p-3">
                <dt className="text-sm font-semibold">{entry.term}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{entry.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {lesson.knowledgeCheck.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Knowledge check</h2>
          </div>
          {lesson.knowledgeCheck.map((question, index) => {
            const answer = selected[index];
            const correct = answer === question.correctIndex;
            return (
              <Card key={`${question.question}-${index}`}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {index + 1}. {question.question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {question.options.map((option, optionIndex) => {
                    const isAnswer = answer === optionIndex;
                    const isCorrect = submitted && optionIndex === question.correctIndex;
                    const isWrong = submitted && isAnswer && !correct;
                    return (
                      <Button
                        key={option}
                        type="button"
                        variant={
                          isCorrect
                            ? "default"
                            : isWrong
                              ? "destructive"
                              : isAnswer
                                ? "secondary"
                                : "outline"
                        }
                        className="h-auto min-h-10 w-full justify-start whitespace-normal py-2 text-left"
                        onClick={() =>
                          !submitted &&
                          setSelected((previous) => ({ ...previous, [index]: optionIndex }))
                        }
                        disabled={submitted}
                      >
                        <span className="mr-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs">
                          {String.fromCharCode(65 + optionIndex)}
                        </span>
                        {option}
                      </Button>
                    );
                  })}
                  {submitted && (
                    <p
                      className={`pt-2 text-sm ${correct ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
                    >
                      {correct ? "Correct. " : "Not quite. "}
                      {question.explanation}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {!submitted ? (
            <Button onClick={submitQuiz}>
              <Check className="mr-2 h-4 w-4" /> Check my answers
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-lg border bg-card px-4 py-2 text-sm">
                Score:{" "}
                <strong>
                  {quizResult.score}/{quizResult.total}
                </strong>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSelected({});
                  setSubmitted(false);
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Try again
              </Button>
            </div>
          )}
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-y py-5">
        <Button variant="outline" disabled={!prev} asChild={!!prev}>
          {prev ? (
            <Link to="/academy/lesson/$lessonId" params={{ lessonId: prev.id }}>
              <ChevronLeft className="mr-1.5 h-4 w-4" /> Previous
            </Link>
          ) : (
            <span>
              <ChevronLeft className="mr-1.5 h-4 w-4" /> Previous
            </span>
          )}
        </Button>
        <Button
          variant={completed ? "secondary" : "default"}
          onClick={() => progressMutation.mutate(!completed)}
          disabled={progressMutation.isPending}
        >
          {progressMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          )}
          {completed ? "Completed" : "Mark complete"}
        </Button>
        <Button variant="outline" disabled={!next} asChild={!!next}>
          {next ? (
            <Link to="/academy/lesson/$lessonId" params={{ lessonId: next.id }}>
              Next <ChevronRight className="ml-1.5 h-4 w-4" />
            </Link>
          ) : (
            <span>
              Next <ChevronRight className="ml-1.5 h-4 w-4" />
            </span>
          )}
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        AI-generated learning content is educational. Practise only in systems you own or are
        authorised to test.
      </p>
    </div>
  );
}
