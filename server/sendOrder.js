import express from "express";
import cors from "cors";
import multer from "multer";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// Allow CORS for frontend requests
app.use(cors());

// Serve static files (if needed)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer setup for ID upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + file.originalname;
    cb(null, uniqueSuffix);
  },
});
const upload = multer({ storage });

// POST route to receive order
app.post("/send-order", upload.single("idFile"), async (req, res) => {
  try {
    const idFilePath = req.file ? req.file.path : null;

    // Form fields
    const cartItems = JSON.parse(req.body.cartItems);
    const subtotal = req.body.subtotal;
    const deliveryFee = req.body.deliveryFee;
    const total = req.body.total;
    const deliveryLocation = JSON.parse(req.body.deliveryLocation);
    const address = JSON.parse(req.body.address);
    const customer = JSON.parse(req.body.customer);
    const paymentMethod = req.body.paymentMethod;

    // ================= Internal Invoice Email
    const internalHtml = `
      <h2>New Order Received (Internal)</h2>
      <strong>Customer:</strong> ${customer.firstName} ${customer.lastName}<br/>
      <strong>Email:</strong> ${customer.email}<br/>
      <strong>Phone:</strong> ${customer.phone}<br/>
      <strong>Address:</strong> ${address.street}, ${address.city}, ${address.state}, ${address.zip}<br/>
      <strong>Delivery Area:</strong> ${deliveryLocation.label}<br/>
      <strong>Payment Method:</strong> ${paymentMethod}<br/>
      <strong>Subtotal:</strong> $${subtotal}<br/>
      <strong>Delivery Fee:</strong> $${deliveryFee}<br/>
      <strong>Total:</strong> $${total}<br/>
      <h3>Cart Items:</h3>
      <ul>
        ${cartItems
          .map(
            (item) =>
              `<li>${item.name}${item.gram ? ` – ${item.gram}g` : ""} x${item.quantity} = $${(
                item.price * item.quantity
              ).toFixed(2)}</li>`
          )
          .join("")}
      </ul>
    `;

    // ================= Customer Confirmation Email
    const customerHtml = `
      <h2>Order Confirmation</h2>
      <p>Hi ${customer.firstName},</p>
      <p>Thank you for your order! Your order will be fulfilled shortly.</p>
      <p><strong>Total:</strong> $${total}</p>
      <p><strong>Delivery Area:</strong> ${deliveryLocation.label}</p>
      <p>We will contact you if any additional information is needed.</p>
    `;

    // Nodemailer setup
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "YOUR_EMAIL@gmail.com", // <-- internal host email
        pass: "YOUR_APP_PASSWORD",    // <-- Gmail App Password
      },
    });

    // Send Internal Invoice
    await transporter.sendMail({
      from: `"Order Verification" <YOUR_EMAIL@gmail.com>`,
      to: "YOUR_EMAIL@gmail.com", // internal verification email
      subject: `Internal Invoice - Order from ${customer.firstName} ${customer.lastName}`,
      html: internalHtml,
      attachments: idFilePath ? [{ path: idFilePath }] : [],
    });

    // Send Customer Confirmation
    await transporter.sendMail({
      from: `"Your Company Name" <YOUR_EMAIL@gmail.com>`,
      to: customer.email,
      subject: "Order Confirmation",
      html: customerHtml,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error sending order:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("Backend running on port 5000");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
