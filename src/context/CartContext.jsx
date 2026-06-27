import React, { createContext, useState, useContext } from "react";

// Create context
const CartContext = createContext();

// Hook to use cart easily
export const useCart = () => useContext(CartContext);

// Provider component
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]); // { id, name, price, quantity }

  // Add item to cart (increment if exists)
  const addItem = (item) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  // Remove item completely
  const removeItem = (id) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Update quantity
  const updateQuantity = (id, quantity) => {
    setCartItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity } : i
      )
    );
  };

  // Clear cart
  const clearCart = () => setCartItems([]);

  // Total items
  const totalItems = cartItems.reduce(
    (sum, i) => sum + i.quantity,
    0
  );

  // Total price
  const totalPrice = cartItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
