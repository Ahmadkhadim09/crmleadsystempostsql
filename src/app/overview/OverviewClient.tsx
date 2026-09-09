"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function timeAgo(date: Date | string | number) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval >= 2) return Math.floor(interval) + " days ago";
    if (interval >= 1) return "Yesterday";
    interval = seconds / 3600;
    if (interval >= 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval >= 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
}

export function OverviewClient({
    summary,
    workspaces,
    activities,
    employees
}: {
    summary: any,
    workspaces: any[],
    activities: any[],
    employees: any[]
}) {
    const [selectedEmployee, setSelectedEmployee] = useState<string>("ALL");
    const [selectedWorkspace, setSelectedWorkspace] = useState<string>("ALL");

    // Filter activities based on selection
    const filteredActivities = activities.filter(act => {
        if (selectedEmployee !== "ALL" && act.employeeId !== selectedEmployee) return false;
        if (selectedWorkspace !== "ALL" && act.record?.workspaceId !== selectedWorkspace) return false;
        return true;
    });

    return (
        <div className="flex-1 flex flex-col overflow-hidden h-full">
            <header className="bg-white border-b border-gray-200 h-16 flex flex-none items-center px-8 shrink-0">
                <h1 className="text-xl font-semibold text-gray-800">Company Overview</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-8 relative isolate">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-500">Total Employees</h3>
                        <p className="text-3xl font-bold mt-2 text-gray-900">{summary.totalEmployees || 0}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-500">Total Workspaces</h3>
                        <p className="text-3xl font-bold mt-2 text-gray-900">{summary.totalWorkspaces || 0}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-500">Total Records</h3>
                        <p className="text-3xl font-bold mt-2 text-gray-900">{summary.totalRecords || 0}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-500">Total Activities</h3>
                        <p className="text-3xl font-bold mt-2 text-gray-900">{summary.totalActivity || 0}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8 flex flex-col">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Workspaces</h3>
                    </div>
                    <div className="overflow-x-auto">
                        {workspaces.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">No workspaces yet. Create your first workspace to start adding records.</div>
                        ) : (
                            <table className="min-w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 font-medium text-gray-500">Employee</th>
                                        <th className="px-6 py-3 font-medium text-gray-500">Workspace</th>
                                        <th className="px-6 py-3 font-medium text-gray-500">Records</th>
                                        <th className="px-6 py-3 font-medium text-gray-500">Fields</th>
                                        <th className="px-6 py-3 font-medium text-gray-500">Last Activity</th>
                                        <th className="px-6 py-3 font-medium text-gray-500 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {workspaces.map((ws) => (
                                        <tr key={ws.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{ws.employee?.name || "Unknown"}</td>
                                            <td className="px-6 py-4 text-gray-600 font-medium">{ws.name}</td>
                                            <td className="px-6 py-4 text-gray-500">{ws._count?.records || 0}</td>
                                            <td className="px-6 py-4 text-gray-500">{ws._count?.fields || 0}</td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {ws.records && ws.records.length > 0
                                                    ? timeAgo(new Date(ws.records[0].updatedAt))
                                                    : "No activity"}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/workspaces/${ws.id}`}>
                                                    <Button variant="outline" size="sm">View Workspace</Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                        <div className="flex space-x-2">
                            <select
                                className="border border-gray-200 rounded-md text-sm px-2 py-1"
                                value={selectedEmployee}
                                onChange={(e) => setSelectedEmployee(e.target.value)}
                            >
                                <option value="ALL">All Employees</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                            <select
                                className="border border-gray-200 rounded-md text-sm px-2 py-1"
                                value={selectedWorkspace}
                                onChange={(e) => setSelectedWorkspace(e.target.value)}
                            >
                                <option value="ALL">All Workspaces</option>
                                {workspaces.map(ws => (
                                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        {filteredActivities.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">No recent activity.</div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {filteredActivities.map((act) => {
                                    const empName = act.employee?.name || "Someone";
                                    const wsName = act.record?.workspace?.name || "an unknown workspace";
                                    let actionText = "";
                                    let colorClass = "text-gray-500 bg-gray-100";

                                    if (act.action === "CREATE") {
                                        actionText = `${empName} created a new record in ${wsName}.`;
                                        colorClass = "text-green-700 bg-green-100";
                                    } else if (act.action === "UPDATE") {
                                        actionText = `${empName} updated a record in ${wsName}.`;
                                        colorClass = "text-blue-700 bg-blue-100";
                                    } else if (act.action === "DELETE") {
                                        actionText = `${empName} deleted a record in ${wsName}.`;
                                        colorClass = "text-red-700 bg-red-100";
                                    } else {
                                        actionText = `${empName} performed an action (${act.action}) in ${wsName}.`;
                                    }

                                    return (
                                        <li key={act.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colorClass}`}>
                                                    {act.action}
                                                </span>
                                                <p className="text-sm text-gray-700">{actionText}</p>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {timeAgo(new Date(act.timestamp))}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}
