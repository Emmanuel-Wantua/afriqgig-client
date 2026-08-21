import "next-auth";
import { DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

/**
 * The session callback in app/api/auth/[...nextauth]/route.ts attaches the
 * Mongo `_id`, the role and the avatar onto `session.user`. Declare them here
 * so server routes can read `session.user._id` with type safety instead of
 * casting through `any`.
 */
declare module "next-auth" {
  interface Session {
    user: {
      _id?: string;
      role?: string;
      avatar?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  // ✅ NEW: the `user` object passed into the jwt() callback (from
  // CredentialsProvider's authorize(), or from the social-login signIn()
  // flow) carries these same custom fields. Without this, the callbacks in
  // [...nextauth]/route.ts need `: any` to read user._id / user.role.
  interface User extends DefaultUser {
    _id?: string;
    role?: string;
    avatar?: string;
  }
}

// ✅ NEW: the jwt() callback reads/writes token.id and token.role — same
// reasoning as above, for the token object instead of the user object.
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: string;
  }
}