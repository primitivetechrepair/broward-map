import React, { useState } from "react";
import "../App.css"; // Make sure your modal styles are in App.css

export default function LoginModal({ show, onClose }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSwitch = () => {
    setIsRegister(!isRegister);
    setFormData({ email: "", password: "" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting form:", formData, isRegister ? "Register" : "Login");
    onClose();
  };

  if (!show) return null;

  return (
    <div className="account-modal-overlay" onClick={onClose}>
      <div className="account-modal" onClick={e => e.stopPropagation()}>
        <h2 style={{ textAlign: "center" }}>{isRegister ? "Create Account" : "Login"}</h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
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

        <p className="switch-btn" onClick={handleSwitch} style={{ cursor: "pointer", textAlign: "center" }}>
          {isRegister ? "Already have an account? Login" : "Don't have an account? Create Account"}
        </p>

        <p className="cancel-btn" onClick={onClose} style={{ cursor: "pointer", textAlign: "center" }}>
          Cancel
        </p>
      </div>
    </div>
  );
}
