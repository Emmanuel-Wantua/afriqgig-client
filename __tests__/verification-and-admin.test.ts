/**
 * Account verification workflow and admin controls.
 *
 * The rule under test: a user may only ever *request* verification by
 * submitting documents from their settings page. Nothing a user sends can
 * mark their own account verified — that requires an admin approval.
 */

import { PATCH as settingsHandler } from "@/app/api/users/settings/route";
import {
  GET as adminListHandler,
  PATCH as adminPatchHandler,
  DELETE as adminDeleteHandler,
} from "@/app/api/admin/users/route";
import { jsonRequest, getRequest, chainable } from "./helpers/testUtils";

jest.mock("@/lib/db", () => ({ connectToDB: jest.fn().mockResolvedValue(true) }));
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));

jest.mock("@/models/User", () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));
jest.mock("@/models/Notification", () => ({
  __esModule: true,
  default: { insertMany: jest.fn(), deleteMany: jest.fn() },
}));
jest.mock("@/models/Job", () => ({ __esModule: true, default: { deleteMany: jest.fn() } }));
jest.mock("@/models/Proposal", () => ({ __esModule: true, default: { deleteMany: jest.fn() } }));
jest.mock("@/models/Contract", () => ({
  __esModule: true,
  default: { deleteMany: jest.fn(), countDocuments: jest.fn() },
}));
jest.mock("@/models/Message", () => ({ __esModule: true, default: { deleteMany: jest.fn() } }));
jest.mock("@/models/Review", () => ({ __esModule: true, default: { deleteMany: jest.fn() } }));
jest.mock("@/models/Post", () => ({ __esModule: true, default: { deleteMany: jest.fn() } }));
jest.mock("@/models/Dispute", () => ({ __esModule: true, default: { deleteMany: jest.fn() } }));

const User = jest.requireMock("@/models/User").default;
const Notification = jest.requireMock("@/models/Notification").default;
const Job = jest.requireMock("@/models/Job").default;
const Proposal = jest.requireMock("@/models/Proposal").default;
const Contract = jest.requireMock("@/models/Contract").default;
const Message = jest.requireMock("@/models/Message").default;
const Review = jest.requireMock("@/models/Review").default;
const Post = jest.requireMock("@/models/Post").default;
const Dispute = jest.requireMock("@/models/Dispute").default;
const { getServerSession } = jest.requireMock("next-auth");

const SETTINGS_URL = "https://test.afriqgig.com/api/users/settings";
const ADMIN_URL = "https://test.afriqgig.com/api/admin/users";

const REGULAR_USER = { user: { _id: "user123", role: "freelancer" } };
const ADMIN_USER = { user: { _id: "admin1", role: "admin" } };

/** Makes `requireAdmin()` succeed and settings updates resolve. */
function signInAsAdmin() {
  getServerSession.mockResolvedValue(ADMIN_USER);
  // `requireAdmin` re-reads the record via `.select()`, so the mock has to be
  // chainable rather than a bare resolved value.
  User.findById.mockReturnValue(chainable({ _id: "admin1", role: "admin", status: "active" }));
  User.findByIdAndUpdate.mockReturnValue(chainable({ _id: "target", status: "suspended" }));
}

/** Signs in a non-admin whose database record confirms the lower privilege. */
function signInAsNonAdmin(role = "freelancer", status = "active") {
  getServerSession.mockResolvedValue({ user: { _id: "user123", role } });
  User.findById.mockReturnValue(chainable({ _id: "user123", role, status }));
}

function signInAsUser() {
  getServerSession.mockResolvedValue(REGULAR_USER);
  User.findByIdAndUpdate.mockReturnValue(chainable({ _id: "user123" }));
  User.find.mockReturnValue(chainable([]));
  User.findById.mockReturnValue(chainable({ _id: "user123", name: "Ada" }));
}

/** Last `$set` payload handed to User.findByIdAndUpdate. */
function lastUpdatePayload() {
  const calls = User.findByIdAndUpdate.mock.calls;
  return calls[calls.length - 1][1].$set;
}

