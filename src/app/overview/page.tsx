import prisma from "@/lib/prisma";
import { OverviewClient } from "./OverviewClient";

export default async function OverviewPage() {
    // 1. Fetch Aggregates
    const [
        totalEmployees,
        totalWorkspaces,
        totalRecords,
        totalActivity
    ] = await Promise.all([
        prisma.employee.count(),
        prisma.workspace.count(),
        prisma.record.count(),
        prisma.activityLog.count()
    ]);

    const summary = { totalEmployees, totalWorkspaces, totalRecords, totalActivity };

    // 2. Fetch Workspaces with employee + stats
    // We get all workspaces for the table
    const workspaces = await prisma.workspace.findMany({
        include: {
            employee: true,
            _count: {
                select: { records: true, fields: true }
            },
            records: {
                select: { updatedAt: true },
                orderBy: { updatedAt: 'desc' },
                take: 1
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // 3. Fetch Recent Activities (limit 20)
    const activities = await prisma.activityLog.findMany({
        include: {
            employee: true,
            record: {
                include: {
                    workspace: true
                }
            }
        },
        orderBy: { timestamp: 'desc' },
        take: 20
    });

    // 4. Fetch Employees purely for dropdown filter
    const employees = await prisma.employee.findMany({
        orderBy: { name: 'asc' }
    });

    return (
        <OverviewClient
            summary={summary}
            workspaces={workspaces}
            activities={activities}
            employees={employees}
        />
    );
}
