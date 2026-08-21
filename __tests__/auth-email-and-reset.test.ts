/**
 * Email confirmation and password reset integration tests.
 *
 * These two flows are the classic account-takeover surface: a token that
 * never expires, a token that isn't hashed at rest, or a reset that doesn't
 * invalidate the token afterwards all hand over the account.
 */

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { POST as verifyEmailHandler } from "@/app/api/auth/verify-email/route";
import { POST as forgotPasswordHandler } from "@/app/api/auth/forgot-password/route";
import { POST as resetPasswordHandler } from "@/app/api/auth/reset-password/route";
import { jsonRequest, mockDoc } from "./helpers/testUtils";

jest.mock("@/lib/db", () => ({ connectToDB: jest.fn().mockResolvedValue(true) }));
jest.mock("@/lib/email", () => ({ sendEmail: jest.fn().mockResolvedValue(true) }));
jest.mock("@/models/User", () => ({ __esModule: true, default: { findOne: jest.fn() } }));

const User = jest.requireMock("@/models/User").default;
const { sendEmail } = jest.requireMock("@/lib/email");

const VERIFY_URL = "https://test.afriqgig.com/api/auth/verify-email";
const FORGOT_URL = "https://test.afriqgig.com/api/auth/forgot-password";
const RESET_URL = "https://test.afriqgig.com/api/auth/reset-password";

