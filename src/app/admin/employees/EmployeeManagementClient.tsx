"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateEmployeeStatus, updateEmployeeRole } from "@/app/actions/admin";
import { Search, Users, ShieldAlert, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";

interface EmployeeItem {
    id: string;
    name: string;
    email: string | null;
    role: string;
    status: string;
    createdAt: Date;
    _count: {
        workspaces: number;
        records: number;
    };
}

export function EmployeeManagementClient({
    employees: initialEmployees,
    currentAdminId
}: {
    employees: EmployeeItem[];
    currentAdminId: string;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [searchInput, setSearchInput] = useState("");
    const [actionError, setActionError] = useState<string | null>(null);

    const filteredEmployees = initialEmployees.filter(emp => {
        if (!searchInput.trim()) return true;
        const q = searchInput.toLowerCase().trim();
        return emp.name.toLowerCase().includes(q) || (emp.email && emp.email.toLowerCase().includes(q));
    });

    const handleToggleStatus = (emp: EmployeeItem) => {
        setActionError(null);
        const newStatus = emp.status === "ACTIVE" ? "DISABLED" : "ACTIVE";

        if (emp.id === currentAdminId && newStatus === "DISABLED") {
            setActionError("Security Restriction: You cannot disable your own active Admin account.");
            return;
        }

        startTransition(async () => {
            const res = await updateEmployeeStatus({ employeeId: emp.id, status: newStatus });
            if (res.success) {
                router.refresh();
            } else {
                setActionError(res.error || "Failed to update employee status");
            }
        });
    };

    const handleToggleRole = (emp: EmployeeItem) => {
        setActionError(null);
        const newRole = emp.role === "ADMIN" ? "EMPLOYEE" : "ADMIN";

        if (emp.id === currentAdminId && newRole !== "ADMIN") {
            setActionError("Security Restriction: You cannot remove your own Admin privileges.");
            return;
        }

        startTransition(async () => {
            const res = await updateEmployeeRole({ employeeId: emp.id, role: newRole });
            if (res.success) {
                router.refresh();
            } else {
                setActionError(res.error || "Failed to update employee role");
            }
        });
    };

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
                <div>
                    <div className="flex items-center space-x-2">
                        <Users className="w-6 h-6 text-[#534AB7]" />
                        <h1 className="text-2xl font-bold tracking-tight text-[#171717]">Employee Management</h1>
                    </div>
                    <p className="text-sm text-[#64748B] mt-1">Manage user accounts, toggle active/disabled access, and assign roles.</p>
                </div>
                <div className="w-full md:w-72 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <Input
                        placeholder="Search name or email..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="pl-9 h-9 text-xs bg-white border-[#E5E7EB] focus:border-[#534AB7]"
                    />
                </div>
            </div>

            {actionError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{actionError}</span>
                </div>
            )}

            {/* Table Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#64748B] font-semibold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="px-5 py-3">Employee</th>
                                <th className="px-5 py-3">Role</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3">Workspaces</th>
                                <th className="px-5 py-3">Records Created</th>
                                <th className="px-5 py-3">Registered</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-slate-400 italic">
                                        No employees found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((emp) => {
                                    const isSelf = emp.id === currentAdminId;
                                    return (
                                        <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#EEEDFE] text-[#534AB7] font-bold text-xs flex items-center justify-center shrink-0">
                                                        {emp.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-[#171717] flex items-center gap-1.5">
                                                            {emp.name}
                                                            {isSelf && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">(You)</span>}
                                                        </div>
                                                        <div className="text-[11px] text-[#64748B]">{emp.email || "No email"}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                    emp.role === "ADMIN"
                                                        ? "bg-amber-50 text-amber-800 border-amber-200"
                                                        : "bg-[#EEEDFE] text-[#3C3489] border-indigo-200"
                                                }`}>
                                                    {emp.role}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center w-fit gap-1 border ${
                                                    emp.status === "ACTIVE"
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        : "bg-rose-50 text-rose-700 border-rose-200"
                                                }`}>
                                                    {emp.status === "ACTIVE" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                    {emp.status}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3.5 font-medium text-[#171717]">
                                                {emp._count.workspaces} workspace(s)
                                            </td>

                                            <td className="px-5 py-3.5 font-medium text-[#171717]">
                                                {emp._count.records} record(s)
                                            </td>

                                            <td className="px-5 py-3.5 text-[#64748B]">
                                                {new Date(emp.createdAt).toLocaleDateString()}
                                            </td>

                                            <td className="px-5 py-3.5 text-right space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs border-[#E5E7EB]"
                                                    onClick={() => handleToggleRole(emp)}
                                                    disabled={isPending || (isSelf && emp.role === "ADMIN")}
                                                    title={isSelf ? "Cannot change own role" : "Toggle Role"}
                                                >
                                                    {emp.role === "ADMIN" ? "Demote to Employee" : "Promote to Admin"}
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={`h-7 text-xs ${
                                                        emp.status === "ACTIVE"
                                                            ? "text-rose-600 hover:bg-rose-50"
                                                            : "text-emerald-600 hover:bg-emerald-50"
                                                    }`}
                                                    onClick={() => handleToggleStatus(emp)}
                                                    disabled={isPending || isSelf}
                                                >
                                                    {emp.status === "ACTIVE" ? "Deactivate" : "Activate"}
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
