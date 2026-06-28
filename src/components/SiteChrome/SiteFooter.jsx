import React from "react";
import { Link } from "react-router-dom";
import "./SiteChrome.css";

const SUPPORT_EMAIL = "YOUR_SUPPORT_EMAIL";

export default function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <span className="site-brand-mark">GM</span>

          <div>
            <strong>Gas Map</strong>
            <p>
              Premium delivery coverage, product ordering, account verification,
              and order tracking in one secure customer portal.
            </p>
          </div>
        </div>

        <div className="site-footer-grid">
          <div>
            <span>Shop</span>

            <Link to="/">Delivery Map</Link>
            <Link to="/products">Products</Link>
            <Link to="/checkout">Checkout</Link>
          </div>

          <div>
            <span>Account</span>

            <Link to="/portal">Customer Portal</Link>
            <Link to="/portal/orders">My Orders</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Create Account</Link>
          </div>

          <div>
            <span>Support</span>

            <a href={`mailto:${SUPPORT_EMAIL}`}>Email Support</a>
            <Link to="/portal">ID Verification</Link>
            <Link to="/portal/orders">Order Help</Link>
          </div>

          <div>
            <span>Coverage</span>

            <p>South Florida delivery areas.</p>
            <p>Availability, delivery fees, and service areas may vary by city.</p>
          </div>
        </div>

        <div className="site-footer-bottom">
          <p>© {currentYear} Gas Map. All rights reserved.</p>

          <p>
            Account approval and age verification may be required before order
            confirmation.
          </p>
        </div>
      </div>
    </footer>
  );
}