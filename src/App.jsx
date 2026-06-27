import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Map from "./components/Map/Map";
import Header from "./components/Header";
import MobileHeader from "./components/MobileHeader/MobileHeader";
import ProductsPage from "./pages/ProductsPage";
import CheckoutPage from "./pages/CheckoutPage/CheckoutPage"; // <-- added
import "./App.css";

function AppWrapper() {
  const location = useLocation();

  // Fixed background wrapper only on non-products pages
  const showBackground = location.pathname !== "/products";

  return (
    <>
      {showBackground && (
        <div className="app-background-wrapper">
          <div className="app-background"></div>
        </div>
      )}

      {/* Mobile Header (hidden on desktop) */}
      <div className="mobile-header-wrapper">
        <MobileHeader />
      </div>

      {/* Desktop Header (hidden on mobile) */}
      <div className="desktop-header-wrapper">
        <Header />
      </div>

      {/* Main content */}
      <main className="page-content">
        <Routes>
          <Route path="/" element={<Map />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/checkout" element={<CheckoutPage />} /> {/* <-- added */}
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  );
}
