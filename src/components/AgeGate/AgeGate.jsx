import React, { useEffect, useState } from "react";
import "./AgeGate.css";

const AGE_GATE_STORAGE_KEY = "gasMap_ageConfirmed_v1";

export default function AgeGate() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const confirmed = localStorage.getItem(AGE_GATE_STORAGE_KEY);

    if (confirmed === "true") {
      setStatus("confirmed");
      return;
    }

    setStatus("pending");
  }, []);

  const confirmAge = () => {
    localStorage.setItem(AGE_GATE_STORAGE_KEY, "true");
    setStatus("confirmed");
  };

  const denyAge = () => {
    setStatus("denied");
  };

  if (status === "checking" || status === "confirmed") {
    return null;
  }

  return (
    <div className="age-gate-overlay" role="dialog" aria-modal="true">
      <div className="age-gate-card">
        <div className="age-gate-badge">21+</div>

        {status === "pending" ? (
          <>
            <p className="age-gate-eyebrow">Age Restricted Website</p>

            <h2>Are you 21 or older?</h2>

            <p className="age-gate-copy">
              You must be at least 21 years old to enter this website. By
              entering, you confirm that you are of legal age and agree to our
              Terms and Privacy Policy.
            </p>

            <div className="age-gate-links">
              <a href="/terms">Terms</a>
              <span>•</span>
              <a href="/privacy">Privacy Policy</a>
            </div>

            <div className="age-gate-actions">
              <button
                type="button"
                className="age-gate-confirm"
                onClick={confirmAge}
              >
                I Am 21+
              </button>

              <button
                type="button"
                className="age-gate-deny"
                onClick={denyAge}
              >
                I Am Not 21
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="age-gate-eyebrow">Access Restricted</p>

            <h2>You must be 21+ to enter.</h2>

            <p className="age-gate-copy">
              This website is intended only for adults who are 21 years of age
              or older.
            </p>

            <a className="age-gate-exit" href="https://www.google.com">
              Leave Website
            </a>
          </>
        )}
      </div>
    </div>
  );
}