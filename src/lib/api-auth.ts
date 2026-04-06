import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function requireAdminApi(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const role = session?.user && "role" in session.user ? session.user.role : undefined;

  if (!session || role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  return session;
}
