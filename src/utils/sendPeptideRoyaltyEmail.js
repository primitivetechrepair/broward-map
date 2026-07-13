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
  console.log("Royalty utility called", {
    orderId,
    cartItems,
    categories: Array.isArray(cartItems)
      ? cartItems.map((item) => item.category)
      : [],
  });

  const peptideItems = Array.isArray(cartItems)
    ? cartItems.filter(
        (item) =>
          String(item.category || "")
            .trim()
            .toLowerCase() === "peptides"
      )
    : [];

  console.log("Royalty peptide matches", peptideItems);

  if (peptideItems.length === 0) {
    console.warn("Royalty email skipped: no peptide category match.");

    return {
      sent: false,
      reason: "No peptide items in order.",
    };
  }

  console.log("Invoking peptide-royalty-email Edge Function");

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

  console.log("Royalty Edge Function response", {
    data,
    error,
  });

  if (error) {
    throw error;
  }

  if (data?.sent === false || data?.error) {
    throw new Error(
      data?.error ||
        data?.reason ||
        "Peptide royalty email was not sent."
    );
  }

  return data;
};