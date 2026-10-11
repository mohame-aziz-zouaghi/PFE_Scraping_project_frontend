import { z } from "zod";

// ─── Primitives ────────────────────────────────────────
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Email is too short")
  .max(254, "Email is too long")
  .email("Invalid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a digit");

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(100, "Username is too long")
  .regex(
    /^[a-zA-Z0-9_.-]+$/,
    "Letters, digits, dots, dashes and underscores only",
  );

export const phoneSchema = z
  .string()
  .trim()
  .max(30)
  .regex(/^[0-9+\-() ]*$/, "Invalid phone number");

export const searchQuerySchema = z
  .string()
  .trim()
  .min(1, "Search query cannot be empty")
  .max(200, "Search query is too long")
  .refine((v) => !/[\u0000-\u001F\u007F]/.test(v), {
    message: "Search query contains control characters",
  });

export const uuidSchema = z.string().uuid("Invalid identifier");

export const turnstileTokenSchema = z
  .string()
  .min(1, "Please complete the human verification");

// ─── Auth forms ────────────────────────────────────────
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(128),
  turnstile_token: turnstileTokenSchema.optional(),
});

/**
 * Full registration payload — everything the wizard gathers across
 * its 3 steps, submitted in one call at the end.
 */
export const registerSchema = z
  .object({
    // Step 1 — Identity
    username: usernameSchema,
    display_name: z.string().trim().max(150).optional().or(z.literal("")),
    phone: phoneSchema.optional().or(z.literal("")),

    // Step 2 — Account
    email: emailSchema,
    password: passwordSchema,
    confirm_password: z.string(),
    turnstile_token: turnstileTokenSchema.optional(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

// ─── Step-scoped schemas (for the wizard's per-step validation) ──
export const registerStep1Schema = z.object({
  username: usernameSchema,
  display_name: z.string().trim().max(150).optional().or(z.literal("")),
  phone: phoneSchema.optional().or(z.literal("")),
});

export const registerStep2Schema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirm_password: z.string(),
    turnstile_token: turnstileTokenSchema.optional(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterStep1Input = z.infer<typeof registerStep1Schema>;
export type RegisterStep2Input = z.infer<typeof registerStep2Schema>;