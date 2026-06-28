import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import "../Auth/AuthPages.css";

export default function PortalDashboard() {
  const navigate = useNavigate();
  const { user, profile, isApproved, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const status = profile?.verification_status || "unsubmitted";

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-one"></div>
      <div className="auth-orb auth-orb-two"></div>

      <section className="portal-card">
        <span className="auth-eyebrow">Customer Portal</span>

        <h1>Your Account</h1>

        <div className="portal-grid">
          <div className="portal-panel">
            <span>Email</span>
            <strong>{user?.email}</strong>
          </div>

          <div className="portal-panel">
            <span>Verification Status</span>
            <strong className={`status-pill status-${status}`}>
              {status}
            </strong>
          </div>

          <div className="portal-panel">
            <span>Age Verified</span>
            <strong>{profile?.age_verified ? "Yes" : "No"}</strong>
          </div>

          <div className="portal-panel">
            <span>Order Access</span>
            <strong>{isApproved ? "Approved" : "Pending Approval"}</strong>
          </div>
        </div>

        {!isApproved && (
          <div className="portal-alert">
            Your account must be ID approved before final order confirmation.
            The ID upload step will be connected next.
          </div>
        )}

        {isApproved && (
          <div className="portal-alert portal-alert-success">
            Your account is approved. You can complete checkout.
          </div>
        )}

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