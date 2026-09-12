"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, Database, Activity, FileText, ChevronRight, Filter } from "lucide-react";

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
        <div className="flex-1 flex flex-col overflow-hidden h-full bg-white">
            <header className="bg-white border-b border-gray-200/60 h-16 flex flex-none items-center px-8 shrink-0 relative z-20">
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Company Overview</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-8 relative isolate bg-gray-50/30">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-500">Total Employees</h3>
                                <div className="p-2 bg-gray-50 rounded-md">
                                    <Users className="w-4 h-4 text-gray-600" />
                                </div>
                            </div>
                            <p className="text-3xl font-semibold text-gray-900">{summary.totalEmployees || 0}</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-500">Total Workspaces</h3>
                                <div className="p-2 bg-gray-50 rounded-md">
                                    <Briefcase className="w-4 h-4 text-gray-600" />
                                </div>
                            </div>
                            <p className="text-3xl font-semibold text-gray-900">{summary.totalWorkspaces || 0}</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-500">Total Records</h3>
                                <div className="p-2 bg-gray-50 rounded-md">
                                    <Database className="w-4 h-4 text-gray-600" />
                                </div>
                            </div>
                            <p className="text-3xl font-semibold text-gray-900">{summary.totalRecords || 0}</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-500">Total Activities</h3>
                                <div className="p-2 bg-gray-50 rounded-md">
                                    <Activity className="w-4 h-4 text-gray-600" />
                                </div>
                            </div>
                            <p className="text-3xl font-semibold text-gray-900">{summary.totalActivity || 0}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Workspaces List (Takes 2 columns on large screens) */}
                        <div className="lg:col-span-2 space-y-4">
                            <h2 className="text-lg font-medium text-gray-900">Active Workspaces</h2>

                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                {workspaces.length === 0 ? (
                                    <div className="p-12 text-center flex flex-col items-center">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                                            <Briefcase className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <h3 className="text-sm font-medium text-gray-900 mb-1">No workspaces yet</h3>
                                        <p className="text-sm text-gray-500 max-w-sm">Create an employee profile to get started with your first workspace and begin managing records.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-left text-sm whitespace-nowrap">
                                            <thead className="bg-gray-50/50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Employee</th>
                                                    <th className="px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Workspace</th>
                                                    <th className="px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Metrics</th>
                                                    <th className="px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider flex justify-end">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {workspaces.map((ws) => (
                                                    <tr key={ws.id} className="hover:bg-gray-50/50 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-semibold text-xs border border-gray-200">
                                                                    {(ws.employee?.name || "U").charAt(0).toUpperCase()}
                                                                </div>
                                                                <span className="font-medium text-gray-900">{ws.employee?.name || "Unknown"}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center space-x-2">
                                                                <Briefcase className="w-4 h-4 text-gray-400" />
                                                                <span className="text-gray-700 font-medium">{ws.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center space-x-4 text-gray-500 text-xs">
                                                                <span className="flex items-center" title="Records">
                                                                    <FileText className="w-3.5 h-3.5 mr-1 text-gray-400" /> {ws._count?.records || 0}
                                                                </span>
                                                                <span className="flex items-center" title="Custom Fields">
                                                                    <Database className="w-3.5 h-3.5 mr-1 text-gray-400" /> {ws._count?.fields || 0}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <Link href={`/workspaces/${ws.id}`}>
                                                                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    Open <ChevronRight className="w-4 h-4 ml-1" />
                                                                </Button>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Activity (Takes 1 column on large screens) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[500px]">
                                <div className="p-4 border-b border-gray-200/60 bg-gray-50/30 flex space-x-2 shrink-0">
                                    <div className="relative flex-1">
                                        <Filter className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                                        <select
                                            className="w-full bg-white border border-gray-200 rounded-md text-sm pl-9 pr-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300 appearance-none text-gray-700"
                                            value={selectedEmployee}
                                            onChange={(e) => setSelectedEmployee(e.target.value)}
                                        >
                                            <option value="ALL">All Employees</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="relative flex-1">
                                        <Filter className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                                        <select
                                            className="w-full bg-white border border-gray-200 rounded-md text-sm pl-9 pr-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300 appearance-none text-gray-700"
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

                                <div className="flex-1 overflow-y-auto p-2">
                                    {filteredActivities.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 p-6">
                                            <Activity className="w-8 h-8 text-gray-300 mb-2" />
                                            <p className="text-sm font-medium text-gray-600">No activity found</p>
                                            <p className="text-xs mt-1">Adjust filters or create records.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {filteredActivities.map((act) => {
                                                const empName = act.employee?.name || "Someone";
                                                const wsName = act.record?.workspace?.name || "Unknown WS";

                                                let actionBadge = act.action;
                                                let badgeClass = "text-gray-600 border-gray-200 bg-gray-50";

                                                if (act.action === "CREATE") {
                                                    badgeClass = "text-emerald-700 border-emerald-200 bg-emerald-50";
                                                } else if (act.action === "UPDATE") {
                                                    badgeClass = "text-indigo-700 border-indigo-200 bg-indigo-50";
                                                } else if (act.action === "DELETE") {
                                                    badgeClass = "text-rose-700 border-rose-200 bg-rose-50";
                                                }

                                                return (
                                                    <div key={act.id} className="p-3 hover:bg-gray-50 rounded-lg transition-colors group">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <div className="flex items-center space-x-2">
                                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                                                                    {actionBadge}
                                                                </span>
                                                                <span className="text-[11px] font-medium text-gray-400">
                                                                    {timeAgo(new Date(act.timestamp))}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-gray-700 mt-1.5 leading-snug">
                                                            <span className="font-medium text-gray-900">{empName}</span> performed this action in <span className="font-medium text-gray-900">{wsName}</span>.
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
