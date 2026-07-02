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

const [hotItemForm, setHotItemForm] = useState({
  eyebrow: "",
  title: "",
  description: "",
  image_url: "",
  cta_label: "",
  cta_path: "",
  is_active: false,
});

const [newsletterForm, setNewsletterForm] = useState({
  eyebrow: "",
  title: "",
  description: "",
  cta_label: "",
  cta_path: "",
  is_active: false,
});

const [hotItemLoading, setHotItemLoading] = useState(true);
const [hotItemSaving, setHotItemSaving] = useState(false);
const [newsletterLoading, setNewsletterLoading] = useState(true);
const [newsletterSaving, setNewsletterSaving] = useState(false);
const [hotItemUploading, setHotItemUploading] = useState(false);
const [activeAdminTab, setActiveAdminTab] = useState("idReviews");
const [verificationStatusFilter, setVerificationStatusFilter] = useState("pending");

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const updateHotItemForm = (key, value) => {
  setHotItemForm((prev) => ({
    ...prev,
    [key]: value,
  }));
};

const updateNewsletterForm = (key, value) => {
  setNewsletterForm((prev) => ({
    ...prev,
    [key]: value,
  }));
};

const loadHotItemPromo = async () => {
  setHotItemLoading(true);
  setActionError("");

  const { data, error } = await supabase
    .from("site_promos")
    .select(
      "eyebrow, title, description, image_url, cta_label, cta_path, is_active"
    )
    .eq("promo_key", "hot_item_month")
    .maybeSingle();

  setHotItemLoading(false);

  if (error) {
    setActionError(error.message);
    return;
  }

  if (!data) {
    setHotItemForm({
  eyebrow: "Council Pick",
  title: "Featured Drop",
  description: "This month’s selected drop from The High Council.",
  image_url: "/products/hot-item.png",
  cta_label: "Shop Now",
  cta_path: "/products",
  is_active: true,
});

    return;
  }

  setHotItemForm({
    eyebrow: data.eyebrow || "",
    title: data.title || "",
    description: data.description || "",
    image_url: data.image_url || "",
    cta_label: data.cta_label || "",
    cta_path: data.cta_path || "",
    is_active: data.is_active === true,
  });
};

const loadNewsletterPromo = async () => {
  setNewsletterLoading(true);
  setActionError("");

  const { data, error } = await supabase
    .from("site_promos")
    .select("eyebrow, title, description, cta_label, cta_path, is_active")
    .eq("promo_key", "newsletter_popup")
    .maybeSingle();

  setNewsletterLoading(false);

  if (error) {
    setActionError(error.message);
    return;
  }

  if (!data) {
    setNewsletterForm({
      eyebrow: "Members Get First Access",
      title: "Join The List",
      description: "Get drop alerts, menu updates, and 10% off your first order.",
      cta_label: "Get 10% Off",
      cta_path: "FIRST10",
      is_active: true,
    });

    return;
  }

  setNewsletterForm({
    eyebrow: data.eyebrow || "",
    title: data.title || "",
    description: data.description || "",
    cta_label: data.cta_label || "",
    cta_path: data.cta_path || "",
    is_active: data.is_active === true,
  });
};

