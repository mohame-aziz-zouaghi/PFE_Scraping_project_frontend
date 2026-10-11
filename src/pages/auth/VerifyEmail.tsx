import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { verifyEmail } from "@/api/auth";
import { FullPageSpinner } from "@/components/ui/Spinner";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<"pending" | "ok" | "error">("pending");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Missing verification token.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await verifyEmail(token);
        if (cancelled) return;
        setState("ok");
        // Auto-redirect to login after 3 seconds
        window.setTimeout(() => {
          navigate("/login?verified=1", { replace: true });
        }, 3000);
      } catch (err) {
        if (cancelled) return;
        setState("error");
        setMessage(
          err instanceof Error ? err.message : "Verification failed.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-surface-elevated p-6 sm:p-8 border border-border-subtle rounded-base shadow-card text-center">
        {state === "pending" && (
          <>
            <FullPageSpinner />
            <p className="mt-4 text-sm text-text-secondary">
              Verifying your email…
            </p>
          </>
        )}

        {state === "ok" && (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 mx-auto flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-emerald-600 dark:text-emerald-400"
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
            </div>
            <h1 className="text-xl font-semibold text-text-primary">
              Email verified
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Redirecting you to sign in…
            </p>
            <div className="mt-6">
              <Link
                to="/login?verified=1"
                className="inline-flex items-center h-10 px-5 rounded-base bg-brand-600 text-white font-medium hover:bg-brand-700"
              >
                Sign in now
              </Link>
            </div>
          </>
        )}

        {state === "error" && (
          <>
            <div className="w-14 h-14 rounded-full bg-danger-50 dark:bg-danger-950/40 mx-auto flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-danger-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-text-primary">
              Verification failed
            </h1>
            <p className="mt-2 text-sm text-text-secondary">{message}</p>
            <div className="mt-6 flex justify-center gap-2">
              <Link
                to="/register"
                className="inline-flex items-center h-10 px-5 rounded-base bg-brand-600 text-white font-medium hover:bg-brand-700"
              >
                Register again
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}