/**
 * Escrow and financial-authorization tests.
 *
 * The rule under test: the browser may say WHICH job and WHICH proposal, but
 * never how much money moves, never who pays, and never whether a payment is
 * authorized. Every figure is re-derived from stored server-side records.
 */

import { POST as createContractHandler } from "@/app/api/contracts/create/route";
import { PATCH as updateContractHandler } from "@/app/api/contracts/[id]/route";
import { jsonRequest, chainable } from "./helpers/testUtils";

jest.mock("@/lib/db", () => ({ connectToDB: jest.fn().mockResolvedValue(true) }));
jest.mock("@/lib/email", () => ({ sendEmail: jest.fn() }));
jest.mock("@/lib/twilio", () => ({ sendMobileNotification: jest.fn().mockResolvedValue(true) }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));

jest.mock("@/models/Contract", () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));
jest.mock("@/models/Job", () => ({
  __esModule: true,
  default: { findById: jest.fn(), findByIdAndUpdate: jest.fn() },
}));
jest.mock("@/models/Proposal", () => ({
  __esModule: true,
  default: { findById: jest.fn(), findByIdAndUpdate: jest.fn() },
}));
jest.mock("@/models/User", () => ({
  __esModule: true,
  default: { findById: jest.fn(), findByIdAndUpdate: jest.fn(), findOneAndUpdate: jest.fn() },
}));
jest.mock("@/models/Transaction", () => ({ __esModule: true, default: { create: jest.fn() } }));
jest.mock("@/models/Notification", () => ({ __esModule: true, default: { create: jest.fn() } }));

const Contract = jest.requireMock("@/models/Contract").default;
const Job = jest.requireMock("@/models/Job").default;
const Proposal = jest.requireMock("@/models/Proposal").default;
const User = jest.requireMock("@/models/User").default;
const Transaction = jest.requireMock("@/models/Transaction").default;
const { getServerSession } = jest.requireMock("next-auth");

const CREATE_URL = "https://test.afriqgig.com/api/contracts/create";
const CONTRACT_URL = "https://test.afriqgig.com/api/contracts/contract1";

const CLIENT_ID = "client1";
const FREELANCER_ID = "freelancer1";

const routeParams = { params: Promise.resolve({ id: "contract1" }) };

