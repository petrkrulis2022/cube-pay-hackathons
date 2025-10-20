// src/pages/api/revolut/webhook.js
import { buffer } from "micro";
import crypto from "crypto";

// You'll get this from your Revolut Merchant settings
const WEBHOOK_SECRET = process.env.REVOLUT_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const rawBody = await buffer(req);
  const signature = req.headers["revolut-signature"];

  // Verify the webhook signature
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  hmac.update(rawBody);
  const computedSignature = hmac.digest("hex");

  if (computedSignature !== signature) {
    return res.status(400).send("Invalid signature");
  }

  const event = JSON.parse(rawBody.toString());

  // Process the event
  switch (event.event) {
    case "ORDER_COMPLETED":
      const order = event.data;
      console.log(`Order ${order.id} completed!`);
      // TODO: Update your database and notify the user
      break;
    case "ORDER_FAILED":
      const failedOrder = event.data;
      console.log(`Order ${failedOrder.id} failed.`);
      // TODO: Update your database and notify the user
      break;
    // Handle other events...
    default:
      console.log(`Unhandled event type ${event.event}`);
  }

  res.status(200).send("OK");
}
