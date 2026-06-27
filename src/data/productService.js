import productinfo from "./productinfo";

/**
 * Find full product info by id
 */
export const getProductInfo = (id) => {
  return productinfo.find(p => p.id === id);
};

/**
 * Centralized THC system
 */
export const getTHCLabel = (product) => {
  const info = getProductInfo(product.id);

  if (product.category === "Flowers" && info?.thcPercent) {
    return `THC ${info.thcPercent}`;
  }

  if (product.category === "Edibles" && info?.thc) {
    return `THC ${info.thc}`;
  }

  return null;
};

/**
 * Flower pricing (grams system)
 */
export const getFlowerPrice = (productId, gram = "3.5") => {
  const info = getProductInfo(productId);
  return info?.grams?.[gram] || null;
};

/**
 * Safe product enrichment for UI
 */
export const enrichProduct = (product) => {
  return {
    ...product,
    thcLabel: getTHCLabel(product),
  };
};