// ---------------------------------------------------------------------------
// Hiring — price and payer are server-derived
// ---------------------------------------------------------------------------
describe("Hiring: server-side pricing", () => {
  /** Client owns the job; the accepted proposal bid 50,000 XAF. */
  function arrangeHire(overrides: { credits?: number; balanceOk?: boolean } = {}) {
    const { credits = 0, balanceOk = true } = overrides;

    getServerSession.mockResolvedValue({ user: { _id: CLIENT_ID, role: "client" } });
    Job.findById.mockResolvedValue({
      _id: "job1",
      client: CLIENT_ID,
      title: "Build a landing page",
      status: "open",
    });
    Job.findByIdAndUpdate.mockResolvedValue({ _id: "job1", title: "Build a landing page" });
    Proposal.findById.mockResolvedValue({
      _id: "proposal1",
      job: "job1",
      freelancer: FREELANCER_ID,
      bidAmount: 50000,
    });
    Proposal.findByIdAndUpdate.mockResolvedValue({});
    User.findById.mockImplementation((id: string) =>
      Promise.resolve(
        id === CLIENT_ID
          ? { _id: CLIENT_ID, name: "Client", wallet: { balance: 200000, credits } }
          : { _id: FREELANCER_ID, name: "Freelancer", email: "f@test.com" }
      )
    );
    User.findOneAndUpdate.mockResolvedValue(
      balanceOk ? { _id: CLIENT_ID, wallet: { balance: 150000 } } : null
    );
    Contract.create.mockResolvedValue({ _id: "contract1" });
    Transaction.create.mockResolvedValue({});
  }

  it("uses the proposal's stored bid, ignoring the amount in the request body", async () => {
    arrangeHire();

    const res = await createContractHandler(
      jsonRequest(CREATE_URL, { jobId: "job1", proposalId: "proposal1", amount: 1 })
    );

    expect(res.status).toBe(201);
    expect(Contract.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 50000 }));
  });

  it("ignores a client-supplied clientId and bills the session user", async () => {
    arrangeHire();

    await createContractHandler(
      jsonRequest(CREATE_URL, {
        jobId: "job1",
        proposalId: "proposal1",
        clientId: "someone-else",
      })
    );

    expect(Contract.create).toHaveBeenCalledWith(expect.objectContaining({ client: CLIENT_ID }));
  });

  it("ignores a client-supplied freelancerId and uses the proposal's author", async () => {
    arrangeHire();

    await createContractHandler(
      jsonRequest(CREATE_URL, {
        jobId: "job1",
        proposalId: "proposal1",
        freelancerId: "attacker-account",
      })
    );

    expect(Contract.create).toHaveBeenCalledWith(
      expect.objectContaining({ freelancer: FREELANCER_ID })
    );
  });

  it("debits escrow atomically with a balance condition, not a read-then-write", async () => {
    arrangeHire();

    await createContractHandler(jsonRequest(CREATE_URL, { jobId: "job1", proposalId: "proposal1" }));

    const [filter, update] = User.findOneAndUpdate.mock.calls[0];
    expect(filter._id).toBe(CLIENT_ID);
    expect(filter["wallet.balance"]).toEqual({ $gte: 50000 });
    expect(update.$inc["wallet.balance"]).toBe(-50000);
  });

  it("refuses the hire when the wallet cannot cover it, even if the UI allowed it", async () => {
    arrangeHire({ balanceOk: false });

    const res = await createContractHandler(
      jsonRequest(CREATE_URL, { jobId: "job1", proposalId: "proposal1" })
    );

    expect(res.status).toBe(402);
    expect(Contract.create).not.toHaveBeenCalled();
  });

  it("records the escrow hold as a transaction", async () => {
    arrangeHire();

    await createContractHandler(jsonRequest(CREATE_URL, { jobId: "job1", proposalId: "proposal1" }));

    expect(Transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: "payment_hold", amount: 50000, user: CLIENT_ID })
    );
  });

  it("applies the referral discount from stored credits, not from the request", async () => {
    arrangeHire({ credits: 1 });

    const res = await createContractHandler(
      jsonRequest(CREATE_URL, { jobId: "job1", proposalId: "proposal1", discountApplied: true })
    );
    const body = await res.json();

    expect(body.amountPaid).toBe(47500); // 50,000 - 5%
    expect(User.findOneAndUpdate.mock.calls[0][1].$inc["wallet.credits"]).toBe(-1);
  });

  it("grants no discount when the client has no credits, whatever the request claims", async () => {
    arrangeHire({ credits: 0 });

    const res = await createContractHandler(
      jsonRequest(CREATE_URL, { jobId: "job1", proposalId: "proposal1", discountApplied: true })
    );
    const body = await res.json();

    expect(body.amountPaid).toBe(50000);
  });

  it("rejects an unauthenticated hire", async () => {
    arrangeHire();
    getServerSession.mockResolvedValue(null);

    const res = await createContractHandler(
      jsonRequest(CREATE_URL, { jobId: "job1", proposalId: "proposal1" })
    );

    expect(res.status).toBe(401);
    expect(Contract.create).not.toHaveBeenCalled();
  });

  it("stops a caller hiring on someone else's job", async () => {
    arrangeHire();
    getServerSession.mockResolvedValue({ user: { _id: "outsider", role: "client" } });
    User.findById.mockResolvedValue({ _id: "outsider", wallet: { balance: 999999, credits: 0 } });

    const res = await createContractHandler(
      jsonRequest(CREATE_URL, { jobId: "job1", proposalId: "proposal1" })
    );

    expect(res.status).toBe(403);
    expect(User.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("rejects a proposal that belongs to a different job", async () => {
    arrangeHire();
    Proposal.findById.mockResolvedValue({
      _id: "proposal1",
      job: "some-other-job",
      freelancer: FREELANCER_ID,
      bidAmount: 50000,
    });

    const res = await createContractHandler(
      jsonRequest(CREATE_URL, { jobId: "job1", proposalId: "proposal1" })
    );

    expect(res.status).toBe(404);
    expect(Contract.create).not.toHaveBeenCalled();
  });

  it("rejects hiring on a job that is already filled", async () => {
    arrangeHire();
    Job.findById.mockResolvedValue({ _id: "job1", client: CLIENT_ID, status: "hired" });

    const res = await createContractHandler(
      jsonRequest(CREATE_URL, { jobId: "job1", proposalId: "proposal1" })
    );

    expect(res.status).toBe(409);
  });

  it("refunds the client if contract creation fails after the debit", async () => {
    arrangeHire();
    Contract.create.mockRejectedValue(new Error("db exploded"));

    const res = await createContractHandler(
      jsonRequest(CREATE_URL, { jobId: "job1", proposalId: "proposal1" })
    );

    expect(res.status).toBe(500);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(CLIENT_ID, {
      $inc: { "wallet.balance": 50000 },
    });
  });
});

// ---------------------------------------------------------------------------
// Contract updates — no client-dictated financial terms
// ---------------------------------------------------------------------------
describe("Contract updates: financial fields are not client-writable", () => {
  function arrangeContract(overrides: Record<string, unknown> = {}) {
    const contract = {
      _id: "contract1",
      amount: 50000,
      paymentStatus: "held",
      status: "active",
      client: { _id: CLIENT_ID, name: "Client", email: "c@test.com" },
      freelancer: { _id: FREELANCER_ID, name: "Freelancer", email: "f@test.com" },
      job: { _id: "job1", title: "Build a landing page" },
      ...overrides,
    };
    Contract.findById.mockReturnValue(chainable(contract));
    Contract.findOne.mockReturnValue(chainable(null));
    Contract.findByIdAndUpdate.mockReturnValue(chainable({ ...contract, status: "completed" }));
    Contract.findOneAndUpdate.mockResolvedValue({ ...contract, paymentStatus: "released" });
    Job.findByIdAndUpdate.mockResolvedValue({});
    User.findById.mockResolvedValue({
      _id: FREELANCER_ID,
      email: "f@test.com",
      wallet: { credits: 0, balance: 0 },
    });
    User.findByIdAndUpdate.mockResolvedValue({});
    Transaction.create.mockResolvedValue({});
    return contract;
  }

  /** The `$set` payload actually written to the contract. */
  function contractUpdatePayload() {
    return Contract.findByIdAndUpdate.mock.calls[0][1].$set;
  }

  it("ignores an attempt to rewrite the contract amount", async () => {
    arrangeContract();
    getServerSession.mockResolvedValue({ user: { _id: CLIENT_ID, role: "client" } });

    await updateContractHandler(
      jsonRequest(CONTRACT_URL, { amount: 5_000_000 }, "PATCH"),
      routeParams
    );

    expect(contractUpdatePayload().amount).toBeUndefined();
  });

  it("ignores an attempt to set paymentStatus directly", async () => {
    arrangeContract();
    getServerSession.mockResolvedValue({ user: { _id: FREELANCER_ID, role: "freelancer" } });

    await updateContractHandler(
      jsonRequest(CONTRACT_URL, { paymentStatus: "released" }, "PATCH"),
      routeParams
    );

    expect(contractUpdatePayload().paymentStatus).toBeUndefined();
    expect(Transaction.create).not.toHaveBeenCalled();
  });

  it("stops the freelancer approving their own work to release the escrow", async () => {
    arrangeContract();
    getServerSession.mockResolvedValue({ user: { _id: FREELANCER_ID, role: "freelancer" } });

    const res = await updateContractHandler(
      jsonRequest(CONTRACT_URL, { status: "completed" }, "PATCH"),
      routeParams
    );

    expect(res.status).toBe(403);
    expect(Transaction.create).not.toHaveBeenCalled();
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("stops an unrelated user touching the contract", async () => {
    arrangeContract();
    getServerSession.mockResolvedValue({ user: { _id: "outsider", role: "client" } });

    const res = await updateContractHandler(
      jsonRequest(CONTRACT_URL, { status: "completed" }, "PATCH"),
      routeParams
    );

    expect(res.status).toBe(403);
  });

  it("rejects an unauthenticated update", async () => {
    arrangeContract();
    getServerSession.mockResolvedValue(null);

    const res = await updateContractHandler(
      jsonRequest(CONTRACT_URL, { status: "completed" }, "PATCH"),
      routeParams
    );

    expect(res.status).toBe(401);
  });

  it("stops the client submitting work on the freelancer's behalf", async () => {
    arrangeContract();
    getServerSession.mockResolvedValue({ user: { _id: CLIENT_ID, role: "client" } });

    const res = await updateContractHandler(
      jsonRequest(CONTRACT_URL, { submission: { files: [], note: "fake" } }, "PATCH"),
      routeParams
    );

    expect(res.status).toBe(403);
  });

  it("rejects an invalid status value", async () => {
    arrangeContract();
    getServerSession.mockResolvedValue({ user: { _id: CLIENT_ID, role: "client" } });

    const res = await updateContractHandler(
      jsonRequest(CONTRACT_URL, { status: "paid_in_full_lol" }, "PATCH"),
      routeParams
    );

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Escrow release
// ---------------------------------------------------------------------------
describe("Escrow release on client approval", () => {
  function arrangeRelease(freelancerCredits = 0, paymentStatus = "held") {
    const contract = {
      _id: "contract1",
      amount: 50000,
      paymentStatus,
      status: "active",
      client: { _id: CLIENT_ID, name: "Client", email: "c@test.com" },
      freelancer: { _id: FREELANCER_ID, name: "Freelancer", email: "f@test.com" },
      job: { _id: "job1", title: "Build a landing page" },
    };
    getServerSession.mockResolvedValue({ user: { _id: CLIENT_ID, role: "client" } });
    Contract.findById.mockReturnValue(chainable(contract));
    Contract.findOne.mockReturnValue(chainable(null));
    Contract.findByIdAndUpdate.mockReturnValue(chainable({ ...contract, status: "completed" }));
    Contract.findOneAndUpdate.mockResolvedValue(
      paymentStatus === "released" ? null : { ...contract, paymentStatus: "released" }
    );
    Job.findByIdAndUpdate.mockResolvedValue({});
    User.findById.mockResolvedValue({
      _id: FREELANCER_ID,
      email: "f@test.com",
      wallet: { credits: freelancerCredits, balance: 0 },
    });
    User.findByIdAndUpdate.mockResolvedValue({});
    Transaction.create.mockResolvedValue({});
  }

  it("credits the freelancer's spendable wallet balance, not just the ledger", async () => {
    arrangeRelease();

    await updateContractHandler(
      jsonRequest(CONTRACT_URL, { status: "completed" }, "PATCH"),
      routeParams
    );

    // Regression: the route used to write only a Transaction row, so earnings
    // were visible but could never be withdrawn.
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(FREELANCER_ID, {
      $inc: { "wallet.balance": 47500 }, // 50,000 less the 5% platform fee
    });
  });

  it("computes the platform fee server-side at 5%", async () => {
    arrangeRelease();

    await updateContractHandler(
      jsonRequest(CONTRACT_URL, { status: "completed" }, "PATCH"),
      routeParams
    );

    expect(Transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: "payment_release", amount: 47500, user: FREELANCER_ID })
    );
  });

  it("applies the discounted 2.5% fee when the freelancer holds a credit", async () => {
    arrangeRelease(1);

    await updateContractHandler(
      jsonRequest(CONTRACT_URL, { status: "completed" }, "PATCH"),
      routeParams
    );

    expect(Transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 48750 }) // 50,000 less 2.5%
    );
  });

  it("releases only once even if approval is clicked repeatedly", async () => {
    arrangeRelease(0, "released"); // the atomic claim finds nothing left to release

    await updateContractHandler(
      jsonRequest(CONTRACT_URL, { status: "completed" }, "PATCH"),
      routeParams
    );

    expect(Transaction.create).not.toHaveBeenCalled();
    expect(User.findByIdAndUpdate).not.toHaveBeenCalledWith(
      FREELANCER_ID,
      expect.objectContaining({ $inc: expect.objectContaining({ "wallet.balance": 47500 }) })
    );
  });

  it("claims the release atomically, guarding against a concurrent double-release", async () => {
    arrangeRelease();

    await updateContractHandler(
      jsonRequest(CONTRACT_URL, { status: "completed" }, "PATCH"),
      routeParams
    );

    const [filter] = Contract.findOneAndUpdate.mock.calls[0];
    expect(filter.paymentStatus).toEqual({ $ne: "released" });
  });
});
