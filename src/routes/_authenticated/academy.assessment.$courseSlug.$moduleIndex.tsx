import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, CheckCircle2, ClipboardCheck, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCourse } from "@/lib/academy/catalog";
import { getModuleAssessment, submitModuleAssessment } from "@/lib/academy.functions";

export const Route = createFileRoute("/_authenticated/academy/assessment/$courseSlug/$moduleIndex")(
  {
    head: ({ params }) => {
      const course = getCourse(params.courseSlug)?.course;
      return {
        meta: [
          { title: `${course?.title ?? "Module"} Assessment — Cyber Academy` },
          {
            name: "description",
            content: "Complete a secure module assessment in the PhishGuard Cyber Academy.",
          },
          {
            property: "og:title",
            content: `${course?.title ?? "Module"} Assessment — Cyber Academy`,
          },
          {
            property: "og:description",
            content: "Demonstrate your defensive cybersecurity knowledge.",
          },
          { property: "og:type", content: "article" },
          { name: "twitter:card", content: "summary" },
        ],
      };
    },
    component: AssessmentPage,
    notFoundComponent: () => <p className="text-sm text-muted-foreground">Assessment not found.</p>,
  },
);

function AssessmentPage() {
  const { courseSlug, moduleIndex: moduleIndexParam } = Route.useParams();
  const moduleIndex = Number(moduleIndexParam);
  const entry = getCourse(courseSlug);
  if (!entry || !Number.isInteger(moduleIndex) || !entry.course.modules[moduleIndex])
    throw notFound();

  const loadAssessment = useServerFn(getModuleAssessment);
  const submitAssessment = useServerFn(submitModuleAssessment);
  const { data, isLoading, error } = useQuery({
    queryKey: ["academy", "assessment", courseSlug, moduleIndex],
    queryFn: () => loadAssessment({ data: { courseSlug, moduleIndex } }),
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean } | null>(
    null,
  );

  useEffect(() => {
    setAnswers({});
    setResult(null);
  }, [courseSlug, moduleIndex]);

  const submit = useMutation({
    mutationFn: () => {
      if (!data) throw new Error("Assessment is still loading.");
      return submitAssessment({
        data: {
          courseSlug,
          moduleIndex,
          questionIds: data.questions.map((question) => question.id),
          answers: data.questions.map((question) => answers[question.id] ?? ""),
        },
      });
    },
    onSuccess: (nextResult) => setResult(nextResult),
    onError: (submitError: Error) => toast.error(submitError.message),
  });

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const isComplete = !!data && answeredCount === data.questions.length;

  return (
    <div
      className="mx-auto w-full max-w-4xl select-none space-y-6"
      onContextMenu={(event) => event.preventDefault()}
      onCopy={(event) => event.preventDefault()}
      onCut={(event) => event.preventDefault()}
    >
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/academy/course/$courseSlug" params={{ courseSlug }}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> {entry.course.title}
        </Link>
      </Button>
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <ClipboardCheck className="h-5 w-5" />
          <span className="text-sm font-medium">Module {moduleIndex + 1}</span>
        </div>
        <h1 className="text-2xl font-bold md:text-3xl">
          {data?.moduleTitle ?? entry.course.modules[moduleIndex].title}
        </h1>
        <p className="text-sm text-muted-foreground">
          Answer every scenario. You need {data?.passPercent ?? 80}% to unlock the next module. You
          can retake it.
        </p>
      </header>

      {isLoading && (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Preparing your assessment…
        </div>
      )}
      {error && (
        <Card>
          <CardContent className="p-5 text-sm text-destructive">
            {(error as Error).message}
          </CardContent>
        </Card>
      )}
      {data && !result && (
        <div className="space-y-4">
          {data.questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">
                    {index + 1}. {question.question}
                  </CardTitle>
                  <Badge variant="outline">Scenario</Badge>
                </div>
                {question.scenario && (
                  <p className="text-sm text-muted-foreground">{question.scenario}</p>
                )}
              </CardHeader>
              <CardContent className="grid gap-2">
                {question.options.map((option) => {
                  const selected = answers[question.id] === option;
                  return (
                    <Button
                      key={option}
                      type="button"
                      variant={selected ? "secondary" : "outline"}
                      className="h-auto min-h-10 justify-start whitespace-normal py-2 text-left"
                      onClick={() =>
                        setAnswers((previous) => ({ ...previous, [question.id]: option }))
                      }
                    >
                      <span className="mr-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs">
                        {option.slice(0, 1).toUpperCase()}
                      </span>
                      {option}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          ))}
          <Button onClick={() => submit.mutate()} disabled={!isComplete || submit.isPending}>
            {submit.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Submit assessment ({answeredCount}/{data.questions.length})
          </Button>
        </div>
      )}
      {result && (
        <Card className={result.passed ? "border-emerald-500/40" : "border-amber-500/40"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.passed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <RotateCcw className="h-5 w-5 text-amber-500" />
              )}{" "}
              {result.passed ? "Module unlocked" : "Keep practising"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You scored {result.score}% ({result.total} questions).{" "}
              {result.passed
                ? "You can continue to the next module."
                : "Review the lessons and retake the assessment when ready."}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setAnswers({});
                setResult(null);
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Retake assessment
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
