import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Map from "./components/Map/Map";
import Header from "./components/Header";
import MobileHeader from "./components/MobileHeader/MobileHeader";

import ProductsPage from "./pages/ProductsPage";
import CheckoutPage from "./pages/CheckoutPage/CheckoutPage";

import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import PortalDashboard from "./pages/Portal/PortalDashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";

import "./App.css";

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

  const showBackground = !noGlobalBackgroundRoutes.includes(location.pathname);

  return (
    <>
      {showBackground && (
        <div className="app-background-wrapper">
          <div className="app-background"></div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="mobile-header-wrapper">
        <MobileHeader />
      </div>

      {/* Desktop Header */}
      <div className="desktop-header-wrapper">
        <Header />
      </div>

      <main className="page-content">
        <Routes>
          <Route path="/" element={<Map />} />

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
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  );
}