import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string | null;
  hint?: string;
};

export function Input({ label, error, hint, className = "", ...rest }: Props) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
          {label}
          {rest.required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <input
        {...rest}
        className={`
          w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900
          placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500
          disabled:bg-gray-50 disabled:text-gray-500
          dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500
          dark:disabled:bg-slate-800/50 dark:disabled:text-slate-500
          ${error ? "border-red-400" : "border-gray-300 dark:border-slate-700"}
          ${className}
        `}
      />
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
          {hint}
        </p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}