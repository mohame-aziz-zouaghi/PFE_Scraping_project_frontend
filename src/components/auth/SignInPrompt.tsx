import { Link } from "react-router-dom";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function SignInPrompt({
  open,
  reason,
  onClose,
}: {
  open: boolean;
  reason?: string | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sign in to keep browsing"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Not now
          </Button>
          <Link
            to="/register"
            className="inline-flex items-center h-10 px-4 text-sm font-medium rounded-base bg-surface-overlay text-text-primary border border-border-strong hover:bg-surface"
          >
            Create account
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center h-10 px-4 text-sm font-medium rounded-base bg-brand-600 text-white hover:bg-brand-700"
          >
            Sign in
          </Link>
        </>
      }
    >
      <p className="text-sm text-text-secondary">
        {reason ??
          "You've reached the free preview limit. Create a free account to see every product across all sites."}
      </p>
      <ul className="mt-4 space-y-2 text-sm text-text-muted">
        <li>· Unlimited browsing across 6 retailers</li>
        <li>· Price alerts on any product</li>
        <li>· Cross-site price comparison</li>
      </ul>
    </Modal>
  );
}