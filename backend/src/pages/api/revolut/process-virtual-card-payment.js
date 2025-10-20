// src/pages/api/revolut/process-virtual-card-payment.js
import revolutApiFetch from "../../../services/revolutApiClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { token, amount, currency } = req.body;

  try {
    // This is a conceptual example. The actual endpoint and payload for processing a token
    // from the popup SDK will need to be verified in the Revolut documentation.
    // It's likely you'll create an order first, then confirm it with the token.

    const order = await revolutApiFetch("/orders", {
      method: "POST",
      body: JSON.stringify({ amount, currency }),
    });

    const payment = await revolutApiFetch(
      `/orders/${order.id}/pay_with_token`,
      {
        // Fictional endpoint, check docs
        method: "POST",
        body: JSON.stringify({ token }),
      }
    );

    res.status(200).json({ success: true, payment });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to process payment", error: error.message });
  }
}
