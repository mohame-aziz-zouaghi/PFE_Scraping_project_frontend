export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className="inline-block animate-spin rounded-full border-2 border-border-strong border-t-brand-600"
      style={{ width: size, height: size }}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size={32} />
    </div>
  );
}