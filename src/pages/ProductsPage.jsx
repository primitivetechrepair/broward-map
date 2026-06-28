// src/pages/ProductsPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import "./ProductsPage.css";
import "./ProductBag.css";

import {
  getFlowerPrice,
  getTHCLabel,
  getProductInfo,
} from "../data/productService";

import PRODUCTS from "../data/products";

const CATEGORIES = [
  "Flowers",
  "Edibles",
  "Disposables",
  "Vapes",
  "Syringes",
  "Concentrates",
  "Peptides",
];

const CATEGORY_IMAGES = {
  Flowers: "/categories/flowers.png",
  Edibles: "/categories/edibles.png",
  Disposables: "/categories/disposables.png",
  Vapes: "/categories/vapes.png",
  Syringes: "/categories/syringes.png",
  Concentrates: "/categories/concentrates.png",
  Peptides: "/categories/peptides.png",
};

export default function ProductsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const bagDockRef = useRef(null);
  const [isBagFloating, setIsBagFloating] = useState(false);

  const {
    cartItems,
    addItem,
    removeItem,
    totalItems,
    totalPrice,
    clearCart,
  } = useCart();

  const [isBagOpen, setIsBagOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);

  const [activeCategory, setActiveCategory] = useState(null);
  const [activeProductId, setActiveProductId] = useState(null);

  const [addedProductId, setAddedProductId] = useState(null);
  const [bagPulseKey, setBagPulseKey] = useState(0);
  const [flyingProduct, setFlyingProduct] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const reorderLoadedRef = useRef(false);
  const [reorderMessage, setReorderMessage] = useState("");

  const [quantities, setQuantities] = useState(
    PRODUCTS.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {})
  );

  const [selectedGrams, setSelectedGrams] = useState({});

  // Defaults for flowers
  useEffect(() => {
    const defaults = {};

    PRODUCTS.forEach((p) => {
      if (p.category === "Flowers") {
        defaults[p.id] = "3.5";
      }
    });

    setSelectedGrams(defaults);
  }, []);

  // City guard
useEffect(() => {
  const city = location.state?.city;
  const fee = location.state?.deliveryFee ?? location.state?.fee;

  if (!city || fee === undefined || fee === null) {
    navigate("/", { replace: true });
    return;
  }

  setSelectedCity(city);
  setDeliveryFee(Number(fee) || 0);
}, [location.state, navigate]);

// Reorder loader
useEffect(() => {
  if (reorderLoadedRef.current) return;
  if (!selectedCity) return;

  const draftFromRoute = location.state?.reorderDraft;

  let draftFromStorage = null;

  try {
    draftFromStorage = JSON.parse(
      sessionStorage.getItem("browardReorderDraft") || "null"
    );
  } catch (error) {
    draftFromStorage = null;
  }

  const reorderDraft = draftFromRoute || draftFromStorage;

  if (!reorderDraft?.items?.length) return;

  reorderLoadedRef.current = true;

  if (typeof clearCart === "function") {
    clearCart();
  }

  reorderDraft.items.forEach((item) => {
    const quantity = Math.max(1, Number(item.quantity || item.qty || 1));

    addItem({
      ...item,
      id: item.id || item.product_id || `${item.name}-${item.gram || ""}`,
      name: item.name,
      gram: item.gram,
      price: Number(item.price || 0),
      quantity,
      category: item.category || "Flowers",
    });
  });

  sessionStorage.removeItem("browardReorderDraft");

  setReorderMessage(
    `Reorder loaded from ${reorderDraft.sourcePaymentMemo || "your previous order"}.`
  );

  setIsBagOpen(true);
}, [selectedCity, location.state, addItem, clearCart]);

