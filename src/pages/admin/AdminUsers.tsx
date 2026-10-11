import Card from "@/components/ui/Card";

export default function AdminUsers() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Users</h1>
        <p className="text-sm text-text-muted mt-1">
          Registered users and roles
        </p>
      </div>

      <Card>
        <p className="text-sm text-text-muted">
          User management will appear here once the backend exposes a users
          listing endpoint.
        </p>
      </Card>
    </div>
  );
}