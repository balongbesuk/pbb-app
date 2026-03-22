import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (!user) return null;

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role;
        token.id = user.id!;
        token.mustChangePassword = user.mustChangePassword;
      }
      // Saat session di-update (setelah ganti password), refresh flag dari DB
      if (trigger === "update") {
        const freshUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { mustChangePassword: true },
        });
        if (freshUser) {
          token.mustChangePassword = freshUser.mustChangePassword;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.mustChangePassword = token.mustChangePassword;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 jam
  },
  // ─── Cookie CSRF protection ─────────────────────────────────────────────
  // Next-auth JWT menggunakan cookies HttpOnly + SameSite=Lax secara default.
  // Konfigurasi di bawah mempertegas setting ini secara eksplisit.
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",   // Blokir CSRF cross-site, izinkan navigasi top-level
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  events: {
    async signIn({ user }) {
      if (user) {
        await prisma.auditLog.create({
          data: {
            action: "LOGIN",
            entity: "User",
            entityId: user.id,
            details: `Pengguna ${user.name} berhasil login ke dalam sistem`,
            userId: user.id,
          },
        });
      }
    },
  },
};