// ---------------------------------------------------------------------------
// A user cannot verify themselves
// ---------------------------------------------------------------------------
describe("Self-verification is impossible", () => {
  beforeEach(signInAsUser);

  it("ignores a client-supplied settings.verificationStatus = verified", async () => {
    const res = await settingsHandler(
      jsonRequest(SETTINGS_URL, { verificationStatus: "verified" }, "PATCH")
    );

    expect(res.status).toBe(200);
    expect(lastUpdatePayload()).not.toHaveProperty("settings.verificationStatus");
  });

  it("ignores a client-supplied root isVerified = true", async () => {
    await settingsHandler(jsonRequest(SETTINGS_URL, { isVerified: true }, "PATCH"));

    const payload = lastUpdatePayload();
    expect(payload.isVerified).toBeUndefined();
    expect(payload["settings.isVerified"]).toBeUndefined();
  });

  it("ignores an attempt to self-assign the admin role", async () => {
    await settingsHandler(jsonRequest(SETTINGS_URL, { role: "admin" }, "PATCH"));

    const payload = lastUpdatePayload();
    expect(payload.role).toBeUndefined();
    expect(payload["settings.role"]).toBeUndefined();
  });

  it("ignores an attempt to top up your own wallet balance", async () => {
    await settingsHandler(
      jsonRequest(SETTINGS_URL, { wallet: { balance: 9_000_000 } }, "PATCH")
    );

    const payload = lastUpdatePayload();
    expect(payload.wallet).toBeUndefined();
    expect(payload["settings.wallet"]).toBeUndefined();
  });

  it("still allows genuine preference changes", async () => {
    await settingsHandler(jsonRequest(SETTINGS_URL, { theme: "dark" }, "PATCH"));

    expect(lastUpdatePayload()["settings.theme"]).toBe("dark");
  });
});

// ---------------------------------------------------------------------------
// Requesting verification
// ---------------------------------------------------------------------------
describe("Requesting verification from account settings", () => {
  beforeEach(signInAsUser);

  it("moves the account to 'pending', not 'verified', on document upload", async () => {
    await settingsHandler(
      jsonRequest(SETTINGS_URL, { identityDocuments: ["https://cdn/id.png"] }, "PATCH")
    );

    const payload = lastUpdatePayload();
    expect(payload["settings.verificationStatus"]).toBe("pending");
    expect(payload.isVerified).toBe(false);
  });

  it("notifies admins that a request is waiting for review", async () => {
    User.find.mockReturnValue(chainable([{ _id: "admin1" }, { _id: "admin2" }]));

    await settingsHandler(
      jsonRequest(SETTINGS_URL, { identityDocuments: ["https://cdn/id.png"] }, "PATCH")
    );

    expect(Notification.insertMany).toHaveBeenCalled();
    expect(Notification.insertMany.mock.calls[0][0]).toHaveLength(2);
  });

  it("keeps isVerified false even when documents and a verified claim arrive together", async () => {
    await settingsHandler(
      jsonRequest(
        SETTINGS_URL,
        { identityDocuments: ["https://cdn/id.png"], verificationStatus: "verified" },
        "PATCH"
      )
    );

    expect(lastUpdatePayload()["settings.verificationStatus"]).toBe("pending");
  });
});

