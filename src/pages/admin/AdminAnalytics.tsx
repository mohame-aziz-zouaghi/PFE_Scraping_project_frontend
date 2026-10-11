import Card from "@/components/ui/Card";

export default function AdminAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Analytics</h1>
        <p className="text-sm text-text-muted mt-1">
          Price trends and volatility
        </p>
      </div>

      <Card>
        <p className="text-sm text-text-muted">
          Analytics widgets will appear here once the backend exposes the
          aggregated endpoints. Placeholder for now.
        </p>
      </Card>
    </div>
  );
}