// Show floating bag clone after the original bag starts leaving the screen
useEffect(() => {
  if (!selectedCity) return;

  let frameId = null;

  const updateFloatingBag = () => {
    if (frameId) {
      window.cancelAnimationFrame(frameId);
    }

    frameId = window.requestAnimationFrame(() => {
      const dock = bagDockRef.current;

      if (!dock) return;

      const rect = dock.getBoundingClientRect();

      // Detach once the original bag dock is near/above the top of the screen
      setIsBagFloating(rect.top < 16);
    });
  };

  updateFloatingBag();

  window.addEventListener("scroll", updateFloatingBag, {
    passive: true,
    capture: true,
  });

  window.addEventListener("resize", updateFloatingBag);

  return () => {
    window.removeEventListener("scroll", updateFloatingBag, {
      capture: true,
    });

    window.removeEventListener("resize", updateFloatingBag);

    if (frameId) {
      window.cancelAnimationFrame(frameId);
    }
  };
}, [selectedCity]);

  // Product card add animation cleanup
  useEffect(() => {
    if (!addedProductId) return;

    const timer = window.setTimeout(() => {
      setAddedProductId(null);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [addedProductId]);

  // Flying item cleanup
  useEffect(() => {
    if (!flyingProduct) return;

    const timer = window.setTimeout(() => {
      setFlyingProduct(null);
    }, 850);

    return () => window.clearTimeout(timer);
  }, [flyingProduct]);

  const handleQuantityChange = (id, delta) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, prev[id] + delta),
    }));
  };

  const handleAddToBag = (product) => {
    const qty = quantities[product.id];
    if (!qty) return;

    let didAdd = false;

    if (product.category === "Flowers") {
      const gram = selectedGrams[product.id] || "3.5";
      const price = getFlowerPrice(product.id, gram);

      if (!price) return;

      addItem({
        id: `${product.id}-${gram}`,
        baseId: product.id,
        name: product.name,
        gram,
        price,
        quantity: qty,
        category: product.category,
      });

      didAdd = true;
    } else {
      addItem({
        ...product,
        quantity: qty,
      });

      didAdd = true;
    }

    if (didAdd) {
      setAddedProductId(product.id);
      setBagPulseKey((prev) => prev + 1);
      setFlyingProduct({
        id: `${product.id}-${Date.now()}`,
        image: product.image,
        name: product.name,
      });
    }

    setQuantities((prev) => ({ ...prev, [product.id]: 0 }));
  };

  const handleCheckout = () => {
    if (!totalItems) return;

    setIsCheckingOut(true);

    window.setTimeout(() => {
      navigate("/checkout", {
        state: { city: selectedCity, deliveryFee, cartItems },
      });
    }, 260);
  };

  const visibleProducts = activeCategory
    ? PRODUCTS.filter((p) => p.category === activeCategory)
    : [];

  const selectedProduct = getProductInfo(activeProductId);

  if (!selectedCity) return null;

  const renderProductHeading = (title, zoneText = "Premium Menu") => (
  <div className="product-heading-container">
    <h1 className="product-heading">{title}</h1>

    <div className="product-zone">
      {zoneText}
    </div>
  </div>
);

  const bagModal = isBagOpen
    ? createPortal(
        <div
          className="modal-overlay bag-modal-overlay"
          onClick={() => setIsBagOpen(false)}
        >
          <div
            className={`modal-card realistic-bag-modal ${
              cartItems.length === 0 ? "is-empty" : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bag-back-glow"></div>

            <div className="bag-handle">
              <span></span>
            </div>

            <div className="bag-rim"></div>
            <div className="modal-zipper"></div>
            <div className="bag-lining"></div>
            <div className="bag-mouth-shadow"></div>

            <div className="bag-content">
              <div className="bag-header">
                <div>
                  <span className="bag-eyebrow">Delivery Bag</span>
                  <h1>Bag</h1>
                </div>

                <button
                  className="bag-x"
                  onClick={() => setIsBagOpen(false)}
                  aria-label="Close bag"
                >
                  ×
                </button>
              </div>

              <div className="bag-scroll-area">
                {cartItems.length === 0 ? (
                  <div className="modal-empty-state">
                    <div className="empty-bag-illustration" aria-hidden="true">
                      <div className="empty-bag-handle"></div>
                      <div className="empty-bag-body">
                        <span></span>
                      </div>
                    </div>

                    <h2>Your bag is empty</h2>
                    <p>
                      Add products from the stash and they’ll appear here before checkout.
                    </p>
                  </div>
                ) : (
                  cartItems.map((item) => {
                    const itemPrice = Number(item.price) || 0;

                    return (
                      <div key={item.id} className="modal-line-item">
                        <div className="modal-line-info">
                          <strong>
                            {item.name}
                            {item.gram && <span> ({item.gram}g)</span>}
                          </strong>

                          <div className="modal-qty">
                            Qty: {item.quantity} × ${itemPrice.toFixed(2)}
                          </div>
                        </div>

                        <div className="modal-line-price">
                          ${(itemPrice * item.quantity).toFixed(2)}
                        </div>

                        <button
                          className="modal-trash-btn"
                          onClick={() => removeItem(item.id)}
                          aria-label="Remove item"
                        >
                          🗑️
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="modal-totals">
                  <div className="modal-total-row">
                    <span>Subtotal</span>
                    <strong>${totalPrice.toFixed(2)}</strong>
                  </div>

                  <div className="modal-total-row">
                    <span>Delivery</span>
                    <strong>${deliveryFee.toFixed(2)}</strong>
                  </div>

                  <div className="modal-total-row modal-grand-total">
                    <span>Total</span>
                    <strong>${(totalPrice + deliveryFee).toFixed(2)}</strong>
                  </div>
                </div>
              )}

              <div className="modal-actions">
                {cartItems.length > 0 ? (
                  <>
                    <button className="modal-clear" onClick={clearCart}>
                      Clear
                    </button>

                    <button
                      className="modal-close"
                      onClick={() => setIsBagOpen(false)}
                    >
                      Close
                    </button>

                    <button className="modal-checkout" onClick={handleCheckout}>
                      Checkout
                    </button>
                  </>
                ) : (
                  <button
                    className="modal-close"
                    onClick={() => setIsBagOpen(false)}
                  >
                    Continue Shopping
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div
      className={`products-page page-enter ${
        isCheckingOut ? "page-leave" : ""
      }`}
    >
      {flyingProduct && (
        <div
          className="flying-bag-item"
          key={flyingProduct.id}
          aria-hidden="true"
        >
          <img src={flyingProduct.image} alt="" />
        </div>
      )}

      {renderProductHeading("The Stash", "Delivery Menu")}

      {reorderMessage && (
  <div className="reorder-loaded-banner">
    <strong>Reorder Ready</strong>
    <p>{reorderMessage}</p>
  </div>
)}

      {/* DELIVERY */}
      <div className="delivery-card">
        <div className="delivery-row city-row">
          <span className="label">City</span>
          <span className="value">{selectedCity}</span>

          <button className="change-city-btn" onClick={() => navigate("/")}>
            Change
          </button>
        </div>

        <div className="delivery-row">
          <span className="label">Delivery Fee</span>
          <span>${deliveryFee.toFixed(2)}</span>
        </div>

        <div className="delivery-row total-row">
          <span>Total</span>
          <span>${(totalPrice + deliveryFee).toFixed(2)}</span>
        </div>

        <div ref={bagDockRef} className="bag-dock">
  <div className="bag-row">
    <span className={`bag-hint ${totalItems === 0 ? "is-empty" : ""}`}>
      {totalItems > 0
        ? `${totalItems} item${totalItems !== 1 ? "s" : ""} in bag`
        : "Bag is empty"}
    </span>

    <button
      key={bagPulseKey}
      className={`bag-btn ${totalItems > 0 ? "has-items" : "is-empty"}`}
      onClick={() => setIsBagOpen(true)}
      aria-label="Open bag"
    >
      <span className="bag-icon">👜</span>

      {totalItems > 0 && <span className="bag-count">{totalItems}</span>}
    </button>
  </div>
</div>
      </div>

      {/* CATEGORY SELECT */}
      {!activeCategory && (
        <>
          {renderProductHeading("Select a Category", "Choose Your Stash")}

          <div className="category-grid">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className="category-card"
                onClick={() => setActiveCategory(cat)}
              >
                <img src={CATEGORY_IMAGES[cat]} alt={cat} />
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* PRODUCT MODAL */}
      {selectedProduct && (
        <div
          className="product-modal-overlay"
          onClick={() => setActiveProductId(null)}
        >
          <div
            className="product-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h1>{selectedProduct.name}</h1>

            {selectedProduct.dose && (
              <div className="product-dose-badge">{selectedProduct.dose}</div>
            )}

            <p>{selectedProduct.description}</p>

            <button
              className="modal-close"
              onClick={() => setActiveProductId(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* PRODUCTS */}
      {activeCategory && (
        <>
          {renderProductHeading(activeCategory, "Product Menu")}

          <button
            onClick={() => setActiveCategory(null)}
            className="back-to-categories-btn"
          >
            ← Back
          </button>

          <div className="product-grid">
            {visibleProducts.map((product) => {
              const thc = getTHCLabel(product);
              const isAdded = addedProductId === product.id;
              const isReady = quantities[product.id] > 0;

              return (
                <div
                  key={product.id}
                  className={`product-card ${isAdded ? "is-added" : ""}`}
                >
                  {thc && <div className="thc-badge">{thc}</div>}

                  <button
                    className="product-info-btn"
                    onClick={() => setActiveProductId(product.id)}
                  >
                    i
                  </button>

                  <img
                    src={product.image}
                    alt={product.name}
                    className="product-image"
                  />

                  <p className="product-name">{product.name}</p>

                  {product.dose && (
                    <div className="product-dose-badge">{product.dose}</div>
                  )}

                  <p className="product-price">
                    $
                    {product.category === "Flowers"
                      ? getFlowerPrice(
                          product.id,
                          selectedGrams[product.id] || "3.5"
                        )
                      : product.price.toFixed(2)}
                  </p>

                  <div className="product-card-actions">
                    {product.category === "Flowers" && (
                      <div className="gram-selector">
                        {["3.5", "7", "14"].map((g) => (
                          <button
                            key={g}
                            className={`gram-btn ${
                              selectedGrams[product.id] === g ? "active" : ""
                            }`}
                            onClick={() =>
                              setSelectedGrams((prev) => ({
                                ...prev,
                                [product.id]: g,
                              }))
                            }
                          >
                            {g}g
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="quantity-counter">
                      <button
                        onClick={() => handleQuantityChange(product.id, -1)}
                      >
                        -
                      </button>

                      <span>{quantities[product.id]}</span>

                      <button
                        onClick={() => handleQuantityChange(product.id, 1)}
                      >
                        +
                      </button>
                    </div>

                    <button
                      className={`add-to-bag ${isReady ? "is-ready" : ""}`}
                      disabled={!isReady}
                      onClick={() => handleAddToBag(product)}
                    >
                      <span>Add To Bag</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* FLOATING BAG CLONE */}
{totalItems > 0 &&
  isBagFloating &&
  createPortal(
    <div className="floating-bag-clone">
      <button
        key={`floating-${bagPulseKey}`}
        className={`bag-btn floating-bag-btn ${
          totalItems > 0 ? "has-items" : "is-empty"
        }`}
        onClick={() => setIsBagOpen(true)}
        aria-label="Open bag"
      >
        <span className="bag-icon">👜</span>

        <span className="bag-count">{totalItems}</span>
      </button>
    </div>,
    document.body
  )}

{/* CHECKOUT */}
{totalItems > 0 && (
  <button className="checkout-btn" onClick={handleCheckout}>
    Checkout ({totalItems})
  </button>
)}

{bagModal}
    </div>
  );
}