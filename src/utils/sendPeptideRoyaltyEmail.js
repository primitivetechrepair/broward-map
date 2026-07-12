// src/utils/sendPeptideRoyaltyEmail.js
import { supabase } from "../lib/supabaseClient.js";

export const sendPeptideRoyaltyEmail = async ({
  orderId,
  customerName,
  customerContact,
  city,
  deliverySpeed,
  deliverySpeedLabel,
  baseDeliveryFee,
  deliverySurcharge,
  deliveryFee,
  cartItems,
}) => {
  const peptideItems = Array.isArray(cartItems)
    ? cartItems.filter(
        (item) =>
          String(item.category || "").toLowerCase() === "peptides"
      )
    : [];

  if (peptideItems.length === 0) {
    return {
      sent: false,
      reason: "No peptide items in order.",
    };
  }

  const { data, error } = await supabase.functions.invoke(
    "peptide-royalty-email",
    {
      body: {
        orderId,
        customerName,
        customerContact,
        city,
        deliverySpeed,
        deliverySpeedLabel,
        baseDeliveryFee,
        deliverySurcharge,
        deliveryFee,
        cartItems,
      },
    }
  );

  if (error) {
    console.error("Peptide royalty email failed:", error);
    throw error;
  }

  if (data?.sent === false || data?.error) {
    const functionError = new Error(
      data?.error ||
        data?.reason ||
        "Peptide royalty email was not sent."
    );

    console.error("Peptide royalty email failed:", data);
    throw functionError;
  }

  return data;
};