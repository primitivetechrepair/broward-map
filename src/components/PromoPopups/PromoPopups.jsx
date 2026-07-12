// src/components/PromoPopups/PromoPopups.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import "./PromoPopups.css";

const HOT_ITEM_STORAGE_KEY = "thc_hot_item_popup_seen_at";
const NEWSLETTER_STORAGE_KEY = "thc_newsletter_popup_seen_at";

const ONE_DAY = 24 * 60 * 60 * 1000;
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function recentlySeen(key, limitMs) {
  const saved = Number(localStorage.getItem(key) || 0);

  if (!saved) return false;

  return Date.now() - saved < limitMs;
}

function markSeen(key) {
  localStorage.setItem(key, String(Date.now()));
}

export default function PromoPopups({ city = "" }) {
  const navigate = useNavigate();

  const [hotItemPromo, setHotItemPromo] = useState(null);
  const [newsletterPromo, setNewsletterPromo] = useState(null);
  const [activePopup, setActivePopup] = useState(null);
  const [newsletterContact, setNewsletterContact] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState("");
  const [isSubmittingNewsletter, setIsSubmittingNewsletter] = useState(false);

  const shouldShowHotItem = useMemo(() => {
    return !recentlySeen(HOT_ITEM_STORAGE_KEY, ONE_DAY);
  }, []);

  const shouldShowNewsletter = useMemo(() => {
    return !recentlySeen(NEWSLETTER_STORAGE_KEY, SEVEN_DAYS);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadPromo = async () => {
  const { data, error } = await supabase
    .from("site_promos")
    .select(
  "promo_key, eyebrow, title, description, image_url, cta_label, cta_path, display_order, is_active"
)
.in("promo_key", ["hot_item_month", "newsletter_popup"])
.order("display_order", { ascending: true });

  if (!isMounted) return;

  if (error) {
    setHotItemPromo(null);
    setNewsletterPromo(null);
    return;
  }

  const promos = data || [];
const activePromos = promos.filter((promo) => promo.is_active === true);

setHotItemPromo(
  activePromos.find((promo) => promo.promo_key === "hot_item_month") || null
);

setNewsletterPromo(
  activePromos.find((promo) => promo.promo_key === "newsletter_popup") || null
);
};

    loadPromo();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hotItemPromo && !newsletterPromo) return;

    const timer = window.setTimeout(() => {
      if (hotItemPromo && shouldShowHotItem) {
  setActivePopup("hotItem");
  return;
}

if (newsletterPromo && shouldShowNewsletter) {
  setActivePopup("newsletter");
}
    }, 900);

    return () => window.clearTimeout(timer);
  }, [hotItemPromo, newsletterPromo, shouldShowHotItem, shouldShowNewsletter]);

  useEffect(() => {
    if (!activePopup) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [activePopup]);

  const closeHotItem = () => {
    markSeen(HOT_ITEM_STORAGE_KEY);
    setActivePopup(null);

    if (newsletterPromo && shouldShowNewsletter) {
  window.setTimeout(() => {
    setActivePopup("newsletter");
  }, 900);
}
  };

  const closeNewsletter = () => {
    markSeen(NEWSLETTER_STORAGE_KEY);
    setActivePopup(null);
    setNewsletterStatus("");
  };

  const handleHotItemCta = () => {
    markSeen(HOT_ITEM_STORAGE_KEY);
    setActivePopup(null);

    if (hotItemPromo?.cta_path) {
      navigate(hotItemPromo.cta_path);
    }
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();

    const contact = newsletterContact.trim();

    setNewsletterStatus("");

    if (!contact) {
      setNewsletterStatus("Enter your phone or email to join.");
      return;
    }

    setIsSubmittingNewsletter(true);

    const { error } = await supabase.from("newsletter_signups").insert({
      contact,
      source: "newsletter_popup",
      offer_code: newsletterPromo?.cta_path || "FIRST10",
      city: city || null,
    });

    setIsSubmittingNewsletter(false);

    if (error) {
      setNewsletterStatus("Something went wrong. Please try again.");
      return;
    }

    markSeen(NEWSLETTER_STORAGE_KEY);
    setNewsletterContact("");
    setNewsletterStatus(
  `You’re in. Use ${newsletterPromo?.cta_path || "FIRST10"} on your first order.`
);

    window.setTimeout(() => {
      setActivePopup(null);
      setNewsletterStatus("");
    }, 1400);
  };

  if (!activePopup) return null;

  const popup = (
    <div
      className="promo-popup-overlay"
      onClick={() => {
        if (activePopup === "hotItem") closeHotItem();
        if (activePopup === "newsletter") closeNewsletter();
      }}
    >
      <section
        className={`promo-popup-card ${
          activePopup === "newsletter" ? "is-newsletter" : "is-hot-item"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="promo-popup-close"
          onClick={activePopup === "hotItem" ? closeHotItem : closeNewsletter}
          aria-label="Close popup"
        >
          ×
        </button>

        {activePopup === "hotItem" && hotItemPromo && (
          <>
            {hotItemPromo.image_url && (
              <div className="promo-popup-image-wrap">
                <img src={hotItemPromo.image_url} alt={hotItemPromo.title} />
              </div>
            )}

            <div className="promo-popup-copy">
              {hotItemPromo.eyebrow && (
                <span className="promo-popup-eyebrow">
                  {hotItemPromo.eyebrow}
                </span>
              )}

              <h2>{hotItemPromo.title}</h2>

              {hotItemPromo.description && <p>{hotItemPromo.description}</p>}

              <button
                type="button"
                className="promo-popup-primary"
                onClick={handleHotItemCta}
              >
                {hotItemPromo.cta_label || "Shop Now"}
              </button>

              <button
                type="button"
                className="promo-popup-secondary"
                onClick={closeHotItem}
              >
                Maybe Later
              </button>
            </div>
          </>
        )}

        {activePopup === "newsletter" && newsletterPromo && (
  <div className="promo-popup-copy">
    {newsletterPromo.eyebrow && (
      <span className="promo-popup-eyebrow">
        {newsletterPromo.eyebrow}
      </span>
    )}

    <h2>{newsletterPromo.title}</h2>

    {newsletterPromo.description && <p>{newsletterPromo.description}</p>}

            <form
              className="promo-newsletter-form"
              onSubmit={handleNewsletterSubmit}
            >
              <input
                type="text"
                value={newsletterContact}
                onChange={(e) => setNewsletterContact(e.target.value)}
                placeholder="Phone or email"
              />

              {newsletterStatus && (
                <div className="promo-newsletter-status">
                  {newsletterStatus}
                </div>
              )}

              <button
                type="submit"
                className="promo-popup-primary"
                disabled={isSubmittingNewsletter}
              >
                {isSubmittingNewsletter
  ? "Joining..."
  : newsletterPromo.cta_label || "Get 10% Off"}
              </button>
            </form>

            <button
              type="button"
              className="promo-popup-secondary"
              onClick={closeNewsletter}
            >
              No Thanks
            </button>
          </div>
        )}
      </section>
    </div>
  );

  return createPortal(popup, document.body);
}