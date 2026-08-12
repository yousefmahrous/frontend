import { AlertCircle, BookX, RefreshCw, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  variant = "empty",
}: {
  title: string;
  description?: string;
  variant?: "empty" | "search";
}) {
  const Icon = variant === "search" ? SearchX : BookX;
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
      <Icon className="size-10 text-muted-foreground" />
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-14 text-center"
    >
      <AlertCircle className="size-10 text-destructive" />
      <p className="font-semibold text-foreground">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="gap-2">
          <RefreshCw className="size-4" />
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}