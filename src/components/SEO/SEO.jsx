// src/components/SEO/SEO.jsx
import { useEffect } from "react";

const DEFAULT_TITLE = "The High Council | Premium Delivery";
const DEFAULT_DESCRIPTION =
  "Browse The High Council's premium collections, select your delivery city, and enjoy a streamlined ordering experience.";

const getSiteUrl = () => {
  const configuredUrl = String(
    import.meta.env.VITE_SITE_URL || ""
  ).trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
};

const setMetaTag = ({ name, property, content }) => {
  if (!content) return;

  const selector = name
    ? `meta[name="${name}"]`
    : `meta[property="${property}"]`;

  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");

    if (name) {
      element.setAttribute("name", name);
    }

    if (property) {
      element.setAttribute("property", property);
    }

    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
};

const setCanonical = (url) => {
  let canonical = document.head.querySelector('link[rel="canonical"]');

  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }

  canonical.setAttribute("href", url);
};

const setStructuredData = (structuredData) => {
  const scriptId = "page-structured-data";
  let script = document.getElementById(scriptId);

  if (!structuredData) {
    script?.remove();
    return;
  }

  if (!script) {
    script = document.createElement("script");
    script.id = scriptId;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(structuredData);
};

const SEO = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = "/og-image.png",
  type = "website",
  robots = "index,follow",
  structuredData = null,
}) => {
  useEffect(() => {
    const siteUrl = getSiteUrl();
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    const canonicalUrl =
      normalizedPath === "/"
        ? `${siteUrl}/`
        : `${siteUrl}${normalizedPath}`;

    const imageUrl = image.startsWith("http")
      ? image
      : `${siteUrl}${image.startsWith("/") ? image : `/${image}`}`;

    document.title = title;

    setMetaTag({
      name: "description",
      content: description,
    });

    setMetaTag({
      name: "robots",
      content: robots,
    });

    setCanonical(canonicalUrl);

    setMetaTag({
      property: "og:type",
      content: type,
    });

    setMetaTag({
      property: "og:site_name",
      content: "The High Council",
    });

    setMetaTag({
      property: "og:title",
      content: title,
    });

    setMetaTag({
      property: "og:description",
      content: description,
    });

    setMetaTag({
      property: "og:url",
      content: canonicalUrl,
    });

    setMetaTag({
      property: "og:image",
      content: imageUrl,
    });

    setMetaTag({
      property: "og:image:width",
      content: "1200",
    });

    setMetaTag({
      property: "og:image:height",
      content: "630",
    });

    setMetaTag({
      name: "twitter:card",
      content: "summary_large_image",
    });

    setMetaTag({
      name: "twitter:title",
      content: title,
    });

    setMetaTag({
      name: "twitter:description",
      content: description,
    });

    setMetaTag({
      name: "twitter:image",
      content: imageUrl,
    });

    setStructuredData(structuredData);
  }, [
    title,
    description,
    path,
    image,
    type,
    robots,
    structuredData,
  ]);

  return null;
};

export default SEO;