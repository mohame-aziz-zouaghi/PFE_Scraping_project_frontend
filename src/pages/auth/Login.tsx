import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { loginSchema, type LoginInput } from "@/lib/validation";
import { useAuth } from "@/hooks/useAuth";
import { env } from "@/lib/env";
import { loadTurnstile, renderTurnstile } from "@/lib/turnstile";
import clsx from "clsx";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { login, error: authError, clearError } = useAuth();

  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const turnstileRef = useRef<HTMLDivElement>(null);
  const [remember, setRemember] = useState(true);
  const [shake, setShake] = useState(false);

  const justVerified = params.get("verified") === "1";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (!env.turnstileSiteKey || !turnstileRef.current) return;
    let cancelled = false;
    void loadTurnstile().then(() => {
      if (cancelled || !turnstileRef.current) return;
      renderTurnstile(
        turnstileRef.current,
        env.turnstileSiteKey,
        setTurnstileToken,
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Shake the card when the server rejects the login.
  useEffect(() => {
    if (!authError) return;
    setShake(true);
    const id = window.setTimeout(() => setShake(false), 400);
    return () => window.clearTimeout(id);
  }, [authError]);

  const onSubmit = async (values: LoginInput) => {
    try {
      const user = await login(
        values.email,
        values.password,
        turnstileToken,
      );

      // The role always comes from the JWT; the fallback is defensive.
      const role = user?.role ?? "user";
      const from =
        (location.state as { from?: string } | null)?.from ??
        (role === "superadmin"
          ? "/super"
          : role === "admin"
            ? "/admin"
            : "/products");

      navigate(from, { replace: true });
    } catch {
      // Error is in the store; the shake effect above fires.
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div
        className={clsx(
          "w-full max-w-md bg-surface-elevated p-6 sm:p-8",
          "border border-border-subtle rounded-base shadow-card",
          "animate-fadeIn",
          shake && "animate-shake",
        )}
      >
        {justVerified && (
          <div
            role="status"
            className={clsx(
              "mb-5 rounded-base p-3 text-sm",
              "border border-emerald-200 bg-emerald-50",
              "dark:border-emerald-900 dark:bg-emerald-950/40",
              "text-emerald-800 dark:text-emerald-200",
              "animate-slideInDown",
            )}
          >
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
              <span>
                Your email is verified. Sign in to continue.
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary mb-6 animate-fadeIn">
            Sign in to your account
          </h1>

          <div className="space-y-5">
            <Field
              id="email"
              label="Your email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <Field
              id="password"
              label="Your password"
              type="password"
              required
              revealable
              autoComplete="current-password"
              placeholder="•••••••••"
              error={errors.password?.message}
              {...register("password")}
            />
          </div>

          <div className="flex items-start my-6">
            <div className="flex items-center group">
              <input
                id="checkbox-remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className={clsx(
                  "w-4 h-4 rounded cursor-pointer",
                  "border border-border-strong bg-surface",
                  "text-brand-600",
                  "focus:ring-2 focus:ring-brand-500/40",
                  "transition-colors duration-150",
                )}
              />
              <label
                htmlFor="checkbox-remember"
                className="ms-2 text-sm font-medium text-text-primary cursor-pointer select-none group-hover:text-brand-600 transition-colors"
              >
                Remember me
              </label>
            </div>
            <Link
              to="/forgot-password"
              className="ms-auto text-sm font-medium text-brand-600 hover:underline transition-colors"
            >
              Lost password?
            </Link>
          </div>

          {env.turnstileSiteKey && (
            <div ref={turnstileRef} className="mb-4 animate-fadeIn" />
          )}

          {authError && (
            <div
              role="alert"
              className={clsx(
                "text-sm rounded-base p-3 mb-4",
                "border border-danger-200 dark:border-danger-900",
                "bg-danger-50 dark:bg-danger-950/40",
                "text-danger-600",
                "animate-slideInDown",
              )}
            >
              {authError}
            </div>
          )}

          <Button
            type="submit"
            loading={isSubmitting}
            className={clsx(
              "w-full mb-3",
              "transition-transform duration-150",
              "hover:scale-[1.01] active:scale-[0.99]",
            )}
          >
            {isSubmitting ? "Signing in…" : "Login to your account"}
          </Button>

          <div className="text-sm font-medium text-text-secondary text-center">
            Not registered?{" "}
            <Link
              to="/register"
              className="text-brand-600 hover:underline transition-colors"
            >
              Create account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}