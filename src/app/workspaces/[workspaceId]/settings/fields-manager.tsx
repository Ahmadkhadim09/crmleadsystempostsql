"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createFieldDefinition, updateFieldDefinition, deleteFieldDefinition, reorderFieldDefinitions } from "@/app/actions/fields"
import { useRouter } from "next/navigation"

export function FieldsManager({ workspaceId, initialFields }: { workspaceId: string, initialFields: any[] }) {
    const router = useRouter();
    const [fields, setFields] = useState(initialFields);
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

    // new/edit field state
    const [name, setName] = useState("");
    const [type, setType] = useState("TEXT");
    const [required, setRequired] = useState(false);
    const [optionsText, setOptionsText] = useState("");

    const handleOpenDialog = (field?: any) => {
        if (field) {
            setEditingFieldId(field.id);
            setName(field.name);
            setType(field.type);
            setRequired(field.isRequired);

            let parsedOptions = field.options;
            if (typeof parsedOptions === 'string') {
                try { parsedOptions = JSON.parse(parsedOptions); } catch { }
            }
            if (Array.isArray(parsedOptions)) {
                setOptionsText(parsedOptions.join(", "));
            } else {
                setOptionsText("");
            }
        } else {
            setEditingFieldId(null);
            setName("");
            setType("TEXT");
            setRequired(false);
            setOptionsText("");
        }
        setOpen(true);
    };

    const handleSaveField = () => {
        if (!name) return;

        let options = null;
        if (type === "DROPDOWN" || type === "MULTI_SELECT") {
            options = optionsText.split(",").map(s => s.trim()).filter(Boolean);
        }

        startTransition(async () => {
            if (editingFieldId) {
                const res = await updateFieldDefinition({
                    id: editingFieldId,
                    workspaceId,
                    name,
                    type,
                    isRequired: required,
                    options,
                    order: fields.find(f => f.id === editingFieldId)?.order || 0
                });
                if (res.success) {
                    setFields(fields.map(f => f.id === editingFieldId ? { ...f, name, type, isRequired: required, options } : f));
                    setOpen(false);
                } else {
                    alert(res.error);
                }
            } else {
                const res = await createFieldDefinition({
                    workspaceId,
                    name,
                    type,
                    isRequired: required,
                    options,
                    order: fields.length
                });
                if (res.success && res.data) {
                    setFields([...fields, res.data]);
                    setOpen(false);
                } else {
                    alert(res.error);
                }
            }
        });
    };

    const handleDelete = (fieldId: string) => {
        if (confirm("Are you sure?")) {
            startTransition(async () => {
                const res = await deleteFieldDefinition(fieldId, workspaceId);
                if (res.success) {
                    setFields(fields.filter(f => f.id !== fieldId));
                } else {
                    alert(res.error);
                }
            });
        }
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        const newFields = [...fields];
        if (direction === 'up' && index > 0) {
            [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
        } else if (direction === 'down' && index < newFields.length - 1) {
            [newFields[index + 1], newFields[index]] = [newFields[index], newFields[index + 1]];
        } else {
            return;
        }

        // update client state immediately
        const reorderedFields = newFields.map((f, i) => ({ ...f, order: i }));
        setFields(reorderedFields);

        startTransition(async () => {
            await reorderFieldDefinitions({
                workspaceId,
                fields: reorderedFields.map(f => ({ id: f.id, order: f.order }))
            });
        });
    };

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-3 font-medium text-gray-900 w-24">Order</th>
                        <th className="px-6 py-3 font-medium text-gray-900">Field Name</th>
                        <th className="px-6 py-3 font-medium text-gray-900">Type</th>
                        <th className="px-6 py-3 font-medium text-gray-900">Required</th>
                        <th className="px-6 py-3 font-medium text-gray-900 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {fields.map((field, index) => {
                        let parsedOptions = field.options;
                        if (typeof parsedOptions === 'string') {
                            try { parsedOptions = JSON.parse(parsedOptions); } catch { }
                        }
                        return (
                            <tr key={field.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex space-x-1">
                                        <button onClick={() => moveField(index, 'up')} disabled={index === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">↑</button>
                                        <button onClick={() => moveField(index, 'down')} disabled={index === fields.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">↓</button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {field.name}
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {field.type}
                                    {(field.type === 'DROPDOWN' || field.type === 'MULTI_SELECT') && parsedOptions && Array.isArray(parsedOptions) && (
                                        <span className="block text-xs text-gray-400 mt-1">Options: {parsedOptions.length}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-gray-500">{field.isRequired ? "Yes" : "No"}</td>
                                <td className="px-6 py-4 text-right">
                                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 mr-2" onClick={() => handleOpenDialog(field)}>Edit</Button>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(field.id)}>Delete</Button>
                                </td>
                            </tr>
                        );
                    })}
                    {fields.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                <p className="mb-2">No custom fields yet.</p>
                                <p className="text-sm">Add fields to define the information you want to collect.</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-center">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger render={
                        <Button variant="outline" className="w-full max-w-sm" onClick={() => handleOpenDialog()}>
                            + Add New Field
                        </Button>
                    } />
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingFieldId ? "Edit Field" : "Add New Field"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Field Name</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Phone Number" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Field Type</Label>
                                <Select value={type} onValueChange={(val) => setType(Array.isArray(val) ? val[0] || "TEXT" : val || "TEXT")}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TEXT">Text</SelectItem>
                                        <SelectItem value="EMAIL">Email</SelectItem>
                                        <SelectItem value="DROPDOWN">Dropdown</SelectItem>
                                        <SelectItem value="MULTI_SELECT">Multi-Select</SelectItem>
                                        <SelectItem value="NUMBER">Number</SelectItem>
                                        <SelectItem value="DATE">Date</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {(type === "DROPDOWN" || type === "MULTI_SELECT") && (
                                <div className="space-y-2 animate-in fade-in">
                                    <Label htmlFor="options">Options (comma separated)</Label>
                                    <Input id="options" value={optionsText} onChange={(e) => setOptionsText(e.target.value)} placeholder="Option 1, Option 2, Option 3" />
                                </div>
                            )}

                            <div className="flex items-center space-x-2">
                                <Checkbox id="required" checked={required} onCheckedChange={(checked) => setRequired(!!checked)} />
                                <Label htmlFor="required">Require this field</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
                            <Button onClick={handleSaveField} disabled={isPending}>{isPending ? 'Saving...' : 'Save Field'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
