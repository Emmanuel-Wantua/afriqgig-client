/**
 * Signup and login integration tests.
 *
 * bcrypt is deliberately NOT mocked — password hashing is the thing under
 * test, and a mocked hash would let a plaintext-storage regression pass.
 */

import bcrypt from "bcryptjs";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { authorizeCredentials } from "@/lib/credentialsAuthorize";
import { jsonRequest } from "./helpers/testUtils";

jest.mock("@/lib/db", () => ({
  connectToDB: jest.fn().mockResolvedValue(true),
}));
jest.mock("@/lib/email", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));
jest.mock("@/models/User", () => ({
  __esModule: true,
  default: { findOne: jest.fn(), create: jest.fn() },
}));
jest.mock("@/models/Notification", () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));

const User = jest.requireMock("@/models/User").default;
const { sendEmail } = jest.requireMock("@/lib/email");

const REGISTER_URL = "https://test.afriqgig.com/api/auth/register";

const VALID_SIGNUP = {
  name: "Ada Ngu",
  email: "ada@test.com",
  phone: "237677000111",
  password: "CorrectHorse9!",
  role: "freelancer",
  country: "Cameroon",
};

/** No existing user with any email/phone/referral code. */
function arrangeFreshDatabase() {
  User.findOne.mockResolvedValue(null);
  User.create.mockImplementation((doc: Record<string, unknown>) =>
    Promise.resolve({ ...doc, _id: "new-user-id" }),
  );
}

describe("Signup", () => {
  beforeEach(arrangeFreshDatabase);

  it("creates an account and returns 201", async () => {
    const res = await registerHandler(jsonRequest(REGISTER_URL, VALID_SIGNUP));

    expect(res.status).toBe(201);
    expect(User.create).toHaveBeenCalled();
  });

  it("stores a bcrypt hash, never the plaintext password", async () => {
    await registerHandler(jsonRequest(REGISTER_URL, VALID_SIGNUP));

    const created = User.create.mock.calls[0][0];
    expect(created.password).not.toBe(VALID_SIGNUP.password);
    expect(created.password).toMatch(/^\$2[aby]\$/); // bcrypt prefix
    await expect(
      bcrypt.compare(VALID_SIGNUP.password, created.password),
    ).resolves.toBe(true);
  });

  it("creates the account UNVERIFIED — verification is never self-granted at signup", async () => {
    await registerHandler(jsonRequest(REGISTER_URL, VALID_SIGNUP));

    const created = User.create.mock.calls[0][0];
    expect(created.isVerified).toBe(false);
  });

  it("ignores a client-supplied isVerified flag in the signup payload", async () => {
    await registerHandler(
      jsonRequest(REGISTER_URL, {
        ...VALID_SIGNUP,
        isVerified: true,
        role: "freelancer",
      }),
    );

    const created = User.create.mock.calls[0][0];
    expect(created.isVerified).toBe(false);
  });

  it("ignores a client-supplied wallet balance", async () => {
    await registerHandler(
      jsonRequest(REGISTER_URL, {
        ...VALID_SIGNUP,
        wallet: { balance: 5_000_000 },
      }),
    );

    const created = User.create.mock.calls[0][0];
    expect(created.wallet.balance).toBe(0);
  });

  it("sends a verification email carrying a token", async () => {
    await registerHandler(jsonRequest(REGISTER_URL, VALID_SIGNUP));

    expect(sendEmail).toHaveBeenCalled();
    const [, template, payload] = sendEmail.mock.calls[0];
    expect(template).toBe("VERIFY");
    expect(payload.link).toContain("token=");
  });

  it("rejects a signup missing required fields", async () => {
    const res = await registerHandler(
      jsonRequest(REGISTER_URL, {
        email: "x@test.com",
        password: "CorrectHorse9!",
      }),
    );

    expect(res.status).toBe(400);
    expect(User.create).not.toHaveBeenCalled();
  });

  it("rejects a duplicate email", async () => {
    User.findOne.mockResolvedValueOnce({
      _id: "existing",
      email: VALID_SIGNUP.email,
    });

    const res = await registerHandler(jsonRequest(REGISTER_URL, VALID_SIGNUP));

    expect(res.status).toBe(400);
    expect(User.create).not.toHaveBeenCalled();
  });

  it("rejects a duplicate email that differs only by case", async () => {
    // Registration must normalise, otherwise Ada@test.com and ada@test.com
    // become two accounts and login silently picks the wrong one.
    User.findOne.mockImplementation((query: Record<string, unknown>) =>
      Promise.resolve(
        query.email === "ada@test.com" ? { _id: "existing" } : null,
      ),
    );

    const res = await registerHandler(
      jsonRequest(REGISTER_URL, { ...VALID_SIGNUP, email: "Ada@Test.com" }),
    );

    expect(res.status).toBe(400);
    expect(User.create).not.toHaveBeenCalled();
  });

  it("rejects a duplicate phone number", async () => {
    User.findOne
      .mockResolvedValueOnce(null) // email free
      .mockResolvedValueOnce({ _id: "existing" }); // phone taken

    const res = await registerHandler(jsonRequest(REGISTER_URL, VALID_SIGNUP));

    expect(res.status).toBe(400);
    expect(User.create).not.toHaveBeenCalled();
  });

  it("rejects a weak password", async () => {
    const res = await registerHandler(
      jsonRequest(REGISTER_URL, { ...VALID_SIGNUP, password: "123" }),
    );

    expect(res.status).toBe(400);
    expect(User.create).not.toHaveBeenCalled();
  });

  it("rejects an invalid role rather than trusting the client", async () => {
    const res = await registerHandler(
      jsonRequest(REGISTER_URL, { ...VALID_SIGNUP, role: "admin" }),
    );

    expect(res.status).toBe(400);
    expect(User.create).not.toHaveBeenCalled();
  });
});

