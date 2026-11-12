const MODE = process.env.PAYPAL_MODE || "sandbox";
const BASE =
  MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

const ID = process.env.PAYPAL_CLIENT_ID || "";
const SECRET = process.env.PAYPAL_CLIENT_SECRET || "";

export const isDummy =
  !ID || !SECRET || ID.startsWith("DUMMY") || SECRET.startsWith("DUMMY");

async function token(): Promise<string> {
  const creds = Buffer.from(`${ID}:${SECRET}`).toString("base64");
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`paypal token failed: ${res.status}`);
  const j = await res.json();
  return j.access_token as string;
}

export type CartItem = { name: string; price_cents: number; qty: number };

/** Create a PayPal order. Dummy mode returns a simulated order so the UI works without keys. */
export async function createPaypalOrder(
  items: CartItem[],
  currency = "USD",
  opts: { payeeMerchantId?: string } = {}
): Promise<{ id: string; dummy: boolean }> {
  const total = (items.reduce((s, i) => s + i.price_cents * i.qty, 0) / 100).toFixed(2);
  if (isDummy) {
    return { id: `DUMMY-${Date.now()}`, dummy: true };
  }
  const access = await token();
  const purchase_unit: Record<string, unknown> = {
    amount: { currency_code: currency, value: total },
    description: "fern storefront order",
  };
  // Commerce Platform direct settlement: money lands in the seller's account,
  // not the platform's. Set once the seller completes PayPal onboarding.
  if (opts.payeeMerchantId) {
    purchase_unit.payee = { merchant_id: opts.payeeMerchantId };
  }
  const res = await fetch(`${BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [purchase_unit],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`paypal create order failed: ${res.status} ${t}`);
  }
  const j = await res.json();
  return { id: j.id as string, dummy: false };
}

/** Capture a PayPal order. Dummy mode simulates success. */
export async function capturePaypalOrder(orderId: string): Promise<{
  status: string;
  email?: string;
  dummy: boolean;
}> {
  if (isDummy || orderId.startsWith("DUMMY-")) {
    return { status: "COMPLETED", email: "sandbox-buyer@example.com", dummy: true };
  }
  const access = await token();
  const res = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`paypal capture failed: ${res.status} ${t}`);
  }
  const j = await res.json();
  return {
    status: j.status as string,
    email: j?.payer?.email_address as string | undefined,
    dummy: false,
  };
}
