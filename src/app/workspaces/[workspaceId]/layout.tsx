import { AppSidebar } from "@/components/AppSidebar";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default async function WorkspaceLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ workspaceId: string }>;
}) {
    const { workspaceId } = await params;
    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true }
    });

    return (
        <div className="flex h-screen bg-gray-50/50">
            <AppSidebar activeWorkspaceId={workspaceId} />
            <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-white">
                <header className="bg-white border-b border-gray-200/60 h-16 flex flex-none items-center px-8 shrink-0 relative z-20">
                    <div className="flex items-center text-gray-500 text-sm">
                        <Link href="/overview" className="hover:text-gray-900 transition-colors font-medium">Workspaces</Link>
                        <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                        <span className="font-semibold text-gray-900">{workspace?.name || "Unknown Workspace"}</span>
                    </div>
                </header>
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {children}
                </div>
            </div>
        </div>
    );
}
