# ============================================================
# fix.ps1 — remove old files, add missing modules
# ============================================================
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " PriceMonitor frontend — fix old paths + add missing files" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ─── Helper ──────────────────────────────────────────────────
function Write-File {
    param(
        [Parameter(Mandatory=$true)][string]$Path,
        [Parameter(Mandatory=$true)][string]$Content
    )
    $absolute = if ([System.IO.Path]::IsPathRooted($Path)) {
        $Path
    } else {
        Join-Path (Get-Location).Path $Path
    }
    $parent = Split-Path -Parent $absolute
    if ($parent -and -not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    $normalized = $Content -replace "`r`n", "`n"
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($absolute, $normalized, $utf8NoBom)
}

# ─── 1. Remove conflicting old files ────────────────────────
# These are the pre-existing skeleton files that reference the
# new modules but live at the old paths. The new tree supersedes them.

$oldFiles = @(
    "src/components/Layout.tsx",
    "src/components/ProtectedRoute.tsx",
    "src/pages/Alerts.tsx",
    "src/pages/Dashboard.tsx",
    "src/pages/Login.tsx",
    "src/pages/Products.tsx",
    "src/pages/register.tsx",
    "src/pages/Register.tsx"
)

$deletedDir = "src._old_deleted_$(Get-Date -Format 'yyyyMMdd-HHmmss')"
if (-not (Test-Path $deletedDir)) {
    New-Item -ItemType Directory -Path $deletedDir -Force | Out-Null
}

foreach ($f in $oldFiles) {
    if (Test-Path $f) {
        $dest = Join-Path $deletedDir ($f -replace "[/\\]", "_")
        Move-Item -Path $f -Destination $dest -Force
        Write-Host "  [moved] $f -> $deletedDir/" -ForegroundColor Yellow
    }
}

# Also remove any orphaned old files under src/pages/ that aren't
# part of the new tree. Anything directly in src/pages/ (not in a
# subfolder) is legacy.
Get-ChildItem -Path "src/pages" -File -ErrorAction SilentlyContinue | ForEach-Object {
    $dest = Join-Path $deletedDir $_.Name
    Move-Item -Path $_.FullName -Destination $dest -Force
    Write-Host "  [moved] src/pages/$($_.Name) -> $deletedDir/" -ForegroundColor Yellow
}

Get-ChildItem -Path "src/components" -File -ErrorAction SilentlyContinue | ForEach-Object {
    $dest = Join-Path $deletedDir $_.Name
    Move-Item -Path $_.FullName -Destination $dest -Force
    Write-Host "  [moved] src/components/$($_.Name) -> $deletedDir/" -ForegroundColor Yellow
}

# Remove src/api/ files not in the new whitelist (older auth.ts etc.
# were overwritten by the setup script, this is defensive).
$validApi = @("auth.ts", "client.ts", "products.ts", "alerts.ts", "admin.ts", "compare.ts", "monitoring.ts")
Get-ChildItem -Path "src/api" -File -ErrorAction SilentlyContinue | ForEach-Object {
    if ($validApi -notcontains $_.Name) {
        Move-Item -Path $_.FullName -Destination (Join-Path $deletedDir $_.Name) -Force
        Write-Host "  [moved] src/api/$($_.Name) -> $deletedDir/" -ForegroundColor Yellow
    }
}

# Remove src/store/ files not named auth.ts
Get-ChildItem -Path "src/store" -File -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.Name -ne "auth.ts") {
        Move-Item -Path $_.FullName -Destination (Join-Path $deletedDir $_.Name) -Force
        Write-Host "  [moved] src/store/$($_.Name) -> $deletedDir/" -ForegroundColor Yellow
    }
}

Write-Host "[cleanup] Old files moved to $deletedDir" -ForegroundColor Green
Write-Host ""

# ─── 2. Add missing modules ─────────────────────────────────

# src/api/compare.ts — read-only compare endpoints
Write-File "src/api/compare.ts" @'
import { api } from "./client";

