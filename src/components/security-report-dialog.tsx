import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { FileText, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { generateSecurityReport, type SecurityReport } from "@/lib/report.functions";
import { downloadReportPdf } from "@/lib/report-pdf";

type Props = {
  url: string;
  size?: "sm" | "default";
  variant?: "default" | "outline" | "secondary";
  label?: string;
  className?: string;
};

function renderLine(line: string, i: number) {
  const clean = line.replace(/\*\*/g, "").replace(/`/g, "");
  if (/^#\s/.test(line)) return <h2 key={i} className="mt-4 text-lg font-bold">{clean.replace(/^#\s*/, "")}</h2>;
  if (/^##\s/.test(line)) return <h3 key={i} className="mt-4 border-b pb-1 text-base font-semibold text-primary">{clean.replace(/^##\s*/, "")}</h3>;
  if (/^###\s/.test(line)) return <h4 key={i} className="mt-3 text-sm font-semibold">{clean.replace(/^###\s*/, "")}</h4>;
  if (/^\s*[-*]\s+/.test(line))
    return <li key={i} className="ml-4 list-disc text-sm text-muted-foreground">{clean.replace(/^\s*[-*]\s+/, "")}</li>;
  if (!clean.trim()) return null;
  return <p key={i} className="text-sm leading-relaxed text-muted-foreground">{clean}</p>;
}

export function SecurityReportDialog({ url, size = "sm", variant = "outline", label = "Full security report", className }: Props) {
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState<SecurityReport | null>(null);
  const generate = useServerFn(generateSecurityReport);

  const mutation = useMutation<SecurityReport, Error, string>({
    mutationFn: (value) => generate({ data: { url: value } }),
    onSuccess: (r) => setReport(r),
    onError: (e) => toast.error(e.message || "Could not generate the report."),
  });

  const start = () => {
    setOpen(true);
    if (!report && !mutation.isPending) mutation.mutate(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size={size} variant={variant} className={className} onClick={start}>
          <FileText className="h-4 w-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 text-base">
            Security assessment report
            {report && <Badge variant="secondary">Risk: {report.riskRating}</Badge>}
          </DialogTitle>
          <DialogDescription className="break-all">{url}</DialogDescription>
        </DialogHeader>

        {mutation.isPending && (
          <div className="flex flex-col items-center gap-3 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            Running passive assessment and compiling OWASP-style findings…
          </div>
        )}

        {!mutation.isPending && report && (
          <>
            <ScrollArea className="h-[52vh] pr-4">
              <div className="space-y-1">{report.content.split("\n").map(renderLine)}</div>
            </ScrollArea>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => mutation.mutate(url)}>
                Regenerate
              </Button>
              <Button size="sm" onClick={() => downloadReportPdf(report.content, report)}>
                <Download className="h-4 w-4" /> Download PDF
              </Button>
            </div>
          </>
        )}

        {!mutation.isPending && !report && mutation.isError && (
          <div className="space-y-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">{mutation.error?.message}</p>
            <Button size="sm" onClick={() => mutation.mutate(url)}>Try again</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
