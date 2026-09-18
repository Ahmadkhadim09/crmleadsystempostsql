import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PublicLandingPage } from "@/components/PublicLandingPage";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();

  if (session) {
    if (session.role === "ADMIN") {
      redirect("/admin");
    }

    // Find employee's workspace for quick entry
    const workspace = await prisma.workspace.findFirst({
      where: { employeeId: session.employeeId },
      orderBy: { createdAt: "asc" }
    });

    if (workspace) {
      redirect(`/workspaces/${workspace.id}`);
    }

    redirect("/overview");
  }

  return <PublicLandingPage />;
}
