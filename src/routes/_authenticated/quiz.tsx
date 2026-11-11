import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Brain, Loader2, CheckCircle2, XCircle, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { generateQuizQuestion, type QuizQuestion } from "@/lib/quiz.functions";

export const Route = createFileRoute("/_authenticated/quiz")({
  head: () => ({
    meta: [
      { title: "Cybersecurity Quiz — PhishGuard Lite" },
      {
        name: "description",
        content:
          "Test your cybersecurity knowledge with PhishGuard quizzes at your chosen difficulty.",
      },
      { property: "og:title", content: "Cybersecurity Quiz — PhishGuard Lite" },
      {
        property: "og:description",
        content:
          "Test your cybersecurity knowledge with PhishGuard quizzes at your chosen difficulty.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Quiz,
});

type Difficulty = "Beginner" | "Intermediate" | "Advanced";

const DIFFICULTIES: { level: Difficulty; description: string }[] = [
  { level: "Beginner", description: "Core concepts and everyday safety basics." },
  { level: "Intermediate", description: "Practical defenses and common attack patterns." },
  { level: "Advanced", description: "Deep technical and expert-level scenarios." },
];

function Quiz() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const generate = useServerFn(generateQuizQuestion);

  const mutation = useMutation<QuizQuestion, Error, Difficulty>({
    mutationFn: (level) => generate({ data: { difficulty: level } }),
    onError: (err) => toast.error(err.message || "Could not load question."),
  });

  const question = mutation.data;
  const answered = selected !== null;

  const start = (level: Difficulty) => {
    setDifficulty(level);
    setScore({ correct: 0, total: 0 });
    setSelected(null);
    mutation.mutate(level);
  };

  const choose = (index: number) => {
    if (answered || !question) return;
    setSelected(index);
    setScore((s) => ({
      correct: s.correct + (index === question.correctIndex ? 1 : 0),
      total: s.total + 1,
    }));
  };

  const next = () => {
    if (!difficulty) return;
    setSelected(null);
    mutation.mutate(difficulty);
  };

  const reset = () => {
    setDifficulty(null);
    setSelected(null);
    mutation.reset();
    setScore({ correct: 0, total: 0 });
  };

  if (!difficulty) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Cybersecurity Quiz</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Choose a difficulty to start an endless stream of AI-generated questions.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {DIFFICULTIES.map(({ level, description }) => (
            <Card
              key={level}
              className="cursor-pointer transition-colors hover:border-primary"
              onClick={() => start(level)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{level}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{description}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Cybersecurity Quiz</h1>
          <Badge variant="secondary">{difficulty}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Score: {score.correct}/{score.total}
          </span>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4" /> Change
          </Button>
        </div>
      </div>

      {mutation.isPending && !question && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Generating question…
        </div>
      )}

      {question && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg leading-snug">{question.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {question.options.map((option, i) => {
                const isCorrect = i === question.correctIndex;
                const isPicked = i === selected;
                let cls = "border-input hover:bg-accent";
                if (answered) {
                  if (isCorrect) cls = "border-green-500 bg-green-500/10";
                  else if (isPicked) cls = "border-destructive bg-destructive/10";
                  else cls = "border-input opacity-70";
                }
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={answered}
                    onClick={() => choose(i)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg border px-4 py-3 text-left text-sm transition-colors disabled:cursor-default ${cls}`}
                  >
                    <span>{option}</span>
                    {answered && isCorrect && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    )}
                    {answered && isPicked && !isCorrect && (
                      <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                    )}
                  </button>
                );
              })}
            </div>

            {answered && (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                  <span className="font-medium">
                    {selected === question.correctIndex ? "Correct! " : "Not quite. "}
                  </span>
                  {question.explanation}
                </div>
                <Button onClick={next} disabled={mutation.isPending} className="w-full sm:w-auto">
                  {mutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Next Question
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
