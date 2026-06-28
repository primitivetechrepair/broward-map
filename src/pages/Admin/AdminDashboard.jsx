import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "../Auth/AuthPages.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [verifications, setVerifications] = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const loadVerifications = async () => {
    setLoading(true);
    setActionMessage("");
    setActionError("");

    const { data, error } = await supabase
      .from("id_verifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setActionError(error.message);
      setLoading(false);
      return;
    }

    const rows = data || [];
    setVerifications(rows);

    const userIds = [...new Set(rows.map((row) => row.user_id))];

    if (userIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name, phone, role, verification_status, age_verified")
        .in("id", userIds);

      if (profileError) {
        setActionError(profileError.message);
      } else {
        const profileMap = {};

        (profiles || []).forEach((profile) => {
          profileMap[profile.id] = profile;
        });

        setProfilesById(profileMap);
      }
    } else {
      setProfilesById({});
    }

    setLoading(false);
  };

  useEffect(() => {
    loadVerifications();
  }, []);

  const openIdFile = async (filePath) => {
    setActionError("");

    const { data, error } = await supabase.storage
      .from("id-verifications")
      .createSignedUrl(filePath, 60);

    if (error) {
      setActionError(error.message);
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const updateVerification = async ({ verification, status }) => {
    setActionMessage("");
    setActionError("");

    const approved = status === "approved";

    const { error: verificationError } = await supabase
      .from("id_verifications")
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", verification.id);

    if (verificationError) {
      setActionError(verificationError.message);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        verification_status: status,
        age_verified: approved,
        updated_at: new Date().toISOString(),
      })
      .eq("id", verification.user_id);

    if (profileError) {
      setActionError(profileError.message);
      return;
    }

    setActionMessage(
      approved
        ? "User approved. They can now complete checkout."
        : "User rejected. They must upload a new ID."
    );

    await loadVerifications();
  };

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-one"></div>
      <div className="auth-orb auth-orb-two"></div>

      <section className="portal-card admin-card">
        <span className="auth-eyebrow">Admin Portal</span>

        <h1>Admin</h1>

        <p className="portal-copy">
          Review uploaded ID files, approve verified customers, or reject
          submissions that need to be uploaded again.
        </p>

        {actionMessage && (
          <div className="auth-success">
            {actionMessage}
          </div>
        )}

        {actionError && (
          <div className="auth-error">
            {actionError}
          </div>
        )}

        <div className="admin-toolbar">
          <button type="button" onClick={loadVerifications}>
            Refresh Reviews
          </button>

          <button type="button" onClick={() => navigate("/")}>
            Back To Map
          </button>

          <button type="button" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>

        <div className="admin-review-list">
          {loading ? (
            <div className="portal-alert">
              Loading ID reviews...
            </div>
          ) : verifications.length === 0 ? (
            <div className="portal-alert">
              No ID submissions yet.
            </div>
          ) : (
            verifications.map((verification) => {
              const profile = profilesById[verification.user_id];
              const status = verification.status;

              return (
                <article
                  key={verification.id}
                  className={`admin-review-card review-${status}`}
                >
                  <div className="admin-review-top">
                    <div>
                      <span className="auth-eyebrow">ID Review</span>

                      <h2>
                        {profile?.full_name || profile?.email || "Customer"}
                      </h2>

                      <p>
                        {profile?.email || "No email found"}
                        {profile?.phone ? ` · ${profile.phone}` : ""}
                      </p>
                    </div>

                    <strong className={`status-pill status-${status}`}>
                      {status}
                    </strong>
                  </div>

                  <div className="admin-review-meta">
                    <div>
                      <span>Submitted</span>
                      <strong>
                        {new Date(verification.created_at).toLocaleString()}
                      </strong>
                    </div>

                    <div>
                      <span>Customer Status</span>
                      <strong>
                        {profile?.verification_status || "unknown"}
                      </strong>
                    </div>

                    <div>
                      <span>Age Verified</span>
                      <strong>
                        {profile?.age_verified ? "Yes" : "No"}
                      </strong>
                    </div>
                  </div>

                  <div className="admin-review-actions">
                    <button
                      type="button"
                      onClick={() => openIdFile(verification.file_path)}
                    >
                      View ID
                    </button>

                    <button
                      type="button"
                      disabled={status === "approved"}
                      onClick={() =>
                        updateVerification({
                          verification,
                          status: "approved",
                        })
                      }
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      disabled={status === "rejected"}
                      onClick={() =>
                        updateVerification({
                          verification,
                          status: "rejected",
                        })
                      }
                    >
                      Reject
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}