// ---------------------------------------------------------------------------
// Settings endpoint authorization
// ---------------------------------------------------------------------------
describe("Settings endpoint authorization", () => {
  it("rejects an unauthenticated request", async () => {
    getServerSession.mockResolvedValue(null);

    const res = await settingsHandler(jsonRequest(SETTINGS_URL, { theme: "dark" }, "PATCH"));

    expect(res.status).toBe(401);
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("edits only the session's own account, ignoring a body userId", async () => {
    // Previously this endpoint took `userId` straight from the body with no
    // session check — meaning anyone could reset any other user's password.
    signInAsUser();

    await settingsHandler(
      jsonRequest(SETTINGS_URL, { userId: "victim-id", newPassword: "HackedPass9!" }, "PATCH")
    );

    expect(User.findByIdAndUpdate.mock.calls[0][0]).toBe("user123");
  });

  it("hashes a new password rather than storing it raw", async () => {
    signInAsUser();

    await settingsHandler(jsonRequest(SETTINGS_URL, { newPassword: "BrandNewPass9!" }, "PATCH"));

    const stored = lastUpdatePayload().password;
    expect(stored).not.toBe("BrandNewPass9!");
    expect(String(stored)).toMatch(/^\$2[aby]\$/);
  });

  it("rejects a too-short new password", async () => {
    signInAsUser();

    const res = await settingsHandler(jsonRequest(SETTINGS_URL, { newPassword: "123" }, "PATCH"));

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Admin approval
// ---------------------------------------------------------------------------
describe("Admin verification approval", () => {
  it("grants verification on approve", async () => {
    signInAsAdmin();

    const res = await adminPatchHandler(
      jsonRequest(ADMIN_URL, { userId: "target", action: "approve" }, "PATCH")
    );

    expect(res.status).toBe(200);
    const payload = lastUpdatePayload();
    expect(payload.isVerified).toBe(true);
    expect(payload["settings.verificationStatus"]).toBe("verified");
  });

  it("revokes verification on reject", async () => {
    signInAsAdmin();

    await adminPatchHandler(
      jsonRequest(ADMIN_URL, { userId: "target", action: "reject" }, "PATCH")
    );

    const payload = lastUpdatePayload();
    expect(payload.isVerified).toBe(false);
    expect(payload["settings.verificationStatus"]).toBe("rejected");
  });

  it("suspends an account", async () => {
    signInAsAdmin();

    const res = await adminPatchHandler(
      jsonRequest(ADMIN_URL, { userId: "target", action: "update_status", status: "suspended" }, "PATCH")
    );

    expect(res.status).toBe(200);
    expect(lastUpdatePayload().status).toBe("suspended");
  });

  it("rejects an unknown status value", async () => {
    signInAsAdmin();

    const res = await adminPatchHandler(
      jsonRequest(ADMIN_URL, { userId: "target", action: "update_status", status: "god_mode" }, "PATCH")
    );

    expect(res.status).toBe(400);
  });

  it("stops an admin suspending their own account", async () => {
    signInAsAdmin();

    const res = await adminPatchHandler(
      jsonRequest(ADMIN_URL, { userId: "admin1", action: "update_status", status: "suspended" }, "PATCH")
    );

    expect(res.status).toBe(400);
  });

  it("404s on an unknown target user", async () => {
    signInAsAdmin();
    User.findByIdAndUpdate.mockReturnValue(chainable(null));

    const res = await adminPatchHandler(
      jsonRequest(ADMIN_URL, { userId: "ghost", action: "approve" }, "PATCH")
    );

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Admin endpoint is admin-only
// ---------------------------------------------------------------------------
describe("Admin endpoint privilege checks", () => {
  it("blocks an anonymous caller from approving verification", async () => {
    getServerSession.mockResolvedValue(null);

    const res = await adminPatchHandler(
      jsonRequest(ADMIN_URL, { userId: "self", action: "approve" }, "PATCH")
    );

    expect(res.status).toBe(403);
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("blocks a regular logged-in user from approving their own verification", async () => {
    signInAsNonAdmin();

    const res = await adminPatchHandler(
      jsonRequest(ADMIN_URL, { userId: "user123", action: "approve" }, "PATCH")
    );

    expect(res.status).toBe(403);
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("blocks a caller whose JWT claims admin but whose DB record does not", async () => {
    // The session role is attacker-influenceable in a stale token; privilege
    // is therefore re-read from the database.
    getServerSession.mockResolvedValue({ user: { _id: "user123", role: "admin" } });
    User.findById.mockReturnValue(chainable({ _id: "user123", role: "freelancer", status: "active" }));

    const res = await adminPatchHandler(
      jsonRequest(ADMIN_URL, { userId: "victim", action: "approve" }, "PATCH")
    );

    expect(res.status).toBe(403);
  });

  it("blocks a suspended admin", async () => {
    getServerSession.mockResolvedValue(ADMIN_USER);
    User.findById.mockReturnValue(chainable({ _id: "admin1", role: "admin", status: "suspended" }));

    const res = await adminPatchHandler(
      jsonRequest(ADMIN_URL, { userId: "victim", action: "approve" }, "PATCH")
    );

    expect(res.status).toBe(403);
  });

  it("blocks a non-admin from listing all users", async () => {
    signInAsNonAdmin("client");

    const res = await adminListHandler(getRequest(ADMIN_URL));

    expect(res.status).toBe(403);
    expect(User.find).not.toHaveBeenCalled();
  });

  it("lets a real admin list users", async () => {
    signInAsAdmin();
    User.find.mockReturnValue(chainable([{ _id: "u1", name: "Ada" }]));

    const res = await adminListHandler(getRequest(ADMIN_URL));

    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Admin account deletion with content cascade
// ---------------------------------------------------------------------------
describe("Admin account deletion", () => {
  function arrangeDeletableUser() {
    signInAsAdmin();
    User.findById.mockImplementation((id: string) =>
      chainable(
        id === "admin1"
          ? { _id: "admin1", role: "admin", status: "active" }
          : { _id: id, role: "freelancer", name: "Target" }
      )
    );
    Contract.countDocuments.mockResolvedValue(0);
    for (const model of [Job, Proposal, Contract, Message, Notification, Review, Post, Dispute]) {
      model.deleteMany.mockResolvedValue({ deletedCount: 2 });
    }
    User.findByIdAndDelete.mockResolvedValue({ _id: "target" });
  }

  it("deletes the user account", async () => {
    arrangeDeletableUser();

    const res = await adminDeleteHandler(
      new Request(`${ADMIN_URL}?userId=target`, { method: "DELETE" })
    );

    expect(res.status).toBe(200);
    expect(User.findByIdAndDelete).toHaveBeenCalledWith("target");
  });

  it("cascades to every content collection the user appears in", async () => {
    arrangeDeletableUser();

    await adminDeleteHandler(new Request(`${ADMIN_URL}?userId=target`, { method: "DELETE" }));

    expect(Job.deleteMany).toHaveBeenCalledWith({ client: "target" });
    expect(Notification.deleteMany).toHaveBeenCalledWith({ user: "target" });
    expect(Post.deleteMany).toHaveBeenCalledWith({ author: "target" });
    expect(Message.deleteMany).toHaveBeenCalledWith({
      $or: [{ sender: "target" }, { receiver: "target" }],
    });
    expect(Review.deleteMany).toHaveBeenCalledWith({
      $or: [{ reviewer: "target" }, { target: "target" }],
    });
    expect(Proposal.deleteMany).toHaveBeenCalled();
    expect(Contract.deleteMany).toHaveBeenCalled();
    expect(Dispute.deleteMany).toHaveBeenCalled();
  });

  it("reports what was removed", async () => {
    arrangeDeletableUser();

    const res = await adminDeleteHandler(
      new Request(`${ADMIN_URL}?userId=target`, { method: "DELETE" })
    );
    const body = await res.json();

    expect(body.deleted).toMatchObject({ jobs: 2, messages: 2, posts: 2 });
  });

  it("refuses while the user still has an active contract (funds in flight)", async () => {
    arrangeDeletableUser();
    Contract.countDocuments.mockResolvedValue(1);

    const res = await adminDeleteHandler(
      new Request(`${ADMIN_URL}?userId=target`, { method: "DELETE" })
    );

    expect(res.status).toBe(409);
    expect(User.findByIdAndDelete).not.toHaveBeenCalled();
    expect(Job.deleteMany).not.toHaveBeenCalled();
  });

  it("blocks a non-admin from deleting accounts", async () => {
    signInAsNonAdmin();

    const res = await adminDeleteHandler(
      new Request(`${ADMIN_URL}?userId=victim`, { method: "DELETE" })
    );

    expect(res.status).toBe(403);
    expect(User.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it("blocks an anonymous caller from deleting accounts", async () => {
    getServerSession.mockResolvedValue(null);

    const res = await adminDeleteHandler(
      new Request(`${ADMIN_URL}?userId=victim`, { method: "DELETE" })
    );

    expect(res.status).toBe(403);
    expect(User.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it("stops an admin from deleting their own account", async () => {
    arrangeDeletableUser();

    const res = await adminDeleteHandler(
      new Request(`${ADMIN_URL}?userId=admin1`, { method: "DELETE" })
    );

    expect(res.status).toBe(400);
    expect(User.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it("404s on an unknown user", async () => {
    arrangeDeletableUser();
    User.findById.mockImplementation((id: string) =>
      chainable(id === "admin1" ? { _id: "admin1", role: "admin", status: "active" } : null)
    );

    const res = await adminDeleteHandler(
      new Request(`${ADMIN_URL}?userId=ghost`, { method: "DELETE" })
    );

    expect(res.status).toBe(404);
  });

  it("requires a userId", async () => {
    arrangeDeletableUser();

    const res = await adminDeleteHandler(new Request(ADMIN_URL, { method: "DELETE" }));

    expect(res.status).toBe(400);
  });
});
