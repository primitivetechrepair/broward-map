import React from "react";
import "./PageHeader.css";

export default function PageHeader({
  title,
  eyebrow,
  subtitle,
  className = "",
}) {
  return (
    <div className={`page-header-card ${className}`}>
      {eyebrow && <div className="page-header-eyebrow">{eyebrow}</div>}

      <h1 className="page-header-title">{title}</h1>

      {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
    </div>
  );
}