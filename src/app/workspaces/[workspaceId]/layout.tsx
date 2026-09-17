import { AppSidebar } from "@/components/AppSidebar";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireWorkspaceAccess } from "@/lib/auth";

export default async function WorkspaceLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ workspaceId: string }>;
}) {
    const { workspaceId } = await params;
    await requireWorkspaceAccess(workspaceId);

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true }
    });

    return (
        <div className="flex h-screen bg-[#F8FAFC]">
            <AppSidebar activeWorkspaceId={workspaceId} />
            <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#F8FAFC]">
                <header className="bg-white border-b border-[#E5E7EB] h-14 md:h-16 flex flex-none items-center px-4 pl-14 md:px-8 shrink-0 relative z-20">
                    <div className="flex items-center text-[#64748B] text-xs md:text-sm whitespace-nowrap overflow-hidden">
                        <Link href="/overview" className="hover:text-[#534AB7] transition-colors font-medium shrink-0">Workspaces</Link>
                        <ChevronRight className="w-3 h-3 md:w-4 md:h-4 mx-1.5 md:mx-2 text-[#64748B]/60 shrink-0" />
                        <span className="font-semibold text-[#171717] truncate">{workspace?.name || "Unknown Workspace"}</span>
                    </div>
                </header>
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {children}
                </div>
            </div>
        </div>
    );
}
