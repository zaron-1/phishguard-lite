import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { User, History, ShieldCheck, Activity, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserDashboard } from "@/lib/rbac.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — PhishGuard Lite" },
      {
        name: "description",
        content:
          "Review your PhishGuard account, saved searches and recent cybersecurity activity.",
      },
      { property: "og:title", content: "Dashboard — PhishGuard Lite" },
      {
        property: "og:description",
        content:
          "Review your PhishGuard account, saved searches and recent cybersecurity activity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const fetchDashboard = useServerFn(getUserDashboard);
  const { data, isLoading } = useQuery({
    queryKey: ["user-dashboard"],
    queryFn: () => fetchDashboard(),
  });

  const stats = [
    { label: "Account status", value: data?.profile?.status ?? "—", icon: ShieldCheck },
    { label: "Searches saved", value: data?.searchCount ?? 0, icon: History },
    { label: "Recent activity", value: data?.recentSearches.length ?? 0, icon: Activity },
    { label: "Profile", value: data?.profile?.displayName ?? "—", icon: User },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back{data?.profile?.displayName ? `, ${data.profile.displayName}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Your personal dashboard and activity overview.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="truncate text-2xl font-bold">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  value
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Profile summary</CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link to="/profile">Edit</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Name" value={data?.profile?.displayName} />
            <Row label="Email" value={data?.profile?.email} />
            <Row label="Phone" value={data?.profile?.phone} />
            <Row label="Bio" value={data?.profile?.bio} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent searches</CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link to="/search-history">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : data && data.recentSearches.length > 0 ? (
              <ul className="divide-y">
                {data.recentSearches.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="truncate text-sm" title={s.searchQuery}>
                      {s.searchQuery}
                    </span>
                    {s.searchCategory && <Badge variant="secondary">{s.searchCategory}</Badge>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No searches yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-right font-medium">{value || "—"}</span>
    </div>
  );
}
