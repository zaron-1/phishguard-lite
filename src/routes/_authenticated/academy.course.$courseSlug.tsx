import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CheckCircle2, Circle, Clock, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCourse, lessonId as makeLessonId } from "@/lib/academy/catalog";
import { getAcademyOverview } from "@/lib/academy.functions";

export const Route = createFileRoute("/_authenticated/academy/course/$courseSlug")({
  head: ({ params }) => {
    const course = getCourse(params.courseSlug)?.course;
    const title = course ? `${course.title} — Cyber Academy` : "Course — Cyber Academy";
    const description =
      course?.description ??
      "A structured cybersecurity course inside the PhishGuard Cyber Academy.";
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
  component: CoursePage,
  errorComponent: () => (
    <p className="text-sm text-muted-foreground">This course could not be loaded.</p>
  ),
  notFoundComponent: () => <p className="text-sm text-muted-foreground">Course not found.</p>,
});

function CoursePage() {
  const { courseSlug } = Route.useParams();
  const entry = getCourse(courseSlug);
  if (!entry) throw notFound();
  const { course, path } = entry;

  const fetchOverview = useServerFn(getAcademyOverview);
  const { data } = useQuery({ queryKey: ["academy", "overview"], queryFn: () => fetchOverview() });
  const completed = new Set(
    (data?.progress ?? []).filter((p) => p.completed).map((p) => p.lessonId),
  );

  const allIds = course.modules.flatMap((m, mi) =>
    m.lessons.map((_, li) => makeLessonId(course.slug, mi, li)),
  );
  const doneCount = allIds.filter((id) => completed.has(id)).length;
  const pct = Math.round((doneCount / allIds.length) * 100);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/academy">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Cyber Academy
        </Link>
      </Button>

      <header className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{path.title}</p>
        <h1 className="text-2xl font-bold md:text-3xl">{course.title}</h1>
        <p className="text-sm text-muted-foreground">{course.description}</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{course.level}</Badge>
          <Badge variant="outline">
            <Clock className="mr-1 h-3 w-3" /> ~{course.hours} hrs
          </Badge>
          <Badge variant="outline">{allIds.length} lessons</Badge>
        </div>
        <div className="space-y-1">
          <Progress value={pct} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {doneCount} of {allIds.length} lessons complete
          </p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">What you will be able to do</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {course.skills.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wrench className="h-4 w-4 text-primary" /> Tools & prerequisites
            </CardTitle>
            <CardDescription className="text-xs">
              {course.prerequisites.length
                ? `Prerequisites: ${course.prerequisites.join(", ")}`
                : "No prerequisites — you can start today."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {course.tools.length ? (
              course.tools.map((t) => (
                <Badge key={t} variant="outline" className="text-xs">
                  {t}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">Concept-only course.</span>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5">
        {course.modules.map((mod, mi) => (
          <section key={mod.title} className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Module {mi + 1} · {mod.title}
            </h2>
            <ul className="divide-y rounded-xl border bg-card">
              {mod.lessons.map((title, li) => {
                const id = makeLessonId(course.slug, mi, li);
                const done = completed.has(id);
                return (
                  <li key={id}>
                    <Link
                      to="/academy/lesson/$lessonId"
                      params={{ lessonId: id }}
                      className="flex items-center gap-3 p-3 text-sm transition-colors hover:bg-muted"
                    >
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="min-w-0 flex-1">{title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        Lesson {li + 1}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
