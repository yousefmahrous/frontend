import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-14">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-book sm:p-8">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 mb-6 text-sm text-muted-foreground">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}