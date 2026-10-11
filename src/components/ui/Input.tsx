import { forwardRef, type InputHTMLAttributes } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | undefined;
  hint?: string | undefined;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className, ...rest }, ref) => {
    const inputId =
      id ??
      (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
    const errorId = inputId ? `${inputId}-error` : undefined;
    const hintId = inputId ? `${inputId}-hint` : undefined;
    const describedBy = error ? errorId : hint ? hintId : undefined;

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          className={clsx(
            "block w-full rounded-md border px-3 py-2 text-sm bg-surface-elevated",
            "focus:outline-none focus:ring-2 focus:ring-brand-500",
            error
              ? "border-danger-500 focus:ring-danger-500"
              : "border-border-strong",
            className,
          )}
          {...rest}
        />
        {error && (
          <p id={errorId} className="text-xs text-danger-600">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={hintId} className="text-xs text-text-muted">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;