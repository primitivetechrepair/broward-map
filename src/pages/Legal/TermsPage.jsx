import React from "react";
import "./LegalPages.css";

export default function TermsPage() {
  return (
    <section className="legal-page">
      <div className="legal-page-inner">
        <p className="legal-eyebrow">Legal</p>

        <h1>Terms of Use</h1>

        <div className="legal-card">
          <p>
            By accessing this website, you confirm that you are at least 21
            years old and legally permitted to view age-restricted content in
            your location.
          </p>

          <h2>Age Restricted Access</h2>
          <p>
            This website is intended only for adults who are 21 years of age or
            older. If you are not 21 or older, you may not use this website.
          </p>

          <h2>Service Availability</h2>
          <p>
            Delivery coverage, product availability, fees, and estimated times
            may vary by location and may change at any time.
          </p>

          <h2>Account and Order Information</h2>
          <p>
            You agree to provide accurate information when creating an account,
            placing an order, or submitting verification details.
          </p>

          <h2>No Unauthorized Use</h2>
          <p>
            You may not misuse this website, attempt to bypass verification, or
            use the website for unlawful purposes.
          </p>

          <h2>Updates</h2>
          <p>
            These Terms may be updated from time to time. Continued use of the
            website means you accept the updated Terms.
          </p>
        </div>
      </div>
    </section>
  );
}