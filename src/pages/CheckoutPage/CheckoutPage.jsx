// src/pages/CheckoutPage.jsx
import React, { useState } from "react";
import PageHeader from "../../components/PageHeader/PageHeader.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { sendPeptideRoyaltyEmail } from "../../utils/sendPeptideRoyaltyEmail.js";
import "./CheckoutPage.css";
import SEO from "../../components/SEO/SEO.jsx";

const PAYMENT_INSTRUCTIONS = {
  zelle: {
    label: "Zelle",
    recipientLabel: "Send Zelle To",
    recipient: "hollywoodexotics@icloud.com",
    noteLabel: "Zelle Memo",
    instructions:
      "Open your banking app, choose Zelle, send the exact total, and include the order memo below before delivery confirmation.",
  },
  apple_pay: {
    label: "Apple Pay",
    recipientLabel: "Send Apple Pay To",
    recipient: "YOUR_APPLE_PAY_PHONE_OR_EMAIL",
    noteLabel: "Apple Pay Note",
    instructions:
      "Open Apple Cash / Apple Pay, send the exact total to the contact below, and include the order memo before delivery confirmation.",
  },
};

const DELIVERY_OPTIONS = {
  standard: {
    id: "standard",
    label: "Standard",
    description: "Delivered within the normal delivery window.",
    surcharge: 0,
  },
  expedited: {
    id: "expedited",
    label: "Expedited",
    description: "Priority handling and the earliest available delivery window.",
    surcharge: 10,
  },
};

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, profileLoading, isApproved } = useAuth();
  const { cartItems, totalItems, totalPrice, clearCart } = useCart();

  const fallbackItems = location.state?.cartItems || [];
  const orderItems = cartItems.length > 0 ? cartItems : fallbackItems;

  const baseDeliveryFee = Number(location.state?.deliveryFee || 0);
  const selectedCity = location.state?.city || "Selected City";

  const fallbackSubtotal = orderItems.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 0;
    return sum + price * qty;
  }, 0);

  const subtotal =
  cartItems.length > 0
    ? Number(totalPrice) || 0
    : fallbackSubtotal;

const itemCount =
  totalItems ||
  orderItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

const [form, setForm] = useState({
  fullName: "",
  phone: "",
  address: "",
  apt: "",
  notes: "",
  payment: "zelle",
  deliverySpeed: "standard",
});

const selectedDeliveryOption =
  DELIVERY_OPTIONS[form.deliverySpeed] || DELIVERY_OPTIONS.standard;

const deliverySurcharge =
  Number(selectedDeliveryOption.surcharge) || 0;

const finalDeliveryFee =
  baseDeliveryFee + deliverySurcharge;