export interface GroupListing {
  product_id: string;
  site: string;
  main_product_id: string | null;
  name: string;
  brand: string | null;
  category: string | null;
  price: number | null;
  discount_price: number | null;
  discount_amount: number | null;
  availability: string | null;
  url: string;
  main_image: string | null;
  last_checked: string | null;
}

export interface GroupDetail {
  group_id: string;
  canonical_name: string;
  canonical_brand: string | null;
  canonical_category: string | null;
  variant_signature: Record<string, unknown> | null;
  product_count: number;
  site_count: number;
  confidence: number;
  base_group_id: string | null;
  cheapest_site: string | null;
  cheapest_price: number | null;
  most_expensive_price: number | null;
  savings_amount: number | null;
  savings_percent: number | null;
  listings: GroupListing[];
}

export interface VariantInBase {
  group_id: string;
  canonical_name: string;
  variant_signature: Record<string, unknown> | null;
  product_count: number;
  site_count: number;
  cheapest_price: number | null;
  cheapest_site: string | null;
}

export interface BaseGroupDetail {
  base_group_id: string;
  base_name: string;
  base_brand: string | null;
  base_category: string | null;
  variant_count: number;
  site_count: number;
  total_product_count: number;
  overall_cheapest_price: number | null;
  overall_cheapest_site: string | null;
  variants: VariantInBase[];
}

export interface ProductGroupResponse {
  product_id: string;
  group_id: string | null;
  base_group_id: string | null;
  canonical_name: string | null;
  site_count: number;
  listings: GroupListing[];
}

export interface CheapestResult {
  base_group_id: string;
  base_name: string;
  variant_count: number;
  site_count: number;
  cheapest_site: string;
  cheapest_price: number;
}

export interface CheapestResponse {
  query: string;
  count: number;
  results: CheapestResult[];
}

export async function getProductGroup(
  productId: string,
): Promise<ProductGroupResponse> {
  return api.get<ProductGroupResponse>(`/compare/product/${productId}`);
}

export async function getGroupDetail(
  canonicalId: string,
): Promise<GroupDetail> {
  return api.get<GroupDetail>(`/compare/group/${canonicalId}`);
}

export async function getBaseGroupDetail(
  baseId: string,
): Promise<BaseGroupDetail> {
  return api.get<BaseGroupDetail>(`/compare/base/${baseId}`);
}

export async function cheapestForQuery(
  query: string,
  limit = 10,
  maxDistance = 0.5,
): Promise<CheapestResponse> {
  return api.get<CheapestResponse>("/compare/cheapest", {
    query: { q: query, limit, max_distance: maxDistance },
  });
}
'@

# src/api/monitoring.ts — health and batch stats
Write-File "src/api/monitoring.ts" @'
import { api } from "./client";

export interface HealthResponse {
  status: string;
  [key: string]: unknown;
}

export interface BatchRow {
  id: string;
  site: string;
  batch_type: string;
  status: string;
  total_products: number;
  processed_products: number;
  changed_products: number;
  error_products: number;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
}

export async function getHealth(): Promise<HealthResponse> {
  return api.get<HealthResponse>("/health");
}

export async function listBatches(): Promise<BatchRow[]> {
  return api.get<BatchRow[]>("/monitoring/batches");
}
'@

# src/components/ui/PageHeader.tsx — reusable page header for admin pages
Write-File "src/components/ui/PageHeader.tsx" @'
import type { ReactNode } from "react";

export default function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
'@

Write-Host "[files] Added missing modules (api/compare, api/monitoring, ui/PageHeader)" -ForegroundColor Green
Write-Host ""

# ─── 3. Verify key files exist ──────────────────────────────

