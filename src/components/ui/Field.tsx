import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import clsx from "clsx";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string | undefined;
  /** Show a show/hide toggle. Only applies to type="password". */
  revealable?: boolean;
  /** Render a red asterisk after the label. */
  required?: boolean;
  /** Optional helper text on the right side of the label row. */
  labelAction?: ReactNode;
}

const Field = forwardRef<HTMLInputElement, FieldProps>(
  (
    {
      label,
      hint,
      error,
      id,
      className,
      revealable = false,
      required = false,
      labelAction,
      type = "text",
      placeholder,
      value,
      defaultValue,
      onBlur,
      onFocus,
      onChange,
      ...rest
    },
    ref,
  ) => {
    const [revealed, setRevealed] = useState(false);
    const [focused, setFocused] = useState(false);
    const [hasValue, setHasValue] = useState<boolean>(
      () =>
        (value !== undefined && value !== null && String(value).length > 0) ||
        (defaultValue !== undefined &&
          defaultValue !== null &&
          String(defaultValue).length > 0),
    );

    const isPassword = type === "password";
    const effectiveType = isPassword && revealed ? "text" : type;

    // Controlled OR uncontrolled — track value via the ref for control.
    const valueFromProps = value !== undefined ? String(value ?? "") : "";
    const showFloating =
      focused || hasValue || valueFromProps.length > 0;

    const errorId = id ? `${id}-error` : undefined;
    const hintId = id ? `${id}-hint` : undefined;

    return (
      <div className="animate-fadeIn">
        {/* Screen-reader-only label for accessibility + form autofill */}
        <label htmlFor={id} className="sr-only">
          {label}
          {required ? " (required)" : ""}
        </label>

        <div className="relative">
          {/* The floating label. Visually sits inside the input when
              idle, and moves to the top border when focused/filled. */}
          <span
            aria-hidden="true"
            className={clsx(
              "pointer-events-none absolute left-3 origin-left",
              "transition-all duration-200 ease-out",
              showFloating
                ? "-top-2 text-xs bg-surface-elevated px-1.5 rounded-sm"
                : "top-1/2 -translate-y-1/2 text-sm",
              error
                ? "text-danger-600"
                : focused
                  ? "text-brand-600"
                  : "text-text-muted",
            )}
          >
            {label}
            {required && (
              <span
                className={clsx(
                  "ml-0.5",
                  error ? "text-danger-600" : "text-danger-500",
                )}
              >
                *
              </span>
            )}
          </span>

          <input
            ref={ref}
            id={id}
            type={effectiveType}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              error ? errorId : hint ? hintId : undefined
            }
            aria-required={required ? "true" : "false"}
            placeholder={showFloating ? placeholder : ""}
            value={value}
            defaultValue={defaultValue}
            onChange={(e) => {
              setHasValue(e.target.value.length > 0);
              onChange?.(e);
            }}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            className={clsx(
              "peer block w-full rounded-base bg-surface",
              "border shadow-xs outline-none",
              "text-sm text-text-primary",
              "placeholder:text-text-muted placeholder:text-xs",
              "transition-[border-color,box-shadow] duration-200",
              "focus:ring-2",
              // Always reserve room at the top for the floating label
              "pt-5 pb-2 px-3",
              error
                ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/30"
                : "border-border-strong focus:border-brand-500 focus:ring-brand-500/30",
              revealable && isPassword && "pr-11",
              className,
            )}
            {...rest}
          />

          {/* Show/hide password toggle */}
          {revealable && isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setRevealed((r) => !r)}
              className={clsx(
                "absolute right-2 top-1/2 -translate-y-1/2",
                "p-1.5 rounded-md",
                "text-text-muted hover:text-text-primary",
                "transition-colors duration-150",
                "focus:outline-none focus:ring-2 focus:ring-brand-500/30",
              )}
              aria-label={
                revealed ? "Hide password" : "Show password"
              }
            >
              {revealed ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}
        </div>

        {/* Label action (e.g. "Lost password?") sits under the field */}
        {labelAction && (
          <div className="mt-1.5 text-right">{labelAction}</div>
        )}

        {error ? (
          <p
            id={errorId}
            className="text-xs text-danger-600 mt-1.5 animate-fadeIn"
          >
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-xs text-text-muted mt-1.5">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

Field.displayName = "Field";
export default Field;

// ─── Icons ─────────────────────────────────────────────
function EyeIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M15 12a3 3 0 11-6 0 3 3 0 006 0z"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}