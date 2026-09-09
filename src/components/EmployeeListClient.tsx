"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { createWorkspace, setEmployeeCookie } from "@/app/actions/workspaces";

type Workspace = {
    id: string;
    name: string;
};

type Employee = {
    id: string;
    name: string;
    workspaces: Workspace[];
};

export function EmployeeListClient({ employees }: { employees: Employee[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [creatingForEmpId, setCreatingForEmpId] = useState<string | null>(null);
    const [newWsName, setNewWsName] = useState("");
    const [createError, setCreateError] = useState("");

    const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);

    const handleOpenWorkspace = (empId: string, wsId: string) => {
        startTransition(async () => {
            await setEmployeeCookie(empId);
            router.push(`/workspaces/${wsId}`);
        });
    };

    const handleCreateWorkspace = async (empId: string) => {
        if (!newWsName.trim()) {
            setCreateError("Name is required");
            return;
        }
        setCreateError("");
        startTransition(async () => {
            const res = await createWorkspace({ name: newWsName, employeeId: empId });
            if (res.success && res.workspaceId) {
                setCreatingForEmpId(null);
                setNewWsName("");
                await setEmployeeCookie(empId);
                router.push(`/workspaces/${res.workspaceId}`);
            } else {
                setCreateError(res.error || "Failed to create workspace");
            }
        });
    };

    const handleEmployeeClick = (emp: Employee) => {
        // If clicking on an employee card without doing anything specific
        if (emp.workspaces.length === 0) {
            setCreatingForEmpId(emp.id);
        } else if (emp.workspaces.length === 1) {
            handleOpenWorkspace(emp.id, emp.workspaces[0].id);
        } else {
            // Expand multiple workspaces
            setExpandedEmpId(expandedEmpId === emp.id ? null : emp.id);
        }
    };

    return (
        <div className="grid gap-4">
            {employees.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <p className="text-sm text-gray-500 font-medium">No employees found.</p>
                    <p className="text-xs text-gray-400 mt-1">Create an employee to get started.</p>
                </div>
            ) : (
                employees.map((emp) => {
                    const isExpanded = expandedEmpId === emp.id;
                    const hasWorkspaces = emp.workspaces.length > 0;
                    const hasMultiple = emp.workspaces.length > 1;

                    return (
                        <div key={emp.id} className="flex flex-col border border-gray-200 rounded-xl bg-white shadow-sm hover:border-gray-300 hover:shadow-md transition-all overflow-hidden group">
                            <div
                                className="flex items-center justify-between p-5 cursor-pointer"
                                onClick={() => handleEmployeeClick(emp)}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="h-12 w-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-semibold text-lg shrink-0">
                                        {emp.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-700 transition-colors">{emp.name}</h3>
                                        <p className="text-sm text-gray-500">
                                            {hasWorkspaces
                                                ? hasMultiple ? `${emp.workspaces.length} Workspaces` : emp.workspaces[0].name
                                                : "No workspace yet"}
                                        </p>
                                    </div>
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                    {hasWorkspaces ? (
                                        hasMultiple ? (
                                            <Button variant="outline" size="sm" onClick={() => setExpandedEmpId(isExpanded ? null : emp.id)}>
                                                {isExpanded ? "Close" : "View Workspaces"}
                                            </Button>
                                        ) : (
                                            <Button variant="secondary" size="sm" disabled={isPending} onClick={() => handleOpenWorkspace(emp.id, emp.workspaces[0].id)}>
                                                Open Workspace
                                            </Button>
                                        )
                                    ) : (
                                        <Button size="sm" onClick={() => setCreatingForEmpId(emp.id)}>
                                            + Create Workspace
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Render multiple workspaces dropdown essentially */}
                            {isExpanded && hasMultiple && (
                                <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-3">
                                    <div className="flex items-center justify-between px-2">
                                        <h4 className="text-sm font-semibold text-gray-700">Workspaces</h4>
                                        <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => setCreatingForEmpId(emp.id)}>
                                            + Create Workspace
                                        </Button>
                                    </div>
                                    <div className="grid gap-2">
                                        {emp.workspaces.map(ws => (
                                            <div key={ws.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                                                <span className="font-medium text-sm text-gray-900">{ws.name}</span>
                                                <Button size="sm" variant="secondary" className="h-8" disabled={isPending} onClick={() => handleOpenWorkspace(emp.id, ws.id)}>
                                                    Open
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })
            )}

            <Dialog open={!!creatingForEmpId} onOpenChange={(open) => !open && setCreatingForEmpId(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Workspace</DialogTitle>
                        <DialogDescription>
                            Create a new workspace for {creatingForEmpId ? employees.find(e => e.id === creatingForEmpId)?.name : 'this employee'}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Workspace Name</Label>
                            <Input
                                placeholder="e.g. Sales, Marketing"
                                value={newWsName}
                                onChange={(e) => setNewWsName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateWorkspace(creatingForEmpId!) }}
                                disabled={isPending}
                            />
                            {createError && <p className="text-xs text-red-500">{createError}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreatingForEmpId(null)} disabled={isPending}>Cancel</Button>
                        <Button onClick={() => handleCreateWorkspace(creatingForEmpId!)} disabled={isPending}>
                            {isPending ? "Creating..." : "Create Workspace"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
