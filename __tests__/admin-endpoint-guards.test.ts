/**
 * Privilege guards across every /api/admin/* endpoint.
 *
 * These routes read the whole platform's finances, private support chats and
 * dispute records, and one of them decides who receives escrowed money. Each
 * must refuse anonymous and non-admin callers.
 */

import { GET as adminStats } from "@/app/api/admin/stats/route";
import { GET as adminAnalytics } from "@/app/api/admin/stats/analytics/route";
import { GET as adminChatsList, POST as adminChatsReply } from "@/app/api/admin/chats/route";
import { GET as adminDisputeList } from "@/app/api/admin/disputes/list/route";
import { POST as adminDisputeResolve } from "@/app/api/admin/disputes/resolve/route";
import {
  GET as adminTransactions,
  PATCH as adminTransactionAction,
} from "@/app/api/admin/transactions/route";
import { GET as debugDiagnostics } from "@/app/api/debug/route";
import { jsonRequest, getRequest, chainable } from "./helpers/testUtils";

jest.mock("@/lib/db", () => ({ connectToDB: jest.fn().mockResolvedValue(true) }));
jest.mock("@/lib/email", () => ({ sendEmail: jest.fn() }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));

jest.mock("@/models/User", () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
  },
}));
jest.mock("@/models/Transaction", () => ({
  __esModule: true,
  default: { find: jest.fn(), findById: jest.fn(), create: jest.fn(), countDocuments: jest.fn(), aggregate: jest.fn() },
}));
jest.mock("@/models/Dispute", () => ({
  __esModule: true,
  default: { find: jest.fn(), findById: jest.fn(), countDocuments: jest.fn() },
}));
jest.mock("@/models/Contract", () => ({ __esModule: true, default: { findById: jest.fn() } }));
jest.mock("@/models/Job", () => ({
  __esModule: true,
  default: { find: jest.fn(), findByIdAndUpdate: jest.fn(), countDocuments: jest.fn() },
}));
jest.mock("@/models/GuestChat", () => ({
  __esModule: true,
  default: { find: jest.fn(), findById: jest.fn() },
}));
jest.mock("@/models/Analytics", () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock("@/models/Notification", () => ({ __esModule: true, default: { create: jest.fn() } }));

const User = jest.requireMock("@/models/User").default;
const Transaction = jest.requireMock("@/models/Transaction").default;
const Dispute = jest.requireMock("@/models/Dispute").default;
const Contract = jest.requireMock("@/models/Contract").default;
const GuestChat = jest.requireMock("@/models/GuestChat").default;
const { getServerSession } = jest.requireMock("next-auth");

const BASE = "https://test.afriqgig.com";

/** Every admin endpoint, paired with a call that should be refused. */
const ADMIN_ENDPOINTS: Array<{ name: string; call: () => Promise<Response> }> = [
  { name: "GET /api/admin/stats", call: () => adminStats(getRequest(`${BASE}/api/admin/stats`)) },
  {
    name: "GET /api/admin/stats/analytics",
    call: () => adminAnalytics(getRequest(`${BASE}/api/admin/stats/analytics`)),
  },
  { name: "GET /api/admin/chats", call: () => adminChatsList() },
  {
    name: "POST /api/admin/chats",
    call: () =>
      adminChatsReply(jsonRequest(`${BASE}/api/admin/chats`, { chatId: "c1", content: "hi" })),
  },
  {
    name: "GET /api/admin/disputes/list",
    call: () => adminDisputeList(getRequest(`${BASE}/api/admin/disputes/list`)),
  },
  {
    name: "POST /api/admin/disputes/resolve",
    call: () =>
      adminDisputeResolve(
        jsonRequest(`${BASE}/api/admin/disputes/resolve`, {
          disputeId: "d1",
          resolution: "release_freelancer",
        })
      ),
  },
  {
    name: "GET /api/admin/transactions",
    call: () => adminTransactions(getRequest(`${BASE}/api/admin/transactions?filter=all`)),
  },
  {
    name: "PATCH /api/admin/transactions",
    call: () =>
      adminTransactionAction(
        jsonRequest(`${BASE}/api/admin/transactions`, { transactionId: "t1", action: "approve" }, "PATCH")
      ),
  },
  { name: "GET /api/debug", call: () => debugDiagnostics() },
];

describe("Admin endpoints reject anonymous callers", () => {
  beforeEach(() => {
    getServerSession.mockResolvedValue(null);
  });

  it.each(ADMIN_ENDPOINTS)("$name returns 403", async ({ call }) => {
    const res = await call();
    expect(res.status).toBe(403);
  });
});

describe("Admin endpoints reject logged-in non-admins", () => {
  beforeEach(() => {
    getServerSession.mockResolvedValue({ user: { _id: "user123", role: "freelancer" } });
    User.findById.mockReturnValue(
      chainable({ _id: "user123", role: "freelancer", status: "active" })
    );
  });

  it.each(ADMIN_ENDPOINTS)("$name returns 403", async ({ call }) => {
    const res = await call();
    expect(res.status).toBe(403);
  });

  it("does not read financial records for a non-admin", async () => {
    await adminTransactions(getRequest(`${BASE}/api/admin/transactions?filter=all`));
    expect(Transaction.find).not.toHaveBeenCalled();
  });

  it("does not read support chats for a non-admin", async () => {
    await adminChatsList();
    expect(GuestChat.find).not.toHaveBeenCalled();
  });
});

describe("Admin endpoints reject a user whose JWT falsely claims admin", () => {
  beforeEach(() => {
    // Privilege is re-read from the database, so a forged/stale token claim
    // is not enough.
    getServerSession.mockResolvedValue({ user: { _id: "user123", role: "admin" } });
    User.findById.mockReturnValue(chainable({ _id: "user123", role: "client", status: "active" }));
  });

  it.each(ADMIN_ENDPOINTS)("$name returns 403", async ({ call }) => {
    const res = await call();
    expect(res.status).toBe(403);
  });
});

describe("Dispute resolution money movement", () => {
  function arrangeDispute(overrides: { disputeStatus?: string; paymentStatus?: string } = {}) {
    const { disputeStatus = "open", paymentStatus = "held" } = overrides;

    getServerSession.mockResolvedValue({ user: { _id: "admin1", role: "admin" } });
    User.findById.mockImplementation((id: string) =>
      chainable(
        id === "admin1"
          ? { _id: "admin1", role: "admin", status: "active" }
          : { _id: id, email: `${id}@test.com`, name: id }
      )
    );

    // `admin` and `resolution` are written by the handler, so the mock is
    // typed loosely enough to receive them.
    const dispute: Record<string, unknown> = {
      _id: "d1",
      status: disputeStatus,
      contract: { _id: "contract1" },
      save: jest.fn().mockResolvedValue(true),
    };
    Dispute.findById.mockReturnValue(chainable(dispute));

    Contract.findById.mockReturnValue(
      chainable({
        _id: "contract1",
        amount: 50000,
        paymentStatus,
        client: { _id: "client1" },
        freelancer: { _id: "freelancer1" },
        job: { _id: "job1", title: "Landing page" },
        save: jest.fn().mockResolvedValue(true),
      })
    );

    Transaction.create.mockResolvedValue({});
    User.findByIdAndUpdate.mockResolvedValue({});
    return dispute;
  }

  it("credits the freelancer's wallet when releasing escrow", async () => {
    arrangeDispute();

    const res = await adminDisputeResolve(
      jsonRequest(`${BASE}/api/admin/disputes/resolve`, {
        disputeId: "d1",
        resolution: "release_freelancer",
      })
    );

    expect(res.status).toBe(200);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith("freelancer1", {
      $inc: { "wallet.balance": 47500 }, // 50,000 less the 5% fee
    });
  });

  it("credits the client's wallet when refunding", async () => {
    arrangeDispute();

    await adminDisputeResolve(
      jsonRequest(`${BASE}/api/admin/disputes/resolve`, {
        disputeId: "d1",
        resolution: "refund_client",
      })
    );

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith("client1", {
      $inc: { "wallet.balance": 50000 },
    });
  });

  it("records the acting admin from the session, not the request body", async () => {
    const dispute = arrangeDispute();

    await adminDisputeResolve(
      jsonRequest(`${BASE}/api/admin/disputes/resolve`, {
        disputeId: "d1",
        resolution: "refund_client",
        adminId: "impersonated-admin",
      })
    );

    expect(dispute.admin).toBe("admin1");
  });

  it("refuses to resolve the same dispute twice", async () => {
    arrangeDispute({ disputeStatus: "resolved" });

    const res = await adminDisputeResolve(
      jsonRequest(`${BASE}/api/admin/disputes/resolve`, {
        disputeId: "d1",
        resolution: "release_freelancer",
      })
    );

    expect(res.status).toBe(409);
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("refuses when the contract escrow was already settled", async () => {
    arrangeDispute({ paymentStatus: "released" });

    const res = await adminDisputeResolve(
      jsonRequest(`${BASE}/api/admin/disputes/resolve`, {
        disputeId: "d1",
        resolution: "release_freelancer",
      })
    );

    expect(res.status).toBe(409);
    expect(Transaction.create).not.toHaveBeenCalled();
  });

  it("rejects an unrecognised resolution instead of guessing", async () => {
    arrangeDispute();

    const res = await adminDisputeResolve(
      jsonRequest(`${BASE}/api/admin/disputes/resolve`, {
        disputeId: "d1",
        resolution: "pay_me_instead",
      })
    );

    expect(res.status).toBe(400);
    expect(Transaction.create).not.toHaveBeenCalled();
  });
});
