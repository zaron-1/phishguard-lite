import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, UserCheck, ShieldAlert, Search as SearchIcon, Loader2, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccessDenied } from "@/components/access-denied";
import { CmsPanel } from "@/components/cms-panel";
import { useRole } from "@/hooks/use-role";
import {
  getAdminDashboard,
  listAllUsers,
  listAllSearches,
  setUserStatus,
  setUserRole,
} from "@/lib/rbac.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Panel — PhishGuard Lite" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useRole();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAdmin) return <AccessDenied />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Manage users, roles, searches, and view system statistics.</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="searches">Searches</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4"><Overview /></TabsContent>
        <TabsContent value="users" className="mt-4"><UsersPanel /></TabsContent>
        <TabsContent value="searches" className="mt-4"><SearchesPanel /></TabsContent>
        <TabsContent value="activity" className="mt-4"><ActivityPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

function Overview() {
  const fetchStats = useServerFn(getAdminDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => fetchStats() });

  const stats = [
    { label: "Total users", value: data?.totalUsers ?? 0, icon: Users },
    { label: "Active users", value: data?.activeUsers ?? 0, icon: UserCheck },
    { label: "Suspended", value: data?.suspendedUsers ?? 0, icon: ShieldAlert },
    { label: "Administrators", value: data?.totalAdmins ?? 0, icon: Shield },
    { label: "Total searches", value: data?.totalSearches ?? 0, icon: SearchIcon },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
  );
}

function UsersPanel() {
  const qc = useQueryClient();
  const fetchUsers = useServerFn(listAllUsers);
  const statusFn = useServerFn(setUserStatus);
  const roleFn = useServerFn(setUserRole);

  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => fetchUsers() });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-users"] });
    qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    qc.invalidateQueries({ queryKey: ["admin-actions"] });
  };

  const status = useMutation({
    mutationFn: (v: { targetUserId: string; status: "active" | "suspended" }) => statusFn({ data: v }),
    onSuccess: invalidate,
  });
  const role = useMutation({
    mutationFn: (v: { targetUserId: string; role: "admin" | "user"; grant: boolean }) => roleFn({ data: v }),
    onSuccess: invalidate,
  });

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">User management</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {(data ?? []).map((u) => {
          const isAdmin = u.roles.includes("admin");
          return (
            <div key={u.userId} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{u.displayName || "—"}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={u.status === "active" ? "default" : "destructive"}>{u.status}</Badge>
                {isAdmin && <Badge variant="secondary">admin</Badge>}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={status.isPending}
                  onClick={() =>
                    status.mutate({ targetUserId: u.userId, status: u.status === "active" ? "suspended" : "active" })
                  }
                >
                  {u.status === "active" ? "Suspend" : "Activate"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={role.isPending}
                  onClick={() => role.mutate({ targetUserId: u.userId, role: "admin", grant: !isAdmin })}
                >
                  {isAdmin ? "Revoke admin" : "Make admin"}
                </Button>
              </div>
            </div>
          );
        })}
        {(data ?? []).length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No users found.</p>}
      </CardContent>
    </Card>
  );
}

function SearchesPanel() {
  const fetchSearches = useServerFn(listAllSearches);
  const { data, isLoading } = useQuery({ queryKey: ["admin-searches"], queryFn: () => fetchSearches() });

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">All search history</CardTitle></CardHeader>
      <CardContent>
        {(data ?? []).length > 0 ? (
          <ul className="divide-y">
            {data!.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm" title={r.searchQuery}>{r.searchQuery}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.searchedAt).toLocaleString()} · {r.ipAddress ?? "no ip"}
                  </p>
                </div>
                {r.searchCategory && <Badge variant="secondary">{r.searchCategory}</Badge>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">No searches recorded.</p>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityPanel() {
  const fetchStats = useServerFn(getAdminDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["admin-actions"], queryFn: () => fetchStats() });

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Administrative activity log</CardTitle></CardHeader>
      <CardContent>
        {data && data.recentActions.length > 0 ? (
          <ul className="divide-y">
            {data.recentActions.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm font-medium">{a.action}</span>
                <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">No administrative actions logged yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
