"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getSession, requireAuth, requireWorkspaceAccess } from "@/lib/auth";

export async function getCurrentEmployeeId() {
    const session = await requireAuth();
    return session.employeeId;
}

export async function createWorkspace(data: { name: string }) {
    const schema = z.object({
        name: z.string().min(1, "Workspace name is required")
    });

    const parsed = schema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        const session = await requireAuth();

        const workspace = await prisma.workspace.create({
            data: {
                name: parsed.data.name.trim(),
                employeeId: session.employeeId,
                fields: {
                    create: [
                        { name: "Name", type: "TEXT", isRequired: true, order: 0 },
                        { name: "Company", type: "TEXT", isRequired: false, order: 1 },
                        { name: "Email", type: "EMAIL", isRequired: false, order: 2 },
                        { name: "Phone Number", type: "PHONE", isRequired: false, order: 3 },
                    ]
                }
            }
        });
        revalidatePath("/overview");
        revalidatePath("/");
        return { success: true, workspaceId: workspace.id };
    } catch (e: any) {
        console.error("Workspace creation failed:", e);
        return { success: false, error: "Failed to create workspace: " + (e.message || String(e)) };
    }
}

export async function renameWorkspace(workspaceId: string, newName: string) {
    try {
        await requireWorkspaceAccess(workspaceId);

        await prisma.workspace.update({
            where: { id: workspaceId },
            data: { name: newName.trim() }
        });

        revalidatePath(`/workspaces/${workspaceId}/settings`);
        revalidatePath("/overview");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || "Failed to rename workspace." };
    }
}

export async function deleteWorkspace(workspaceId: string) {
    try {
        await requireWorkspaceAccess(workspaceId);

        await prisma.workspace.delete({
            where: { id: workspaceId }
        });

        revalidatePath("/overview");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || "Failed to delete workspace." };
    }
}
