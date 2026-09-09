"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEmployee } from "@/app/actions/employees";

export function CreateEmployeeDialog() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleCreate = () => {
        if (!name.trim()) {
            setError("Name is required");
            return;
        }
        setError("");
        startTransition(async () => {
            const res = await createEmployee({ name });
            if (res.success) {
                setOpen(false);
                setName("");
            } else {
                setError(res.error || "Failed to create employee");
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button variant="outline" size="sm">Create Employee</Button>} />
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Employee</DialogTitle>
                    <DialogDescription>Add a new employee profile to the system.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Employee Name</Label>
                        <Input
                            placeholder="e.g. Sarah"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                            disabled={isPending}
                        />
                        {error && <p className="text-xs text-red-500">{error}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={isPending}>{isPending ? "Saving..." : "Create Employee"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
