import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  addCredential,
  deleteCredential,
  getMyCredentials,
  type VaultCredential,
} from "@/lib/vault.functions";

export const Route = createFileRoute("/_authenticated/vault")({
  head: () => ({ meta: [{ title: "Password Vault — PhishGuard Lite" }] }),
  component: VaultPage,
});

// ---------- Password generator ----------
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?";

type GenOpts = {
  length: number;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
};

function generatePassword({ length, upper, digits, symbols }: GenOpts): string {
  let pool = LOWER;
  if (upper) pool += UPPER;
  if (digits) pool += DIGITS;
  if (symbols) pool += SYMBOLS;
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  let out = "";
  for (let i = 0; i < length; i++) out += pool[arr[i] % pool.length];
  return out;
}

function strengthLabel(pw: string): { label: string; pct: number; cls: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 14) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "Very weak", cls: "bg-destructive" },
    { label: "Weak", cls: "bg-destructive" },
    { label: "Fair", cls: "bg-yellow-500" },
    { label: "Good", cls: "bg-primary" },
    { label: "Strong", cls: "bg-emerald-500" },
    { label: "Excellent", cls: "bg-emerald-500" },
  ];
  return { label: map[score].label, pct: (score / 5) * 100, cls: map[score].cls };
}

function VaultPage() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(getMyCredentials);
  const addFn = useServerFn(addCredential);
  const delFn = useServerFn(deleteCredential);

  const { data, isLoading } = useQuery({
    queryKey: ["vault"],
    queryFn: () => fetchAll(),
  });

  const [filter, setFilter] = useState("");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  // form
  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showFormPw, setShowFormPw] = useState(false);

  // generator
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);

  const add = useMutation({
    mutationFn: () =>
      addFn({
        data: {
          siteName: siteName.trim(),
          siteUrl: siteUrl.trim(),
          username: username.trim(),
          password,
          notes: "",
        },
      }),
    onSuccess: () => {
      setSiteName("");
      setSiteUrl("");
      setUsername("");
      setPassword("");
      qc.invalidateQueries({ queryKey: ["vault"] });
      toast.success("Credential saved to your vault.");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save credential."),
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vault"] });
      toast.success("Credential deleted.");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not delete."),
  });

  const filtered = useMemo(() => {
    const rows: VaultCredential[] = data ?? [];
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.siteName.toLowerCase().includes(q) ||
        r.username.toLowerCase().includes(q) ||
        (r.siteUrl ?? "").toLowerCase().includes(q),
    );
  }, [data, filter]);

  function regenerate() {
    setPassword(generatePassword({ length, upper, digits, symbols }));
    setShowFormPw(true);
  }

  async function copy(value: string, what: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${what} copied to clipboard.`);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  }

  const strength = strengthLabel(password);
  const canSave = siteName.trim() && username.trim() && password;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/15 p-2 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Password Vault</h1>
          <p className="text-sm text-muted-foreground">
            Securely save, search, and manage your website logins.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add a login</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (canSave) add.mutate();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="siteName">Website name</Label>
                <Input
                  id="siteName"
                  placeholder="e.g. GitHub"
                  value={siteName}
                  maxLength={120}
                  onChange={(e) => setSiteName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="siteUrl">Website URL</Label>
                <Input
                  id="siteUrl"
                  placeholder="https://github.com"
                  value={siteUrl}
                  maxLength={2048}
                  onChange={(e) => setSiteUrl(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="username">Username / email</Label>
                <Input
                  id="username"
                  placeholder="you@example.com"
                  value={username}
                  maxLength={255}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      type={showFormPw ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      maxLength={512}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPw((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showFormPw ? "Hide password" : "Show password"}
                    >
                      {showFormPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => password && copy(password, "Password")}
                    aria-label="Copy password"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {password && (
                  <div className="space-y-1 pt-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className={`h-full ${strength.cls}`} style={{ width: `${strength.pct}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{strength.label}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Generator */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <KeyRound className="h-4 w-4 text-primary" /> Secure password generator
              </div>
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Length</span>
                    <span>{length}</span>
                  </div>
                  <Slider
                    min={8}
                    max={48}
                    step={1}
                    value={[length]}
                    onValueChange={(v) => setLength(v[0])}
                  />
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={upper} onCheckedChange={setUpper} /> Uppercase
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={digits} onCheckedChange={setDigits} /> Numbers
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={symbols} onCheckedChange={setSymbols} /> Symbols
                  </label>
                </div>
                <Button type="button" variant="secondary" onClick={regenerate} className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Generate password
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={add.isPending || !canSave} className="gap-2">
              {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Save to vault
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-lg">Your logins</CardTitle>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by site, URL, or username…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length > 0 ? (
            <ul className="divide-y">
              {filtered.map((r) => {
                const show = revealed[r.id];
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" title={r.siteName}>
                        {r.siteName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground" title={r.username}>
                        {r.username}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                          {show ? r.password : "••••••••••"}
                        </code>
                        <button
                          type="button"
                          onClick={() => setRevealed((s) => ({ ...s, [r.id]: !s[r.id] }))}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={show ? "Hide password" : "Reveal password"}
                        >
                          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => copy(r.password, "Password")}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Copy password"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => del.mutate(r.id)}
                      disabled={del.isPending}
                      aria-label="Delete credential"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No saved logins yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
