import { create } from "zustand";
import { tokenStore, setUnauthorizedHandler } from "@/lib/http";
import * as authApi from "@/api/auth";
import type { User } from "@/api/auth";

interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "authenticated" | "anonymous";
  error: string | null;

  login: (
    email: string,
    password: string,
    turnstileToken?: string,
  ) => Promise<User>;
  register: (
    email: string,
    password: string,
    confirmPassword: string,
    turnstileToken?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: "idle",
  error: null,

  async login(email, password, turnstileToken) {
    set({ status: "loading", error: null });
    try {
      // 1. Authenticate and get a user built from the JWT claims.
      const user = await authApi.login({
        email,
        password,
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
      });
      set({ user, status: "authenticated" });

      // 2. Fire-and-forget: enrich with the full profile.
      //    The UI can render immediately; the header fills in the
      //    email a moment later.
      void authApi
        .me()
        .then((full) => {
          // Only apply if the same user is still logged in.
          if (get().user?.id === full.id) {
            set({ user: { ...get().user, ...full } });
          }
        })
        .catch(() => {
          // Non-fatal. The minimal user is still usable.
        });

      return user;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Login failed";
      set({ status: "anonymous", error: message });
      throw err;
    }
  },

  async register(email, password, confirmPassword, turnstileToken) {
    set({ status: "loading", error: null });
    try {
      await authApi.register({
          email,
          password,
          confirm_password: confirmPassword,
          ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
          username: ""
      });
      // Registration does NOT auto-login. The user must verify
      // their email, then sign in. Return to anonymous so the
      // register wizard can advance to step 3.
      set({ status: "anonymous" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Registration failed";
      set({ status: "anonymous", error: message });
      throw err;
    }
  },

  async logout() {
    try {
      await authApi.logout();
    } finally {
      tokenStore.clear();
      set({ user: null, status: "anonymous", error: null });
    }
  },

  async hydrate() {
    set({ status: "loading" });
    try {
      // 1. Silent refresh using the httpOnly cookie.
      await authApi.refresh();

      // 2. Fetch the full profile — this is where email, username,
      //    display_name, avatar_url come from.
      const full = await authApi.me();
      set({ user: full, status: "authenticated" });
    } catch {
      tokenStore.clear();
      set({ user: null, status: "anonymous" });
    }
  },

  clearError() {
    set({ error: null });
  },
}));

setUnauthorizedHandler(() => {
  tokenStore.clear();
  useAuthStore.setState({
    user: null,
    status: "anonymous",
    error: null,
  });
});