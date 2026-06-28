import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import "./SiteChrome.css";

const SUPPORT_EMAIL = "YOUR_SUPPORT_EMAIL";

export default function SiteHeader() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = profile?.role === "admin";

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    closeMenu();
    navigate("/", { replace: true });
  };

  return (
    <header className="site-header">
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
          <span className="site-brand-mark">GM</span>

          <span>
            <strong>Gas Map</strong>
            <small>Premium delivery coverage</small>
          </span>
        </button>

        <button
          type="button"
          className={`site-menu-toggle ${menuOpen ? "is-open" : ""}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
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

          {isAdmin && (
            <NavLink to="/admin/orders" onClick={closeMenu}>
              Admin
            </NavLink>
          )}

          <a href={`mailto:${SUPPORT_EMAIL}`} onClick={closeMenu}>
            Support
          </a>

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