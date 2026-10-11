import Card from "@/components/ui/Card";

export default function SuperBackfill() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Backfill</h1>
        <p className="text-sm text-text-muted mt-1">
          Rebuild canonical_products and base_groups from products
        </p>
      </div>

      <Card>
        <p className="text-sm text-text-muted">
          Backfill runs from the CLI via{" "}
          <code className="bg-surface-overlay px-1 rounded">
            python -m scripts.backfill_canonical_products
          </code>
          . A web trigger will be added once the backend exposes it.
        </p>
      </Card>
    </div>
  );
}