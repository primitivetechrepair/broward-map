// src/pages/ProductsPage.jsx
import React, { useState, useEffect, useRef } from "react";
import PageHeader from "../components/PageHeader/PageHeader.jsx";
import PromoPopups from "../components/PromoPopups/PromoPopups.jsx";
import { supabase } from "../lib/supabaseClient.js";
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

const CATEGORY_STATUS = {
  Disposables: {
    disabled: true,
    label: "Off Menu",
  },
};

const getProductBadge = (product, index) => {
  if (index === 0) return "Council Pick";
  if (index === 1) return "High Demand";
  if (index === 2) return "Limited Drop";

  return product.category || "Menu Item";
};

const getProductTypeLabel = (product) => {
  if (product.category === "Flowers") return "Premium Flower";
  if (product.category === "Edibles") return "Infused Edible";
  if (product.category === "Vapes") return "Vape Selection";
  if (product.category === "Disposables") return "Disposable";
  if (product.category === "Concentrates") return "Concentrate";
  if (product.category === "Syringes") return "Syringe";
  if (product.category === "Peptides") return "Peptide";

  return product.category || "Menu Item";
};

const getProductDetailChips = ({ product, thc, selectedGram }) => {
  const chips = [];

  if (thc) chips.push(thc);

  if (product.category === "Flowers") {
    chips.push(`${selectedGram || "3.5"}g`);
  }

  if (product.dose) {
    chips.push(product.dose);
  }

  if (product.category) {
    chips.push(product.category);
  }

  return chips.slice(0, 3);
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

  const [requestForm, setRequestForm] = useState({
    customerName: "",
    contact: "",
    productName: "",
    notes: "",
  });

  const [requestStatus, setRequestStatus] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

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

  useEffect(() => {
  if (!isRequestModalOpen) return;

  const originalBodyOverflow = document.body.style.overflow;
  const originalHtmlOverflow = document.documentElement.style.overflow;

  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";

  return () => {
    document.body.style.overflow = originalBodyOverflow;
    document.documentElement.style.overflow = originalHtmlOverflow;
  };
}, [isRequestModalOpen]);

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

  const updateRequestForm = (key, value) => {
  setRequestForm((prev) => ({
    ...prev,
    [key]: value,
  }));
};

const handleProductRequestSubmit = async (e) => {
  e.preventDefault();

  setRequestStatus("");

  const customerName = requestForm.customerName.trim();
  const contact = requestForm.contact.trim();
  const productName = requestForm.productName.trim();
  const notes = requestForm.notes.trim();

  if (!customerName || !contact || !productName) {
    setRequestStatus("Please fill out your name, contact, and product request.");
    return;
  }

  setIsSubmittingRequest(true);

  const { error } = await supabase.from("product_requests").insert({
    customer_name: customerName,
    contact,
    product_name: productName,
    notes: notes || null,
  });

  setIsSubmittingRequest(false);

  if (error) {
    setRequestStatus("Something went wrong. Please try again.");
    return;
  }

  setRequestForm({
    customerName: "",
    contact: "",
    productName: "",
    notes: "",
  });

  setRequestStatus("Request sent. We’ll review it and reach out if available.");

window.setTimeout(() => {
  setIsRequestModalOpen(false);
  setRequestStatus("");
}, 1200);
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

    const productRequestModal = isRequestModalOpen
  ? createPortal(
      <div
        className="product-request-modal-overlay"
        onClick={() => setIsRequestModalOpen(false)}
      >
        <section
          className="product-request-card product-request-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <button
  type="button"
  className="product-request-close"
  onClick={() => setIsRequestModalOpen(false)}
  aria-label="Close product request form"
>
  ×
</button>

          <div className="product-request-header">
            <span>Looking for something?</span>
            <h2>Product Request</h2>
            <p>
              Request a product or category and we’ll let you know if it becomes available.
            </p>
          </div>

          <form
            className="product-request-form"
            onSubmit={handleProductRequestSubmit}
          >
            <div className="product-request-grid">
              <label>
                Name
                <input
                  type="text"
                  value={requestForm.customerName}
                  onChange={(e) =>
                    updateRequestForm("customerName", e.target.value)
                  }
                  placeholder="Your name"
                />
              </label>

              <label>
                Phone / Contact
                <input
                  type="text"
                  value={requestForm.contact}
                  onChange={(e) =>
                    updateRequestForm("contact", e.target.value)
                  }
                  placeholder="Phone, email, or preferred contact"
                />
              </label>
            </div>

            <label>
              Product Requested
              <input
                type="text"
                value={requestForm.productName}
                onChange={(e) =>
                  updateRequestForm("productName", e.target.value)
                }
                placeholder="What are you looking for?"
              />
            </label>

            <label>
              Notes
              <textarea
                value={requestForm.notes}
                onChange={(e) => updateRequestForm("notes", e.target.value)}
                placeholder="Flavor, strength, brand, quantity, or any details..."
              />
            </label>

            {requestStatus && (
              <div className="product-request-status">
                {requestStatus}
              </div>
            )}

            <button
              type="submit"
              className="product-request-submit"
              disabled={isSubmittingRequest}
            >
              {isSubmittingRequest ? "Sending..." : "Send Request"}
            </button>
          </form>
        </section>
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

      <PageHeader title="The Menu" eyebrow="Curated Delivery" />

      {reorderMessage && (
  <div className="reorder-loaded-banner">
    <strong>Reorder Ready</strong>
    <p>{reorderMessage}</p>
  </div>
)}

      {!activeCategory && (
  <section className="menu-intro-card">
    <div className="menu-intro-copy">
      <span>Tonight’s Menu</span>

      <h2>Curated for your delivery zone.</h2>

      <p>
        Choose a collection below, build your bag, and submit your order when ready.
      </p>
    </div>

    <div className="menu-intro-panel">
      <div className="menu-intro-stats">
        <div>
          <span>City</span>
          <strong>{selectedCity}</strong>
        </div>

        <div>
          <span>Delivery</span>
          <strong>${deliveryFee.toFixed(2)}</strong>
        </div>

        <div>
          <span>Total</span>
          <strong>${(totalPrice + deliveryFee).toFixed(2)}</strong>
        </div>
      </div>

      <div ref={bagDockRef} className="menu-bag-dock">
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

      <button
        className="change-city-btn menu-change-city-btn"
        onClick={() => navigate("/")}
      >
        Change City
      </button>
    </div>
  </section>
)}

      {/* CATEGORY SELECT */}
      {!activeCategory && (
        <>
          <PageHeader title="Choose a Collection" eyebrow="Select Your Lane" />

          <div className="category-grid">
            {CATEGORIES.map((cat) => {
  const categoryStatus = CATEGORY_STATUS[cat];
  const isCategoryDisabled = categoryStatus?.disabled === true;

  return (
    <button
      key={cat}
      className={`category-card ${
        isCategoryDisabled ? "is-disabled is-out-of-stock" : ""
      }`}
      disabled={isCategoryDisabled}
      aria-disabled={isCategoryDisabled}
      onClick={() => {
        if (isCategoryDisabled) return;
        setActiveCategory(cat);
      }}
    >
      <img src={CATEGORY_IMAGES[cat]} alt={cat} />

      <span>{cat}</span>

      {isCategoryDisabled && (
        <div className="category-status-pill">
          {categoryStatus.label}
        </div>
      )}
    </button>
  );
})}
          </div>

<section className="product-request-strip">
  <div className="product-request-strip-copy">
    <span>Can’t find it?</span>
    <strong>Request a product</strong>
    <p>Tell us what you’re looking for and we’ll check availability.</p>
  </div>

  <button
    type="button"
    onClick={() => setIsRequestModalOpen(true)}
  >
    Request Product
  </button>
</section>

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
          <PageHeader title={activeCategory} eyebrow="Collection Menu" />

          <button
            onClick={() => setActiveCategory(null)}
            className="back-to-categories-btn"
          >
            ← Back
          </button>

          <div className="product-grid">
            {visibleProducts.map((product, index) => {
  const thc = getTHCLabel(product);
  const isAdded = addedProductId === product.id;
  const isReady = quantities[product.id] > 0;
  const selectedGram = selectedGrams[product.id] || "3.5";
  const productPrice =
    product.category === "Flowers"
      ? getFlowerPrice(product.id, selectedGram)
      : product.price;

  const productBadge = getProductBadge(product, index);
  const productTypeLabel = getProductTypeLabel(product);
  const detailChips = getProductDetailChips({
    product,
    thc,
    selectedGram,
  });

  return (
    <article
      key={product.id}
      className={`product-card ${isAdded ? "is-added" : ""}`}
    >
      <div className="product-card-topline">
        <span className="product-status-badge">
          {productBadge}
        </span>

        <span className="product-availability-pill">
          Available
        </span>
      </div>

      <button
        className="product-info-btn"
        onClick={() => setActiveProductId(product.id)}
        aria-label={`View details for ${product.name}`}
      >
        i
      </button>

      <div className="product-image-stage">
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
        />
      </div>

      <div className="product-card-body">
        <span className="product-type-label">
          {productTypeLabel}
        </span>

        <p className="product-name">{product.name}</p>

        <p className="product-short-description">
          {product.description ||
            "Selected for the menu with quality, consistency, and availability in mind."}
        </p>

        {detailChips.length > 0 && (
          <div className="product-detail-chips">
            {detailChips.map((chip) => (
              <span key={chip}>{chip}</span>
            ))}
          </div>
        )}
      </div>

      <div className="product-price-row">
        <span>Price</span>

        <strong>
          ${Number(productPrice || 0).toFixed(2)}
        </strong>
      </div>

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
            aria-label={`Decrease quantity for ${product.name}`}
          >
            -
          </button>

          <span>{quantities[product.id]}</span>

          <button
            onClick={() => handleQuantityChange(product.id, 1)}
            aria-label={`Increase quantity for ${product.name}`}
          >
            +
          </button>
        </div>

        <button
          className={`add-to-bag ${isReady ? "is-ready" : ""}`}
          disabled={!isReady}
          onClick={() => handleAddToBag(product)}
        >
          <span>{isReady ? "Add To Bag" : "Select Quantity"}</span>
        </button>
      </div>
    </article>
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

<PromoPopups city={selectedCity} />

{bagModal}
{productRequestModal}
    </div>
  );
}