import Link from "next/link";
import { getAdminOverviewStats } from "@/app/actions/admin";
import { Users, Briefcase, Database, UserCheck, ShieldCheck, ArrowRight, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
    const res = await getAdminOverviewStats();
    const stats = res.stats || { totalEmployees: 0, activeEmployees: 0, totalWorkspaces: 0, totalRecords: 0 };
    const activities = res.recentActivities || [];

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
                <div>
                    <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-6 h-6 text-amber-500" />
                        <h1 className="text-2xl font-bold tracking-tight text-[#171717]">Admin Dashboard</h1>
                    </div>
                    <p className="text-sm text-[#64748B] mt-1">High-level CRM overview, system statistics, and audit activity logs.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin/employees">
                        <button className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-[#E5E7EB] text-[#171717] hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#534AB7]" />
                            Employees
                        </button>
                    </Link>
                    <Link href="/admin/workspaces">
                        <button className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#534AB7] hover:bg-[#7F77DD] text-white transition-colors shadow-sm flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5" />
                            Workspaces
                        </button>
                    </Link>
                </div>
            </div>

            {/* Overview Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Employees */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-[#64748B]">
                        <span className="text-xs font-semibold uppercase tracking-wider">Total Employees</span>
                        <div className="w-8 h-8 rounded-lg bg-[#EEEDFE] text-[#534AB7] flex items-center justify-center">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-3xl font-extrabold text-[#171717]">{stats.totalEmployees}</div>
                    <p className="text-[11px] text-[#64748B]">Registered accounts</p>
                </div>

                {/* Active Employees */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-[#64748B]">
                        <span className="text-xs font-semibold uppercase tracking-wider">Active Employees</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <UserCheck className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-3xl font-extrabold text-[#171717]">{stats.activeEmployees}</div>
                    <p className="text-[11px] text-emerald-600 font-medium">Verified active access</p>
                </div>

                {/* Total Workspaces */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-[#64748B]">
                        <span className="text-xs font-semibold uppercase tracking-wider">Total Workspaces</span>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Briefcase className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-3xl font-extrabold text-[#171717]">{stats.totalWorkspaces}</div>
                    <p className="text-[11px] text-[#64748B]">Active tenant workspaces</p>
                </div>

                {/* Total Records */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-[#64748B]">
                        <span className="text-xs font-semibold uppercase tracking-wider">Total Records</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Database className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-3xl font-extrabold text-[#171717]">{stats.totalRecords}</div>
                    <p className="text-[11px] text-[#64748B]">Lead & contact rows</p>
                </div>
            </div>

            {/* Quick Management Banner Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-[#26215C] to-[#3C3489] text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-xs font-medium mb-3">
                            <Users className="w-3.5 h-3.5" /> Employee Management
                        </div>
                        <h2 className="text-xl font-bold">Manage Accounts & Roles</h2>
                        <p className="text-xs text-indigo-200/80 mt-1 leading-relaxed">
                            Search employees, toggle active/disabled statuses, and manage role permissions safely.
                        </p>
                    </div>
                    <div>
                        <Link href="/admin/employees">
                            <button className="px-4 py-2 text-xs font-semibold rounded-lg bg-white text-[#26215C] hover:bg-slate-100 transition-colors shadow-sm flex items-center gap-2">
                                Open Employee Management <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </Link>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-[#534AB7] to-[#7F77DD] text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-xs font-medium mb-3">
                            <Briefcase className="w-3.5 h-3.5" /> Workspace Oversight
                        </div>
                        <h2 className="text-xl font-bold">Inspect All Workspaces</h2>
                        <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
                            Global oversight of all tenant workspaces, custom field counts, and record rows across the CRM.
                        </p>
                    </div>
                    <div>
                        <Link href="/admin/workspaces">
                            <button className="px-4 py-2 text-xs font-semibold rounded-lg bg-white text-[#534AB7] hover:bg-slate-100 transition-colors shadow-sm flex items-center gap-2">
                                Open Workspace Management <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* System Audit Log Section */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                    <div className="flex items-center space-x-2">
                        <Activity className="w-5 h-5 text-[#534AB7]" />
                        <h2 className="text-lg font-bold text-[#171717]">Recent System Audit Activity</h2>
                    </div>
                    <span className="text-xs text-[#64748B]">Last 10 system actions</span>
                </div>

                {activities.length === 0 ? (
                    <p className="text-xs text-[#64748B] py-6 text-center italic">No system audit activity recorded yet.</p>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {activities.map((act: any) => (
                            <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                                <div className="flex items-center space-x-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        act.action === "CREATE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                        act.action === "UPDATE" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                                        "bg-rose-50 text-rose-700 border border-rose-200"
                                    }`}>
                                        {act.action}
                                    </span>
                                    <span className="font-semibold text-[#171717]">{act.employee?.name || "System User"}</span>
                                    <span className="text-[#64748B]">in workspace</span>
                                    <span className="font-medium text-[#534AB7]">{act.record?.workspace?.name || "Workspace"}</span>
                                </div>
                                <span className="text-[11px] text-[#64748B]">
                                    {new Date(act.timestamp).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