describe("Signup referral credits", () => {
  beforeEach(arrangeFreshDatabase);

  it("awards the referrer a credit when the new user is a client", async () => {
    const referrer = {
      _id: "ref1",
      name: "Ref",
      email: "ref@test.com",
      referralCode: "AFQ-ABC123",
      wallet: { credits: 0 },
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockImplementation((query: Record<string, unknown>) =>
      Promise.resolve(query.referralCode === "AFQ-ABC123" ? referrer : null),
    );

    await registerHandler(
      jsonRequest(REGISTER_URL, {
        ...VALID_SIGNUP,
        role: "client",
        referralCode: "AFQ-ABC123",
      }),
    );

    expect(referrer.wallet.credits).toBe(1);
    expect(referrer.save).toHaveBeenCalled();
  });

  it("awards no credit when the new user is a freelancer", async () => {
    const referrer = {
      _id: "ref1",
      name: "Ref",
      email: "ref@test.com",
      referralCode: "AFQ-ABC123",
      wallet: { credits: 0 },
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockImplementation((query: Record<string, unknown>) =>
      Promise.resolve(query.referralCode === "AFQ-ABC123" ? referrer : null),
    );

    await registerHandler(
      jsonRequest(REGISTER_URL, {
        ...VALID_SIGNUP,
        role: "freelancer",
        referralCode: "AFQ-ABC123",
      }),
    );

    expect(referrer.wallet.credits).toBe(0);
  });

  it("ignores an unknown referral code without failing the signup", async () => {
    const res = await registerHandler(
      jsonRequest(REGISTER_URL, { ...VALID_SIGNUP, referralCode: "AFQ-NOPE" }),
    );

    expect(res.status).toBe(201);
  });
});

describe("Login", () => {
  const PASSWORD = "CorrectHorse9!";
  let hashed: string;

  // ✅ NEW: gives the test a real shape to check against instead of `as any`
  interface AuthorizedUser {
    _id: string;
    password?: string;
  }

  beforeAll(async () => {
    hashed = await bcrypt.hash(PASSWORD, 10);
  });

  function arrangeUser(overrides: Record<string, unknown> = {}) {
    const record: Record<string, unknown> = {
      _id: "user123",
      name: "Ada",
      email: "ada@test.com",
      role: "freelancer",
      status: "active",
      password: hashed,
      twoFactorEnabled: false,
      ...overrides,
    };
    // Mirrors the real Mongoose document's .toObject() that authorizeCredentials() relies on.
    record.toObject = () => {
      const { toObject: _toObject, ...plain } = record;
      return plain;
    };
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(record),
    });
  }

  it("accepts correct credentials", async () => {
    arrangeUser();

    const result = (await authorizeCredentials({
      identifier: "ada@test.com",
      password: PASSWORD,
    })) as AuthorizedUser;

    expect(result).toBeDefined();
    expect(result._id).toBe("user123");
  });

  it("never returns the password hash to the caller", async () => {
    arrangeUser();

    const result = (await authorizeCredentials({
      identifier: "ada@test.com",
      password: PASSWORD,
    })) as AuthorizedUser;

    expect(result.password).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain(hashed);
  });

  it("rejects a wrong password", async () => {
    arrangeUser();

    await expect(
      authorizeCredentials({
        identifier: "ada@test.com",
        password: "WrongPassword1!",
      }),
    ).rejects.toThrow("Invalid password");
  });

  it("rejects an unknown identifier", async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    await expect(
      authorizeCredentials({
        identifier: "nobody@test.com",
        password: PASSWORD,
      }),
    ).rejects.toThrow("User not found");
  });

  it("blocks a suspended account even with the right password", async () => {
    arrangeUser({ status: "suspended" });

    await expect(
      authorizeCredentials({ identifier: "ada@test.com", password: PASSWORD }),
    ).rejects.toThrow("Account suspended");
  });

  it("blocks a deactivated account", async () => {
    arrangeUser({ status: "deactivated" });

    await expect(
      authorizeCredentials({ identifier: "ada@test.com", password: PASSWORD }),
    ).rejects.toThrow("Account deactivated");
  });

  it("rejects a social-only account with no password instead of crashing", async () => {
    // bcrypt.compare(password, undefined) throws — that must surface as a
    // clean, caught error, not an unhandled crash.
    arrangeUser({ password: undefined, authProvider: "google" });

    await expect(
      authorizeCredentials({ identifier: "ada@test.com", password: PASSWORD }),
    ).rejects.toThrow("User not found");
  });

  it("rejects a request with no password supplied", async () => {
    arrangeUser();

    await expect(
      authorizeCredentials({ identifier: "ada@test.com" }),
    ).rejects.toThrow("Invalid credentials");
  });
});

