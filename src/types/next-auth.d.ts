/**
 * next-auth.d.ts — Augmentasi type NextAuth.
 *
 * Menghilangkan kebutuhan `as any` di seluruh codebase untuk:
 *   session.user.id
 *   session.user.role
 *   session.user.mustChangePassword
 *   token.id
 *   token.role
 *   token.mustChangePassword
 */

import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

type AppRole = "ADMIN" | "PENARIK" | "PENGGUNA";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: AppRole;
    mustChangePassword: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: AppRole;
    mustChangePassword: boolean;
  }
}
