"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { createWorkspace } from "@/app/actions/workspaces";
import { User, Briefcase, Plus, ChevronDown, ChevronUp, Folder } from "lucide-react";

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
        startTransition(() => {
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
            const res = await createWorkspace({ name: newWsName });
            if (res.success && res.workspaceId) {
                setCreatingForEmpId(null);
                setNewWsName("");
                router.push(`/workspaces/${res.workspaceId}`);
            } else {
                setCreateError(res.error || "Failed to create workspace");
            }
        });
    };

    const handleEmployeeClick = (emp: Employee) => {
        if (emp.workspaces.length === 0) {
            setCreatingForEmpId(emp.id);
        } else if (emp.workspaces.length === 1) {
            handleOpenWorkspace(emp.id, emp.workspaces[0].id);
        } else {
            setExpandedEmpId(expandedEmpId === emp.id ? null : emp.id);
        }
    };

    return (
        <div className="grid gap-4">
            {employees.length === 0 ? (
                <div className="text-center py-16 border border-gray-200 rounded-xl bg-gray-50/50 flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 border border-gray-200">
                        <User className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-900 font-medium">No employees found.</p>
                    <p className="text-sm text-gray-500 mt-1">Create an employee profile to get started.</p>
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
                                    <div className="h-12 w-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 font-semibold text-lg shrink-0">
                                        {emp.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-base">{emp.name}</h3>
                                        <div className="flex items-center text-sm text-gray-500 mt-0.5">
                                            {hasWorkspaces ? (
                                                <div className="flex items-center">
                                                    <Briefcase className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                                                    {hasMultiple ? `${emp.workspaces.length} Workspaces` : emp.workspaces[0].name}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">No workspace yet</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                    {hasWorkspaces ? (
                                        hasMultiple ? (
                                            <Button variant="outline" size="sm" className="text-gray-600 border-gray-200" onClick={() => setExpandedEmpId(isExpanded ? null : emp.id)}>
                                                {isExpanded ? (
                                                    <><ChevronUp className="w-4 h-4 mr-1.5" /> Close</>
                                                ) : (
                                                    <><Folder className="w-4 h-4 mr-1.5" /> View All</>
                                                )}
                                            </Button>
                                        ) : (
                                            <Button variant="secondary" size="sm" className="bg-gray-100 hover:bg-gray-200 text-gray-900" disabled={isPending} onClick={() => handleOpenWorkspace(emp.id, emp.workspaces[0].id)}>
                                                Open Workspace
                                            </Button>
                                        )
                                    ) : (
                                        <Button size="sm" onClick={() => setCreatingForEmpId(emp.id)}>
                                            <Plus className="w-4 h-4 mr-1.5" /> Create Workspace
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Render multiple workspaces dropdown */}
                            {isExpanded && hasMultiple && (
                                <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-3">
                                    <div className="flex items-center justify-between px-2">
                                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Workspaces</h4>
                                        <Button variant="ghost" size="sm" className="h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-200/50" onClick={() => setCreatingForEmpId(emp.id)}>
                                            <Plus className="w-3.5 h-3.5 mr-1" /> New Workspace
                                        </Button>
                                    </div>
                                    <div className="grid gap-2">
                                        {emp.workspaces.map(ws => (
                                            <div key={ws.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                                                <div className="flex items-center space-x-2">
                                                    <Briefcase className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium text-sm text-gray-900">{ws.name}</span>
                                                </div>
                                                <Button size="sm" variant="secondary" className="h-8 bg-gray-100 hover:bg-gray-200 text-gray-900" disabled={isPending} onClick={() => handleOpenWorkspace(emp.id, ws.id)}>
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
