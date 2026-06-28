import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "../Auth/AuthPages.css";

const ORDER_STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "out_for_delivery",
  "completed",
  "cancelled",
];

const PAYMENT_STATUS_OPTIONS = [
  "pending",
  "received",
  "failed",
  "refunded",
];

const ORDER_FILTER_OPTIONS = [
  "all",
  "active",
  "pending",
  "confirmed",
  "out_for_delivery",
  "completed",
  "cancelled",
];

const ACTIVE_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "out_for_delivery",
];

const ORDER_STATUS_WEIGHT = {
  pending: 1,
  confirmed: 2,
  out_for_delivery: 3,
  completed: 4,
  cancelled: 5,
};

const normalizeOrderStatus = (status) => {
  return String(status || "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_");
};

export default function AdminOrders() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [activeFilter, setActiveFilter] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [customerUpdateDrafts, setCustomerUpdateDrafts] = useState({});

  const loadOrders = async () => {
    setLoading(true);
    setActionMessage("");
    setActionError("");

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setActionError(error.message);
      setLoading(false);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const updateOrderField = async ({
  orderId,
  field,
  value,
  timelineLabel,
  timelineMessage,
}) => {
  setActionMessage("");
  setActionError("");

  const existingOrder = orders.find((order) => order.id === orderId);

  const existingTimeline = Array.isArray(existingOrder?.order_timeline)
    ? existingOrder.order_timeline
    : [];

  const updates = {
    [field]: value,
  };

  if (field === "payment_status" && value === "received") {
    updates.paid_at = existingOrder?.paid_at || new Date().toISOString();
  }

  if (field !== "admin_notes") {
    updates.order_timeline = [
      ...existingTimeline,
      buildTimelineEntry({
        type: field,
        label:
          timelineLabel ||
          getTimelineLabelFromUpdates(updates, "Order Updated"),
        message:
          timelineMessage ||
          `${formatStatusLabel(field)} changed to ${formatStatusLabel(value)}.`,
      }),
    ];
  }

  const { error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId);

  if (error) {
    setActionError(error.message);
    return;
  }

  setActionMessage("Order updated.");

  setOrders((prev) =>
    prev.map((order) =>
      order.id === orderId
        ? {
            ...order,
            ...updates,
          }
        : order
    )
  );
};

  const updateOrderFields = async ({
  orderId,
  updates,
  message,
  customerMessage,
}) => {
  setActionMessage("");
  setActionError("");

  const existingOrder = orders.find((order) => order.id === orderId);

  const existingTimeline = Array.isArray(existingOrder?.order_timeline)
    ? existingOrder.order_timeline
    : [];

  const finalUpdates = {
    ...updates,
  };

  if (finalUpdates.payment_status === "received") {
    finalUpdates.paid_at = existingOrder?.paid_at || new Date().toISOString();
  }

  const cleanCustomerMessage = String(customerMessage || "").trim();

  finalUpdates.order_timeline = [
    ...existingTimeline,
    buildTimelineEntry({
      type: finalUpdates.order_status || finalUpdates.payment_status || "update",
      label: getTimelineLabelFromUpdates(finalUpdates, "Order Updated"),
      message: cleanCustomerMessage || message || "Order updated.",
    }),
  ];

  const { error } = await supabase
    .from("orders")
    .update(finalUpdates)
    .eq("id", orderId);

  if (error) {
    setActionError(error.message);
    return;
  }

  setActionMessage(message || "Order updated.");

  setCustomerUpdateDrafts((prev) => {
    const next = { ...prev };
    delete next[orderId];
    return next;
  });

  setOrders((prev) =>
    prev.map((order) =>
      order.id === orderId
        ? {
            ...order,
            ...finalUpdates,
          }
        : order
    )
  );
};

const sendCustomerUpdate = async (orderId) => {
  setActionMessage("");
  setActionError("");

  const cleanCustomerMessage = String(customerUpdateDrafts[orderId] || "").trim();

  if (!cleanCustomerMessage) {
    setActionError("Type a customer update message first.");
    return;
  }

  const existingOrder = orders.find((order) => order.id === orderId);

  const existingTimeline = Array.isArray(existingOrder?.order_timeline)
    ? existingOrder.order_timeline
    : [];

  const updatedTimeline = [
    ...existingTimeline,
    buildTimelineEntry({
      type: "customer_update",
      label: "Customer Update",
      message: cleanCustomerMessage,
    }),
  ];

  const { data: savedOrder, error } = await supabase
    .from("orders")
    .update({
      order_timeline: updatedTimeline,
    })
    .eq("id", orderId)
    .select("*")
    .single();

  if (error) {
    setActionError(error.message);
    return;
  }

  setActionMessage("Customer update sent.");

  setCustomerUpdateDrafts((prev) => {
    const next = { ...prev };
    delete next[orderId];
    return next;
  });

  setOrders((prev) =>
    prev.map((order) =>
      order.id === orderId
        ? {
            ...order,
            ...savedOrder,
          }
        : order
    )
  );
};

const formatStatusLabel = (value) => {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const buildTimelineEntry = ({ type, label, message }) => {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    type,
    label,
    message,
    at: new Date().toISOString(),
  };
};

const getTimelineLabelFromUpdates = (updates, fallback = "Order Updated") => {
  if (updates.order_status === "cancelled") return "Order Cancelled";
  if (updates.order_status === "completed") return "Order Completed";
  if (updates.order_status === "out_for_delivery") return "Out For Delivery";

  if (
  updates.order_status === "confirmed" &&
  updates.payment_status === "received"
) {
  return "Payment Received & Order Confirmed";
}

  if (updates.order_status === "confirmed") return "Order Confirmed";
  if (updates.payment_status === "received") return "Payment Received";
  if (updates.payment_status) return `Payment ${formatStatusLabel(updates.payment_status)}`;

  return fallback;
};

const getTimelineEntries = (order) => {
  const savedTimeline = Array.isArray(order.order_timeline)
    ? order.order_timeline
    : [];

  const baseTimeline = [
    {
      id: `created-${order.id}`,
      type: "created",
      label: "Order Created",
      message: "Customer submitted this order.",
      at: order.created_at,
    },
  ];

  return [...baseTimeline, ...savedTimeline]
    .filter((event) => event?.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at));
};

