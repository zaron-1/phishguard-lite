import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccessDenied({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <ShieldAlert className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="mt-4 text-2xl font-bold">Access denied</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {message ?? "You don't have permission to view this page. This area is restricted to administrators."}
      </p>
      <Button asChild className="mt-6">
        <Link to="/dashboard">Back to your dashboard</Link>
      </Button>
    </div>
  );
}
