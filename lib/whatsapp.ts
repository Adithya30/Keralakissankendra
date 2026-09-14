interface WhatsAppOrderParams {
  recipientPhone: string;
  recipientName: string;
  orderId: string;
  items: { name: string; quantity: number; priceInr: number }[];
  totalInr: number;
}

function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return trimmed;
  return `+91${trimmed}`;
}

function buildOrderSummary(
  items: { name: string; quantity: number; priceInr: number }[],
  totalInr: number,
): string {
  const lines = items.map(
    (item) => `${item.quantity}x ${item.name} - ₹${item.priceInr}`,
  );
  lines.push(`Total: ₹${totalInr}`);
  return lines.join(", ");
}

export async function sendOrderConfirmationWhatsApp(
  params: WhatsAppOrderParams,
): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    console.warn(
      "[WhatsApp] Twilio env vars not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM). Skipping notification.",
    );
    return;
  }

  const to = `whatsapp:${normalizePhone(params.recipientPhone)}`;
  const shortOrderId = params.orderId.slice(0, 8);
  const summary = buildOrderSummary(params.items, params.totalInr);

  const contentVariables = JSON.stringify({
    "1": params.recipientName,
    "2": shortOrderId,
    "3": summary,
  });

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString(
      "base64",
    );

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: from,
        To: to,
        ContentSid: "HXebb3f6cca28b7eb7faeeaf5a66bd560b",
        ContentVariables: contentVariables,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[WhatsApp] Twilio API error ${res.status}: ${body}`);
    }
  } catch (err) {
    console.error("[WhatsApp] Failed to send order confirmation:", err);
  }
}

interface WhatsAppShippingUpdateParams {
  recipientPhone: string;
  recipientName: string;
  orderId: string;
  shippingProvider: string;
  shippingTrackingId: string;
}

export async function sendShippingUpdateWhatsApp(
  params: WhatsAppShippingUpdateParams,
): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    console.warn(
      "[WhatsApp] Twilio env vars not configured. Skipping shipping update notification.",
    );
    return;
  }

  const to = `whatsapp:${normalizePhone(params.recipientPhone)}`;
  const shortOrderId = params.orderId.slice(0, 8);

  const contentVariables = JSON.stringify({
    "1": params.recipientName,
    "2": shortOrderId,
    "3": params.shippingProvider,
    "4": params.shippingTrackingId,
  });

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString(
      "base64",
    );

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: from,
        To: to,
        ContentSid: "HX41dcc32568cadc2003e3d72522f31c2b",
        ContentVariables: contentVariables,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[WhatsApp] Shipping update API error ${res.status}: ${body}`);
    }
  } catch (err) {
    console.error("[WhatsApp] Failed to send shipping update:", err);
  }
}