const uploadHotItemImage = async (file) => {
  if (!file) return;

  setActionMessage("");
  setActionError("");

  if (!file.type.startsWith("image/")) {
    setActionError("Please upload an image file.");
    return;
  }

  const maxSize = 6 * 1024 * 1024;

  if (file.size > maxSize) {
    setActionError("Image is too large. Please upload an image under 6MB.");
    return;
  }

  setHotItemUploading(true);

  const extension = file.name.split(".").pop() || "jpg";
  const safeFileName = `council-pick-${Date.now()}.${extension}`;
  const filePath = `council-picks/${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("promo-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    setHotItemUploading(false);
    setActionError(uploadError.message);
    return;
  }

  const { data } = supabase.storage
    .from("promo-images")
    .getPublicUrl(filePath);

  setHotItemUploading(false);

  if (!data?.publicUrl) {
    setActionError("Image uploaded, but no public URL was returned.");
    return;
  }

  updateHotItemForm("image_url", data.publicUrl);
  setActionMessage("Image uploaded. Click Save Council Pick to publish it.");
};

const saveHotItemPromo = async (e) => {
  e.preventDefault();

  setActionMessage("");
  setActionError("");

  const title = hotItemForm.title.trim();

  if (!title) {
    setActionError("Council Pick title is required.");
    return;
  }

  setHotItemSaving(true);

  const { error } = await supabase.from("site_promos").upsert(
    {
      promo_key: "hot_item_month",
      eyebrow: hotItemForm.eyebrow.trim() || "Council Pick",
      title,
      description: hotItemForm.description.trim() || null,
      image_url: hotItemForm.image_url.trim() || null,
      cta_label: hotItemForm.cta_label.trim() || "Shop Now",
      cta_path: hotItemForm.cta_path.trim() || "/products",
      is_active: hotItemForm.is_active,
      display_order: 1,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "promo_key",
    }
  );

  setHotItemSaving(false);

  if (error) {
    setActionError(error.message);
    return;
  }

  setActionMessage("Council Pick popup updated.");
  await loadHotItemPromo();
};

const saveNewsletterPromo = async (e) => {
  e.preventDefault();

  setActionMessage("");
  setActionError("");

  const title = newsletterForm.title.trim();

  if (!title) {
    setActionError("Newsletter title is required.");
    return;
  }

  setNewsletterSaving(true);

  const { error } = await supabase.from("site_promos").upsert(
    {
      promo_key: "newsletter_popup",
      eyebrow: newsletterForm.eyebrow.trim() || "Members Get First Access",
      title,
      description: newsletterForm.description.trim() || null,
      image_url: null,
      cta_label: newsletterForm.cta_label.trim() || "Get 10% Off",
      cta_path: newsletterForm.cta_path.trim() || "FIRST10",
      is_active: newsletterForm.is_active,
      display_order: 2,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "promo_key",
    }
  );

  setNewsletterSaving(false);

  if (error) {
    setActionError(error.message);
    return;
  }

  setActionMessage("Newsletter popup updated.");
  await loadNewsletterPromo();
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
  loadHotItemPromo();
  loadNewsletterPromo();
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

  const verificationCounts = verifications.reduce(
  (counts, verification) => {
    const status = verification.status || "pending";

    counts.all += 1;
    counts[status] = (counts[status] || 0) + 1;

    return counts;
  },
  {
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  }
);

const activeMarketingCount = [
  hotItemForm.is_active,
  newsletterForm.is_active,
].filter(Boolean).length;

const filteredVerifications =
  verificationStatusFilter === "all"
    ? verifications
    : verifications.filter(
        (verification) =>
          (verification.status || "pending") === verificationStatusFilter
      );

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-one"></div>
      <div className="auth-orb auth-orb-two"></div>

      <section className="portal-card admin-card">
        <span className="auth-eyebrow">The High Council</span>

<h1>Admin Portal</h1>

<p className="portal-copy">
  Manage customer verifications, order access, newsletter offers, and Council Pick promotions from one control room.
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

        <div className="admin-tab-bar">
  <button
    type="button"
    className={activeAdminTab === "idReviews" ? "is-active" : ""}
    onClick={() => setActiveAdminTab("idReviews")}
  >
    <span>ID / Email Verifications</span>

    <strong className="admin-main-tab-badge">
      {verificationCounts.pending}
    </strong>
  </button>

  <button
    type="button"
    className={activeAdminTab === "marketing" ? "is-active" : ""}
    onClick={() => setActiveAdminTab("marketing")}
  >
    <span>Council Marketing</span>

    <strong className="admin-main-tab-badge">
      {activeMarketingCount}
    </strong>
  </button>
</div>

<div className="admin-toolbar">
  <button type="button" onClick={loadVerifications}>
    Refresh Reviews
  </button>

  <button type="button" onClick={() => navigate("/admin/orders")}>
    View Orders
  </button>

  <button type="button" onClick={() => navigate("/")}>
    Back To Map
  </button>

  <button type="button" onClick={handleSignOut}>
    Sign Out
  </button>
</div>



{activeAdminTab === "marketing" && (
  <>
    <div id="admin-marketing" className="admin-marketing-panel">
  <div className="admin-marketing-header">
    <div>
      <span className="auth-eyebrow">Marketing</span>
      <h2>Council Pick Popup</h2>
<p>
  Update the monthly Council Pick promotion without editing code.
</p>
    </div>

    <strong className={`status-pill ${hotItemForm.is_active ? "status-approved" : "status-rejected"}`}>
      {hotItemForm.is_active ? "Active" : "Inactive"}
    </strong>
  </div>

  {hotItemLoading ? (
    <div className="portal-alert">
      Loading Council Pick settings...
    </div>
  ) : (
    <form className="admin-marketing-form" onSubmit={saveHotItemPromo}>
      <label>
        Eyebrow
        <input
          type="text"
          value={hotItemForm.eyebrow}
          onChange={(e) => updateHotItemForm("eyebrow", e.target.value)}
          placeholder="Council Pick"
        />
      </label>

      <label>
        Title
        <input
          type="text"
          value={hotItemForm.title}
          onChange={(e) => updateHotItemForm("title", e.target.value)}
          placeholder="Featured Drop"
        />
      </label>

      <label>
        Description
        <textarea
          value={hotItemForm.description}
          onChange={(e) => updateHotItemForm("description", e.target.value)}
          placeholder="Describe the featured item..."
        />
      </label>

      <div className="admin-marketing-grid">
  <label>
    Upload Image
    <input
  type="file"
  accept="image/*"
  onChange={(e) => {
    uploadHotItemImage(e.target.files?.[0]);
    e.target.value = "";
  }}
/>
  </label>

  <label>
    CTA Label
    <input
      type="text"
      value={hotItemForm.cta_label}
      onChange={(e) => updateHotItemForm("cta_label", e.target.value)}
      placeholder="Shop Now"
    />
  </label>
</div>

<label>
  Image URL
  <input
    type="text"
    value={hotItemForm.image_url}
    onChange={(e) => updateHotItemForm("image_url", e.target.value)}
    placeholder="/products/hot-item.png"
  />
</label>

{hotItemUploading && (
  <div className="portal-alert">
    Uploading image...
  </div>
)}

      <label>
        CTA Path
        <input
          type="text"
          value={hotItemForm.cta_path}
          onChange={(e) => updateHotItemForm("cta_path", e.target.value)}
          placeholder="/products"
        />
      </label>

      <label className="admin-toggle-row">
        <input
          type="checkbox"
          checked={hotItemForm.is_active}
          onChange={(e) => updateHotItemForm("is_active", e.target.checked)}
        />

        <span>
  Show Council Pick popup to customers
</span>
      </label>

      {hotItemForm.image_url && (
        <div className="admin-marketing-preview">
          <span>Image Preview</span>
          <img src={hotItemForm.image_url} alt="Council Pick preview" />
        </div>
      )}

      <button type="submit" disabled={hotItemSaving}>
        {hotItemSaving ? "Saving..." : "Save Council Pick"}
      </button>
    </form>
  )}
</div>

<div className="admin-marketing-panel">
  <div className="admin-marketing-header">
    <div>
      <span className="auth-eyebrow">Marketing</span>
      <h2>Newsletter Popup</h2>
      <p>
        Control the newsletter popup, offer text, and discount code.
      </p>
    </div>

    <strong className={`status-pill ${newsletterForm.is_active ? "status-approved" : "status-rejected"}`}>
      {newsletterForm.is_active ? "Active" : "Inactive"}
    </strong>
  </div>

  {newsletterLoading ? (
    <div className="portal-alert">
      Loading newsletter settings...
    </div>
  ) : (
    <form className="admin-marketing-form" onSubmit={saveNewsletterPromo}>
      <label>
        Eyebrow
        <input
          type="text"
          value={newsletterForm.eyebrow}
          onChange={(e) => updateNewsletterForm("eyebrow", e.target.value)}
          placeholder="Members Get First Access"
        />
      </label>

      <label>
        Title
        <input
          type="text"
          value={newsletterForm.title}
          onChange={(e) => updateNewsletterForm("title", e.target.value)}
          placeholder="Join The List"
        />
      </label>

      <label>
        Description
        <textarea
          value={newsletterForm.description}
          onChange={(e) => updateNewsletterForm("description", e.target.value)}
          placeholder="Get drop alerts, menu updates, and 10% off your first order."
        />
      </label>

      <div className="admin-marketing-grid">
        <label>
          Button Text
          <input
            type="text"
            value={newsletterForm.cta_label}
            onChange={(e) => updateNewsletterForm("cta_label", e.target.value)}
            placeholder="Get 10% Off"
          />
        </label>

        <label>
          Offer Code
          <input
            type="text"
            value={newsletterForm.cta_path}
            onChange={(e) => updateNewsletterForm("cta_path", e.target.value)}
            placeholder="FIRST10"
          />
        </label>
      </div>

      <label className="admin-toggle-row">
        <input
          type="checkbox"
          checked={newsletterForm.is_active}
          onChange={(e) => updateNewsletterForm("is_active", e.target.checked)}
        />

        <span>
          Show Newsletter popup to customers
        </span>
      </label>

      <button type="submit" disabled={newsletterSaving}>
        {newsletterSaving ? "Saving..." : "Save Newsletter Popup"}
      </button>
    </form>
  )}
</div>
  </>
)}
        {activeAdminTab === "idReviews" && (
  <>
    <div className="admin-status-tabs">
      <button
        type="button"
        className={verificationStatusFilter === "pending" ? "is-active" : ""}
        onClick={() => setVerificationStatusFilter("pending")}
      >
        Pending
        <span>{verificationCounts.pending}</span>
      </button>

      <button
        type="button"
        className={verificationStatusFilter === "approved" ? "is-active" : ""}
        onClick={() => setVerificationStatusFilter("approved")}
      >
        Approved
        <span>{verificationCounts.approved}</span>
      </button>

      <button
        type="button"
        className={verificationStatusFilter === "rejected" ? "is-active" : ""}
        onClick={() => setVerificationStatusFilter("rejected")}
      >
        Rejected
        <span>{verificationCounts.rejected}</span>
      </button>

      <button
        type="button"
        className={verificationStatusFilter === "all" ? "is-active" : ""}
        onClick={() => setVerificationStatusFilter("all")}
      >
        All
        <span>{verificationCounts.all}</span>
      </button>
    </div>

    <div className="admin-review-list">
          {loading ? (
            <div className="portal-alert">
              Loading ID reviews...
            </div>
          ) : filteredVerifications.length === 0 ? (
  <div className="portal-alert">
    No {verificationStatusFilter === "all" ? "ID" : verificationStatusFilter} submissions found.
  </div>
) : (
  filteredVerifications.map((verification) => {
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
      </>
      )}
      </section>
    </div>
  );
}