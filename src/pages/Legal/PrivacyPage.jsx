import React from "react";
import "./LegalPages.css";

export default function PrivacyPage() {
  return (
    <section className="legal-page">
      <div className="legal-page-inner">
        <p className="legal-eyebrow">Legal</p>

        <h1>Privacy Policy</h1>

        <div className="legal-card">
          <p>
            This Privacy Policy explains how information may be collected and
            used when you access this website, create an account, submit
            verification information, or place an order.
          </p>

          <h2>Information We May Collect</h2>
          <p>
            We may collect information such as your name, email, phone number,
            delivery details, account information, order details, uploaded
            verification files, and support messages.
          </p>

          <h2>How Information Is Used</h2>
          <p>
            Information may be used to verify eligibility, process orders,
            provide customer support, improve the website, prevent misuse, and
            maintain account security.
          </p>

          <h2>Verification Information</h2>
          <p>
            If verification is required, submitted files or details may be used
            only for review, approval, fraud prevention, and compliance-related
            purposes.
          </p>

          <h2>Data Sharing</h2>
          <p>
            We do not sell personal information. Information may be shared only
            when needed to operate the website, provide service, comply with
            legal obligations, or protect against misuse.
          </p>

          <h2>Data Security</h2>
          <p>
            Reasonable safeguards are used to protect submitted information, but
            no website or online service can guarantee complete security.
          </p>

          <h2>Updates</h2>
          <p>
            This Privacy Policy may be updated from time to time. Continued use
            of the website means you accept the updated policy.
          </p>
        </div>
      </div>
    </section>
  );
}