import React from "react";
import { useCart } from "../context/CartContext";
import "./BagModal.css";

export default function BagModal({ isOpen, onClose }) {
  const { cartItems, removeItem, totalPrice } = useCart();

  if (!isOpen) return null;

  return (
    <div className="bag-overlay" onClick={onClose}>
      <div className="bag-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Your Bag</h3>

        {cartItems.length === 0 ? (
          <p>Your bag is empty.</p>
        ) : (
          <ul className="bag-items">
            {cartItems.map((item) => (
              <li
                key={`${item.id}-${item.gram}`}
                className="bag-item"
              >
                <div className="bag-item-info">
                  <strong>
                    {item.name}
                    {item.gram && (
                      <span className="bag-gram"> ({item.gram}g)</span>
                    )}
                  </strong>

                  <p>
                    ${item.price} × {item.quantity}
                  </p>
                </div>

                <button
                  className="remove-item"
                  onClick={() => removeItem(item.id, item.gram)}
                  aria-label="Remove item"
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="bag-footer">
          <strong>Subtotal:</strong> ${totalPrice.toFixed(2)}
        </div>

        <button className="close-bag" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
