import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "../Auth/AuthPages.css";

export default function PortalDashboard() {
  const navigate = useNavigate();

  const {
    user,
    profile,
    isApproved,
    signOut,
    refreshProfile,
  } = useAuth();

  const [idFile, setIdFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const handleIdUpload = async (e) => {
    e.preventDefault();

    setUploadMessage("");
    setUploadError("");

    if (!user?.id) {
      setUploadError("You must be logged in to upload ID.");
      return;
    }

    if (!idFile) {
      setUploadError("Please choose an ID file first.");
      return;
    }

    setUploading(true);

    const fileExt = idFile.name.split(".").pop();
    const cleanFileName = idFile.name
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9.-]/g, "");

    const filePath = `${user.id}/${Date.now()}-${cleanFileName || `id.${fileExt}`}`;

    const { error: uploadErrorResult } = await supabase.storage
      .from("id-verifications")
      .upload(filePath, idFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: idFile.type,
      });

    if (uploadErrorResult) {
      setUploading(false);
      setUploadError(uploadErrorResult.message);
      return;
    }

    const { error: insertError } = await supabase
      .from("id_verifications")
      .insert({
        user_id: user.id,
        file_path: filePath,
        status: "pending",
      });

    if (insertError) {
      setUploading(false);
      setUploadError(insertError.message);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        verification_status: "pending",
        age_verified: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      setUploading(false);
      setUploadError(profileError.message);
      return;
    }

    await refreshProfile();

    setIdFile(null);
    setUploading(false);
    setUploadMessage("ID uploaded. Your account is now pending review.");
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
          </div>
        )}

        {isApproved && (
          <div className="portal-alert portal-alert-success">
            Your account is approved. You can complete checkout.
          </div>
        )}

        {!isApproved && (
          <form onSubmit={handleIdUpload} className="portal-upload-card">
            <span className="auth-eyebrow">ID Verification</span>

            <h2>Upload ID</h2>

            <p>
              Upload a clear photo or PDF of your ID. Your account will remain
              pending until reviewed.
            </p>

            <label className="portal-upload-drop">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setIdFile(e.target.files?.[0] || null)}
              />

              <strong>{idFile ? idFile.name : "Choose ID File"}</strong>
              <small>Accepted: image or PDF</small>
            </label>

            {uploadMessage && (
              <div className="auth-success">
                {uploadMessage}
              </div>
            )}

            {uploadError && (
              <div className="auth-error">
                {uploadError}
              </div>
            )}

            <button type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Submit ID For Review"}
            </button>
          </form>
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