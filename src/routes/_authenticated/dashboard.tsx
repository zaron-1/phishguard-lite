import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, ShieldAlert, MessageSquare, Activity, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDashboard } from "@/lib/dashboard.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — PhishGuard Lite" }] }),
  component: Dashboard,
});

function verdictVariant(verdict: string): "default" | "secondary" | "destructive" {
  if (verdict === "Dangerous") return "destructive";
  if (verdict === "Suspicious") return "secondary";
  return "default";
}

function Dashboard() {
  const fetchDashboard = useServerFn(getDashboard);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboard(),
  });

  const stats = [
    { label: "Analyses run", value: data?.analysesCount ?? 0, icon: ShieldCheck },
    { label: "Dangerous found", value: data?.dangerousCount ?? 0, icon: ShieldAlert },
    { label: "Tutor messages", value: data?.chatMessages ?? 0, icon: MessageSquare },
    { label: "Recent activity", value: data?.recent.length ?? 0, icon: Activity },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your security activity at a glance.</p>
      </div>

      {isError ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Couldn't load your activity. Please try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <Card key={label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                  <Icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent analyses</CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link to="/analyzer">New analysis</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : data && data.recent.length > 0 ? (
                <ul className="divide-y">
                  {data.recent.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                      <span className="truncate text-sm" title={r.url}>{r.url}</span>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-muted-foreground">{r.riskScore}%</span>
                        <Badge variant={verdictVariant(r.verdict)}>{r.verdict}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No analyses yet. Run your first URL check in the Analyzer.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
