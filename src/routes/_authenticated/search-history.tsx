import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2, Trash2, Plus, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMySearchHistory, addSearchHistory, deleteSearchHistory } from "@/lib/rbac.functions";
import { SecurityReportDialog } from "@/components/security-report-dialog";

export const Route = createFileRoute("/_authenticated/search-history")({
  head: () => ({ meta: [{ title: "Search History — PhishGuard Lite" }] }),
  component: SearchHistoryPage,
});

const CATEGORIES = ["url", "domain", "email", "general"];

function SearchHistoryPage() {
  const qc = useQueryClient();
  const fetchHistory = useServerFn(getMySearchHistory);
  const addFn = useServerFn(addSearchHistory);
  const delFn = useServerFn(deleteSearchHistory);

  const { data, isLoading } = useQuery({ queryKey: ["search-history"], queryFn: () => fetchHistory() });

  const [filter, setFilter] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [newQuery, setNewQuery] = useState("");
  const [newCat, setNewCat] = useState<string>("general");

  const add = useMutation({
    mutationFn: () => addFn({ data: { searchQuery: newQuery.trim(), searchCategory: newCat } }),
    onSuccess: () => {
      setNewQuery("");
      qc.invalidateQueries({ queryKey: ["search-history"] });
      qc.invalidateQueries({ queryKey: ["user-dashboard"] });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["search-history"] });
      qc.invalidateQueries({ queryKey: ["user-dashboard"] });
    },
  });

  const filtered = useMemo(() => {
    const rows = data ?? [];
    return rows.filter((r) => {
      const matchesText = r.searchQuery.toLowerCase().includes(filter.toLowerCase());
      const matchesCat = category === "all" || r.searchCategory === category;
      return matchesText && matchesCat;
    });
  }, [data, filter, category]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Search History</h1>
        <p className="text-sm text-muted-foreground">View, search, filter, and delete your own search records.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add a record</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (newQuery.trim()) add.mutate();
            }}
          >
            <Input
              placeholder="Search query…"
              value={newQuery}
              maxLength={500}
              onChange={(e) => setNewQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={newCat} onValueChange={setNewCat}>
              <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button type="submit" disabled={add.isPending || !newQuery.trim()}>
              {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-lg">Your records</CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search records…" value={filter} onChange={(e) => setFilter(e.target.value)} className="pl-9" />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="sm:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length > 0 ? (
            <ul className="divide-y">
              {filtered.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" title={r.searchQuery}>{r.searchQuery}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.searchedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    {r.searchCategory && <Badge variant="secondary">{r.searchCategory}</Badge>}
                    <SecurityReportDialog url={r.searchQuery} label="Report" />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => del.mutate(r.id)}
                      disabled={del.isPending}
                      aria-label="Delete record"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No records found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
