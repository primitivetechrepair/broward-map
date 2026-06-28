import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user, loading, profileLoading, isAdmin } = useAuth();

  if (loading || profileLoading) {
    return (
      <div className="auth-route-loading">
        Checking admin access...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/portal" replace />;
  }

  return children;
}