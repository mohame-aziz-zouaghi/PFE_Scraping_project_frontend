import { useAuth } from "@/hooks/useAuth";
import { roleLabel } from "@/lib/roles";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function Account() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Account</h1>
        <p className="text-sm text-text-muted mt-1">Your profile and settings</p>
      </div>

      <Card>
        <dl className="space-y-4">
          <div>
            <dt className="text-xs font-semibold text-text-muted uppercase">
              Email
            </dt>
            <dd className="mt-1 text-sm text-text-primary">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-text-muted uppercase">
              Role
            </dt>
            <dd className="mt-1">
              <Badge
                tone={
                  user.role === "superadmin"
                    ? "danger"
                    : user.role === "admin"
                      ? "warning"
                      : "gray"
                }
              >
                {roleLabel(user.role)}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-text-muted uppercase">
              Status
            </dt>
            <dd className="mt-1 text-sm text-text-primary">
              {user.is_active ? "Active" : "Inactive"} &middot;{" "}
              {user.is_verified ? "Verified" : "Unverified"}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}