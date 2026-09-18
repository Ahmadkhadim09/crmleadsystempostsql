"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, Database, Activity, FileText, ExternalLink, Filter, Sparkles } from "lucide-react";

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
        <div className="flex-1 flex flex-col overflow-hidden h-full bg-[#F8FAFC]">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 h-14 md:h-16 flex flex-none items-center justify-between px-4 pl-14 md:px-8 shrink-0 relative z-20">
                <div className="flex items-center gap-2">
                    <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Company Overview</h1>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EEEDFE] text-[#534AB7] text-[11px] font-semibold">
                        <Sparkles className="w-3 h-3" /> Real-Time Analytics
                    </span>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 relative isolate">
                <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Employees</h3>
                                <div className="p-2 bg-[#EEEDFE] text-[#534AB7] rounded-lg">
                                    <Users className="w-4 h-4" />
                                </div>
                            </div>
                            <p className="text-3xl font-extrabold text-slate-900">{summary.totalEmployees || 0}</p>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Workspaces</h3>
                                <div className="p-2 bg-[#EEEDFE] text-[#534AB7] rounded-lg">
                                    <Briefcase className="w-4 h-4" />
                                </div>
                            </div>
                            <p className="text-3xl font-extrabold text-slate-900">{summary.totalWorkspaces || 0}</p>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Records</h3>
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                    <Database className="w-4 h-4" />
                                </div>
                            </div>
                            <p className="text-3xl font-extrabold text-slate-900">{summary.totalRecords || 0}</p>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Activities</h3>
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                    <Activity className="w-4 h-4" />
                                </div>
                            </div>
                            <p className="text-3xl font-extrabold text-slate-900">{summary.totalActivity || 0}</p>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                        {/* Workspaces List (Takes 2 columns) */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-bold text-slate-900">Workspaces Directory</h2>
                                <span className="text-xs text-slate-500">{workspaces.length} Active Workspaces</span>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                {workspaces.length === 0 ? (
                                    <div className="p-12 text-center flex flex-col items-center">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100 text-slate-400">
                                            <Briefcase className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-sm font-semibold text-slate-800 mb-1">No workspaces yet</h3>
                                        <p className="text-xs text-slate-500 max-w-sm">Create a workspace to start managing custom CRM records and data.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-left text-xs whitespace-nowrap">
                                            <thead className="bg-slate-50 border-b border-slate-200">
                                                <tr>
                                                    <th className="px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                                                    <th className="px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider">Workspace</th>
                                                    <th className="px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider">Metrics</th>
                                                    <th className="px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {workspaces.map((ws) => (
                                                    <tr key={ws.id} className="hover:bg-slate-50/80 transition-colors group">
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center space-x-2.5">
                                                                <div className="w-7 h-7 rounded-full bg-[#EEEDFE] text-[#534AB7] flex items-center justify-center font-bold text-xs">
                                                                    {(ws.employee?.name || "E").charAt(0).toUpperCase()}
                                                                </div>
                                                                <span className="font-semibold text-slate-900">{ws.employee?.name || "System Admin"}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center space-x-2">
                                                                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                                                <span className="text-slate-800 font-medium">{ws.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center space-x-3 text-slate-500 text-xs">
                                                                <span className="flex items-center gap-1" title="Records">
                                                                    <FileText className="w-3.5 h-3.5 text-slate-400" /> {ws._count?.records || 0} records
                                                                </span>
                                                                <span className="flex items-center gap-1" title="Fields">
                                                                    <Database className="w-3.5 h-3.5 text-slate-400" /> {ws._count?.fields || 0} fields
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3.5 text-right">
                                                            <Link href={`/workspaces/${ws.id}`}>
                                                                <Button variant="outline" size="sm" className="h-7 text-xs border-slate-200 hover:bg-[#EEEDFE] hover:text-[#534AB7] transition-colors">
                                                                    Open <ExternalLink className="w-3 h-3 ml-1" />
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

                        {/* Recent Activity (Takes 1 column) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-bold text-slate-900">System Activity Stream</h2>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[480px] overflow-hidden">
                                {/* Activity Filters */}
                                <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex gap-2 shrink-0">
                                    <div className="relative flex-1">
                                        <Filter className="w-3 h-3 absolute left-2.5 top-2.5 text-slate-400" />
                                        <select
                                            className="w-full bg-white border border-slate-200 rounded-md text-xs pl-7 pr-2 py-1 focus:outline-none focus:border-[#534AB7] text-slate-700 font-medium"
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
                                        <Filter className="w-3 h-3 absolute left-2.5 top-2.5 text-slate-400" />
                                        <select
                                            className="w-full bg-white border border-slate-200 rounded-md text-xs pl-7 pr-2 py-1 focus:outline-none focus:border-[#534AB7] text-slate-700 font-medium"
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

                                {/* Activity List */}
                                <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100">
                                    {filteredActivities.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
                                            <Activity className="w-8 h-8 text-slate-300 mb-2" />
                                            <p className="text-xs font-semibold text-slate-600">No activity logs found</p>
                                            <p className="text-[11px] mt-0.5">Adjust filter options or perform record actions.</p>
                                        </div>
                                    ) : (
                                        filteredActivities.map((act) => {
                                            const empName = act.employee?.name || "System User";
                                            const wsName = act.record?.workspace?.name || "Workspace";

                                            let badgeClass = "text-slate-600 bg-slate-100 border-slate-200";

                                            if (act.action === "CREATE") {
                                                badgeClass = "text-emerald-700 bg-emerald-50 border-emerald-200";
                                            } else if (act.action === "UPDATE") {
                                                badgeClass = "text-[#534AB7] bg-[#EEEDFE] border-indigo-200";
                                            } else if (act.action === "DELETE") {
                                                badgeClass = "text-rose-700 bg-rose-50 border-rose-200";
                                            }

                                            return (
                                                <div key={act.id} className="py-2.5 first:pt-0 last:pb-0 hover:bg-slate-50 px-2 rounded-lg transition-colors">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${badgeClass}`}>
                                                            {act.action}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {timeAgo(new Date(act.timestamp))}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-700 leading-snug">
                                                        <span className="font-semibold text-slate-900">{empName}</span> in <span className="font-semibold text-slate-900">{wsName}</span>
                                                    </p>
                                                </div>
                                            );
                                        })
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
