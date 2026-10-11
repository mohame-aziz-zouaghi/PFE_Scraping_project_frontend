import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { FullPageSpinner } from "@/components/ui/Spinner";

/**
 * Wraps /login and /register.
 *
 * Two scenarios:
 *   A) A logged-in user navigates here directly (bookmark, back
 *      button). We redirect immediately.
 *   B) An anonymous user just submitted the login form. The form
 *      navigates itself; this route must not race it. We wait a
 *      tick for the form to win; if it doesn't, we redirect.
 */
export default function AnonymousOnlyRoute() {
  const { status, user } = useAuth();
  const location = useLocation();
  const sawAnonymous = useRef(false);
  const [allowRedirect, setAllowRedirect] = useState(false);

  if (status === "anonymous") {
    sawAnonymous.current = true;
  }

  const isAuthed = status === "authenticated" && user != null;

  useEffect(() => {
    if (!isAuthed) {
      setAllowRedirect(false);
      return;
    }
    // If the user was already logged in on mount → 0ms delay.
    // If they just logged in via the form → 400ms grace period so
    // the form's own navigate() unmounts this route first.
    const delay = sawAnonymous.current ? 400 : 0;
    const id = window.setTimeout(() => setAllowRedirect(true), delay);
    return () => window.clearTimeout(id);
  }, [isAuthed]);

  if (status === "idle" || status === "loading") {
    return <FullPageSpinner />;
  }

  if (isAuthed && allowRedirect) {
    const state = location.state as
      | { from?: string }
      | null;
    const dest =
      state?.from ??
      (user.role === "superadmin"
        ? "/super"
        : user.role === "admin"
          ? "/admin"
          : "/products");
    return <Navigate to={dest} replace />;
  }

  // Authenticated but redirect not yet decided → show spinner so
  // the form's navigate can win the race.
  if (isAuthed) {
    return <FullPageSpinner />;
  }

  return <Outlet />;
}