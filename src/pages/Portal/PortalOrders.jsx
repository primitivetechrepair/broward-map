import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "../Auth/AuthPages.css";

export default function PortalOrders() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderError, setOrderError] = useState("");

  const formatStatusLabel = (value) => {
    return String(value || "")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

const normalizeOrderStatus = (status) => {
  return String(status || "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_");
};

const getCustomerTimelineDate = (order, { labels = [], types = [] }) => {
  const savedTimeline = Array.isArray(order.order_timeline)
    ? order.order_timeline
    : [];

  const matchingEvent = [...savedTimeline]
    .filter((event) => event?.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .find((event) => {
      const eventLabel = String(event.label || "");
      const eventType = String(event.type || "");

      return labels.includes(eventLabel) || types.includes(eventType);
    });

  return matchingEvent?.at || null;
};

const formatCustomerTimelineDate = (value) => {
  if (!value) return "";

  return new Date(value).toLocaleString();
};

const getCustomerTrackerSteps = (order) => {
  const orderStatus = normalizeOrderStatus(order.order_status);
  const paymentStatus = normalizeOrderStatus(order.payment_status);

  const isCancelled = orderStatus === "cancelled";

  if (isCancelled) {
    return [
      {
        key: "received",
        label: "Order Received",
        description: "Your order was submitted.",
        done: true,
        current: false,
        at: order.created_at,
      },
      {
        key: "cancelled",
        label: "Order Cancelled",
        description: "This order was cancelled.",
        done: true,
        current: true,
        at:
          getCustomerTimelineDate(order, {
            labels: ["Order Cancelled"],
            types: ["cancelled"],
          }) || null,
      },
    ];
  }

  const steps = [
    {
      key: "received",
      label: "Order Received",
      description: "Your order was submitted.",
      done: true,
      at: order.created_at,
    },
    {
      key: "payment",
      label: "Payment Received",
      description: "Your payment has been confirmed.",
      done: paymentStatus === "received",
      at:
        order.paid_at ||
        getCustomerTimelineDate(order, {
          labels: ["Payment Received", "Payment Received & Order Confirmed"],
          types: ["payment_status"],
        }),
    },
    {
      key: "confirmed",
      label: "Order Confirmed",
      description: "Your order has been confirmed.",
      done: ["confirmed", "out_for_delivery", "completed"].includes(orderStatus),
      at: getCustomerTimelineDate(order, {
        labels: ["Order Confirmed", "Payment Received & Order Confirmed"],
        types: ["confirmed"],
      }),
    },
    {
      key: "out_for_delivery",
      label: "Out For Delivery",
      description: "Your order is on the way.",
      done: ["out_for_delivery", "completed"].includes(orderStatus),
      at: getCustomerTimelineDate(order, {
        labels: ["Out For Delivery"],
        types: ["out_for_delivery"],
      }),
    },
    {
      key: "completed",
      label: "Completed",
      description: "Your order has been completed.",
      done: orderStatus === "completed",
      at: getCustomerTimelineDate(order, {
        labels: ["Order Completed"],
        types: ["completed"],
      }),
    },
  ];

  const firstIncompleteIndex = steps.findIndex((step) => !step.done);

  return steps.map((step, index) => ({
    ...step,
    current:
      firstIncompleteIndex === -1
        ? step.key === "completed"
        : index === firstIncompleteIndex,
  }));
};

  const getCustomerStatusMessage = (order) => {
  if (order.order_status === "cancelled") {
    return {
      tone: "danger",
      title: "Order Cancelled",
      message:
        "This order has been cancelled. Contact us if you believe this was a mistake.",
    };
  }

  if (order.order_status === "completed") {
    return {
      tone: "success",
      title: "Order Completed",
      message:
        "Your order has been completed. Thank you for shopping with us.",
    };
  }

  if (order.order_status === "out_for_delivery") {
    return {
      tone: "success",
      title: "Your Order Is On The Way",
      message:
        "Your order is out for delivery. Please keep your phone nearby for driver updates.",
    };
  }

  if (order.payment_status === "pending") {
    return {
      tone: "warning",
      title: "Payment Pending",
      message: `Send the exact total and include memo ${order.payment_memo}.`,
    };
  }

  if (order.order_status === "confirmed") {
    return {
      tone: "success",
      title: "Order Confirmed",
      message:
        "Your payment was received and your order has been confirmed.",
    };
  }

  return {
    tone: "neutral",
    title: "Order Received",
    message:
      "Your order has been received and is waiting for review.",
  };
};

  const copyToClipboard = async (text) => {
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    setOrderError("");
  } catch (error) {
    setOrderError("Could not copy memo. Please copy it manually.");
  }
};

  const loadOrders = async () => {
    if (!user?.id) return;

    setLoading(true);
    setOrderError("");

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setOrderError(error.message);
      setLoading(false);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-one"></div>
      <div className="auth-orb auth-orb-two"></div>

      <section className="portal-card admin-card">
        <span className="auth-eyebrow">Customer Portal</span>

        <h1>My Orders</h1>

        <p className="portal-copy">
          Track your delivery requests, payment status, order memo, and current
          order status.
        </p>

        {orderError && (
          <div className="auth-error">
            {orderError}
          </div>
        )}

        <div className="admin-toolbar">
          <button type="button" onClick={loadOrders}>
            Refresh Orders
          </button>

          <button type="button" onClick={() => navigate("/portal")}>
            Account
          </button>

          <button type="button" onClick={() => navigate("/")}>
            Back To Map
          </button>

          <button type="button" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>

        <div className="customer-orders-list">
          {loading ? (
            <div className="portal-alert">
              Loading your orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="portal-alert">
              No orders yet. Start from the map, choose products, and complete
              checkout after approval.
            </div>
          ) : (
            orders.map((order) => {
              const items = Array.isArray(order.items) ? order.items : [];
              const statusMessage = getCustomerStatusMessage(order);
              const trackerSteps = getCustomerTrackerSteps(order);

              return (
                <article key={order.id} className="customer-order-card">
                  <div className="customer-order-top">
  <div>
    <span className="auth-eyebrow">Order Memo</span>

    <h2>{order.payment_memo}</h2>

    <p>
      {new Date(order.created_at).toLocaleString()}
    </p>

    <button
      type="button"
      className="copy-memo-btn"
      onClick={() => copyToClipboard(order.payment_memo)}
    >
      Copy Payment Memo
    </button>
  </div>

  <strong className={`status-pill status-${order.order_status}`}>
    {formatStatusLabel(order.order_status)}
  </strong>
</div>

<div className={`customer-status-message customer-status-${statusMessage.tone}`}>
  <strong>{statusMessage.title}</strong>
  <p>{statusMessage.message}</p>
</div>

<div className="customer-order-tracker">
  <span>Order Progress</span>

  <div className="customer-tracker-steps">
    {trackerSteps.map((step) => (
      <div
        key={step.key}
        className={`customer-tracker-step ${
          step.done ? "is-done" : ""
        } ${step.current ? "is-current" : ""}`}
      >
        <div className="customer-tracker-dot"></div>

        <div>
          <strong>{step.label}</strong>
          <p>{step.description}</p>

          <small>
            {step.done && step.at
              ? formatCustomerTimelineDate(step.at)
              : step.current
                ? "Current step"
                : "Pending"}
          </small>
        </div>
      </div>
    ))}
  </div>
</div>

{order.payment_status === "pending" && (
  <div className="payment-warning">
    Payment is still pending. Send the exact total and include this order memo:
    <strong>{order.payment_memo}</strong>
  </div>
)}

                  <div className="customer-order-meta">
                    <div>
                      <span>Total</span>
                      <strong>${Number(order.total || 0).toFixed(2)}</strong>
                    </div>

                    <div>
                      <span>Payment</span>
                      <strong>{formatStatusLabel(order.payment_method)}</strong>
                    </div>

                    <div>
                      <span>Payment Status</span>
                      <strong>{formatStatusLabel(order.payment_status)}</strong>
                    </div>

                    <div>
                      <span>Delivery</span>
                      <strong>{order.city}</strong>
                    </div>
                  </div>

                  <div className="customer-order-address">
                    <span>Delivery Address</span>

                    <strong>
                      {order.address}
                      {order.apt ? `, ${order.apt}` : ""}, {order.city}
                    </strong>

                    {order.notes && (
                      <p>
                        <b>Notes:</b> {order.notes}
                      </p>
                    )}
                  </div>

                  <div className="customer-order-items">
                    <span>Items</span>

                    {items.length === 0 ? (
                      <p>No items found.</p>
                    ) : (
                      items.map((item, index) => (
                        <div key={`${item.id || item.name}-${index}`}>
                          <strong>
                            {item.name}
                            {item.gram ? ` (${item.gram}g)` : ""}
                          </strong>

                          <small>
                            Qty {item.quantity} × $
                            {Number(item.price || 0).toFixed(2)}
                          </small>

                          <b>
                            $
                            {(
                              Number(item.quantity || 0) *
                              Number(item.price || 0)
                            ).toFixed(2)}
                          </b>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="customer-order-actions">
  <button
    type="button"
    onClick={() =>
      navigate("/products", {
        state: {
          city: order.city,
          selectedCity: order.city,
          deliveryFee: Number(order.delivery_fee || 0),
          fromOrderHistory: true,
        },
      })
    }
  >
    Shop Again
  </button>

  <button
    type="button"
    className="reorder-action"
    onClick={() => {
      const reorderDraft = {
        city: order.city,
        selectedCity: order.city,
        deliveryFee: Number(order.delivery_fee || 0),
        items: Array.isArray(order.items) ? order.items : [],
        sourceOrderId: order.id,
        sourcePaymentMemo: order.payment_memo,
        createdAt: new Date().toISOString(),
      };

      sessionStorage.setItem(
        "browardReorderDraft",
        JSON.stringify(reorderDraft)
      );

      navigate("/products", {
        state: {
          city: order.city,
          selectedCity: order.city,
          deliveryFee: Number(order.delivery_fee || 0),
          reorderDraft,
          fromReorder: true,
        },
      });
    }}
  >
    Reorder
  </button>

  <button
    type="button"
    onClick={() => navigate("/")}
  >
    Back To Map
  </button>
</div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}