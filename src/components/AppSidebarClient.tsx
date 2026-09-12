"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { setEmployeeCookie, createWorkspace } from "@/app/actions/workspaces";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutDashboard, Briefcase, Plus, Grip, Menu, X } from "lucide-react";

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
    const [isPending, startTransition] = useTransition();

    const [isCreating, setIsCreating] = useState(false);
    const [newWsName, setNewWsName] = useState("");
    const [createError, setCreateError] = useState("");

    // Mobile menu state
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [activeWorkspaceId, isOverview]);

    const switchEmployee = (empId: string) => {
        startTransition(async () => {
            await setEmployeeCookie(empId);
            setIsMobileMenuOpen(false);
            router.push("/overview");
        });
    };

    const handleCreateWorkspace = async () => {
        if (!newWsName.trim()) {
            setCreateError("Name is required");
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

    return (
        <>
            {/* Mobile Hamburger Button */}
            <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden fixed top-2 left-2.5 z-40 flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-md text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
                aria-label="Open Menu"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-gray-900/50 z-40 backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Wrapper */}
            <div className={`
                fixed md:relative inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
                w-72 md:w-64 bg-white md:bg-gray-50/40 border-r border-gray-200 flex flex-col justify-between shrink-0
                ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Close Button Mobile */}
                <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="md:hidden absolute top-3 right-3 flex items-center justify-center w-10 h-10 rounded-md text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 focus:outline-none"
                    aria-label="Close Menu"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col h-full">
                    <div className="h-16 flex items-center px-6 shrink-0 border-b border-transparent">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-7 h-7 bg-gray-900 rounded-md flex items-center justify-center">
                                <Grip className="w-4 h-4 text-white" />
                            </div>
                            <h2 className="font-bold text-lg text-gray-900 tracking-tight">CRM Desk</h2>
                        </Link>
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto space-y-8">
                        {/* Navigation */}
                        <div className="space-y-1">
                            <Link href="/overview" className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isOverview
                                ? 'text-gray-900 bg-gray-200/50'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}>
                                <LayoutDashboard className="w-4 h-4 mr-3 text-gray-500" />
                                Company Overview
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {/* Workspaces */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between px-3 pb-1">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Workspaces</Label>
                                    <button className="text-gray-400 hover:text-gray-900 transition-colors" onClick={() => setIsCreating(true)}>
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                {myWorkspaces.length === 0 ? (
                                    <p className="text-xs text-gray-400 px-3 italic">No workspaces yet.</p>
                                ) : (
                                    <nav className="space-y-1">
                                        {myWorkspaces.map(ws => (
                                            <Link key={ws.id} href={`/workspaces/${ws.id}`} className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeWorkspaceId === ws.id
                                                ? 'text-gray-900 bg-gray-200/50'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                                }`}>
                                                <Briefcase className={`w-4 h-4 mr-3 ${activeWorkspaceId === ws.id ? 'text-gray-900' : 'text-gray-400'}`} />
                                                <span className="truncate">{ws.name}</span>
                                            </Link>
                                        ))}
                                    </nav>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Employee Switcher (Footer) */}
                <div className="p-4 border-t border-gray-200/60 bg-white">
                    <div className="space-y-2">
                        <Label className="text-xs text-gray-500 font-semibold px-1 uppercase tracking-wider">Active Profile</Label>
                        <Select value={currentEmployeeId} onValueChange={(v) => switchEmployee(v || "")} disabled={isPending}>
                            <SelectTrigger className="h-9 text-sm bg-gray-50/50 border-gray-200">
                                <SelectValue placeholder="Select Employee" />
                            </SelectTrigger>
                            <SelectContent>
                                {allEmployees.map(e => (
                                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Create Workspace Dialog */}
                <Dialog open={isCreating} onOpenChange={setIsCreating}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create Workspace</DialogTitle>
                            <DialogDescription>Create a new workspace for your records.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Workspace Name</Label>
                                <Input
                                    placeholder="e.g. Leads, Marketing"
                                    value={newWsName}
                                    onChange={(e) => setNewWsName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreateWorkspace() }}
                                />
                                {createError && <p className="text-xs text-red-500">{createError}</p>}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreating(false)} disabled={isPending}>Cancel</Button>
                            <Button onClick={handleCreateWorkspace} disabled={isPending}>Create Workspace</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
