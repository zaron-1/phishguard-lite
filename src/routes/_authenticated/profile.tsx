import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Save, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getMyProfile, updateMyProfile } from "@/lib/rbac.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My Profile — PhishGuard Lite" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const saveProfile = useServerFn(updateMyProfile);

  const { data, isLoading } = useQuery({ queryKey: ["my-profile"], queryFn: () => fetchProfile() });

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setDisplayName(data.displayName ?? "");
      setPhone(data.phone ?? "");
      setBio(data.bio ?? "");
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => saveProfile({ data: { displayName, phone, bio } }),
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      qc.invalidateQueries({ queryKey: ["user-dashboard"] });
      setTimeout(() => setSaved(false), 2500);
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-sm text-muted-foreground">View and edit your personal information.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Personal details</CardTitle>
          {data?.status && (
            <Badge variant={data.status === "active" ? "default" : "destructive"}>{data.status}</Badge>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
            >
              <div className="space-y-2">
                <Label>Email (read-only)</Label>
                <Input value={data?.email ?? ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Display name</Label>
                <Input id="name" value={displayName} maxLength={120} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input id="phone" value={phone} maxLength={40} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" value={bio} maxLength={1000} rows={4} onChange={(e) => setBio(e.target.value)} />
              </div>

              {mutation.isError && (
                <p className="text-sm text-destructive">Could not save. Please try again.</p>
              )}

              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                ) : saved ? (
                  <><CheckCircle2 className="h-4 w-4" /> Saved</>
                ) : (
                  <><Save className="h-4 w-4" /> Save changes</>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