// ---------------------------------------------------------------------------
// Email confirmation
// ---------------------------------------------------------------------------
describe("Email confirmation", () => {
  it("verifies a user holding a valid, unexpired token", async () => {
    const user = mockDoc({
      _id: "u1",
      email: "ada@test.com",
      name: "Ada",
      isVerified: false,
      settings: {},
    });
    User.findOne.mockResolvedValue(user);

    const res = await verifyEmailHandler(jsonRequest(VERIFY_URL, { token: "good-token" }));

    expect(res.status).toBe(200);
    expect(user.isVerified).toBe(true);
    expect(user.save).toHaveBeenCalled();
  });

  it("burns the token after use so the link can't be replayed", async () => {
    const user = mockDoc({
      _id: "u1",
      email: "ada@test.com",
      name: "Ada",
      isVerified: false,
      verificationToken: "good-token",
      settings: {},
    });
    User.findOne.mockResolvedValue(user);

    await verifyEmailHandler(jsonRequest(VERIFY_URL, { token: "good-token" }));

    expect(user.verificationToken).toBeUndefined();
    expect(user.verificationTokenExpiry).toBeUndefined();
  });

  it("queries with an expiry constraint so stale tokens can't verify", async () => {
    User.findOne.mockResolvedValue(null);

    await verifyEmailHandler(jsonRequest(VERIFY_URL, { token: "whatever" }));

    const query = User.findOne.mock.calls[0][0];
    expect(query.verificationTokenExpiry).toHaveProperty("$gt");
  });

  it("rejects a missing token", async () => {
    const res = await verifyEmailHandler(jsonRequest(VERIFY_URL, {}));

    expect(res.status).toBe(400);
  });

  it("rejects an entirely unknown token", async () => {
    User.findOne.mockResolvedValue(null);

    const res = await verifyEmailHandler(jsonRequest(VERIFY_URL, { token: "forged" }));

    expect(res.status).toBe(400);
  });

  it("treats a second click on an already-verified link as success", async () => {
    User.findOne
      .mockResolvedValueOnce(null) // no unexpired match
      .mockResolvedValueOnce({ _id: "u1", isVerified: true }); // but token belongs to a verified user

    const res = await verifyEmailHandler(jsonRequest(VERIFY_URL, { token: "used-token" }));

    expect(res.status).toBe(200);
  });

  it("returns 400 (not a 500 crash) for an expired token on an unverified account", async () => {
    // Regression: the handler previously fell through to `user.isVerified = true`
    // with `user === null` on exactly this path, throwing a TypeError.
    User.findOne
      .mockResolvedValueOnce(null) // expired, so no match
      .mockResolvedValueOnce({ _id: "u1", isVerified: false }); // token exists but stale

    const res = await verifyEmailHandler(jsonRequest(VERIFY_URL, { token: "expired-token" }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/expired|invalid/i);
  });

  it("sends the welcome email only after successful verification", async () => {
    const user = mockDoc({
      _id: "u1",
      email: "ada@test.com",
      name: "Ada",
      isVerified: false,
      settings: {},
    });
    User.findOne.mockResolvedValue(user);

    await verifyEmailHandler(jsonRequest(VERIFY_URL, { token: "good-token" }));

    expect(sendEmail).toHaveBeenCalledWith(
      "ada@test.com",
      "WELCOME",
      expect.anything(),
      "u1"
    );
  });
});

// ---------------------------------------------------------------------------
// Forgot password
// ---------------------------------------------------------------------------
describe("Forgot password", () => {
  it("sends a reset link for a known address", async () => {
    const user = mockDoc({ _id: "u1", email: "ada@test.com" });
    User.findOne.mockResolvedValue(user);

    const res = await forgotPasswordHandler(jsonRequest(FORGOT_URL, { email: "ada@test.com" }));

    expect(res.status).toBe(200);
    expect(sendEmail).toHaveBeenCalledWith("ada@test.com", "RESET_PASSWORD", expect.anything());
  });

  it("gives an identical response for an unknown address (no account enumeration)", async () => {
    const knownUser = mockDoc({ _id: "u1", email: "ada@test.com" });

    User.findOne.mockResolvedValue(knownUser);
    const knownRes = await forgotPasswordHandler(jsonRequest(FORGOT_URL, { email: "ada@test.com" }));
    const knownBody = await knownRes.json();

    User.findOne.mockResolvedValue(null);
    const unknownRes = await forgotPasswordHandler(
      jsonRequest(FORGOT_URL, { email: "ghost@test.com" })
    );
    const unknownBody = await unknownRes.json();

    expect(unknownRes.status).toBe(knownRes.status);
    expect(unknownBody.message).toBe(knownBody.message);
  });

  it("stores only a HASH of the reset token, never the raw token", async () => {
    const user = mockDoc({ _id: "u1", email: "ada@test.com" });
    User.findOne.mockResolvedValue(user);

    await forgotPasswordHandler(jsonRequest(FORGOT_URL, { email: "ada@test.com" }));

    const emailPayload = sendEmail.mock.calls[0][2];
    const rawToken = String(emailPayload.resetUrl).split("/").pop();

    expect(user.resetPasswordToken).not.toBe(rawToken);
    expect(user.resetPasswordToken).toBe(
      crypto.createHash("sha256").update(String(rawToken)).digest("hex")
    );
  });

  it("sets an expiry on the reset token", async () => {
    const user = mockDoc({ _id: "u1", email: "ada@test.com" });
    User.findOne.mockResolvedValue(user);

    await forgotPasswordHandler(jsonRequest(FORGOT_URL, { email: "ada@test.com" }));

    expect(Number(user.resetPasswordExpires)).toBeGreaterThan(Date.now());
  });

  it("does not send mail for an unknown address", async () => {
    User.findOne.mockResolvedValue(null);

    await forgotPasswordHandler(jsonRequest(FORGOT_URL, { email: "ghost@test.com" }));

    expect(sendEmail).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Reset password
// ---------------------------------------------------------------------------
describe("Reset password", () => {
  const RAW_TOKEN = "a".repeat(64);
  const HASHED = crypto.createHash("sha256").update(RAW_TOKEN).digest("hex");

  it("updates the password when the token is valid", async () => {
    const user = mockDoc({ _id: "u1", password: "old-hash" });
    User.findOne.mockResolvedValue(user);

    const res = await resetPasswordHandler(
      jsonRequest(RESET_URL, { token: RAW_TOKEN, password: "BrandNewPass9!" })
    );

    expect(res.status).toBe(200);
    await expect(bcrypt.compare("BrandNewPass9!", String(user.password))).resolves.toBe(true);
  });

  it("looks the token up by its hash, with an expiry constraint", async () => {
    User.findOne.mockResolvedValue(null);

    await resetPasswordHandler(
      jsonRequest(RESET_URL, { token: RAW_TOKEN, password: "BrandNewPass9!" })
    );

    const query = User.findOne.mock.calls[0][0];
    expect(query.resetPasswordToken).toBe(HASHED);
    expect(query.resetPasswordExpires).toHaveProperty("$gt");
  });

  it("clears the token so the same link can't reset the password twice", async () => {
    const user = mockDoc({ _id: "u1", password: "old-hash" });
    User.findOne.mockResolvedValue(user);

    await resetPasswordHandler(
      jsonRequest(RESET_URL, { token: RAW_TOKEN, password: "BrandNewPass9!" })
    );

    expect(user.resetPasswordToken).toBeUndefined();
    expect(user.resetPasswordExpires).toBeUndefined();
  });

  it("rejects an invalid or expired token", async () => {
    User.findOne.mockResolvedValue(null);

    const res = await resetPasswordHandler(
      jsonRequest(RESET_URL, { token: "forged", password: "BrandNewPass9!" })
    );

    expect(res.status).toBe(400);
  });

  it("rejects a missing token without crashing", async () => {
    const res = await resetPasswordHandler(jsonRequest(RESET_URL, { password: "BrandNewPass9!" }));

    expect(res.status).toBe(400);
    expect(res.status).toBeLessThan(500);
  });

  it("rejects a missing password rather than hashing undefined", async () => {
    User.findOne.mockResolvedValue(mockDoc({ _id: "u1" }));

    const res = await resetPasswordHandler(jsonRequest(RESET_URL, { token: RAW_TOKEN }));

    expect(res.status).toBe(400);
  });

  it("enforces the same minimum password length as signup", async () => {
    User.findOne.mockResolvedValue(mockDoc({ _id: "u1" }));

    const res = await resetPasswordHandler(
      jsonRequest(RESET_URL, { token: RAW_TOKEN, password: "123" })
    );

    expect(res.status).toBe(400);
  });

  it("never stores the new password in plaintext", async () => {
    const user = mockDoc({ _id: "u1", password: "old-hash" });
    User.findOne.mockResolvedValue(user);

    await resetPasswordHandler(
      jsonRequest(RESET_URL, { token: RAW_TOKEN, password: "BrandNewPass9!" })
    );

    expect(user.password).not.toBe("BrandNewPass9!");
    expect(String(user.password)).toMatch(/^\$2[aby]\$/);
  });
});
