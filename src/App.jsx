import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Map from "./components/Map/Map";

import SiteHeader from "./components/SiteChrome/SiteHeader.jsx";
import SiteFooter from "./components/SiteChrome/SiteFooter.jsx";

import ProductsPage from "./pages/ProductsPage";
import CheckoutPage from "./pages/CheckoutPage/CheckoutPage";

import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import PortalDashboard from "./pages/Portal/PortalDashboard";
import PortalOrders from "./pages/Portal/PortalOrders";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminOrders from "./pages/Admin/AdminOrders";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";

import AgeGate from "./components/AgeGate/AgeGate.jsx";
import TermsPage from "./pages/Legal/TermsPage.jsx";
import PrivacyPage from "./pages/Legal/PrivacyPage.jsx";

import "./App.css";
import "./components/PageHeader/PageHeader.css";

function AppWrapper() {
  const location = useLocation();

  const noGlobalBackgroundRoutes = [
    "/products",
    "/checkout",
    "/login",
    "/register",
    "/portal",
    "/admin",
  ];

  const showBackground = !noGlobalBackgroundRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  const isHomePage = location.pathname === "/";

  const isLegalPage =
    location.pathname === "/terms" || location.pathname === "/privacy";

  return (
  <div className={`app-shell ${showBackground ? "has-app-background" : ""}`}>
    {showBackground && (
      <div className="app-background-wrapper">
        <div className="app-background"></div>
      </div>
    )}

    {!isLegalPage && <AgeGate />}

    <SiteHeader />

    <main
  className={`page-content site-main-content ${
    isHomePage ? "home-main-content" : ""
  }`}
>
      <Routes>
  <Route path="/" element={<Map />} />

  <Route path="/terms" element={<TermsPage />} />
  <Route path="/privacy" element={<PrivacyPage />} />

  <Route path="/products" element={<ProductsPage />} />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />

          <Route path="/login" element={<LoginPage />} />

          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/portal"
            element={
              <ProtectedRoute>
                <PortalDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/orders"
            element={
              <ProtectedRoute>
                <PortalOrders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            }
          />
        </Routes>
      </main>

          <SiteFooter />
  </div>
);
}

export default function App() {
  return (
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  );
}