import { api } from "./client";
import { httpRequest, tokenStore } from "@/lib/http";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validation";
import type { Role } from "@/lib/roles";
import { decodeJwt } from "@/lib/jwt";

export interface User {
  id: string;
  /** Empty string until `/auth/me` fills it in. */
  email: string;
  /** Empty string until `/auth/me` fills it in. */
  username: string;
  role: Role;
  tier: "free" | "premium" | "business";
  is_active: boolean;
  is_verified: boolean;
  display_name: string | null;
  avatar_url: string | null;
}

interface LoginTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface RegisterResponse {
  user_id: string;
  email: string;
  username: string;
  verification_expires_at: string;
}

/**
 * Build a User from the JWT claims.
 *
 * Fields present in the token (id, role, tier) are populated
 * immediately. Fields the token doesn't carry (email, username,
 * display_name, avatar_url) start empty and are filled by /auth/me.
 */
function userFromToken(token: string): User | null {
  const claims = decodeJwt(token);
  if (!claims || !claims.sub) return null;
  return {
    id: claims.sub,
    email: "",
    username: "",
    role: (claims.role as Role) ?? "user",
    tier: (claims.tier as User["tier"]) ?? "free",
    is_active: true,
    is_verified: true,
    display_name: null,
    avatar_url: null,
  };
}

export async function login(input: LoginInput): Promise<User> {
  const parsed = loginSchema.parse(input);
  const data = await api.post<LoginTokenResponse>(
    "/auth/login",
    parsed,
    { skipAuth: true, skipRefresh: true },
  );
  tokenStore.set(data.access_token);

  const user = userFromToken(data.access_token);
  if (!user) {
    throw new Error("Invalid access token received from server");
  }
  return user;
}

export async function register(
  input: RegisterInput,
): Promise<RegisterResponse> {
  const parsed = registerSchema.parse(input);
  return api.post<RegisterResponse>("/auth/register", parsed, {
    skipAuth: true,
    skipRefresh: true,
  });
}

export async function logout(): Promise<void> {
  try {
    await api.post<void>("/auth/logout");
  } finally {
    tokenStore.clear();
  }
}

/**
 * Fetch the full user profile. Called on app boot (hydrate) and
 * after login to fill in the fields the JWT doesn't carry.
 */
export async function me(): Promise<User> {
  return api.get<User>("/auth/me");
}

export async function refresh(): Promise<string> {
  const data = await httpRequest<{ access_token: string }>(
    "/auth/refresh",
    {
      method: "POST",
      skipAuth: true,
      skipRefresh: true,
    },
  );
  tokenStore.set(data.access_token);
  return data.access_token;
}

export async function verifyEmail(token: string): Promise<void> {
  return api.post<void>(
    "/auth/verify-email",
    { token },
    { skipAuth: true, skipRefresh: true },
  );
}

export async function resendVerification(
  email: string,
): Promise<{ expires_at: string }> {
  return api.post<{ expires_at: string }>(
    "/auth/resend-verification",
    { email },
    { skipAuth: true, skipRefresh: true },
  );
}