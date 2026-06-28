import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import "../Auth/AuthPages.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-one"></div>
      <div className="auth-orb auth-orb-two"></div>

      <section className="portal-card">
        <span className="auth-eyebrow">Admin Portal</span>

        <h1>Admin</h1>

        <p className="portal-copy">
          Logged in as {user?.email}. Admin order review, user approval, and ID
          verification controls will be connected next.
        </p>

        <div className="portal-grid">
          <div className="portal-panel">
            <span>Users</span>
            <strong>Coming Next</strong>
          </div>

          <div className="portal-panel">
            <span>Orders</span>
            <strong>Coming Next</strong>
          </div>

          <div className="portal-panel">
            <span>ID Reviews</span>
            <strong>Coming Next</strong>
          </div>
        </div>

        <div className="portal-actions">
          <button type="button" onClick={() => navigate("/")}>
            Back To Map
          </button>

          <button type="button" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </section>
    </div>
  );
}
