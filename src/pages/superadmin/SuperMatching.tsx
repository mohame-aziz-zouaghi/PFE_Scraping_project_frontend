import { useState } from "react";
import { runMatch, type MatchStats } from "@/api/admin";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";

export default function SuperMatching() {
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState<MatchStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Safe incremental run
  const [maxDistance, setMaxDistance] = useState(0.25);
  const [llmBudget, setLlmBudget] = useState<number | "">("");

  // Destructive run (multi-step)
  const [destructiveOpen, setDestructiveOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [destructiveToken, setDestructiveToken] = useState("");

  const runSafe = async () => {
  setRunning(true);
  setError(null);
  try {
    const res = await runMatch({
      max_distance: maxDistance,
      ...(typeof llmBudget === "number" ? { llm_budget: llmBudget } : {}),
      sync: true,
    });
    if (res.stats) setStats(res.stats);
  } catch (e) {
    setError(e instanceof Error ? e.message : "Match failed");
  } finally {
    setRunning(false);
  }
};

  const runDestructive = async () => {
    if (confirmText !== "YES-DELETE-EVERYTHING") {
      setError("Confirmation text does not match");
      return;
    }
    if (!destructiveToken) {
      setError("Admin token required");
      return;
    }
    setRunning(true);
    setError(null);
    try {
      const res = await runMatch({
        clear_existing: true,
        confirm: confirmText,
        destructive_token: destructiveToken,
        sync: true,
      });
      if (res.stats) setStats(res.stats);
      setDestructiveOpen(false);
      setConfirmText("");
      setDestructiveToken("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Match failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Matching pipeline
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Trigger cross-site matching runs
        </p>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-text-primary mb-4">
          Incremental run
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Max distance"
            type="number"
            step="0.05"
            min="0"
            max="1"
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
          />
          <Input
            label="LLM budget (blank = unlimited)"
            type="number"
            min="0"
            value={llmBudget}
            onChange={(e) =>
              setLlmBudget(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>
        <div className="mt-4">
          <Button onClick={() => void runSafe()} loading={running}>
            Run incremental match
          </Button>
        </div>
      </Card>

      <Card className="border-danger-200 bg-danger-50/30">
        <h2 className="text-sm font-semibold text-danger-700 mb-2">
          Destructive run
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Truncates canonical_products, base_groups, and product_match_pairs,
          then rebuilds from <code>products</code>. Requires role, confirmation
          string, and shared-secret header.
        </p>
        <Button
          variant="danger"
          onClick={() => setDestructiveOpen(true)}
          disabled={running}
        >
          Open destructive controls
        </Button>
      </Card>

      {error && (
        <div className="p-4 rounded-md bg-danger-50 border border-danger-200 text-danger-700 text-sm">
          {error}
        </div>
      )}

      {stats && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">
              Last run stats
            </h2>
            <Badge tone="success">completed</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key}>
                <div className="text-xs text-text-muted">{key}</div>
                <div className="font-medium text-text-primary">{String(value)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal
        open={destructiveOpen}
        onClose={() => {
          setDestructiveOpen(false);
          setConfirmText("");
          setDestructiveToken("");
        }}
        title="Destructive matching run"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setDestructiveOpen(false);
                setConfirmText("");
                setDestructiveToken("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={running}
              onClick={() => void runDestructive()}
              disabled={
                confirmText !== "YES-DELETE-EVERYTHING" ||
                destructiveToken.length === 0
              }
            >
              Confirm and run
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 rounded-md bg-danger-50 border border-danger-200 text-danger-700 text-xs">
            This action will TRUNCATE canonical_products, base_groups, and
            product_match_pairs. Backups are created automatically, but this
            is irreversible without manual restore.
          </div>
          <Input
            label="Type YES-DELETE-EVERYTHING to confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
          <Input
            label="Admin token (X-Admin-Destructive-Token)"
            type="password"
            value={destructiveToken}
            onChange={(e) => setDestructiveToken(e.target.value)}
            hint="Held in memory only. Never stored."
          />
        </div>
      </Modal>
    </div>
  );
}