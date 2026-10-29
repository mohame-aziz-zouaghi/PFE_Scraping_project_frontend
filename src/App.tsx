import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import ShopperLayout from "@/components/layout/ShopperLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";
import SuperAdminRoute from "@/components/auth/SuperAdminRoute";
import AnonymousOnlyRoute from "@/components/auth/AnonymousOnlyRoute";

import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";

import Home from "@/pages/shopper/Home";
import Products from "@/pages/shopper/Products";
import ProductDetail from "@/pages/shopper/ProductDetail";
import Search from "@/pages/shopper/Search";
import Alerts from "@/pages/shopper/Alerts";
import Account from "@/pages/shopper/Account";
import NotFound from "@/pages/shopper/NotFound";
import Forbidden from "@/pages/shopper/Forbidden";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminAlerts from "@/pages/admin/AdminAlerts";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminUsers from "@/pages/admin/AdminUsers";

import SuperDashboard from "@/pages/superadmin/SuperDashboard";
import SuperMatching from "@/pages/superadmin/SuperMatching";
import SuperBackfill from "@/pages/superadmin/SuperBackfill";
import SuperAudit from "@/pages/superadmin/SuperAudit";

import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";   // ← NEW
import VerifyEmail from "./pages/auth/VerifyEmail";
import Wishlist from "./pages/shopper/wishlist";
import { ChatLauncher } from "./components/rag/ChatLauncher";

import "./styles/rag-animations.css";
import CompareProduct from "./pages/shopper/CompareProduct";

export default function App() {
  const hydrate = useAuth().hydrate;

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // ── Notification pipeline ──────────────────────────
  // Mount once. Opens /ws/user and seeds the store.
  // Runs whether the user is authenticated or not — the
  // hook self-skips when there is no token.
  useNotifications();

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public (shopper) ───────────────────── */}
        <Route element={<ShopperLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/403" element={<Forbidden />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/account" element={<Account />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/compare/product/:id" element={<CompareProduct />} />
          </Route>
        </Route>

        {/* ── Auth pages ─────────────────────────── */}
        <Route element={<ShopperLayout />}>
          <Route element={<AnonymousOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
        </Route>

        {/* ── Admin ──────────────────────────────── */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/alerts" element={<AdminAlerts />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
        </Route>

        {/* ── Super admin ────────────────────────── */}
        <Route element={<SuperAdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/super" element={<SuperDashboard />} />
            <Route path="/super/matching" element={<SuperMatching />} />
            <Route path="/super/backfill" element={<SuperBackfill />} />
            <Route path="/super/audit" element={<SuperAudit />} />
          </Route>
        </Route>

        {/* ── Fallback ───────────────────────────── */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
      <ChatLauncher />
    </BrowserRouter>
  );
}