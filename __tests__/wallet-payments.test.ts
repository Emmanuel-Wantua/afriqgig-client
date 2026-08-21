/**
 * Payment processing integration tests.
 *
 * Covers the three failure simulations that matter most for mobile-money
 * rails in Cameroon:
 *   1. The user's connection dies mid-payment (unclear outcome).
 *   2. The provider sends a FAILED status payload to our webhook.
 *   3. The user tampers with the payment amount in the browser request.
 *
 * Plus the defensive mechanisms around them: idempotency, webhook origin
 * verification, atomic balance deduction, and refund-only-when-certain.
 */

import { SwychrPayoutError } from "@/lib/swychr";
import { POST as withdrawHandler } from "@/app/api/wallet/withdraw/route";
import { POST as depositHandler } from "@/app/api/wallet/deposit/route";
import { POST as webhookHandler } from "@/app/api/webhooks/swychr/route";
import { jsonRequest, mockDoc } from "./helpers/testUtils";

jest.mock("@/lib/db", () => ({ connectToDB: jest.fn().mockResolvedValue(true) }));
jest.mock("@/lib/email", () => ({ sendEmail: jest.fn() }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));

jest.mock("@/lib/swychr", () => {
  const actual = jest.requireActual("@/lib/swychr");
  return {
    ...actual,
    executePayout: jest.fn(),
    createDepositLink: jest.fn(),
  };
});

jest.mock("@/models/Transaction", () => ({
  __esModule: true,
  default: { create: jest.fn(), findOne: jest.fn(), find: jest.fn() },
}));
jest.mock("@/models/User", () => ({
  __esModule: true,
  default: { findById: jest.fn(), findByIdAndUpdate: jest.fn(), findOneAndUpdate: jest.fn() },
}));
jest.mock("@/models/Notification", () => ({ __esModule: true, default: { create: jest.fn() } }));

// Retrieved after the mock factories run, which avoids the TDZ trap of
// referencing an outer `const` from inside a hoisted `jest.mock` factory.
const Transaction = jest.requireMock("@/models/Transaction").default;
const User = jest.requireMock("@/models/User").default;
const { executePayout, createDepositLink } = jest.requireMock("@/lib/swychr");
const { getServerSession } = jest.requireMock("next-auth");

const SESSION = { user: { _id: "user123", email: "u@test.com", role: "freelancer" } };

const WITHDRAW_URL = "https://test.afriqgig.com/api/wallet/withdraw";
const DEPOSIT_URL = "https://test.afriqgig.com/api/wallet/deposit";
const WEBHOOK_URL = "https://test.afriqgig.com/api/webhooks/swychr";

/** Puts the withdrawal happy path in place; individual tests override pieces. */
function arrangeSolventUser() {
  User.findById.mockResolvedValue({ _id: "user123", email: "u@test.com" });
  User.findOneAndUpdate.mockResolvedValue({ _id: "user123", email: "u@test.com" });
  Transaction.find.mockResolvedValue([]);
  Transaction.create.mockResolvedValue(mockDoc({ status: "pending", description: "" }));
}

beforeEach(() => {
  getServerSession.mockResolvedValue(SESSION);
});

