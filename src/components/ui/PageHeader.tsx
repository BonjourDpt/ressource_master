import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  action?: ReactNode;
}

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--rm-fg)]">
        {title}
      </h1>
      {action}
    </div>
  );
}
