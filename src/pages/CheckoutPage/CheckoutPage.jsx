// src/pages/CheckoutPage.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import "./CheckoutPage.css";

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

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, profileLoading, isApproved } = useAuth();
  const { cartItems, totalItems, totalPrice, clearCart } = useCart();

  const fallbackItems = location.state?.cartItems || [];
  const orderItems = cartItems.length > 0 ? cartItems : fallbackItems;

  const deliveryFee = Number(location.state?.deliveryFee || 0);
  const selectedCity = location.state?.city || "Selected City";

  const fallbackSubtotal = orderItems.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 0;
    return sum + price * qty;
  }, 0);

  const subtotal = totalPrice || fallbackSubtotal;
  const itemCount =
    totalItems ||
    orderItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const grandTotal = subtotal + deliveryFee;

  const [form, setForm] = useState({
  fullName: "",
  phone: "",
  address: "",
  apt: "",
  notes: "",
  payment: "zelle",
});

  const [idFileName, setIdFileName] = useState("");
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
    form.fullName.trim() &&
    form.phone.trim() &&
    form.address.trim() &&
    idFileName;

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
    name: item.name,
    gram: item.gram || null,
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
      delivery_fee: deliveryFee,
      total: grandTotal,
      payment_method: form.payment,
      payment_status: "pending",
      order_status: "pending",
      payment_memo: orderMemo,
    })
    .select("id")
    .single();

  setIsSubmittingOrder(false);

  if (error) {
    setOrderError(error.message);
    return;
  }

  setSubmittedOrder({
    orderId: data?.id,
    memo: orderMemo,
    payment: form.payment,
    paymentLabel: paymentInfo.label,
    recipientLabel: paymentInfo.recipientLabel,
    recipient: paymentInfo.recipient,
    noteLabel: paymentInfo.noteLabel,
    instructions: paymentInfo.instructions,
    total: grandTotal,
    city: selectedCity,
    itemCount,
  });

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
    <div className="checkout-page">
      <div className="checkout-bg-orb orb-one"></div>
      <div className="checkout-bg-orb orb-two"></div>

      <div className="checkout-shell">
        <section className="checkout-main-card">
          <span className="checkout-eyebrow">Secure Checkout</span>

          <h1>Confirm Delivery</h1>

          <p className="checkout-subtitle">
            Enter your delivery details, upload ID verification, and choose how
            you’d like to pay.
          </p>

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
              <h2>ID Verification</h2>

              <label className="id-upload-card">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) =>
                    setIdFileName(e.target.files?.[0]?.name || "")
                  }
                />

                <span className="id-upload-icon">ID</span>

                <strong>{idFileName || "Upload ID"}</strong>

                <small>Required before delivery confirmation.</small>
              </label>
            </div>

            <div className="checkout-section">
              <h2>Payment</h2>

              <div className="payment-options">
  {[
    ["zelle", "Zelle"],
    ["apple_pay", "Apple Pay"],
  ].map(([value, label]) => (
    <button
      type="button"
      key={value}
      className={form.payment === value ? "active" : ""}
      onClick={() => updateForm("payment", value)}
    >
      {label}
    </button>
  ))}
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
              <span>Delivery</span>
              <strong>${deliveryFee.toFixed(2)}</strong>
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
  );
}