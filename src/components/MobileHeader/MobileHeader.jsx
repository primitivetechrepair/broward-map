import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./MobileHeader.css";

export default function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  const openLogin = () => {
    setIsLoginOpen(true);
    setIsRegister(false);
  };

  const closeLogin = () => {
    setIsLoginOpen(false);
    setFormData({ email: "", password: "" });
  };

  const handleSwitch = () => {
    setIsRegister(prev => !prev);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add login/register logic here
    closeLogin();
  };

  return (
    <>
      <header className="mobile-header">
        <div className="mobile-header-content">
          {/* Login button on the far left */}
          <button className="mobile-login-btn" onClick={openLogin}>
            Login
          </button>

          {/* Logo centered */}
          <Link to="/" className="mobile-logo">
            <img src="/logo.png" alt="Logo" />
          </Link>

          {/* Hamburger on the far right */}
          <button
            className={`hamburger-btn ${isMenuOpen ? "open" : ""}`}
            onClick={toggleMenu}
            aria-label="Toggle Menu"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>

        {/* Sliding drawer */}
        <div className={`mobile-drawer ${isMenuOpen ? "open" : ""}`}>
          <button className="drawer-close-btn" onClick={toggleMenu} aria-label="Close Menu">
            &times;
          </button>
          <nav className="mobile-nav">
            <ul>
              <li>
                <Link to="/products" onClick={toggleMenu}>Products</Link>
              </li>
              <li>
                <Link to="/about" onClick={toggleMenu}>About Us</Link>
              </li>
              <li>
                <a
                  href="https://www.instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  onClick={toggleMenu}
                >
                  Instagram
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* Overlay behind drawer */}
        {isMenuOpen && <div className="drawer-overlay" onClick={toggleMenu}></div>}
      </header>

      {/* Mobile Login Modal (top-level) */}
      {isLoginOpen && (
        <div className="mobile-account-modal-overlay" onClick={closeLogin}>
          <div className="mobile-account-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ textAlign: "center" }}>
              {isRegister ? "Create Account" : "Login"}
            </h2>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}
            >
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                required
              />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                required
              />
              <button type="submit">{isRegister ? "Register" : "Login"}</button>
            </form>

            <p
              className="switch-btn"
              onClick={handleSwitch}
              style={{ cursor: "pointer", textAlign: "center" }}
            >
              {isRegister ? "Already have an account? Login" : "Don't have an account? Create Account"}
            </p>

            <p
              className="cancel-btn"
              onClick={closeLogin}
              style={{ cursor: "pointer", textAlign: "center" }}
            >
              Cancel
            </p>
          </div>
        </div>
      )}
    </>
  );
}