const grandTotal =
  subtotal + finalDeliveryFee;

  const [submitted, setSubmitted] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [orderError, setOrderError] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const updateForm = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const isReady =
  itemCount > 0 &&
  Boolean(form.fullName.trim()) &&
  Boolean(form.phone.trim()) &&
  Boolean(form.address.trim());

    const selectedPaymentInfo =
  PAYMENT_INSTRUCTIONS[form.payment] || PAYMENT_INSTRUCTIONS.zelle;

  const handleSubmit = async (e) => {
  e.preventDefault();

  setOrderError("");

  if (!isReady || isSubmittingOrder) return;

  if (!user?.id) {
    navigate("/login", {
      replace: true,
      state: { from: location },
    });
    return;
  }

  if (!isApproved) {
    navigate("/portal", { replace: true });
    return;
  }

  setIsSubmittingOrder(true);

  const orderMemo = `ORDER-${Date.now().toString().slice(-6)}`;
  const paymentInfo = PAYMENT_INSTRUCTIONS[form.payment];

  const normalizedItems = orderItems.map((item) => ({
  id: item.id,
  baseId: item.baseId || null,
  name: item.name,
  category: item.category || null,
  gram: item.gram || null,
  dose: item.dose || null,
  quantity: Number(item.quantity) || 0,
  price: Number(item.price) || 0,
}));

  const { data, error } = await supabase
  .from("orders")
  .insert({
    user_id: user.id,
    customer_name: form.fullName.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    apt: form.apt.trim() || null,
    city: selectedCity,
    notes: form.notes.trim() || null,
    items: normalizedItems,
    subtotal,
    delivery_speed: selectedDeliveryOption.id,
    base_delivery_fee: baseDeliveryFee,
    delivery_surcharge: deliverySurcharge,
    delivery_fee: finalDeliveryFee,
    total: grandTotal,
    payment_method: form.payment,
    payment_status: "pending",
    order_status: "pending",
    payment_memo: orderMemo,
  })
  .select("id")
  .single();

  if (error) {
  setIsSubmittingOrder(false);
  setOrderError(error.message);
  return;
}

sendPeptideRoyaltyEmail({
  orderId: data?.id || orderMemo,
  customerName: form.fullName.trim(),
  customerContact: form.phone.trim(),
  city: selectedCity,
  deliverySpeed: selectedDeliveryOption.id,
  deliverySpeedLabel: selectedDeliveryOption.label,
  baseDeliveryFee,
  deliverySurcharge,
  deliveryFee: finalDeliveryFee,
  cartItems: normalizedItems,
}).catch((royaltyError) => {
  console.error("Peptide royalty email failed:", royaltyError);
});

setSubmittedOrder({
  orderId: data?.id,
  memo: orderMemo,
  payment: form.payment,
  paymentLabel: paymentInfo.label,
  recipientLabel: paymentInfo.recipientLabel,
  recipient: paymentInfo.recipient,
  noteLabel: paymentInfo.noteLabel,
  instructions: paymentInfo.instructions,
  deliverySpeed: selectedDeliveryOption.id,
  deliverySpeedLabel: selectedDeliveryOption.label,
  baseDeliveryFee,
  deliverySurcharge,
  deliveryFee: finalDeliveryFee,
  total: grandTotal,
  city: selectedCity,
  itemCount,
});
  setIsSubmittingOrder(false);
  setSubmitted(true);
  clearCart();
};

if (profileLoading) {
  return (
    <div className="checkout-page checkout-success-page">
      <div className="checkout-success-card">
        <span className="checkout-eyebrow">Checking Account</span>

        <h1>Please Wait</h1>

        <p>
          We are checking your account approval before checkout.
        </p>
      </div>
    </div>
  );
}