// ✅ NEW: this coverage didn't exist before — the old /api/auth/login route
// never had 2FA logic at all, so it was untested. authorizeCredentials() does.
describe("Login — Two-Factor Authentication", () => {
  const PASSWORD = "CorrectHorse9!";
  let hashed: string;

  beforeAll(async () => {
    hashed = await bcrypt.hash(PASSWORD, 10);
  });

  function arrangeUserWith2FA(overrides: Record<string, unknown> = {}) {
    const record: Record<string, unknown> = {
      _id: "user123",
      name: "Ada",
      email: "ada@test.com",
      role: "freelancer",
      status: "active",
      password: hashed,
      twoFactorEnabled: true,
      twoFactorSecret: "TESTSECRETBASE32",
      ...overrides,
    };
    record.toObject = () => {
      const { toObject: _toObject, ...plain } = record;
      return plain;
    };
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(record),
    });
  }

  it("requires an OTP when 2FA is enabled", async () => {
    arrangeUserWith2FA();

    await expect(
      authorizeCredentials({ identifier: "ada@test.com", password: PASSWORD }),
    ).rejects.toThrow("2FA_REQUIRED");
  });

  it("rejects an incorrect OTP", async () => {
    arrangeUserWith2FA();

    await expect(
      authorizeCredentials({
        identifier: "ada@test.com",
        password: PASSWORD,
        otp: "000000",
      }),
    ).rejects.toThrow("Invalid 2FA Code");
  });
});
