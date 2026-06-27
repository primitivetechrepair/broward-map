// src/components/Header.jsx
import "./Header.css"; // Desktop only styles
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import LoginModal from "./LoginModal";

export default function Header() {
  const [showLogin, setShowLogin] = useState(false);
  const [showProductsDropdown, setShowProductsDropdown] = useState(false);

  const dropdownRef = useRef(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProductsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="global-header">
      <div className="header-content">
        {/* Logo */}
        <Link to="/" className="logo-container">
          <img src="/logo.png" alt="Logo" className="logo-image" />
        </Link>

        {/* Navigation links + Login */}
        <nav className="header-nav">
          <ul className="nav-links">
            {/* All links on the left side */}
<li>
  <a
    href="https://www.instagram.com/hollywoodcartel__"
    target="_blank"
    rel="noreferrer"
    className="instagram-link"
  >
    Instagram
  </a>
</li>


            <li>
              <Link to="/about">About Us</Link>
            </li>

            {/* Products dropdown */}
            <li className="products" ref={dropdownRef}>
              <button
                className="dropdown-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProductsDropdown((prev) => !prev);
                }}
              >
                Products
              </button>
              <div className={`dropdown-menu ${showProductsDropdown ? "show" : ""}`}>
                <div className="dropdown-arrow" />
                <ul>
                  <li><Link to="/products/product1">Flower</Link></li>
                  <li><Link to="/products/product2">Edibles</Link></li>
                  <li><Link to="/products/product3">Disposables</Link></li>
                  <li><Link to="/products/product3">Vapes</Link></li>
                  <li><Link to="/products/product3">Syringes</Link></li>
                  <li><Link to="/products/product4">Concentrates</Link></li>
                </ul>
              </div>
            </li>

            {/* Login button */}
            <li>
              <button className="login-btn" onClick={() => setShowLogin(true)}>
                Login
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Login Modal */}
      <LoginModal show={showLogin} onClose={() => setShowLogin(false)} />
    </header>
  );
}
