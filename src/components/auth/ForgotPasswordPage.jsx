import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import "./AuthPages.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setStatusMessage("");
    setErrorMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage("Enter the email address connected to your account.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(
        "We could not send the recovery email. Please try again."
      );
      return;
    }

    setStatusMessage(
      "If an account exists for that email, a password recovery link has been sent."
    );
  };

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-one"></div>
      <div className="auth-orb auth-orb-two"></div>

      <section className="auth-card">
        <span className="auth-eyebrow">Account Recovery</span>

        <h1>Reset Password</h1>

        <p>
          Enter the email address used to create your account. We will send a
          secure link to choose a new password.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Account Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              required
            />
          </label>

          {statusMessage && (
            <div className="auth-success">
              {statusMessage}
            </div>
          )}

          {errorMessage && (
            <div className="auth-error">
              {errorMessage}
            </div>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Recovery Link"}
          </button>
        </form>

        <div className="auth-switch">
          Remembered your login? <Link to="/login">Back to Login</Link>
        </div>
      </section>
    </div>
  );
}