const formatTimelineDate = (value) => {
  if (!value) return "Unknown time";

  return new Date(value).toLocaleString();
};

const copyToClipboard = async (text) => {
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    setActionMessage("Payment memo copied.");
    setActionError("");
  } catch (error) {
    setActionError("Could not copy memo. Please copy it manually.");
  }
};

const cleanPhoneNumber = (phone) => {
  return String(phone || "").replace(/[^\d+]/g, "");
};

const buildSmsMessage = (order) => {
  return encodeURIComponent(
    `Hi ${order.customer_name}, your order ${order.payment_memo} is currently ${formatStatusLabel(order.order_status)}.`
  );
};

const buildMapsUrl = (order) => {
  const fullAddress = `${order.address || ""} ${order.apt || ""} ${order.city || ""}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
};

const sortedOrders = [...orders].sort((a, b) => {
  const statusA = ORDER_STATUS_WEIGHT[normalizeOrderStatus(a.order_status)] || 99;
  const statusB = ORDER_STATUS_WEIGHT[normalizeOrderStatus(b.order_status)] || 99;

  if (statusA !== statusB) {
    return statusA - statusB;
  }

  return new Date(b.created_at) - new Date(a.created_at);
});

const filteredOrders = sortedOrders.filter((order) => {
  const orderStatus = normalizeOrderStatus(order.order_status);
  const currentFilter = normalizeOrderStatus(activeFilter);

  const matchesFilter =
    currentFilter === "all" ||
    orderStatus === currentFilter ||
    (currentFilter === "active" &&
      ACTIVE_ORDER_STATUSES.includes(orderStatus));

  const searchValue = searchTerm.trim().toLowerCase();

  if (!searchValue) return matchesFilter;

  const searchableText = [
    order.id,
    order.customer_name,
    order.phone,
    order.city,
    order.address,
    order.payment_memo,
    order.payment_method,
    order.payment_status,
    order.order_status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return matchesFilter && searchableText.includes(searchValue);
});

const todayKey = new Date().toDateString();

const orderSummary = {
  total: orders.length,

  pendingPayment: orders.filter(
    (order) => order.payment_status === "pending"
  ).length,

  outForDelivery: orders.filter(
    (order) => order.order_status === "out_for_delivery"
  ).length,

  completed: orders.filter(
    (order) => order.order_status === "completed"
  ).length,

  todayRevenue: orders
  .filter((order) => {
    if (!order.paid_at) return false;

    const paidDateKey = new Date(order.paid_at).toDateString();

    return (
      paidDateKey === todayKey &&
      order.payment_status === "received"
    );
  })
  .reduce((sum, order) => sum + Number(order.total || 0), 0),
};

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-one"></div>
      <div className="auth-orb auth-orb-two"></div>

      <section className="portal-card admin-card">
        <span className="auth-eyebrow">Admin Orders</span>

        <h1>Orders</h1>

        <p className="portal-copy">
          Review customer orders, payment method, payment memo, delivery
          details, and update order status.
        </p>

        {actionMessage && (
          <div className="auth-success">
            {actionMessage}
          </div>
        )}

        {actionError && (
          <div className="auth-error">
            {actionError}
          </div>
        )}

        <div className="admin-toolbar">
          <button type="button" onClick={loadOrders}>
            Refresh Orders
          </button>

          <button type="button" onClick={() => navigate("/admin")}>
            ID Reviews
          </button>

          <button type="button" onClick={() => navigate("/")}>
            Back To Map
          </button>

          <button type="button" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>

        <div className="admin-order-summary">
  <div>
    <span>Total Orders</span>
    <strong>{orderSummary.total}</strong>
  </div>

  <div>
    <span>Pending Payment</span>
    <strong>{orderSummary.pendingPayment}</strong>
  </div>

  <div>
    <span>Out For Delivery</span>
    <strong>{orderSummary.outForDelivery}</strong>
  </div>

  <div>
    <span>Completed</span>
    <strong>{orderSummary.completed}</strong>
  </div>

  <div>
    <span>Today’s Revenue</span>
    <strong>${orderSummary.todayRevenue.toFixed(2)}</strong>
  </div>
</div>

        <div className="admin-order-filters">
  {ORDER_FILTER_OPTIONS.map((filter) => (
    <button
      type="button"
      key={filter}
      className={activeFilter === filter ? "active" : ""}
      onClick={() => setActiveFilter(filter)}
    >
      {filter === "all"
  ? "All"
  : filter === "active"
    ? "Active"
    : formatStatusLabel(filter)}

<span>
  {filter === "all"
    ? orders.length
    : filter === "active"
      ? orders.filter((order) =>
          ACTIVE_ORDER_STATUSES.includes(normalizeOrderStatus(order.order_status))
        ).length
      : orders.filter(
          (order) => normalizeOrderStatus(order.order_status) === filter
        ).length}
</span>
    </button>
  ))}
</div>

<div className="admin-order-search">
  <label>
    Search Orders
    <input
      type="search"
      value={searchTerm}
      placeholder="Search name, phone, city, memo, or order ID..."
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </label>

  {searchTerm.trim() && (
    <button type="button" onClick={() => setSearchTerm("")}>
      Clear
    </button>
  )}
</div>

        <div className="admin-orders-list">
          {loading ? (
  <div className="portal-alert">
    Loading orders...
  </div>
) : orders.length === 0 ? (
  <div className="portal-alert">
    No orders have been submitted yet.
  </div>
) : filteredOrders.length === 0 ? (
  <div className="portal-alert">
  No orders match this filter or search.
</div>
) : (
  filteredOrders.map((order) => {
  const items = Array.isArray(order.items) ? order.items : [];
  const orderStatus = normalizeOrderStatus(order.order_status);
  const paymentStatus = normalizeOrderStatus(order.payment_status);

              return (
                <article key={order.id} className="admin-order-card">
                  <div className="admin-order-top">
  <div>
    <span className="auth-eyebrow">Customer</span>

    <h2>{order.customer_name}</h2>

    <p>
      {order.phone} · {order.city}
    </p>

    <button
      type="button"
      className="copy-memo-btn"
      onClick={() => copyToClipboard(order.payment_memo)}
    >
      Copy Payment Memo
    </button>
  </div>

  <strong className={`status-pill status-${normalizeOrderStatus(order.order_status)}`}>
  {formatStatusLabel(order.order_status)}
</strong>
</div>

{paymentStatus === "pending" && (
  <div className="payment-warning">
    Payment is still pending. Check Zelle / Apple Pay for this memo:
    <strong>{order.payment_memo}</strong>
  </div>
)}

<div className="admin-contact-actions">
  <a href={`tel:${cleanPhoneNumber(order.phone)}`}>
    Call Customer
  </a>

  <a
    href={`sms:${cleanPhoneNumber(order.phone)}?&body=${buildSmsMessage(order)}`}
  >
    Text Customer
  </a>

  <a
    href={buildMapsUrl(order)}
    target="_blank"
    rel="noreferrer"
  >
    Open Address
  </a>
</div>

                  <div className="admin-order-meta">
                    <div>
                      <span>Order ID</span>
                      <strong>{order.id}</strong>
                    </div>

                    <div>
                      <span>Submitted</span>
                      <strong>
                        {new Date(order.created_at).toLocaleString()}
                      </strong>
                    </div>

                    <div>
                      <span>Payment Method</span>
                      <strong>
                        {formatStatusLabel(order.payment_method)}
                      </strong>
                    </div>

                    <div>
                      <span>Payment Memo</span>
                      <strong>{order.payment_memo}</strong>
                    </div>

                    <div>
                      <span>Total</span>
                      <strong>${Number(order.total || 0).toFixed(2)}</strong>
                    </div>

                    <div>
                      <span>Delivery Fee</span>
                      <strong>
                        ${Number(order.delivery_fee || 0).toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  <div className="admin-order-address">
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

                  <div className="admin-order-items">
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

                  <div className="admin-order-controls">
  <label>
    Payment Status

    <strong className={`mini-status-pill payment-${paymentStatus}`}>
      {formatStatusLabel(order.payment_status)}
    </strong>

    <select
      value={order.payment_status}
      onChange={(e) =>
        updateOrderField({
          orderId: order.id,
          field: "payment_status",
          value: e.target.value,
        })
      }
    >
      {PAYMENT_STATUS_OPTIONS.map((status) => (
        <option key={status} value={status}>
          {formatStatusLabel(status)}
        </option>
      ))}
    </select>
  </label>

  <label>
    Order Status

    <select
      value={order.order_status}
      onChange={(e) =>
        updateOrderField({
          orderId: order.id,
          field: "order_status",
          value: e.target.value,
        })
      }
    >
      {ORDER_STATUS_OPTIONS.map((status) => (
        <option key={status} value={status}>
          {formatStatusLabel(status)}
        </option>
      ))}
    </select>
  </label>
</div>

<div className="admin-customer-update-message">
  <label>
    Customer Update Message
    <textarea
      value={customerUpdateDrafts[order.id] || ""}
      placeholder="Example: Driver is 15 minutes away. Meet near the front entrance..."
      onChange={(e) =>
        setCustomerUpdateDrafts((prev) => ({
          ...prev,
          [order.id]: e.target.value,
        }))
      }
    />
  </label>

  <p>
    Click Send Customer Update to show this message in the customer portal.
    Quick action buttons can also use this message.
  </p>

  <button
    type="button"
    onClick={() => sendCustomerUpdate(order.id)}
  >
    Send Customer Update
  </button>
</div>

<div className="admin-quick-actions">
  {paymentStatus !== "received" &&
    orderStatus !== "cancelled" && (
      <button
        type="button"
        onClick={() =>
          updateOrderFields({
  orderId: order.id,
  updates: {
    payment_status: "received",
    order_status: "confirmed",
  },
  message: "Payment marked received and order confirmed.",
  customerMessage: customerUpdateDrafts[order.id],
})
        }
      >
        Mark Paid
      </button>
    )}

  {orderStatus === "pending" && (
    <button
      type="button"
      onClick={() =>
        updateOrderFields({
  orderId: order.id,
  updates: {
    order_status: "confirmed",
  },
  message: "Order confirmed.",
  customerMessage: customerUpdateDrafts[order.id],
})
      }
    >
      Confirm Order
    </button>
  )}

  {(orderStatus === "pending" || orderStatus === "confirmed") && (
    <button
      type="button"
      onClick={() =>
        updateOrderFields({
          orderId: order.id,
          updates: {
            order_status: "out_for_delivery",
          },
          message: "Order marked out for delivery.",
          customerMessage: customerUpdateDrafts[order.id],
        })
      }
    >
      Out For Delivery
    </button>
  )}

  {orderStatus !== "completed" && orderStatus !== "cancelled" && (
    <button
      type="button"
      onClick={() =>
        updateOrderFields({
          orderId: order.id,
          updates: {
            order_status: "completed",
            payment_status: "received",
          },
          message: "Order completed and payment marked received.",
          customerMessage: customerUpdateDrafts[order.id],
        })
      }
    >
      Complete Order
    </button>
  )}

  {orderStatus !== "cancelled" && orderStatus !== "completed" && (
    <button
      type="button"
      className="danger-action"
      onClick={() =>
        updateOrderFields({
          orderId: order.id,
          updates: {
            order_status: "cancelled",
          },
          message: "Order cancelled.",
          customerMessage: customerUpdateDrafts[order.id],
        })
      }
    >
      Cancel Order
    </button>
  )}

  {(orderStatus === "completed" || orderStatus === "cancelled") && (
    <>
      <span className="admin-quick-actions-empty">
        This order is closed.
      </span>

      <button
        type="button"
        onClick={() => {
          setActiveFilter("active");

          updateOrderFields({
            orderId: order.id,
            updates: {
              order_status: "confirmed",
              payment_status:
                paymentStatus === "received" ? "received" : "pending",
            },
            message: "Order reopened and moved back to confirmed.",
            customerMessage: customerUpdateDrafts[order.id],
          });
        }}
      >
        Reopen Order
      </button>
    </>
  )}
</div>

<div className="admin-order-timeline">
  <span>Order Timeline</span>

  {getTimelineEntries(order).map((event) => (
    <div key={event.id} className={`timeline-event timeline-${event.type}`}>
      <div className="timeline-dot"></div>

      <div>
        <strong>{event.label}</strong>
        <p>{event.message}</p>
        <small>{formatTimelineDate(event.at)}</small>
      </div>
    </div>
  ))}
</div>

<div className="admin-internal-notes">
  <label>
    Internal Notes
    <textarea
      value={order.admin_notes || ""}
      placeholder="Example: Payment confirmed, driver assigned, customer texted..."
      onChange={(e) =>
        setOrders((prev) =>
          prev.map((item) =>
            item.id === order.id
              ? {
                  ...item,
                  admin_notes: e.target.value,
                }
              : item
          )
        )
      }
    />
  </label>

  <button
    type="button"
    onClick={() =>
      updateOrderField({
        orderId: order.id,
        field: "admin_notes",
        value: order.admin_notes || "",
      })
    }
  >
    Save Notes
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