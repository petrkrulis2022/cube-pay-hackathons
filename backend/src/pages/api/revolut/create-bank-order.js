// src/pages/api/revolut/create-bank-order.js
import revolutApiFetch from "../../../services/revolutApiClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { amount, currency, agentId } = req.body;

  try {
    const order = await revolutApiFetch("/orders", {
      method: "POST",
      body: JSON.stringify({
        amount: amount * 100, // Amount in cents
        currency,
        // Add other details as needed
      }),
    });

    // This is a simplified example. The actual payment URL might be part of the order object
    // or you might need to construct it. Refer to the Revolut documentation for the exact structure.
    const payment_url = `https://sandbox-merchant.revolut.com/pay/${order.id}`;

    res.status(200).json({ payment_url });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Failed to create Revolut order",
        error: error.message,
      });
  }
}
