import Card from "@/components/ui/Card";

export default function SuperAudit() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Audit log</h1>
        <p className="text-sm text-text-muted mt-1">
          Every destructive operation with actor and timestamp
        </p>
      </div>

      <Card>
        <p className="text-sm text-text-muted">
          Audit log will appear here once the backend exposes a{" "}
          <code className="bg-surface-overlay px-1 rounded">/audit</code> endpoint.
        </p>
      </Card>
    </div>
  );
}