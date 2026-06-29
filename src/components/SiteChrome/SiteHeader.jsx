import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import "./SiteChrome.css";

const SUPPORT_EMAIL = "YOUR_SUPPORT_EMAIL";

export default function SiteHeader({ compact = false }) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    closeMenu();
    navigate("/", { replace: true });
  };

  return (
    <header className={`site-header ${compact ? "site-header-compact" : ""}`}>
      <div className="site-header-inner">
        <button
          type="button"
          className="site-brand"
          onClick={() => {
            closeMenu();
            navigate("/");
          }}
          aria-label="Go to delivery map"
        >
          <span className="site-brand-mark">THC</span>

<span>
  <strong>The High Council</strong>
  <small>A Higher Order.</small>
</span>
        </button>

        <button
          type="button"
          className={`site-menu-toggle ${menuOpen ? "is-open" : ""}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`site-nav ${menuOpen ? "is-open" : ""}`}>
          <NavLink to="/" onClick={closeMenu}>
            Map
          </NavLink>

          <NavLink to="/products" onClick={closeMenu}>
            Products
          </NavLink>

          {user && (
            <NavLink to="/portal/orders" onClick={closeMenu}>
              My Orders
            </NavLink>
          )}

          {user && (
            <NavLink to="/portal" onClick={closeMenu}>
              Account
            </NavLink>
          )}

          <a href={`mailto:${SUPPORT_EMAIL}`} onClick={closeMenu}>
            Support
          </a>

          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy Policy</a>

          {!user ? (
            <NavLink className="site-nav-cta" to="/login" onClick={closeMenu}>
              Login
            </NavLink>
          ) : (
            <button type="button" className="site-nav-cta" onClick={handleSignOut}>
              Sign Out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}