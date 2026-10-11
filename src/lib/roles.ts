export type Role = "user" | "admin" | "superadmin";

const ORDER: Record<Role, number> = {
  user: 0,
  admin: 1,
  superadmin: 2,
};

export function hasRole(
  userRole: Role | undefined | null,
  required: Role,
): boolean {
  if (!userRole) return false;
  return ORDER[userRole] >= ORDER[required];
}

export function isAdmin(role: Role | undefined | null): boolean {
  return hasRole(role, "admin");
}

export function isSuperAdmin(role: Role | undefined | null): boolean {
  return hasRole(role, "superadmin");
}

export function roleLabel(role: Role): string {
  switch (role) {
    case "superadmin":
      return "Super Administrator";
    case "admin":
      return "Administrator";
    case "user":
      return "Shopper";
  }
}