"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function setEmployeeCookie(employeeId: string) {
    const cookieStore = await cookies();
    cookieStore.set("current_employee_id", employeeId, { path: '/' });
    revalidatePath("/");
}

export async function getCurrentEmployeeId() {
    const cookieStore = await cookies();
    const existing = cookieStore.get("current_employee_id")?.value;

    if (existing) {
        // Validate if it actually exists in DB to prevent foreign key constraint issues
        const emp = await prisma.employee.findUnique({ where: { id: existing } });
        if (emp) return emp.id;
    }

    // Fallback: Use the very first employee if no valid cookie
    const firstEmp = await prisma.employee.findFirst({ orderBy: { name: 'asc' } });
    if (firstEmp) {
        return firstEmp.id;
    }

    // Last resort panic fallback, upsert "default_employee" to guarantee FK
    const defaultEmp = await prisma.employee.upsert({
        where: { id: "default_employee" },
        update: {},
        create: { id: "default_employee", name: "Default Employee" }
    });
    return defaultEmp.id;
}

export async function createWorkspace(data: { name: string, employeeId?: string }) {
    const schema = z.object({
        name: z.string().min(1, "Workspace name is required"),
        employeeId: z.string().optional()
    });

    const parsed = schema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    const employeeId = parsed.data.employeeId || await getCurrentEmployeeId();

    try {
        const workspace = await prisma.workspace.create({
            data: {
                name: parsed.data.name,
                employeeId: employeeId
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
    const employeeId = await getCurrentEmployeeId();

    try {
        // verify ownership
        const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
        if (!workspace || workspace.employeeId !== employeeId) {
            return { success: false, error: "Unauthorized or not found." };
        }

        await prisma.workspace.update({
            where: { id: workspaceId },
            data: { name: newName }
        });

        revalidatePath(`/workspaces/${workspaceId}/settings`);
        revalidatePath("/overview");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Failed to rename workspace." };
    }
}

export async function deleteWorkspace(workspaceId: string) {
    const employeeId = await getCurrentEmployeeId();

    try {
        // verify ownership
        const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
        if (!workspace || workspace.employeeId !== employeeId) {
            return { success: false, error: "Unauthorized or not found." };
        }

        // Deleting the workspace naturally cascades based on the schema design
        await prisma.workspace.delete({
            where: { id: workspaceId }
        });

        revalidatePath("/overview");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Failed to delete workspace." };
    }
}
