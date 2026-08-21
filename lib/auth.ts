import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";

/**
 * Server-side authorization helpers.
 *
 * The rule this file exists to enforce: identity and privilege are read from
 * the verified session on the server, NEVER from the request body. A route
 * that trusts a client-supplied `userId` lets any caller act as anyone else.
 */

export interface SessionIdentity {
  userId: string;
  role: string;
}

/** Returns the caller's identity from the session, or null if unauthenticated. */
export async function getIdentity(): Promise<SessionIdentity | null> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;
  if (!userId) return null;
  return { userId: String(userId), role: session?.user?.role || "" };
}

/**
 * Confirms the caller is an admin.
 *
 * The role is re-read from the database rather than trusted from the JWT: a
 * demoted or suspended admin must lose access immediately, not whenever their
 * token happens to expire.
 */
export async function requireAdmin(): Promise<SessionIdentity | null> {
  const identity = await getIdentity();
  if (!identity) return null;

  await connectToDB();
  const user = await User.findById(identity.userId).select("role status");
  if (!user || user.role !== "admin" || user.status !== "active") return null;

  return { userId: identity.userId, role: "admin" };
}
