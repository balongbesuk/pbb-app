import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

const LOGIN_RATE_LIMIT = {
  limit: 5,
  windowMs: 10 * 60 * 1000,
};

function maskIp(ip: string): string {
  if (!ip || ip === "unknown") return "unknown";

  if (ip.includes(":")) {
    const parts = ip.split(":").filter(Boolean);
    if (parts.length <= 2) return ip;
    return `${parts.slice(0, 2).join(":")}:*`;
  }

  const parts = ip.split(".");
  if (parts.length !== 4) return ip;
  return `${parts[0]}.${parts[1]}.*.*`;
}

async function createFailedLoginAuditLog(username: string, ip: string, reason: string) {
  try {
    await prisma.auditLog.create({
      data: {
        action: "LOGIN_FAILED",
        entity: "Auth",
        entityId: username,
        details: `Login gagal untuk username "${username}" dari IP ${maskIp(ip)}. Alasan: ${reason}.`,
      },
    });
  } catch (error) {
    console.error("Gagal membuat audit log login gagal:", error);
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) return null;

        const username = credentials.username.trim();
        const ip = getClientIp(req);
        const rateLimitKey = `login:${ip}:${username.toLowerCase()}`;
        const loginRateLimit = await checkRateLimit(rateLimitKey, LOGIN_RATE_LIMIT);

        if (!loginRateLimit.allowed) {
          await createFailedLoginAuditLog(username, ip, "RATE_LIMIT");
          throw new Error(
            `Terlalu banyak percobaan login. Coba lagi dalam ${loginRateLimit.retryAfter} detik.`
          );
        }

        const user = await prisma.user.findUnique({
          where: { username },
        });

        if (!user) {
          await createFailedLoginAuditLog(username, ip, "USER_NOT_FOUND");
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          await createFailedLoginAuditLog(username, ip, "INVALID_PASSWORD");
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
          username: user.username,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role;
        token.id = user.id!;
        token.username = (user as any).username;
        token.mustChangePassword = user.mustChangePassword;
      }

      // Self-healing: jika token.id tidak ditemukan di DB (karena DB di-seed/reset ulang),
      // coba cari berdasarkan token.username untuk menyelaraskan ID secara otomatis
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id },
            select: { id: true, role: true, mustChangePassword: true }
          });

          if (!dbUser && token.username) {
            const healedUser = await prisma.user.findUnique({
              where: { username: token.username as string },
              select: { id: true, role: true, mustChangePassword: true }
            });
            if (healedUser) {
              token.id = healedUser.id;
              token.role = healedUser.role;
              token.mustChangePassword = healedUser.mustChangePassword;
              console.warn(`[NextAuth JWT] Session healed for user "${token.username}". Old ID was invalid, mapped to new ID: ${token.id}`);
            } else {
              console.warn(`[NextAuth JWT] User "${token.username}" not found in DB. Invalidating token.`);
              return {} as any; // Bersihkan token
            }
          } else if (!dbUser) {
            console.warn(`[NextAuth JWT] User ID ${token.id} not found and no username present to heal. Invalidating token.`);
            return {} as any; // Bersihkan token
          } else if (dbUser) {
            token.mustChangePassword = dbUser.mustChangePassword;
          }
        } catch (err) {
          console.error("[NextAuth JWT] Error checking/healing session ID:", err);
        }
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
        if (!token.id) {
          // Bersihkan session.user agar NextAuth (baik di server maupun client) tahu user tidak authenticated
          return {
            ...session,
            user: null as any
          };
        }
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
