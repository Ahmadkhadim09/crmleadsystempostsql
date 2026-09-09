"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setEmployeeCookie, createWorkspace } from "@/app/actions/workspaces";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

    const switchEmployee = (empId: string) => {
        startTransition(async () => {
            await setEmployeeCookie(empId);
            // After switching employee, redirect to overview
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
                router.push(`/workspaces/${res.workspaceId}`);
            } else {
                setCreateError(res.error || "Failed to create workspace");
            }
        });
    };

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0">
            <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <Link href="/">
                        <h2 className="font-bold text-xl text-gray-800 tracking-tight">CRM</h2>
                    </Link>
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-6">
                    {/* Navigation */}
                    <div className="space-y-1">
                        <Link href="/overview" className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${isOverview ? 'text-blue-700 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'
                            }`}>
                            Company Overview
                        </Link>
                    </div>

                    {/* Employee Switcher */}
                    <div className="space-y-2">
                        <Label className="text-xs text-gray-500 font-semibold px-1">CURRENT EMPLOYEE (DEV)</Label>
                        <Select value={currentEmployeeId} onValueChange={(v) => switchEmployee(v || "")} disabled={isPending}>
                            <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Select Employee" />
                            </SelectTrigger>
                            <SelectContent>
                                {allEmployees.map(e => (
                                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Workspaces */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <Label className="text-xs text-gray-500 font-semibold">MY WORKSPACES</Label>
                            <button className="text-xs text-blue-600 hover:underline" onClick={() => setIsCreating(true)}>+ New</button>
                        </div>

                        {myWorkspaces.length === 0 ? (
                            <p className="text-xs text-gray-400 px-1 italic">No workspaces yet.</p>
                        ) : (
                            <nav className="space-y-1">
                                {myWorkspaces.map(ws => (
                                    <Link key={ws.id} href={`/workspaces/${ws.id}`} className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeWorkspaceId === ws.id ? 'text-blue-700 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
                                        }`}>
                                        <div className="truncate w-full">{ws.name}</div>
                                    </Link>
                                ))}
                            </nav>
                        )}
                    </div>
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
    );
}
