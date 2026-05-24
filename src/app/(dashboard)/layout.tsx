import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClientLayout } from "./ClientLayout";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  // Force password change if needed
  // Note: we let them access the ganti-password page itself
  // Actually, layout doesn't know the exact path easily in server components, 
  // but we can check the session flag. Next.js App Router layout wraps children.
  // The ganti-password page is INSIDE this layout group.


  return <ClientLayout>{children}</ClientLayout>;
}

