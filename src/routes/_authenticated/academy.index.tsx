import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  BookOpen,
  Compass,
  GraduationCap,
  Loader2,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  PATHS,
  TOTAL_COURSES,
  TOTAL_LESSONS,
  courseLessonCount,
  getPath,
  pathLessons,
} from "@/lib/academy/catalog";
import { getAcademyOverview, saveAcademyProfile } from "@/lib/academy.functions";

export const Route = createFileRoute("/_authenticated/academy")({
  head: () => ({
    meta: [
      { title: "Cyber Academy — Learn Cybersecurity from Zero | PhishGuard" },
      {
        name: "description",
        content:
          "A guided cybersecurity school inside PhishGuard: structured paths, AI-written lessons, audio narration, knowledge checks and progress tracking.",
      },
      { property: "og:title", content: "PhishGuard Cyber Academy" },
      {
        property: "og:description",
        content: "Structured cybersecurity learning paths with AI lessons, narration and quizzes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AcademyHome,
});

const LEVELS = [
  { value: "beginner", label: "Complete beginner", hint: "New to computers and security" },
  { value: "some-it", label: "Some IT background", hint: "I use tech daily, new to security" },
  { value: "switching", label: "Career switcher", hint: "Moving into cybersecurity" },
  { value: "professional", label: "Working in tech/security", hint: "Levelling up specific skills" },
] as const;

function AcademyHome() {
  const qc = useQueryClient();
  const fetchOverview = useServerFn(getAcademyOverview);
  const saveProfile = useServerFn(saveAcademyProfile);

  const { data, isLoading } = useQuery({
    queryKey: ["academy", "overview"],
    queryFn: () => fetchOverview(),
  });

  const [level, setLevel] = useState<string>("beginner");
  const [interest, setInterest] = useState("");
  const [hours, setHours] = useState(5);
  const [goal, setGoal] = useState("");
  const [editing, setEditing] = useState(false);

  const mutation = useMutation({
    mutationFn: (input: {
      experienceLevel: any;
      careerInterest?: string;
      weeklyHours: number;
      learningGoal?: string;
    }) => saveProfile({ data: input }),
    onSuccess: (res) => {
      toast.success(`Your path is set: ${getPath(res.recommendedPath)?.title ?? "Foundations"}`);
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["academy"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save your profile."),
  });

  const profile = data?.profile ?? null;
  const completed = new Set((data?.progress ?? []).filter((p) => p.completed).map((p) => p.lessonId));
  const recommended = profile?.recommendedPath ? getPath(profile.recommendedPath) : undefined;
  const showOnboarding = !isLoading && (!profile?.onboarded || editing);

  const overallPct = Math.round((completed.size / TOTAL_LESSONS) * 100);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold md:text-3xl">Cyber Academy</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {TOTAL_LESSONS} lessons across {TOTAL_COURSES} courses — from “what is a computer” to cloud
          detection engineering. Every lesson is written for you, read aloud, and checked with a quiz.
        </p>
      </header>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your academy…
        </div>
      ) : (
        <>
          {showOnboarding ? (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Compass className="h-5 w-5 text-primary" /> Build your learning plan
                </CardTitle>
                <CardDescription>
                  Answer three quick questions and we will recommend where to start.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Where are you starting from?</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {LEVELS.map((l) => (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => setLevel(l.value)}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          level === l.value
                            ? "border-primary bg-primary/10"
                            : "hover:bg-muted/60"
                        }`}
                      >
                        <div className="text-sm font-medium">{l.label}</div>
                        <div className="text-xs text-muted-foreground">{l.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="interest">What role interests you?</Label>
                    <Input
                      id="interest"
                      placeholder="e.g. SOC analyst, pentester, cloud security"
                      value={interest}
                      onChange={(e) => setInterest(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours">Hours you can study each week</Label>
                    <Input
                      id="hours"
                      type="number"
                      min={1}
                      max={40}
                      value={hours}
                      onChange={(e) => setHours(Math.max(1, Math.min(40, Number(e.target.value) || 1)))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal">Your goal (optional)</Label>
                  <Textarea
                    id="goal"
                    rows={2}
                    placeholder="e.g. Pass Security+ and land a junior SOC role in 6 months"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() =>
                      mutation.mutate({
                        experienceLevel: level,
                        careerInterest: interest.trim() || undefined,
                        weeklyHours: hours,
                        learningGoal: goal.trim() || undefined,
                      })
                    }
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Recommend my path
                  </Button>
                  {profile?.onboarded && (
                    <Button variant="ghost" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Lessons completed</CardDescription>
                  <CardTitle className="text-2xl">{completed.size}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={overallPct} className="h-2" />
                  <p className="mt-2 text-xs text-muted-foreground">{overallPct}% of the full academy</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Quiz average</CardDescription>
                  <CardTitle className="text-2xl">
                    {data?.quizAverage != null ? `${data.quizAverage}%` : "—"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Trophy className="h-4 w-4 text-amber-500" /> Across all knowledge checks
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Your plan</CardDescription>
                  <CardTitle className="text-base">{recommended?.title ?? "Not set"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {profile?.weeklyHours ?? 5} hrs/week
                    {profile?.careerInterest ? ` · ${profile.careerInterest}` : ""}
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                    Update plan
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {data?.lastLessonId && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Continue learning</p>
                  <p className="truncate text-sm font-medium">
                    {data.progress[0]?.lessonTitle || "Your last lesson"}
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link to="/academy/lesson/$lessonId" params={{ lessonId: data.lastLessonId }}>
                    Resume
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Learning paths</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {PATHS.map((path) => {
                const lessons = pathLessons(path.slug);
                const done = lessons.filter((l) => completed.has(l.id)).length;
                const pct = Math.round((done / lessons.length) * 100);
                const isRecommended = recommended?.slug === path.slug;
                return (
                  <Card
                    key={path.slug}
                    className={isRecommended ? "border-primary shadow-lg shadow-primary/10" : ""}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{path.title}</CardTitle>
                        {isRecommended && <Badge>Recommended</Badge>}
                      </div>
                      <CardDescription>{path.tagline}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{path.description}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary">{path.level}</Badge>
                        <Badge variant="outline">{path.courses.length} courses</Badge>
                        <Badge variant="outline">{lessons.length} lessons</Badge>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                      <div className="space-y-1.5">
                        {path.courses.map((course) => (
                          <Link
                            key={course.slug}
                            to="/academy/course/$courseSlug"
                            params={{ courseSlug: course.slug }}
                            className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                              <span className="truncate">{course.title}</span>
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {courseLessonCount(course.slug)} lessons
                            </span>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {!!data?.bookmarks.length && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Target className="h-5 w-5 text-primary" /> Saved lessons
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.bookmarks.map((b) => (
                  <Link
                    key={b.lessonId}
                    to="/academy/lesson/$lessonId"
                    params={{ lessonId: b.lessonId }}
                    className="rounded-lg border p-3 text-sm hover:bg-muted"
                  >
                    {b.lessonTitle}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
