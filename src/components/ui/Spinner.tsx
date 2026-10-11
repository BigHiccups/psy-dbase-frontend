export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-gray-200 border-t-brand-600 dark:border-slate-700 dark:border-t-brand-400"
      style={{ width: size, height: size }}
    />
  );
}