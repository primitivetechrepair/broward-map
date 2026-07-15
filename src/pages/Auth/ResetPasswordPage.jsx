import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import "./AuthPages.css";

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const checkRecoverySession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        setErrorMessage(
          "The recovery link could not be verified. Request a new link."
        );
        setIsCheckingSession(false);
        return;
      }

      setHasRecoverySession(Boolean(data.session));
      setIsCheckingSession(false);
    };

    checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === "PASSWORD_RECOVERY" || session) {
        setHasRecoverySession(true);
        setIsCheckingSession(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const updateForm = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setStatusMessage("");
    setErrorMessage("");

    if (!hasRecoverySession) {
      setErrorMessage(
        "This recovery link is invalid or expired. Request a new link."
      );
      return;
    }

    if (form.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.updateUser({
      password: form.password,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setStatusMessage("Password updated successfully. Redirecting to login...");

    await supabase.auth.signOut();

    window.setTimeout(() => {
      navigate("/login", {
        replace: true,
      });
    }, 1200);
  };

  if (isCheckingSession) {
    return (
      <div className="auth-page">
        <div className="auth-orb auth-orb-one"></div>
        <div className="auth-orb auth-orb-two"></div>

        <section className="auth-card">
          <span className="auth-eyebrow">Account Recovery</span>

          <h1>Checking Link</h1>

          <p>Verifying your password recovery session.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-one"></div>
      <div className="auth-orb auth-orb-two"></div>

      <section className="auth-card">
        <span className="auth-eyebrow">Account Recovery</span>

        <h1>Create New Password</h1>

        <p>
          Choose a new password for your account. This applies to customers and
          administrators.
        </p>

        {hasRecoverySession ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              New Password
              <input
                type="password"
                value={form.password}
                onChange={(e) => updateForm("password", e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            <label>
              Confirm New Password
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) =>
                  updateForm("confirmPassword", e.target.value)
                }
                placeholder="Confirm new password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            {statusMessage && (
              <div className="auth-success">{statusMessage}</div>
            )}

            {errorMessage && (
              <div className="auth-error">{errorMessage}</div>
            )}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </form>
        ) : (
          <>
            <div className="auth-error">
              This recovery link is invalid or expired.
            </div>

            <div className="auth-switch">
              <Link to="/forgot-password">Request a new recovery link</Link>
            </div>
          </>
        )}

        <div className="auth-switch">
          <Link to="/login">Back to Login</Link>
        </div>
      </section>
    </div>
  );
}