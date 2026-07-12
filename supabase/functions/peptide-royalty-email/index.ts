// supabase/functions/peptide-royalty-email/index.ts

type CartItem = {
  id?: string;
  name?: string;
  category?: string;
  gram?: string;
  dose?: string;
  price?: number | string;
  quantity?: number | string;
};

type RoyaltyPayload = {
  orderId?: string;
  customerName?: string;
  customerContact?: string;
  city?: string;
  deliveryFee?: number;
  cartItems?: CartItem[];
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const money = (value: number) => {
  return `$${Number(value || 0).toFixed(2)}`;
};

const esc = (value: unknown) => {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

Deno.serve(async (req) => {
  console.log("peptide-royalty-email invoked", {
    method: req.method,
    time: new Date().toISOString(),
  });

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    console.log("Invalid method", req.method);

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const royaltyEmailTo = Deno.env.get("PEPTIDE_ROYALTY_EMAIL_TO");
    const royaltyEmailFrom =
      Deno.env.get("PEPTIDE_ROYALTY_EMAIL_FROM") ||
      "The High Council <onboarding@resend.dev>";

    console.log("Secrets loaded", {
      hasResendApiKey: Boolean(resendApiKey),
      royaltyEmailTo,
      royaltyEmailFrom,
    });

    if (!resendApiKey || !royaltyEmailTo) {
      console.log("Missing required secrets");

      return new Response(
        JSON.stringify({
          error: "Missing RESEND_API_KEY or PEPTIDE_ROYALTY_EMAIL_TO",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const payload = (await req.json()) as RoyaltyPayload;

    const cartItems = Array.isArray(payload.cartItems)
      ? payload.cartItems
      : [];

    console.log("Payload received", {
      orderId: payload.orderId,
      city: payload.city,
      totalItemsReceived: cartItems.length,
      categories: cartItems.map((item) => item.category),
    });

    const peptideItems = cartItems.filter(
      (item) => String(item.category || "").toLowerCase() === "peptides"
    );

    console.log("Peptide items found", {
      peptideCount: peptideItems.length,
      peptideItems,
    });

    if (peptideItems.length === 0) {
      return new Response(
        JSON.stringify({
          sent: false,
          reason: "No peptide items in order.",
          receivedCategories: cartItems.map((item) => item.category || null),
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const lineItems = peptideItems.map((item) => {
      const price = Number(item.price || 0);
      const quantity = Number(item.quantity || 0);
      const lineTotal = price * quantity;

      return {
        name: item.name || "Peptide Item",
        dose: item.dose || item.gram || "",
        price,
        quantity,
        lineTotal,
      };
    });

    const peptideSubtotal = lineItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0
    );

    const royaltyRate = 0.2;
    const royaltyCut = peptideSubtotal * royaltyRate;

    console.log("Royalty calculated", {
      peptideSubtotal,
      royaltyRate,
      royaltyCut,
    });

    const itemRows = lineItems
      .map(
        (item) => `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #1f2937;">
              <strong>${esc(item.name)}</strong>
              ${
                item.dose
                  ? `<br><span style="color:#94a3b8;">${esc(item.dose)}</span>`
                  : ""
              }
            </td>
            <td style="padding:10px;border-bottom:1px solid #1f2937;text-align:center;">
              ${esc(item.quantity)}
            </td>
            <td style="padding:10px;border-bottom:1px solid #1f2937;text-align:right;">
              ${money(item.price)}
            </td>
            <td style="padding:10px;border-bottom:1px solid #1f2937;text-align:right;">
              ${money(item.lineTotal)}
            </td>
          </tr>
        `
      )
      .join("");

    const subject = `Peptide Royalty Alert — ${money(royaltyCut)} Cut`;

    const html = `
      <div style="margin:0;padding:0;background:#070712;color:#ffffff;font-family:Arial,sans-serif;">
        <div style="max-width:720px;margin:0 auto;padding:28px;">
          <div style="padding:22px;border:1px solid rgba(0,229,255,0.28);border-radius:22px;background:linear-gradient(135deg,rgba(0,229,255,0.12),rgba(255,78,196,0.08));">
            <p style="margin:0 0 8px;color:#00e5ff;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">
              Peptide Royalty Tracker
            </p>

            <h1 style="margin:0;color:#ffffff;font-size:30px;line-height:1.1;">
              New Peptides Purchase
            </h1>

            <p style="margin:12px 0 0;color:#cbd5e1;font-size:14px;line-height:1.5;">
              This email only tracks dollars spent on products in the <strong>Peptides</strong> category.
            </p>
          </div>

          <div style="margin-top:18px;padding:18px;border-radius:18px;background:#0f1020;border:1px solid #1f2937;">
            <h2 style="margin:0 0 12px;font-size:18px;color:#ffffff;">Order Details</h2>

            <p style="margin:6px 0;color:#cbd5e1;"><strong>Order ID:</strong> ${esc(payload.orderId || "N/A")}</p>
            <p style="margin:6px 0;color:#cbd5e1;"><strong>Customer:</strong> ${esc(payload.customerName || "N/A")}</p>
            <p style="margin:6px 0;color:#cbd5e1;"><strong>Contact:</strong> ${esc(payload.customerContact || "N/A")}</p>
            <p style="margin:6px 0;color:#cbd5e1;"><strong>City:</strong> ${esc(payload.city || "N/A")}</p>
          </div>

          <div style="margin-top:18px;padding:18px;border-radius:18px;background:#0f1020;border:1px solid #1f2937;">
            <h2 style="margin:0 0 12px;font-size:18px;color:#ffffff;">Peptide Item Breakdown</h2>

            <table style="width:100%;border-collapse:collapse;color:#ffffff;font-size:14px;">
              <thead>
                <tr>
                  <th style="padding:10px;border-bottom:1px solid #334155;text-align:left;color:#94a3b8;">Product</th>
                  <th style="padding:10px;border-bottom:1px solid #334155;text-align:center;color:#94a3b8;">Qty</th>
                  <th style="padding:10px;border-bottom:1px solid #334155;text-align:right;color:#94a3b8;">Unit</th>
                  <th style="padding:10px;border-bottom:1px solid #334155;text-align:right;color:#94a3b8;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>
          </div>

          <div style="margin-top:18px;padding:20px;border-radius:20px;background:linear-gradient(135deg,rgba(78,255,154,0.16),rgba(0,229,255,0.1));border:1px solid rgba(78,255,154,0.34);">
            <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">
              Royalty Calculation
            </p>

            <p style="margin:8px 0;color:#ffffff;font-size:16px;">
              Peptide Subtotal: <strong>${money(peptideSubtotal)}</strong>
            </p>

            <p style="margin:8px 0;color:#ffffff;font-size:16px;">
              Royalty Rate: <strong>20%</strong>
            </p>

            <p style="margin:12px 0 0;color:#4eff9a;font-size:28px;font-weight:800;">
              Your Cut: ${money(royaltyCut)}
            </p>
          </div>
        </div>
      </div>
    `;

    console.log("Sending email through Resend", {
      to: royaltyEmailTo,
      from: royaltyEmailFrom,
      subject,
    });

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: royaltyEmailFrom,
        to: [royaltyEmailTo],
        subject,
        html,
      }),
    });

    const emailResult = await emailResponse.json();

    console.log("Resend response", {
      ok: emailResponse.ok,
      status: emailResponse.status,
      emailResult,
    });

    if (!emailResponse.ok) {
      return new Response(
        JSON.stringify({
          error: "Email failed",
          details: emailResult,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        sent: true,
        peptideSubtotal,
        royaltyRate,
        royaltyCut,
        emailResult,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.log("Unexpected function error", String(error));

    return new Response(
      JSON.stringify({
        error: "Unexpected error",
        details: String(error),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});