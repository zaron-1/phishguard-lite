import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Upload, ImageIcon, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  getLandingContent,
  updateLandingContent,
  uploadSiteAsset,
  DEFAULT_LANDING,
  type LandingContent,
} from "@/lib/cms.functions";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export function CmsPanel() {
  const qc = useQueryClient();
  const fetchContent = useServerFn(getLandingContent);
  const saveFn = useServerFn(updateLandingContent);
  const uploadFn = useServerFn(uploadSiteAsset);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({ queryKey: ["landing-content"], queryFn: () => fetchContent() });
  const [form, setForm] = useState<LandingContent>(DEFAULT_LANDING);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const set = (key: keyof LandingContent, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: () => saveFn({ data: form }),
    onSuccess: () => {
      toast.success("Site content published.");
      qc.invalidateQueries({ queryKey: ["landing-content"] });
      qc.invalidateQueries({ queryKey: ["admin-actions"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save."),
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 4_000_000) throw new Error("Image must be under 4 MB.");
      const dataBase64 = await fileToBase64(file);
      return uploadFn({ data: { fileName: file.name, contentType: file.type, dataBase64 } });
    },
    onSuccess: (res) => {
      set("heroImageUrl", res.url);
      toast.success("Image uploaded. Remember to publish.");
    },
    onError: (e: Error) => toast.error(e.message || "Upload failed."),
  });

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Landing page content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="badge">Top badge</Label>
              <Input id="badge" value={form.badge} maxLength={160} onChange={(e) => set("badge", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cta">Primary button label</Label>
              <Input id="cta" value={form.ctaLabel} maxLength={60} onChange={(e) => set("ctaLabel", e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input id="headline" value={form.headline} maxLength={200} onChange={(e) => set("headline", e.target.value)} />
            <p className="text-xs text-muted-foreground">Each word animates in on the landing page.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sub">Sub-headline</Label>
            <Textarea id="sub" rows={3} value={form.subheadline} maxLength={600} onChange={(e) => set("subheadline", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ann">Announcement banner (leave empty to hide)</Label>
            <Input id="ann" value={form.announcement} maxLength={300} onChange={(e) => set("announcement", e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hct">Hero card title</Label>
              <Input id="hct" value={form.heroCardTitle} maxLength={120} onChange={(e) => set("heroCardTitle", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hcx">Hero card text</Label>
              <Input id="hcx" value={form.heroCardText} maxLength={400} onChange={(e) => set("heroCardText", e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vt">Vault section title</Label>
              <Input id="vt" value={form.vaultTitle} maxLength={160} onChange={(e) => set("vaultTitle", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vx">Vault section text</Label>
              <Textarea id="vx" rows={3} value={form.vaultText} maxLength={600} onChange={(e) => set("vaultText", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="h-4 w-4 text-primary" /> Hero image
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload.mutate(file);
                e.target.value = "";
              }}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
              {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload image
            </Button>
            {form.heroImageUrl && (
              <Button variant="ghost" onClick={() => set("heroImageUrl", "")}>Remove image</Button>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="img">Image URL</Label>
            <Input id="img" value={form.heroImageUrl} onChange={(e) => set("heroImageUrl", e.target.value)} placeholder="https://…" />
          </div>
          {form.heroImageUrl && (
            <img src={form.heroImageUrl} alt="Hero preview" className="max-h-48 rounded-xl border object-cover" />
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" asChild>
          <a href="/" target="_blank" rel="noreferrer"><Eye className="h-4 w-4" /> Preview site</a>
        </Button>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Publish changes
        </Button>
      </div>
    </div>
  );
}
