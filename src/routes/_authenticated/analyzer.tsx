import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  History,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { analyzeUrl, type AnalysisResult } from "@/lib/phishing.functions";
import { getMySearchHistory, addSearchHistory } from "@/lib/rbac.functions";
import { SecurityReportDialog } from "@/components/security-report-dialog";

export const Route = createFileRoute("/_authenticated/analyzer")({
  head: () => ({ meta: [{ title: "Phishing Analyzer — PhishGuard Lite" }] }),
  component: Analyzer,
});

const STATUS_ICON = {
  pass: CheckCircle2,
  warn: AlertTriangle,
  fail: XCircle,
} as const;

const STATUS_COLOR = {
  pass: "text-green-500",
  warn: "text-yellow-500",
  fail: "text-destructive",
} as const;

function verdictVariant(verdict: string): "default" | "secondary" | "destructive" {
  if (verdict === "Dangerous") return "destructive";
  if (verdict === "Suspicious") return "secondary";
  return "default";
}

function Analyzer() {
  const [url, setUrl] = useState("");
  const queryClient = useQueryClient();
  const analyze = useServerFn(analyzeUrl);
  const fetchHistory = useServerFn(getMySearchHistory);
  const saveSearch = useServerFn(addSearchHistory);

  const { data: history } = useQuery({
    queryKey: ["search-history"],
    queryFn: () => fetchHistory(),
  });

  const recent = (history ?? []).filter((r) => r.searchCategory === "url").slice(0, 8);

  const mutation = useMutation<AnalysisResult, Error, string>({
    mutationFn: (value) => analyze({ data: { url: value } }),
    onSuccess: async (_res, value) => {
      try {
        await saveSearch({ data: { searchQuery: value, searchCategory: "url", searchResultsCount: 1 } });
      } catch {
        /* history is best-effort */
      }
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["search-history"] });
      queryClient.invalidateQueries({ queryKey: ["user-dashboard"] });
    },
    onError: (err) => toast.error(err.message || "Analysis failed."),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed.length < 3) {
      toast.error("Please enter a valid URL.");
      return;
    }
    mutation.mutate(trimmed);
  };

  const result = mutation.data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Phishing Analyzer</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Paste a URL and we'll analyze it for phishing risk using AI.
      </p>

      <form onSubmit={submit} className="flex gap-2">
        <Input
          type="text"
          inputMode="url"
          placeholder="https://example.com/login"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={mutation.isPending}
        />
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Analyze
        </Button>
      </form>

      {recent.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-primary" /> Recent searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {recent.map((r) => (
                <Button
                  key={r.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="max-w-full"
                  disabled={mutation.isPending}
                  onClick={() => {
                    setUrl(r.searchQuery);
                    mutation.mutate(r.searchQuery);
                  }}
                  title={`Re-analyze ${r.searchQuery}`}
                >
                  <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{r.searchQuery}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="truncate text-base" title={result.url}>
                {result.url}
              </CardTitle>
              <Badge variant={verdictVariant(result.verdict)}>{result.verdict}</Badge>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Risk score</span>
                <span>{result.riskScore}/100</span>
              </div>
              <Progress value={result.riskScore} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{result.explanation}</p>
            {result.recommendedAction && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <span className="font-medium">Recommendation: </span>
                {result.recommendedAction}
              </div>
            )}
            {result.checks.length > 0 && (
              <ul className="space-y-2">
                {result.checks.map((check, i) => {
                  const Icon = STATUS_ICON[check.status] ?? AlertTriangle;
                  return (
                    <li key={`${check.name}-${i}`} className="flex items-start gap-2 text-sm">
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${STATUS_COLOR[check.status] ?? ""}`} />
                      <div>
                        <span className="font-medium">{check.name}</span>
                        <span className="text-muted-foreground"> — {check.detail}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
