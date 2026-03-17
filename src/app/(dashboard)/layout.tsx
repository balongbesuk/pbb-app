import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClientLayout } from "./ClientLayout";


export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }


  return <ClientLayout>{children}</ClientLayout>;
}

