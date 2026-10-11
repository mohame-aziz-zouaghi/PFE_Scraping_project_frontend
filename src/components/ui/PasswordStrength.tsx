export default function PasswordStrength({ password }: { password: string }) {
  const score = scorePassword(password);
  const bars = [
    score >= 1,
    score >= 2,
    score >= 3,
    score >= 4,
  ];

  const label =
    password.length === 0
      ? ""
      : score <= 1
        ? "Weak"
        : score === 2
          ? "Fair"
          : score === 3
            ? "Good"
            : "Strong";

  const color =
    score <= 1
      ? "bg-danger-500"
      : score === 2
        ? "bg-warning-500"
        : score === 3
          ? "bg-brand-500"
          : "bg-emerald-500";

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1">
        {bars.map((on, i) => (
          <span
            key={i}
            className={
              "h-1 flex-1 rounded-full transition-colors " +
              (on ? color : "bg-neutral-200 dark:bg-neutral-300")
            }
          />
        ))}
      </div>
      {label && (
        <p
          className={
            "mt-1 text-xs font-medium " +
            (score <= 1
              ? "text-danger-600"
              : score === 2
                ? "text-warning-600"
                : "text-emerald-600")
          }
        >
          Password strength: {label}
        </p>
      )}
    </div>
  );
}

function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score);
}