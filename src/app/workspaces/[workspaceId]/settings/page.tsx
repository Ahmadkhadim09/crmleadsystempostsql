import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FieldsManager } from "./fields-manager";
import { WorkspaceSettingsActions } from "./WorkspaceSettingsActions";
import prisma from "@/lib/prisma";

export default async function WorkspaceSettingsPage({ params }: { params: Promise<{ workspaceId: string }> }) {
    const { workspaceId } = await params;
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });

    const initialFields = await prisma.fieldDefinition.findMany({
        where: { workspaceId },
        orderBy: { order: 'asc' }
    });

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <header className="border-b border-gray-200 h-16 flex flex-none items-center px-8 shrink-0">
                <h1 className="text-xl font-semibold text-gray-800">Workspace Settings</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-8 max-w-5xl">
                <WorkspaceSettingsActions workspaceId={workspaceId} initialName={workspace?.name || "Unknown"} />

                <div className="mb-8">
                    <h2 className="text-lg font-medium text-gray-900 mb-1">Custom Fields</h2>
                    <p className="text-sm text-gray-500">
                        Define the dynamic fields for your records. The Boss Overview can see all fields.
                    </p>
                </div>

                <FieldsManager workspaceId={workspaceId} initialFields={initialFields} />
            </main>
        </div>
    );
}