$required = @(
    "src/main.tsx",
    "src/App.tsx",
    "src/index.css",
    "src/vite-env.d.ts",
    "src/lib/env.ts",
    "src/lib/http.ts",
    "src/lib/roles.ts",
    "src/lib/format.ts",
    "src/lib/validation.ts",
    "src/lib/turnstile.ts",
    "src/store/auth.ts",
    "src/hooks/useAuth.ts",
    "src/hooks/useEventLogger.ts",
    "src/api/client.ts",
    "src/api/auth.ts",
    "src/api/products.ts",
    "src/api/alerts.ts",
    "src/api/admin.ts",
    "src/api/compare.ts",
    "src/api/monitoring.ts",
    "src/components/ui/Button.tsx",
    "src/components/ui/Input.tsx",
    "src/components/ui/Badge.tsx",
    "src/components/ui/Card.tsx",
    "src/components/ui/Spinner.tsx",
    "src/components/ui/EmptyState.tsx",
    "src/components/ui/ErrorState.tsx",
    "src/components/ui/Modal.tsx",
    "src/components/auth/ProtectedRoute.tsx",
    "src/components/auth/AdminRoute.tsx",
    "src/components/auth/SuperAdminRoute.tsx",
    "src/components/auth/AnonymousOnlyRoute.tsx",
    "src/components/layout/Header.tsx",
    "src/components/layout/Footer.tsx",
    "src/components/layout/ShopperLayout.tsx",
    "src/components/layout/AdminLayout.tsx",
    "src/components/layout/AdminSidebar.tsx",
    "src/components/layout/AdminTopbar.tsx",
    "src/components/product/ProductCard.tsx",
    "src/components/product/ProductGrid.tsx",
    "src/components/product/ProductFilters.tsx",
    "src/components/product/PriceBadge.tsx",
    "src/components/product/SiteBadge.tsx",
    "src/pages/auth/Login.tsx",
    "src/pages/auth/Register.tsx",
    "src/pages/shopper/Home.tsx",
    "src/pages/shopper/Products.tsx",
    "src/pages/shopper/ProductDetail.tsx",
    "src/pages/shopper/Search.tsx",
    "src/pages/shopper/Alerts.tsx",
    "src/pages/shopper/Account.tsx",
    "src/pages/shopper/NotFound.tsx",
    "src/pages/shopper/Forbidden.tsx",
    "src/pages/admin/AdminDashboard.tsx",
    "src/pages/admin/AdminProducts.tsx",
    "src/pages/admin/AdminAlerts.tsx",
    "src/pages/admin/AdminAnalytics.tsx",
    "src/pages/admin/AdminUsers.tsx",
    "src/pages/superadmin/SuperDashboard.tsx",
    "src/pages/superadmin/SuperMatching.tsx",
    "src/pages/superadmin/SuperBackfill.tsx",
    "src/pages/superadmin/SuperAudit.tsx"
)

$missing = @()
foreach ($f in $required) {
    if (-not (Test-Path $f)) {
        $missing += $f
    }
}

if ($missing.Count -gt 0) {
    Write-Host "MISSING FILES:" -ForegroundColor Red
    foreach ($m in $missing) {
        Write-Host "  - $m" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Re-run setup.ps1 first, then fix.ps1" -ForegroundColor Yellow
} else {
    Write-Host "[verify] All $($required.Count) required files present" -ForegroundColor Green
}

# ─── 4. Check for @hookform/resolvers ───────────────────────

$pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
$hasResolvers = $pkg.dependencies.'@hookform/resolvers' -or $pkg.devDependencies.'@hookform/resolvers'
if (-not $hasResolvers) {
    Write-Host ""
    Write-Host "[npm] Installing @hookform/resolvers" -ForegroundColor Yellow
    npm install @hookform/resolvers
} else {
    Write-Host "[verify] @hookform/resolvers already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " DONE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " Next:" -ForegroundColor White
Write-Host "   npm run typecheck" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host " Old files moved to: $deletedDir" -ForegroundColor Gray
Write-Host " Delete that folder once you've confirmed everything works." -ForegroundColor Gray
Write-Host ""