import type { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
      {icon && (
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100">
        {title}
      </h3>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}