if (!isApproved) {
  return (
    <div className="checkout-page checkout-success-page">
      <div className="checkout-success-card">
        <div className="success-icon">!</div>

        <span className="checkout-eyebrow">Approval Required</span>

        <h1>ID Required</h1>

        <p>
          Your account must be ID approved before final order confirmation.
          Upload your ID in the customer portal.
        </p>

        <button onClick={() => navigate("/portal")}>
          Go To Portal
        </button>
      </div>
    </div>
  );
}

  if (submitted) {
  const payment = submittedOrder || {
  memo: "ORDER-PENDING",
  paymentLabel: "Payment",
  recipientLabel: "Send Payment To",
  recipient: "Payment recipient pending",
  noteLabel: "Payment Memo",
  instructions:
    "Send the exact total using your selected payment method. Your delivery will be confirmed after payment is reviewed.",
  deliverySpeed: selectedDeliveryOption.id,
  deliverySpeedLabel: selectedDeliveryOption.label,
  baseDeliveryFee,
  deliverySurcharge,
  deliveryFee: finalDeliveryFee,
  total: grandTotal,
  city: selectedCity,
  itemCount,
};

  return (
    <div className="checkout-page checkout-success-page">
      <div className="success-burst" aria-hidden="true"></div>

      <div className="checkout-success-card">
        <div className="success-icon">✓</div>

        <span className="checkout-eyebrow">Order Received</span>

        <h1>Payment Required</h1>

        <p>
          Your delivery request was created. Send the exact payment amount using
          the instructions below to complete confirmation.
        </p>

        <div className="manual-payment-card">
  <div className="manual-payment-row">
    <span>Payment Method</span>
    <strong>{payment.paymentLabel}</strong>
  </div>

  <div className="manual-payment-row">
    <span>Delivery Speed</span>
    <strong>{payment.deliverySpeedLabel}</strong>
  </div>

  <div className="manual-payment-row">
  <span>Amount Due</span>
  <strong>${payment.total.toFixed(2)}</strong>
</div>

          <div className="manual-payment-row">
            <span>{payment.recipientLabel}</span>
            <strong>{payment.recipient}</strong>
          </div>

          <div className="manual-payment-row">
            <span>{payment.noteLabel}</span>
            <strong>{payment.memo}</strong>
          </div>

          {payment.orderId && (
  <div className="manual-payment-row">
    <span>Order ID</span>
    <strong>{payment.orderId}</strong>
  </div>
)}

          <div className="manual-payment-instructions">
            {payment.instructions}
          </div>
        </div>

        <button onClick={() => navigate("/")}>
          Back To Map
        </button>
      </div>
    </div>
  );
}

  return (
  <>
    <SEO
      title="Secure Checkout | The High Council"
      description="Complete your order securely with delivery details, delivery priority, payment instructions, and premium delivery throughout South Florida."
      path="/checkout"
      structuredData={{
        "@context": "https://schema.org",
        "@type": "CheckoutPage",
        name: "The High Council Checkout",
        url: `${window.location.origin}/checkout`,
        isPartOf: {
          "@type": "WebSite",
          name: "The High Council",
          url: `${window.location.origin}/`,
        },
      }}
    />

    <div className="checkout-page">
      <div className="checkout-bg-orb orb-one"></div>
      <div className="checkout-bg-orb orb-two"></div>

      <PageHeader
  title="Confirm Delivery"
  eyebrow="Secure Checkout"
  subtitle="Enter your delivery details, choose your delivery priority, and select how you’d like to pay."
/>

<div className="checkout-shell">
  <section className="checkout-main-card">
    <form onSubmit={handleSubmit} className="checkout-form">
            <div className="checkout-section">
              <h2>Customer Info</h2>

              <div className="checkout-field-grid">
                <label>
                  Full Name
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => updateForm("fullName", e.target.value)}
                    placeholder="Enter full name"
                  />
                </label>

                <label>
                  Phone Number
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    placeholder="Enter phone number"
                  />
                </label>
              </div>
            </div>

            <div className="checkout-section">
              <h2>Delivery Address</h2>

              <label>
                Street Address
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateForm("address", e.target.value)}
                  placeholder="Delivery address"
                />
              </label>

              <div className="checkout-field-grid">
                <label>
                  Apt / Unit
                  <input
                    type="text"
                    value={form.apt}
                    onChange={(e) => updateForm("apt", e.target.value)}
                    placeholder="Optional"
                  />
                </label>

                <label>
                  City
                  <input type="text" value={selectedCity} readOnly />
                </label>
              </div>
            </div>

            <div className="checkout-section">
  <div className="checkout-section-heading">
    <div>
      <span className="checkout-section-eyebrow">
        Delivery Priority
      </span>

      <h2>Delivery Speed</h2>
    </div>

    {deliverySurcharge > 0 && (
      <span className="delivery-speed-surcharge">
        +${deliverySurcharge.toFixed(2)}
      </span>
    )}
  </div>

  <div
    className="delivery-speed-options"
    role="radiogroup"
    aria-label="Choose delivery speed"
  >
    {Object.values(DELIVERY_OPTIONS).map((option) => {
      const isSelected = form.deliverySpeed === option.id;

      return (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={isSelected}
          className={`delivery-speed-option ${
            isSelected ? "is-selected" : ""
          }`}
          onClick={() =>
            updateForm("deliverySpeed", option.id)
          }
        >
          <span
            className="delivery-speed-control"
            aria-hidden="true"
          >
            <span></span>
          </span>

          <span className="delivery-speed-copy">
            <strong>{option.label}</strong>
            <small>{option.description}</small>
          </span>

          <span className="delivery-speed-price">
            {option.surcharge > 0
              ? `+$${option.surcharge.toFixed(2)}`
              : "Included"}
          </span>
        </button>
      );
    })}
  </div>

  <div className="selected-delivery-preview">
    <span>Selected Delivery</span>

    <strong>{selectedDeliveryOption.label}</strong>

    <p>
      {selectedDeliveryOption.id === "expedited"
        ? "Your order receives priority handling and the earliest available delivery window. Exact arrival time remains subject to availability and traffic."
        : "Your order will be handled within the normal delivery window for your selected city."}
    </p>
  </div>
