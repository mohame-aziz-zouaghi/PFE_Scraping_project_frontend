export default function Footer() {
  return (
  <footer className="border-t border-border-subtle bg-surface-elevated mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">PriceMonitor</h3>
            <p className="mt-2 text-sm text-text-muted">
              Compare prices across 6 Tunisian retailers.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Sites</h4>
            <ul className="mt-3 space-y-2 text-sm text-text-muted">
              <li>MegaPC</li>
              <li>Tunisianet</li>
              <li>SBS</li>
              <li>Mytek</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Account
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-text-muted">
              <li>Sign in</li>
              <li>Register</li>
              <li>Alerts</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Legal
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-text-muted">
              <li>Privacy</li>
              <li>Terms</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border-subtle text-xs text-text-muted">
          &copy; {new Date().getFullYear()} PriceMonitor. All rights reserved.
        </div>
      </div>
    </footer>
  );
}