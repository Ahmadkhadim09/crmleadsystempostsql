"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { renameWorkspace, deleteWorkspace } from "@/app/actions/workspaces";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

export function WorkspaceSettingsActions({ workspaceId, initialName }: { workspaceId: string, initialName: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isRenaming, setIsRenaming] = useState(false);
    const [name, setName] = useState(initialName);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");

    const handleRename = () => {
        setError("");
        startTransition(async () => {
            const res = await renameWorkspace(workspaceId, name);
            if (res.success) {
                setIsRenaming(false);
            } else {
                setError(res.error || "Failed to rename workspace");
            }
        });
    };

    const handleDelete = () => {
        setError("");
        startTransition(async () => {
            const res = await deleteWorkspace(workspaceId);
            if (res.success) {
                router.push("/overview");
            } else {
                setError(res.error || "Failed to delete workspace");
            }
        });
    };

    return (
        <div className="space-y-8 mb-8 pb-8 border-b border-gray-200">
            {/* Rename Section */}
            <div>
                <h2 className="text-lg font-medium text-gray-900 mb-1">General Settings</h2>
                <p className="text-sm text-gray-500 mb-4">Manage your workspace identity.</p>
                <div className="flex items-center space-x-4 max-w-sm">
                    {isRenaming ? (
                        <>
                            <Input value={name} onChange={e => setName(e.target.value)} disabled={isPending} />
                            <Button onClick={handleRename} disabled={isPending || !name.trim()}>Save</Button>
                            <Button variant="ghost" onClick={() => setIsRenaming(false)} disabled={isPending}>Cancel</Button>
                        </>
                    ) : (
                        <>
                            <div className="flex-1 text-sm font-medium p-2 border rounded-md bg-gray-50">{name}</div>
                            <Button variant="outline" onClick={() => setIsRenaming(true)}>Rename</Button>
                        </>
                    )}
                </div>
            </div>

            {/* Danger Zone */}
            <div>
                <h2 className="text-lg font-medium text-red-600 mb-1">Danger Zone</h2>
                <p className="text-sm text-gray-500 mb-4">Permanently delete this workspace and all its data.</p>
                <Button variant="destructive" onClick={() => setIsDeleting(true)}>Delete Workspace</Button>
            </div>

            <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete this workspace?</DialogTitle>
                        <DialogDescription>
                            Are you absolutely sure? This action cannot be undone. This will permanently delete the workspace <strong>{initialName}</strong> and purge all associated records, custom fields, and logs.
                        </DialogDescription>
                    </DialogHeader>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleting(false)} disabled={isPending}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isPending}>Yes, Delete Workspace</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
