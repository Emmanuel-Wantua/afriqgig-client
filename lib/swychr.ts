import axios from "axios";

// --- CONFIGURATION ---
const PAYIN_URL = process.env.SWYCHR_PAYIN_URL || "https://api.accountpe.com/api/payin";
const PAYOUT_URL = process.env.SWYCHR_PAYOUT_URL || "https://api.accountpe.com/api/payout";

const CREDENTIALS = {
  email: process.env.SWYCHR_ADMIN_EMAIL,
  password: process.env.SWYCHR_ADMIN_PASSWORD,
};

// --- TOKEN CACHE (To avoid logging in for every single click) ---
let payinToken: string | null = null;
let payoutToken: string | null = null;

// --- 1. AUTHENTICATION ENGINE ---

// Login to PAYIN API (For Deposits)
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
  } catch (error: any) {
    console.error("❌ Payin Auth Failed:", error.response?.data || error.message);
    throw new Error("Payment System Offline (Auth)");
  }
}

// Login to PAYOUT API (For Withdrawals)
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
  } catch (error: any) {
    console.error("❌ Payout Auth Failed:", error.response?.data || error.message);
    throw new Error("Payout System Offline (Auth)");
  }
}

// --- 2. DEPOSIT FUNCTIONS (PAYIN) ---

export async function createDepositLink(user: any, amount: number, transactionId: string) {
  const token = await getPayinToken();
  
  // Per agreement: We pass the digital charge (2.5%) to the user
  const payload = {
    country_code: "CM", // Default to Cameroon (or dynamic based on user.country)
    name: user.name,
    email: user.email,
    mobile: user.phone || "",
    amount: amount, // The amount they WANT to deposit (e.g., 10,000)
    currency: "XAF",
    transaction_id: transactionId,
    description: `AfriqGig Wallet Topup: ${user.email}`,
    pass_digital_charge: true, // <--- CRITICAL: User pays the fee on top
    callback_url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/swychr` // Webhook to confirm payment
  };

  try {
    const { data } = await axios.post(`${PAYIN_URL}/create_payment_links`, payload, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Idempotency-Key": transactionId // Prevents duplicate charges
      }
    });
    return data.data; // Returns { payment_link, id, ... }
  } catch (error: any) {
    console.error("❌ Create Link Failed:", error.response?.data || error.message);
    // If token expired, reset and retry (simple logic)
    if (error.response?.status === 401) payinToken = null;
    throw new Error(error.response?.data?.message || "Failed to create payment link");
  }
}

// --- 3. WITHDRAWAL FUNCTIONS (PAYOUT) ---

// Step A: Get Supported Banks/MOMO for a Country
export async function getPayoutMethods(countryCode: string = "CM") {
  const token = await getPayoutToken();
  try {
    const { data } = await axios.post(`${PAYOUT_URL}/payout_methods`, { country_code: countryCode }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data.data; // Returns payment methods & currency info
  } catch (error: any) {
    console.error("❌ Fetch Methods Failed:", error.response?.data);
    return null;
  }
}

// Step B: Send Money
export async function executePayout(
  details: {
    country_code: string;
    beneficiary_name: string;
    mobile_no: string; // E.164 format
    amount: number; // Net amount AFTER fees
    transaction_id: string;
    payment_method: string; // e.g., 'momo' or 'bank_transfer'
    bank_code?: string;
    account_number?: string;
  }
) {
  const token = await getPayoutToken();
  
  try {
    const { data } = await axios.post(`${PAYOUT_URL}/create_transaction`, details, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error: any) {
    console.error("❌ Payout Failed:", error.response?.data || error.message);
    if (error.response?.status === 401) payoutToken = null;
    throw new Error(error.response?.data?.message || "Payout execution failed");
  }
}