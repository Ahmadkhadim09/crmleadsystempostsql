"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createWorkspace } from "@/app/actions/workspaces";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LayoutDashboard, Briefcase, Plus, Grip, Menu, X, ShieldCheck, Users, LogOut } from "lucide-react";

export function AppSidebarClient({
    allEmployees,
    myWorkspaces,
    currentEmployeeId,
    activeWorkspaceId,
    isOverview
}: {
    allEmployees: any[];
    myWorkspaces: any[];
    currentEmployeeId: string;
    activeWorkspaceId?: string;
    isOverview?: boolean;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const [isCreating, setIsCreating] = useState(false);
    const [newWsName, setNewWsName] = useState("");
    const [createError, setCreateError] = useState("");

    // Mobile menu state
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const activeUser = allEmployees.find(e => e.id === currentEmployeeId);
    const currentRole = activeUser?.role || "EMPLOYEE";

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname, activeWorkspaceId, isOverview]);

    const handleCreateWorkspace = async () => {
        if (!newWsName.trim()) {
            setCreateError("Workspace name is required");
            return;
        }
        setCreateError("");
        startTransition(async () => {
            const res = await createWorkspace({ name: newWsName });
            if (res.success) {
                setIsCreating(false);
                setNewWsName("");
                setIsMobileMenuOpen(false);
                router.push(`/workspaces/${res.workspaceId}`);
            } else {
                setCreateError(res.error || "Failed to create workspace");
            }
        });
    };

    const isAdminOverview = pathname === "/admin";
    const isAdminEmployees = pathname === "/admin/employees";
    const isAdminWorkspaces = pathname === "/admin/workspaces";

    return (
        <>
            {/* Mobile Hamburger Button */}
            <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden fixed top-3 left-3 z-40 flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#534AB7]"
                aria-label="Open Mobile Menu"
            >
                <Menu className="w-5 h-5 text-slate-700" />
            </button>

            {/* Mobile Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Wrapper */}
            <aside className={`
                fixed md:relative inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
                w-72 md:w-64 bg-[#26215C] border-r border-indigo-950/60 flex flex-col justify-between shrink-0 text-slate-100 select-none
                ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Close Button Mobile */}
                <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="md:hidden absolute top-3.5 right-3.5 flex items-center justify-center w-8 h-8 rounded-lg text-indigo-200 hover:text-white bg-indigo-900/60 hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    aria-label="Close Menu"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex flex-col h-full">
                    {/* Brand Header */}
                    <div className="h-16 flex items-center px-5 shrink-0 border-b border-indigo-950/70 bg-[#211B52]">
                        <Link href="/overview" className="flex items-center space-x-3 group focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-lg p-1">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#534AB7] to-[#7F77DD] rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                                <Grip className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold text-base text-white tracking-tight leading-none">CRM System</h2>
                                <span className="text-[10px] text-indigo-300/70 font-medium">Enterprise Edition</span>
                            </div>
                        </Link>
                    </div>

                    <div className="p-3.5 flex-1 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-indigo-900">
                        {/* Core Navigation */}
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest px-3 pb-1 block">Main Menu</Label>
                            <Link
                                href="/overview"
                                className={`flex items-center px-3 py-2 text-xs font-semibold rounded-lg transition-all ${isOverview
                                    ? 'text-[#26215C] bg-[#EEEDFE] shadow-sm font-bold'
                                    : 'text-indigo-200/80 hover:bg-[#7F77DD]/20 hover:text-white'
                                    }`}
                                aria-current={isOverview ? "page" : undefined}
                            >
                                <LayoutDashboard className={`w-4 h-4 mr-2.5 ${isOverview ? 'text-[#534AB7]' : 'text-indigo-300/70'}`} />
                                Company Overview
                            </Link>
                        </div>

                        {/* Admin Console Navigation */}
                        {currentRole === "ADMIN" && (
                            <div className="space-y-1 pt-3 border-t border-indigo-950/60">
                                <div className="flex items-center justify-between px-3 pb-1">
                                    <Label className="text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest block">Admin Console</Label>
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">ADMIN</span>
                                </div>

                                <Link
                                    href="/admin"
                                    className={`flex items-center px-3 py-2 text-xs font-semibold rounded-lg transition-all ${isAdminOverview
                                        ? 'text-[#26215C] bg-[#EEEDFE] shadow-sm font-bold'
                                        : 'text-indigo-200/80 hover:bg-[#7F77DD]/20 hover:text-white'
                                        }`}
                                    aria-current={isAdminOverview ? "page" : undefined}
                                >
                                    <ShieldCheck className={`w-4 h-4 mr-2.5 ${isAdminOverview ? 'text-[#534AB7]' : 'text-amber-400'}`} />
                                    Admin Dashboard
                                </Link>

                                <Link
                                    href="/admin/employees"
                                    className={`flex items-center px-3 py-2 text-xs font-semibold rounded-lg transition-all ${isAdminEmployees
                                        ? 'text-[#26215C] bg-[#EEEDFE] shadow-sm font-bold'
                                        : 'text-indigo-200/80 hover:bg-[#7F77DD]/20 hover:text-white'
                                        }`}
                                    aria-current={isAdminEmployees ? "page" : undefined}
                                >
                                    <Users className={`w-4 h-4 mr-2.5 ${isAdminEmployees ? 'text-[#534AB7]' : 'text-indigo-300/70'}`} />
                                    Employee Directory
                                </Link>

                                <Link
                                    href="/admin/workspaces"
                                    className={`flex items-center px-3 py-2 text-xs font-semibold rounded-lg transition-all ${isAdminWorkspaces
                                        ? 'text-[#26215C] bg-[#EEEDFE] shadow-sm font-bold'
                                        : 'text-indigo-200/80 hover:bg-[#7F77DD]/20 hover:text-white'
                                        }`}
                                    aria-current={isAdminWorkspaces ? "page" : undefined}
                                >
                                    <Briefcase className={`w-4 h-4 mr-2.5 ${isAdminWorkspaces ? 'text-[#534AB7]' : 'text-indigo-300/70'}`} />
                                    Workspace Catalog
                                </Link>
                            </div>
                        )}

                        {/* Workspaces Section */}
                        <div className="space-y-1 pt-3 border-t border-indigo-950/60">
                            <div className="flex items-center justify-between px-3 pb-1">
                                <Label className="text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest block">My Workspaces</Label>
                                <button
                                    className="p-1 rounded text-indigo-300/70 hover:text-white hover:bg-indigo-800/50 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                    onClick={() => setIsCreating(true)}
                                    title="Create Workspace"
                                    aria-label="Create Workspace"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {myWorkspaces.length === 0 ? (
                                <p className="text-xs text-indigo-300/50 px-3 py-2 italic">No workspaces created yet.</p>
                            ) : (
                                <nav className="space-y-1">
                                    {myWorkspaces.map(ws => {
                                        const isActive = activeWorkspaceId === ws.id;
                                        return (
                                            <Link
                                                key={ws.id}
                                                href={`/workspaces/${ws.id}`}
                                                className={`flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all ${isActive
                                                    ? 'text-[#26215C] bg-[#EEEDFE] shadow-sm font-bold'
                                                    : 'text-indigo-200/80 hover:bg-[#7F77DD]/20 hover:text-white'
                                                    }`}
                                                aria-current={isActive ? "page" : undefined}
                                            >
                                                <div className="flex items-center min-w-0 pr-2">
                                                    <Briefcase className={`w-3.5 h-3.5 mr-2.5 shrink-0 ${isActive ? 'text-[#534AB7]' : 'text-indigo-300/70'}`} />
                                                    <span className="truncate">{ws.name}</span>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </nav>
                            )}
                        </div>
                    </div>
                </div>

                {/* User Profile & Sign Out Footer */}
                <div className="p-3.5 border-t border-indigo-950/70 bg-[#1E194B]">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-full bg-[#534AB7] text-white flex items-center justify-center text-xs font-bold shrink-0 ring-2 ring-indigo-400/20">
                                {(activeUser?.name || "E").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-white truncate leading-tight">
                                    {activeUser?.name || "Employee"}
                                </p>
                                <span className="inline-block text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-[#EEEDFE] text-[#26215C] mt-0.5">
                                    {currentRole}
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-indigo-200 hover:text-rose-200 hover:bg-rose-500/20 px-2.5 transition-colors"
                            onClick={async () => {
                                const { logoutUser } = await import("@/app/actions/auth");
                                await logoutUser();
                            }}
                            title="Sign Out"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Create Workspace Dialog */}
                <Dialog open={isCreating} onOpenChange={setIsCreating}>
                    <DialogContent className="max-w-md bg-white rounded-xl shadow-xl border border-slate-200">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-slate-900">Create New Workspace</DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                Create a dedicated workspace to organize custom CRM records and fields.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Workspace Title</Label>
                                <Input
                                    placeholder="e.g. Sales Pipeline, Key Accounts"
                                    value={newWsName}
                                    onChange={(e) => setNewWsName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreateWorkspace() }}
                                    className="text-sm bg-slate-50 border-slate-200 focus:border-[#534AB7]"
                                />
                                {createError && <p className="text-xs text-rose-600 font-medium">{createError}</p>}
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" onClick={() => setIsCreating(false)} disabled={isPending} className="text-xs">
                                Cancel
                            </Button>
                            <Button onClick={handleCreateWorkspace} disabled={isPending} className="text-xs bg-[#534AB7] hover:bg-[#7F77DD] text-white">
                                {isPending ? "Creating..." : "Create Workspace"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </aside>
        </>
    );
}
