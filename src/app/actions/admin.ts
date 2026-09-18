"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getAdminOverviewStats() {
    await requireAdmin();

    try {
        const totalEmployees = await prisma.employee.count();
        const activeEmployees = await prisma.employee.count({ where: { status: "ACTIVE" } });
        const totalWorkspaces = await prisma.workspace.count();
        const totalRecords = await prisma.record.count();

        const recentActivities = await prisma.activityLog.findMany({
            take: 10,
            orderBy: { timestamp: "desc" },
            include: {
                employee: { select: { name: true, email: true } },
                record: { select: { workspace: { select: { name: true } } } }
            }
        });

        return {
            success: true,
            stats: {
                totalEmployees,
                activeEmployees,
                totalWorkspaces,
                totalRecords
            },
            recentActivities
        };
    } catch (e: any) {
        return { success: false, error: e.message || "Failed to fetch stats" };
    }
}

export async function getAdminEmployees(searchQuery?: string) {
    await requireAdmin();

    try {
        const whereClause = searchQuery?.trim() ? {
            OR: [
                { name: { contains: searchQuery.trim(), mode: "insensitive" as const } },
                { email: { contains: searchQuery.trim(), mode: "insensitive" as const } }
            ]
        } : {};

        const employees = await prisma.employee.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                _count: {
                    select: {
                        workspaces: true,
                        records: true
                    }
                }
            }
        });

        return { success: true, employees };
    } catch (e: any) {
        return { success: false, error: e.message || "Failed to fetch employees" };
    }
}

export async function updateEmployeeStatus(payload: { employeeId: string; status: "ACTIVE" | "DISABLED" }) {
    const session = await requireAdmin();

    if (payload.employeeId === session.employeeId && payload.status === "DISABLED") {
        return { success: false, error: "Security Restriction: You cannot disable your own active Admin account." };
    }

    try {
        await prisma.employee.update({
            where: { id: payload.employeeId },
            data: { status: payload.status }
        });

        revalidatePath("/admin");
        revalidatePath("/admin/employees");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || "Failed to update employee status" };
    }
}

export async function updateEmployeeRole(payload: { employeeId: string; role: "EMPLOYEE" | "ADMIN" }) {
    const session = await requireAdmin();

    if (payload.employeeId === session.employeeId && payload.role !== "ADMIN") {
        return { success: false, error: "Security Restriction: You cannot remove your own Admin privileges." };
    }

    try {
        await prisma.employee.update({
            where: { id: payload.employeeId },
            data: { role: payload.role }
        });

        revalidatePath("/admin");
        revalidatePath("/admin/employees");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || "Failed to update employee role" };
    }
}

export async function getAdminWorkspaces(searchQuery?: string) {
    await requireAdmin();

    try {
        const whereClause = searchQuery?.trim() ? {
            OR: [
                { name: { contains: searchQuery.trim(), mode: "insensitive" as const } },
                { employee: { name: { contains: searchQuery.trim(), mode: "insensitive" as const } } }
            ]
        } : {};

        const workspaces = await prisma.workspace.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                createdAt: true,
                employee: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        fields: true,
                        records: true
                    }
                }
            }
        });

        return { success: true, workspaces };
    } catch (e: any) {
        return { success: false, error: e.message || "Failed to fetch workspaces" };
    }
}