// ---------------------------------------------------------------------------
// SIMULATION 1 — user breaks their internet connection mid-payment
// ---------------------------------------------------------------------------
describe("Simulation: connection lost mid-payment", () => {
  it("does NOT refund on a timeout, because the payout may have succeeded", async () => {
    arrangeSolventUser();
    executePayout.mockRejectedValue(
      new SwychrPayoutError("timeout of 30000ms exceeded", false, null)
    );

    const res = await withdrawHandler(
      jsonRequest(WITHDRAW_URL, { amount: 10000, phone: "237677000000", beneficiaryName: "Test User" })
    );

    // 202 Accepted: "we don't know yet" — never reported as a clean failure.
    expect(res.status).toBe(202);
    // The critical assertion: no blind refund. Refunding here would hand the
    // user their money back on a payout that actually went through.
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("parks the transaction as 'processing' for reconciliation, not 'failed'", async () => {
    arrangeSolventUser();
    const tx = mockDoc({ status: "pending", description: "" });
    Transaction.create.mockResolvedValue(tx);
    executePayout.mockRejectedValue(new SwychrPayoutError("socket hang up", false, null));

    await withdrawHandler(
      jsonRequest(WITHDRAW_URL, { amount: 10000, phone: "237677000000", beneficiaryName: "Test User" })
    );

    expect(tx.status).toBe("processing");
    expect(tx.save).toHaveBeenCalled();
  });

  it("tells the user to check status rather than blindly retry (double-charge guard)", async () => {
    arrangeSolventUser();
    executePayout.mockRejectedValue(new SwychrPayoutError("ETIMEDOUT", false, null));

    const res = await withdrawHandler(
      jsonRequest(WITHDRAW_URL, { amount: 10000, phone: "237677000000", beneficiaryName: "Test User" })
    );
    const body = await res.json();

    expect(body.message).toMatch(/confirming|check back/i);
  });

  it("DOES refund when the provider explicitly rejected the payout", async () => {
    arrangeSolventUser();
    executePayout.mockRejectedValue(
      new SwychrPayoutError("Invalid mobile number", true, { code: "INVALID_NUMBER" })
    );

    const res = await withdrawHandler(
      jsonRequest(WITHDRAW_URL, { amount: 10000, phone: "237677000000", beneficiaryName: "Test User" })
    );

    expect(res.status).toBe(502);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith("user123", {
      $inc: { "wallet.balance": 10000 },
    });
  });

  it("sends an idempotency key so a retried payout can't charge twice", async () => {
    arrangeSolventUser();
    executePayout.mockResolvedValue({ id: "swychr-tx-1" });

    await withdrawHandler(
      jsonRequest(WITHDRAW_URL, { amount: 10000, phone: "237677000000", beneficiaryName: "Test User" })
    );

    const details = executePayout.mock.calls[0][0];
    // `transaction_id` is what lib/swychr forwards as the Idempotency-Key header.
    expect(details.transaction_id).toMatch(/^WTH-/);
  });
});

// ---------------------------------------------------------------------------
// SIMULATION 2 — provider sends a FAILED status payload
// ---------------------------------------------------------------------------
describe("Simulation: provider sends a FAILED webhook payload", () => {
  const failedPayload = {
    data: { data: { attributes: { transaction_id: "DEP-1", status: 2, amount: 5000 } } },
  };

  it("marks the transaction failed and credits nothing", async () => {
    const tx = mockDoc({ status: "pending", amount: 5000, user: "user123" });
    Transaction.findOne.mockResolvedValue(tx);

    const res = await webhookHandler(
      jsonRequest(`${WEBHOOK_URL}?secret=test-secret-value`, failedPayload)
    );

    expect(res.status).toBe(200);
    expect(tx.status).toBe("failed");
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("acknowledges with 200 so the provider stops retrying", async () => {
    Transaction.findOne.mockResolvedValue(mockDoc({ status: "pending", amount: 5000, user: "u" }));

    const res = await webhookHandler(
      jsonRequest(`${WEBHOOK_URL}?secret=test-secret-value`, failedPayload)
    );

    expect(res.status).toBe(200);
  });

  it("credits the wallet on a SUCCESSFUL payload", async () => {
    const tx = mockDoc({ status: "pending", amount: 5000, user: "user123" });
    Transaction.findOne.mockResolvedValue(tx);
    User.findByIdAndUpdate.mockResolvedValue({ _id: "user123", email: "u@test.com" });

    await webhookHandler(
      jsonRequest(`${WEBHOOK_URL}?secret=test-secret-value`, {
        data: { data: { attributes: { transaction_id: "DEP-1", status: 1, amount: 5000 } } },
      })
    );

    expect(tx.status).toBe("completed");
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "user123",
      { $inc: { "wallet.balance": 5000 } },
      { new: true }
    );
  });

  it("is idempotent — a replayed SUCCESS webhook does not double-credit", async () => {
    Transaction.findOne.mockResolvedValue(
      mockDoc({ status: "completed", amount: 5000, user: "user123" })
    );

    const res = await webhookHandler(
      jsonRequest(`${WEBHOOK_URL}?secret=test-secret-value`, {
        data: { data: { attributes: { transaction_id: "DEP-1", status: 1, amount: 5000 } } },
      })
    );

    expect(res.status).toBe(200);
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("rejects a forged webhook that carries no secret", async () => {
    const res = await webhookHandler(jsonRequest(WEBHOOK_URL, failedPayload));

    expect(res.status).toBe(403);
    expect(Transaction.findOne).not.toHaveBeenCalled();
  });

  it("rejects a webhook with a guessed secret", async () => {
    const res = await webhookHandler(
      jsonRequest(`${WEBHOOK_URL}?secret=wrong-guess-value`, failedPayload)
    );

    expect(res.status).toBe(403);
    expect(Transaction.findOne).not.toHaveBeenCalled();
  });

  it("handles an unknown transaction reference without crashing", async () => {
    Transaction.findOne.mockResolvedValue(null);

    const res = await webhookHandler(
      jsonRequest(`${WEBHOOK_URL}?secret=test-secret-value`, failedPayload)
    );

    expect(res.status).toBe(404);
  });

  it("rejects a malformed payload rather than throwing", async () => {
    const res = await webhookHandler(
      jsonRequest(`${WEBHOOK_URL}?secret=test-secret-value`, { nonsense: true })
    );

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// SIMULATION 3 — user manipulates the payment amount in the browser request
// ---------------------------------------------------------------------------
describe("Simulation: amount manipulation from the browser", () => {
  it("ignores a client-supplied fee/net override and recomputes server-side", async () => {
    arrangeSolventUser();
    executePayout.mockResolvedValue({ id: "swychr-tx-1" });

    await withdrawHandler(
      jsonRequest(WITHDRAW_URL, {
        amount: 10000,
        phone: "237677000000",
        beneficiaryName: "Test User",
        fee: 1, // attacker: "charge me 1 XAF"
        netPayout: 9999, // attacker: "pay me 9999"
      })
    );

    const details = executePayout.mock.calls[0][0];
    const expectedFee = Math.ceil(10000 * 0.015 + 450);
    expect(details.amount).toBe(10000 - expectedFee);
    expect(details.amount).not.toBe(9999);
  });

  it("ignores a client-supplied userId and acts only on the session identity", async () => {
    arrangeSolventUser();
    executePayout.mockResolvedValue({ id: "swychr-tx-1" });

    await withdrawHandler(
      jsonRequest(WITHDRAW_URL, {
        userId: "victim-account-id", // attacker: "withdraw from THIS account"
        amount: 10000,
        phone: "237677000000",
        beneficiaryName: "Test User",
      })
    );

    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: "user123" }),
      expect.anything(),
      expect.anything()
    );
    expect(Transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ user: "user123" })
    );
  });

  it("rejects a negative amount instead of crediting the attacker", async () => {
    arrangeSolventUser();

    const res = await withdrawHandler(
      jsonRequest(WITHDRAW_URL, { amount: -50000, phone: "237677000000", beneficiaryName: "T" })
    );

    expect(res.status).toBe(400);
    expect(executePayout).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric amount", async () => {
    arrangeSolventUser();

    const res = await withdrawHandler(
      jsonRequest(WITHDRAW_URL, { amount: "10000abc", phone: "237677000000", beneficiaryName: "T" })
    );

    expect(res.status).toBe(400);
    expect(executePayout).not.toHaveBeenCalled();
  });

  it("rejects an amount below the minimum", async () => {
    arrangeSolventUser();

    const res = await withdrawHandler(
      jsonRequest(WITHDRAW_URL, { amount: 500, phone: "237677000000", beneficiaryName: "T" })
    );

    expect(res.status).toBe(400);
    expect(executePayout).not.toHaveBeenCalled();
  });

  it("deducts the balance atomically so concurrent requests can't overdraw", async () => {
    arrangeSolventUser();
    User.findOneAndUpdate.mockResolvedValue(null); // atomic guard rejected it
    const tx = mockDoc({ status: "pending", description: "" });
    Transaction.create.mockResolvedValue(tx);

    const res = await withdrawHandler(
      jsonRequest(WITHDRAW_URL, { amount: 10000, phone: "237677000000", beneficiaryName: "T" })
    );

    expect(res.status).toBe(400);
    expect(executePayout).not.toHaveBeenCalled();
    expect(tx.status).toBe("failed");
  });

  it("locks funds already committed to pending withdrawals", async () => {
    arrangeSolventUser();
    Transaction.find.mockResolvedValue([{ amount: 7000 }, { amount: 3000 }]);
    executePayout.mockResolvedValue({ id: "tx" });

    await withdrawHandler(
      jsonRequest(WITHDRAW_URL, { amount: 10000, phone: "237677000000", beneficiaryName: "T" })
    );

    // The atomic filter must subtract the 10,000 XAF already locked.
    const filter = User.findOneAndUpdate.mock.calls[0][0];
    expect(JSON.stringify(filter)).toContain("10000");
  });
});

// ---------------------------------------------------------------------------
// Authentication on money-moving endpoints
// ---------------------------------------------------------------------------
describe("Payment endpoint authentication", () => {
  it("rejects an unauthenticated withdrawal", async () => {
    getServerSession.mockResolvedValue(null);

    const res = await withdrawHandler(
      jsonRequest(WITHDRAW_URL, { amount: 10000, phone: "237677000000", beneficiaryName: "T" })
    );

    expect(res.status).toBe(401);
    expect(executePayout).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated deposit", async () => {
    getServerSession.mockResolvedValue(null);

    const res = await depositHandler(jsonRequest(DEPOSIT_URL, { amount: 5000 }));

    expect(res.status).toBe(401);
    expect(createDepositLink).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Deposit link creation
// ---------------------------------------------------------------------------
describe("Deposit initiation", () => {
  beforeEach(() => {
    User.findById.mockResolvedValue({ _id: "user123", email: "u@test.com", name: "U" });
    Transaction.create.mockResolvedValue(mockDoc({ _id: "tx1", status: "pending" }));
  });

  it("creates a pending transaction with a unique reference before calling the provider", async () => {
    createDepositLink.mockResolvedValue({ payment_link: "https://pay.test/abc" });

    const res = await depositHandler(jsonRequest(DEPOSIT_URL, { amount: 5000 }));

    expect(res.status).toBe(200);
    const created = Transaction.create.mock.calls[0][0];
    expect(created.status).toBe("pending");
    expect(created.reference).toMatch(/^DEP-/);
    expect(created.user).toBe("user123");
  });

  it("records the deposit against the session user, not a client-supplied id", async () => {
    createDepositLink.mockResolvedValue({ payment_link: "https://pay.test/abc" });

    await depositHandler(jsonRequest(DEPOSIT_URL, { amount: 5000, userId: "victim-id" }));

    expect(Transaction.create).toHaveBeenCalledWith(expect.objectContaining({ user: "user123" }));
  });

  it("rejects a deposit below the minimum", async () => {
    const res = await depositHandler(jsonRequest(DEPOSIT_URL, { amount: 10 }));

    expect(res.status).toBe(400);
    expect(createDepositLink).not.toHaveBeenCalled();
  });

  it("rejects a negative deposit amount", async () => {
    const res = await depositHandler(jsonRequest(DEPOSIT_URL, { amount: -5000 }));

    expect(res.status).toBe(400);
    expect(createDepositLink).not.toHaveBeenCalled();
  });

  it("marks the transaction failed when the provider is unreachable", async () => {
    const tx = mockDoc({ _id: "tx1", status: "pending" });
    Transaction.create.mockResolvedValue(tx);
    createDepositLink.mockRejectedValue(new Error("Payment System Offline (Auth)"));

    const res = await depositHandler(jsonRequest(DEPOSIT_URL, { amount: 5000 }));

    expect(res.status).toBe(500);
    expect(tx.status).toBe("failed");
  });
});
