import axios from "axios";

// --- CONFIGURATION ---
const PAYIN_URL = process.env.SWYCHR_PAYIN_URL || "https://api.accountpe.com/api/payin";
const PAYOUT_URL = process.env.SWYCHR_PAYOUT_URL || "https://api.accountpe.com/api/payout";

// Shared secret embedded in the webhook callback URL. Swychr doesn't document
// an HMAC signing header, so we defend the webhook endpoint the portable way:
// only requests carrying this exact token are trusted.
const WEBHOOK_SECRET = process.env.SWYCHR_WEBHOOK_SECRET;

const CREDENTIALS = {
  email: process.env.SWYCHR_ADMIN_EMAIL,
  password: process.env.SWYCHR_ADMIN_PASSWORD,
};

// --- TOKEN CACHE (To avoid logging in for every single click) ---
let payinToken: string | null = null;
let payoutToken: string | null = null;

// ✅ Typed error instead of attaching properties to `any`. Callers can
// `instanceof` check this to tell "Swychr explicitly rejected this" apart
// from "we genuinely don't know what happened" (timeout/no response).
export class SwychrPayoutError extends Error {
  isExplicitRejection: boolean;
  raw: unknown;

  constructor(message: string, isExplicitRejection: boolean, raw: unknown) {
    super(message);
    this.name = "SwychrPayoutError";
    this.isExplicitRejection = isExplicitRejection;
    this.raw = raw;
  }
}

// --- 1. AUTHENTICATION ENGINE ---

async function getPayinToken() {
  if (payinToken) return payinToken;

  try {
    console.log("🔐 [Swychr] Authenticating Payin API...");
    const { data } = await axios.post(`${PAYIN_URL}/admin/auth`, CREDENTIALS);

    if (data.token) {
      payinToken = data.token;
      return data.token;
    }
    throw new Error("No token returned from Payin Auth");
  } catch (error: unknown) {
    const axiosError = axios.isAxiosError(error) ? error : null;
    console.error("❌ Payin Auth Failed:", axiosError?.response?.data || (error instanceof Error ? error.message : error));
    throw new Error("Payment System Offline (Auth)");
  }
}

async function getPayoutToken() {
  if (payoutToken) return payoutToken;

  try {
    console.log("🔐 [Swychr] Authenticating Payout API...");
    const { data } = await axios.post(`${PAYOUT_URL}/admin/auth`, CREDENTIALS);

    if (data.token) {
      payoutToken = data.token;
      return data.token;
    }
    throw new Error("No token returned from Payout Auth");
  } catch (error: unknown) {
    const axiosError = axios.isAxiosError(error) ? error : null;
    console.error("❌ Payout Auth Failed:", axiosError?.response?.data || (error instanceof Error ? error.message : error));
    throw new Error("Payout System Offline (Auth)");
  }
}

// --- 2. DEPOSIT FUNCTIONS (PAYIN) ---

interface DepositUser {
  name: string;
  email: string;
  phone?: string;
}

export async function createDepositLink(user: DepositUser, amount: number, transactionId: string) {
  const token = await getPayinToken();

  if (!WEBHOOK_SECRET) {
    console.warn("⚠️ [Swychr] SWYCHR_WEBHOOK_SECRET is not set — webhook endpoint is unprotected!");
  }

  const payload = {
    country_code: "CM",
    name: user.name,
    email: user.email,
    mobile: user.phone || "",
    amount: amount,
    currency: "XAF",
    transaction_id: transactionId,
    description: `AfriqGig Wallet Topup: ${user.email}`,
    pass_digital_charge: true,
    callback_url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/swychr?secret=${WEBHOOK_SECRET || ""}`
  };

  try {
    const { data } = await axios.post(`${PAYIN_URL}/create_payment_links`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Idempotency-Key": transactionId
      }
    });
    return data.data;
  } catch (error: unknown) {
    const axiosError = axios.isAxiosError(error) ? error : null;
    console.error("❌ Create Link Failed:", axiosError?.response?.data || (error instanceof Error ? error.message : error));
    if (axiosError?.response?.status === 401) payinToken = null;
    const message = (axiosError?.response?.data as { message?: string } | undefined)?.message || "Failed to create payment link";
    throw new Error(message);
  }
}

// --- 3. WITHDRAWAL FUNCTIONS (PAYOUT) ---

export async function getPayoutMethods(countryCode: string = "CM") {
  const token = await getPayoutToken();
  try {
    const { data } = await axios.post(`${PAYOUT_URL}/payout_methods`, { country_code: countryCode }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data.data;
  } catch (error: unknown) {
    const axiosError = axios.isAxiosError(error) ? error : null;
    console.error("❌ Fetch Methods Failed:", axiosError?.response?.data);
    return null;
  }
}

export interface PayoutDetails {
  country_code: string;
  beneficiary_name: string;
  mobile_no: string;
  amount: number;
  transaction_id: string;
  payment_method: string;
  bank_code?: string;
  account_number?: string;
}

export async function executePayout(details: PayoutDetails) {
  const token = await getPayoutToken();

  try {
    const { data } = await axios.post(`${PAYOUT_URL}/create_transaction`, details, {
      headers: {
        Authorization: `Bearer ${token}`,
        // Mirrors the deposit flow — protects against a retried request
        // (client double-click, or a retry after a dropped connection)
        // triggering two real payouts for the same withdrawal.
        "Idempotency-Key": details.transaction_id
      }
    });
    return data;
  } catch (error: unknown) {
    const axiosError = axios.isAxiosError(error) ? error : null;
    console.error("❌ Payout Failed:", axiosError?.response?.data || (error instanceof Error ? error.message : error));
    if (axiosError?.response?.status === 401) payoutToken = null;

    // `axiosError.response` present = Swychr actually responded with a
    // rejection body (safe to refund). No `.response` = timeout/dropped
    // connection/no reply (do NOT assume failure — it may have gone through).
    const isExplicitRejection = !!axiosError?.response;
    const message = (axiosError?.response?.data as { message?: string } | undefined)?.message || "Payout execution failed";
    const raw = axiosError?.response?.data ?? (error instanceof Error ? error.message : error);

    throw new SwychrPayoutError(message, isExplicitRejection, raw);
  }
}