</div>

            <div className="checkout-section">
              <h2>Payment</h2>

              <div className="payment-options">
  <button
    type="button"
    className={form.payment === "zelle" ? "active" : ""}
    onClick={() => updateForm("payment", "zelle")}
  >
    Zelle
  </button>

  <button
    type="button"
    className="is-disabled"
    disabled
    title="Apple Pay coming soon"
  >
    Apple Pay
    <span className="coming-soon-pill">Coming Soon</span>
  </button>
</div>

<div className="selected-payment-preview">
  <span>Selected Payment</span>

  <strong>{selectedPaymentInfo.label}</strong>

  <p>
    Payment instructions will appear after you place the order. Send the exact
    total and include your order memo.
  </p>
</div>
            </div>

            <div className="checkout-section">
              <h2>Notes</h2>

              <textarea
                value={form.notes}
                onChange={(e) => updateForm("notes", e.target.value)}
                placeholder="Gate code, meet-up instructions, preferred contact method..."
              />
            </div>

            {orderError && (
  <div className="auth-error">
    {orderError}
  </div>
)}

<button
  type="submit"
  className="place-order-btn"
  disabled={!isReady || isSubmittingOrder}
>
  {isSubmittingOrder
    ? "Placing Order..."
    : `Place Order · $${grandTotal.toFixed(2)}`}
</button>
          </form>
        </section>

        <aside className="checkout-summary-card">
          <span className="checkout-eyebrow">Delivery Summary</span>

          <h2>{selectedCity}</h2>

          <div className="summary-items">
            {orderItems.length === 0 ? (
              <p className="empty-summary">No items in bag.</p>
            ) : (
              orderItems.map((item) => {
                const price = Number(item.price) || 0;

                return (
                  <div key={item.id} className="summary-item">
                    <div>
                      <strong>
                        {item.name}
                        {item.gram && <span> ({item.gram}g)</span>}
                      </strong>

                      <small>
                        Qty {item.quantity} × ${price.toFixed(2)}
                      </small>
                    </div>

                    <span>${(price * item.quantity).toFixed(2)}</span>
                  </div>
                );
              })
            )}
          </div>

          <div className="summary-totals">
  <div>
    <span>Subtotal</span>
    <strong>${subtotal.toFixed(2)}</strong>
  </div>

  <div>
    <span>Base Delivery</span>
    <strong>${baseDeliveryFee.toFixed(2)}</strong>
  </div>

  {deliverySurcharge > 0 && (
    <div className="summary-expedited-row">
      <span>Expedited Delivery</span>
      <strong>+${deliverySurcharge.toFixed(2)}</strong>
    </div>
  )}

  <div>
    <span>Delivery Total</span>
    <strong>${finalDeliveryFee.toFixed(2)}</strong>
  </div>

  <div className="summary-grand-total">
    <span>Total</span>
    <strong>${grandTotal.toFixed(2)}</strong>
  </div>
</div>

          <button
            type="button"
            className="checkout-back-btn"
            onClick={() => navigate(-1)}
          >
            ← Back to Products
          </button>
        </aside>
      </div>
    </div>
  </>
);
}