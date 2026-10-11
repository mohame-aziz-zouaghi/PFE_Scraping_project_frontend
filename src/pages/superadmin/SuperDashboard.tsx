import { useQuery } from "@tanstack/react-query";
import { getMatchStats } from "@/api/admin";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

function Stat({
  label,
  value,
  tone = "gray",
}: {
  label: string;
  value: string | number;
  tone?: "gray" | "brand" | "success" | "warning" | "danger";
}) {
  return (
    <Card>
      <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-text-primary">{value}</span>
        <Badge tone={tone}>&nbsp;</Badge>
      </div>
    </Card>
  );
}

export default function SuperDashboard() {
  const statsQuery = useQuery({
    queryKey: ["super", "match-stats"],
    queryFn: getMatchStats,
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Super admin dashboard
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Matching pipeline health and destructive operations
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Pairs total"
          value={statsQuery.data?.candidates_found ?? "\u2014"}
          tone="brand"
        />
        <Stat
          label="Accepted"
          value={statsQuery.data?.auto_accepted ?? "\u2014"}
          tone="success"
        />
        <Stat
          label="Rejected"
          value={statsQuery.data?.rule_rejected ?? "\u2014"}
          tone="warning"
        />
        <Stat
          label="Errors"
          value={statsQuery.data?.errors ?? "\u2014"}
          tone={(statsQuery.data?.errors ?? 0) > 0 ? "danger" : "success"}
        />
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-text-primary mb-3">
          LLM verification
        </h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-text-muted">Checked</div>
            <div className="text-lg font-semibold">
              {statsQuery.data?.llm_checked ?? "\u2014"}
            </div>
          </div>
          <div>
            <div className="text-xs text-text-muted">Accepted</div>
            <div className="text-lg font-semibold text-emerald-600">
              {statsQuery.data?.llm_accepted ?? "\u2014"}
            </div>
          </div>
          <div>
            <div className="text-xs text-text-muted">Rejected</div>
            <div className="text-lg font-semibold text-amber-600">
              {statsQuery.data?.llm_rejected ?? "\u2014"}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}