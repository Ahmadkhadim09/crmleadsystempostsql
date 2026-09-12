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
import { ChevronUp, ChevronDown, Pencil, Trash2, Plus, Database, AlignLeft, List, CheckSquare, Hash, Calendar } from "lucide-react"

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
        if (confirm("Are you sure you want to delete this field data across all records?")) {
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

    const getTypeIcon = (t: string) => {
        switch (t) {
            case "TEXT": return <AlignLeft className="w-3.5 h-3.5 mr-1.5 text-blue-500" />;
            case "EMAIL": return <AlignLeft className="w-3.5 h-3.5 mr-1.5 text-amber-500" />;
            case "DROPDOWN": return <List className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />;
            case "MULTI_SELECT": return <CheckSquare className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />;
            case "NUMBER": return <Hash className="w-3.5 h-3.5 mr-1.5 text-orange-500" />;
            case "DATE": return <Calendar className="w-3.5 h-3.5 mr-1.5 text-rose-500" />;
            default: return <Database className="w-3.5 h-3.5 mr-1.5 text-gray-400" />;
        }
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
            {/* Header Area */}
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Custom Fields</h3>
                    <p className="text-sm text-gray-500 mt-1">Configure the data structure and schema for this workspace.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger render={
                        <Button className="shadow-sm">
                            <Plus className="w-4 h-4 mr-1.5" /> Add New Field
                        </Button>
                    } />
                    <DialogContent className="max-w-md">
                        <DialogHeader className="pb-3 border-b border-gray-100">
                            <DialogTitle className="text-xl font-semibold tracking-tight">{editingFieldId ? "Edit Field Definition" : "Add New Field"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-5 py-4">
                            <div className="space-y-1.5 focus-within:text-gray-900 text-gray-600">
                                <Label htmlFor="name" className="text-sm font-medium">Field Name</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Phone Number, Status..." className="border-gray-200 text-gray-900 placeholder:text-gray-400" />
                            </div>
                            <div className="space-y-1.5 focus-within:text-gray-900 text-gray-600">
                                <Label htmlFor="type" className="text-sm font-medium">Field Type</Label>
                                <Select value={type} onValueChange={(val) => setType(Array.isArray(val) ? val[0] || "TEXT" : val || "TEXT")}>
                                    <SelectTrigger className="border-gray-200 text-gray-900">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TEXT">Text (Single Line)</SelectItem>
                                        <SelectItem value="EMAIL">Email Address</SelectItem>
                                        <SelectItem value="DROPDOWN">Dropdown Menu</SelectItem>
                                        <SelectItem value="MULTI_SELECT">Multi-Select Tags</SelectItem>
                                        <SelectItem value="NUMBER">Number</SelectItem>
                                        <SelectItem value="DATE">Date Picker</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {(type === "DROPDOWN" || type === "MULTI_SELECT") && (
                                <div className="space-y-1.5 focus-within:text-gray-900 text-gray-600 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <Label htmlFor="options" className="text-sm font-medium">Options <span className="text-gray-400 font-normal">(comma separated)</span></Label>
                                    <Input id="options" value={optionsText} onChange={(e) => setOptionsText(e.target.value)} placeholder="e.g. Active, Pending, Closed" className="border-gray-200 text-gray-900 placeholder:text-gray-400" />
                                </div>
                            )}

                            <div className="flex items-center space-x-2.5 pt-2">
                                <Checkbox id="required" checked={required} onCheckedChange={(checked) => setRequired(!!checked)} className="border-gray-300" />
                                <Label htmlFor="required" className="text-gray-700 font-medium cursor-pointer">Require this field</Label>
                            </div>
                        </div>
                        <DialogFooter className="pt-4 border-t border-gray-100">
                            <Button variant="outline" className="border-gray-200 text-gray-700" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
                            <Button onClick={handleSaveField} disabled={isPending} className="shadow-sm">{isPending ? 'Saving...' : 'Save Field'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Fields Table List */}
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50/80 border-b border-gray-200 uppercase tracking-wider text-xs font-semibold text-gray-500">
                        <tr>
                            <th className="px-5 py-3 w-28 text-center shrink-0">Order</th>
                            <th className="px-5 py-3">Field Name</th>
                            <th className="px-5 py-3">Type</th>
                            <th className="px-5 py-3 text-center">Required</th>
                            <th className="px-5 py-3 text-right sticky right-0 bg-gray-50/80 backdrop-blur-sm border-l border-gray-100/50">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {fields.map((field, index) => {
                            let parsedOptions = field.options;
                            if (typeof parsedOptions === 'string') {
                                try { parsedOptions = JSON.parse(parsedOptions); } catch { }
                            }
                            return (
                                <tr key={field.id} className="hover:bg-gray-50/60 transition-colors group">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center justify-center space-x-0.5">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50" disabled={index === 0 || isPending} onClick={() => moveField(index, 'up')} aria-label="Move up">
                                                <ChevronUp className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50" disabled={index === fields.length - 1 || isPending} onClick={() => moveField(index, 'down')} aria-label="Move down">
                                                <ChevronDown className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{field.name}</span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex flex-col items-start justify-center">
                                            <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 border border-gray-200 text-gray-700">
                                                {getTypeIcon(field.type)}
                                                {field.type}
                                            </div>
                                            {(field.type === 'DROPDOWN' || field.type === 'MULTI_SELECT') && parsedOptions && Array.isArray(parsedOptions) && (
                                                <span className="mt-1 text-[11px] font-medium text-gray-400">
                                                    {parsedOptions.length} Option{parsedOptions.length !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold ${field.isRequired ? 'bg-amber-100 text-amber-700 border border-amber-200/50 shrink-0' : 'text-gray-300'}`}>
                                            {field.isRequired ? "*" : "-"}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right sticky right-0 bg-white group-hover:bg-gray-50/50 border-l border-gray-50 space-x-1.5 transition-colors">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-200 bg-transparent hover:bg-white shadow-none transition-all" aria-label="Edit field" title="Edit Field" onClick={() => handleOpenDialog(field)} disabled={isPending}>
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" aria-label="Delete field" title="Delete Field" onClick={() => handleDelete(field.id)} disabled={isPending}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                        {fields.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center m-auto">
                                        <div className="w-14 h-14 bg-gray-50 rounded-full border border-gray-100 flex items-center justify-center mb-4">
                                            <Database className="w-6 h-6 text-gray-300" />
                                        </div>
                                        <h3 className="text-base font-semibold text-gray-900 mb-1">No custom fields created</h3>
                                        <p className="text-sm text-gray-500 max-w-sm">Setup your workspace structure by adding the fields that determine what information is stored.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
