import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { register } from "@/api/auth";
import {
  registerStep1Schema,
  registerStep2Schema,
  type RegisterStep1Input,
  type RegisterStep2Input,
} from "@/lib/validation";
import { env } from "@/lib/env";
import { loadTurnstile, renderTurnstile } from "@/lib/turnstile";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import PasswordStrength from "@/components/ui/PasswordStrength";
import clsx from "clsx";

type Step = 0 | 1 | 2;

function formatHMS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

const STEP_LABELS = ["Identity", "Account", "Verify"] as const;
const DEFAULT_VERIFY_TTL_HOURS = 24;

interface WizardState {
  username: string;
  display_name: string;
  phone: string;
  email: string;
  password: string;
}

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);
  const [direction, setDirection] = useState<"forward" | "back">(
    "forward",
  );
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [wizard, setWizard] = useState<WizardState>({
    username: "",
    display_name: "",
    phone: "",
    email: "",
    password: "",
  });

  // Populated after the register call succeeds
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationExpiresAt, setVerificationExpiresAt] =
    useState<string>("");

  const [turnstileToken, setTurnstileToken] = useState<
    string | undefined
  >();
  const turnstileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step !== 1) return;
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
  }, [step]);

  const form1 = useForm<RegisterStep1Input>({
    resolver: zodResolver(registerStep1Schema),
    mode: "onBlur",
    defaultValues: {
      username: wizard.username,
      display_name: wizard.display_name,
      phone: wizard.phone,
    },
  });

  const form2 = useForm<RegisterStep2Input>({
    resolver: zodResolver(registerStep2Schema),
    mode: "onBlur",
    defaultValues: {
      email: wizard.email,
      password: wizard.password,
      confirm_password: "",
    },
  });

  const goForward = () => {
    setDirection("forward");
    setStep((s) => (s + 1) as Step);
  };
  const goBack = () => {
    setDirection("back");
    setStep((s) => Math.max(0, s - 1) as Step);
  };

  const onStep1 = async (values: RegisterStep1Input) => {
    setWizard((w) => ({
      ...w,
      username: values.username,
      display_name: values.display_name ?? "",
      phone: values.phone ?? "",
    }));
    goForward();
  };

  const onStep2 = async (values: RegisterStep2Input) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const full = {
        username: wizard.username,
        ...(wizard.display_name
          ? { display_name: wizard.display_name }
          : {}),
        ...(wizard.phone ? { phone: wizard.phone } : {}),
        email: values.email,
        password: values.password,
        confirm_password: values.confirm_password,
        ...(turnstileToken
          ? { turnstile_token: turnstileToken }
          : {}),
      };

      const res = await register(full);

      // Fallback: if the backend didn't return an expiry, compute one
      // locally from the default TTL. This guarantees step 3 always
      // renders with a live countdown.
      const expiresAt =
        res.verification_expires_at ||
        new Date(
          Date.now() + DEFAULT_VERIFY_TTL_HOURS * 3600 * 1000,
        ).toISOString();

      setWizard((w) => ({
        ...w,
        email: values.email,
        password: values.password,
      }));
      setVerificationEmail(res.email || values.email);
      setVerificationExpiresAt(expiresAt);
      goForward();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Registration failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStepClick = (target: Step) => {
    if (target < step) {
      setDirection("back");
      setStep(target);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-surface-elevated p-6 sm:p-8 border border-border-subtle rounded-base shadow-card">
        <Stepper current={step} onStepClick={handleStepClick} />

        <div key={step} className="mt-6 mb-5 animate-fadeIn">
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary">
            {step === 0 && "Tell us about you"}
            {step === 1 && "Set up your account"}
            {step === 2 && "Check your inbox"}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {step === 0 &&
              "Choose how you'll be known on PriceMonitor."}
            {step === 1 &&
              "We'll use this email for sign-in and alerts."}
            {step === 2 &&
              "Click the link we just sent to finish creating your account."}
          </p>
        </div>

        {serverError && (
          <div
            role="alert"
            className="text-sm text-danger-600 mb-4 rounded-base border border-danger-200 dark:border-danger-900 bg-danger-50 dark:bg-danger-950/40 p-3 animate-shake"
          >
            {serverError}
          </div>
        )}

        <div
          key={step}
          className={clsx(
            "transition-all duration-300 ease-out",
            direction === "forward"
              ? "animate-slideInRight"
              : "animate-slideInLeft",
          )}
        >
          {step === 0 && (
            <form
              onSubmit={form1.handleSubmit(onStep1)}
              noValidate
              className="space-y-5"
            >
              <Field
                id="username"
                label="Username"
                required
                autoComplete="username"
                autoFocus
                error={form1.formState.errors.username?.message}
                {...form1.register("username")}
              />
              <Field
                id="display_name"
                label="Display name"
                autoComplete="name"
                hint="Optional. Shown on your profile."
                error={form1.formState.errors.display_name?.message}
                {...form1.register("display_name")}
              />
              <Field
                id="phone"
                label="Phone"
                type="tel"
                autoComplete="tel"
                hint="Optional. For order alerts."
                error={form1.formState.errors.phone?.message}
                {...form1.register("phone")}
              />

              <Button type="submit" className="w-full">
                Continue
              </Button>

              <p className="text-sm text-text-secondary text-center">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-brand-600 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </form>
          )}

          {step === 1 && (
            <form
              onSubmit={form2.handleSubmit(onStep2)}
              noValidate
              className="space-y-5"
            >
              <Field
                id="email"
                label="Email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                error={form2.formState.errors.email?.message}
                {...form2.register("email")}
              />

              <div>
                <Field
                  id="password"
                  label="Password"
                  type="password"
                  required
                  revealable
                  autoComplete="new-password"
                  error={form2.formState.errors.password?.message}
                  {...form2.register("password")}
                />
                <PasswordStrength
                  password={form2.watch("password") ?? ""}
                />
              </div>

              <Field
                id="confirm_password"
                label="Confirm password"
                type="password"
                required
                revealable
                autoComplete="new-password"
                error={
                  form2.formState.errors.confirm_password?.message
                }
                {...form2.register("confirm_password")}
              />

              {env.turnstileSiteKey && (
                <div ref={turnstileRef} className="pt-1" />
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={submitting}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  loading={submitting}
                  className="flex-1"
                >
                  Create account
                </Button>
              </div>
            </form>
          )}

          {/* Step 3 — always render once we have an email */}
          {step === 2 && verificationEmail && (
            <VerifyStep
              email={verificationEmail}
              initialExpiresAt={verificationExpiresAt}
              onVerified={() =>
                navigate("/login?verified=1", { replace: true })
              }
              onManualCheck={() =>
                navigate("/login?verified=1", { replace: true })
              }
            />
          )}

          {/* Safety net — step is 2 but we have no email (shouldn't happen) */}
          {step === 2 && !verificationEmail && (
            <div className="text-sm text-danger-600">
              Something went wrong.{" "}
              <button
                onClick={goBack}
                className="underline"
              >
                Go back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Stepper (unchanged)
// ═══════════════════════════════════════════════════════
function Stepper({
  current,
  onStepClick,
}: {
  current: Step;
  onStepClick: (target: Step) => void;
}) {
  return (
    <ol className="flex items-center gap-2">
      {STEP_LABELS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = i < current;
        return (
          <li key={label} className="flex items-center gap-2 flex-1">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(i as Step)}
              className={clsx(
                "w-7 h-7 shrink-0 rounded-full flex items-center justify-center",
                "text-xs font-semibold transition-all duration-200",
                done || active
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-neutral-200 dark:bg-neutral-300 text-text-muted",
                clickable && "hover:scale-105 cursor-pointer",
                !clickable && "cursor-default",
              )}
              aria-current={active ? "step" : undefined}
            >
              {done ? (
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                i + 1
              )}
            </button>
            <span
              className={clsx(
                "text-xs font-medium transition-colors",
                active
                  ? "text-text-primary"
                  : done
                    ? "text-brand-600"
                    : "text-text-muted",
              )}
            >
              {label}
            </span>
            {i < STEP_LABELS.length - 1 && (
              <span
                className={clsx(
                  "flex-1 h-px transition-colors duration-300",
                  done ? "bg-brand-600" : "bg-border-subtle",
                )}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ═══════════════════════════════════════════════════════
// Verify step — rich content
// ═══════════════════════════════════════════════════════
function VerifyStep({
  email,
  initialExpiresAt,
  onVerified,
  onManualCheck,
}: {
  email: string;
  initialExpiresAt: string;
  onVerified: () => void;
  onManualCheck: () => void;
}) {
  const [expiresAt, setExpiresAt] = useState(initialExpiresAt);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(
      0,
      Math.floor(
        (new Date(expiresAt).getTime() - Date.now()) / 1000,
      ),
    ),
  );
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [polls, setPolls] = useState(0);
  const [copied, setCopied] = useState(false);

  // ── Verified transition state
  const [verified, setVerified] = useState(false);
  const [redirectIn, setRedirectIn] = useState(3);

  // Countdown until token expiry
  useEffect(() => {
    const id = window.setInterval(() => {
      const s = Math.max(
        0,
        Math.floor(
          (new Date(expiresAt).getTime() - Date.now()) / 1000,
        ),
      );
      setSecondsLeft(s);
      if (s === 0) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  // Poll the backend for verification status
  useEffect(() => {
    if (verified) return; // stop polling once done
    let cancelled = false;
    const poll = async () => {
      try {
        const { api } = await import("@/api/client");
        const status = await api.get<{ is_verified: boolean }>(
          `/auth/verification-status?email=${encodeURIComponent(email)}`,
          { skipAuth: true, skipRefresh: true },
        );
        if (cancelled) return;
        setPolls((p) => p + 1);
        if (status.is_verified) {
          setVerified(true);
        }
      } catch {
        // ignore
      }
    };
    const id = window.setInterval(poll, 4000);
    void poll();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [email, verified]);

  // Once verified, run the 3-2-1 redirect countdown
  useEffect(() => {
    if (!verified) return;
    if (redirectIn <= 0) {
      onVerified();
      return;
    }
    const id = window.setTimeout(
      () => setRedirectIn((n) => n - 1),
      1000,
    );
    return () => window.clearTimeout(id);
  }, [verified, redirectIn, onVerified]);

  const handleResend = async () => {
    setResending(true);
    setResent(false);
    try {
      const { resendVerification } = await import("@/api/auth");
      const res = await resendVerification(email);
      setExpiresAt(res.expires_at);
      setResent(true);
    } catch {
      // ignore
    } finally {
      setResending(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const expired = secondsLeft === 0;
  const progress = Math.min(1, (polls * 4) / 30);

  // ═══════════════════════════════════════════════════════
  // VERIFIED STATE
  // ═══════════════════════════════════════════════════════
  if (verified) {
    return (
      <div className="space-y-5 animate-fadeIn">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center animate-[scaleIn_0.3s_ease-out]">
            <svg
              className="w-9 h-9 text-emerald-600 dark:text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>

          <h2 className="mt-4 text-xl font-semibold text-text-primary">
            Your email is verified
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            All set. Taking you to sign in…
          </p>
        </div>

        <div className="rounded-base border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-5 text-center">
          <p className="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-1">
            Redirecting in
          </p>
          <p
            key={redirectIn}
            className="text-4xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300 animate-[scaleIn_0.25s_ease-out]"
          >
            {redirectIn}
          </p>
        </div>

        <button
          type="button"
          onClick={onVerified}
          className="w-full text-sm text-center text-brand-600 hover:underline"
        >
          Go to sign in now →
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // WAITING STATE
  // ═══════════════════════════════════════════════════════
  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Envelope illustration + short story */}
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-brand-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
        </div>

        <p className="mt-4 text-sm text-text-secondary">
          We sent a verification email to
        </p>

        <button
          type="button"
          onClick={() => void handleCopy()}
          title="Click to copy"
          className={clsx(
            "mt-1 inline-flex items-center gap-2 px-3 py-1.5",
            "rounded-base bg-surface border border-border-subtle",
            "text-sm font-medium text-text-primary",
            "hover:border-brand-500 hover:text-brand-600 transition-colors",
          )}
        >
          <span className="font-mono">{email}</span>
          {copied ? (
            <svg
              className="w-4 h-4 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 text-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
              />
            </svg>
          )}
        </button>

        <p className="mt-3 text-sm text-text-muted max-w-sm">
          Open the email and click the{" "}
          <strong className="font-semibold text-text-secondary">
            Verify my email
          </strong>{" "}
          button. This page will detect it automatically and take you
          to sign-in.
        </p>
      </div>

      {/* Countdown card */}
      <div className="rounded-base border border-border-subtle bg-surface p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-wider text-text-muted">
            {expired ? "Link expired" : "Link expires in"}
          </span>
          {!expired && (
            <span className="inline-flex items-center gap-1.5 text-xs text-brand-600">
              <span className="relative flex w-2 h-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex rounded-full w-2 h-2 bg-brand-500" />
              </span>
              Live
            </span>
          )}
        </div>

        <p
          className={clsx(
            "text-4xl font-bold tabular-nums text-center transition-colors",
            expired
              ? "text-danger-600"
              : secondsLeft < 60
                ? "text-warning-600"
                : "text-text-primary",
          )}
        >
          {formatHMS(secondsLeft)}
        </p>

        {!expired && (
          <div className="mt-4">
            <div className="h-1 w-full rounded-full bg-neutral-200 dark:bg-neutral-300 overflow-hidden">
              <div
                className="h-full bg-brand-500 transition-[width] duration-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-text-muted text-center">
              Checking your inbox… ({polls}{" "}
              {polls === 1 ? "check" : "checks"})
            </p>
          </div>
        )}

        {expired && (
          <p className="mt-3 text-xs text-danger-600 text-center">
            The verification link is no longer valid. Send a new one
            below.
          </p>
        )}
      </div>

      {resent && (
        <div className="text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-base p-3 animate-fadeIn">
          A fresh verification link is on its way. Check your inbox
          again.
        </div>
      )}

      {/* What to do next */}
      <div className="rounded-base border border-border-subtle bg-surface p-4 space-y-2 text-sm">
        <p className="font-medium text-text-primary">
          Not seeing the email?
        </p>
        <ul className="space-y-1 text-text-secondary">
          <li className="flex items-start gap-2">
            <span className="text-text-muted">·</span>
            <span>
              Check the <strong className="font-medium">Spam</strong> or{" "}
              <strong className="font-medium">Promotions</strong>{" "}
              folder.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-text-muted">·</span>
            <span>Wait 1–2 minutes — delivery can be slow.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-text-muted">·</span>
            <span>
              Confirm the address above matches the one you use.
            </span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          loading={resending}
          onClick={() => void handleResend()}
          className="w-full"
        >
          {expired
            ? "Send new verification link"
            : "Resend verification email"}
        </Button>

        <button
          type="button"
          onClick={onManualCheck}
          className="text-sm text-brand-600 hover:underline text-center"
        >
          I've already verified — take me to sign in
        </button>

        <Link
          to="/login"
          className="text-sm text-center text-text-muted hover:text-text-primary"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}