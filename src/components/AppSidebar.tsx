import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { AppSidebarClient } from "./AppSidebarClient";
import { getCurrentEmployeeId } from "@/app/actions/workspaces";

export async function AppSidebar({ activeWorkspaceId, isOverview }: { activeWorkspaceId?: string, isOverview?: boolean }) {
    const currentEmployeeId = await getCurrentEmployeeId();

    // Grab all employees for the switcher
    const allEmployees = await prisma.employee.findMany({ orderBy: { name: 'asc' } });

    // Grab workspaces for the CURRENT employee
    const myWorkspaces = await prisma.workspace.findMany({
        where: { employeeId: currentEmployeeId },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <AppSidebarClient
            allEmployees={allEmployees}
            myWorkspaces={myWorkspaces}
            currentEmployeeId={currentEmployeeId}
            activeWorkspaceId={activeWorkspaceId}
            isOverview={isOverview}
        />
    );
}
