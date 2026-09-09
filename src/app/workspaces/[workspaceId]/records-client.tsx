"use client";

import { useState, useTransition, FormEvent } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createRecord, updateRecord, deleteRecord } from "@/app/actions/records";
import { ParsedFilter, FilterOperator } from "@/lib/record-utils";

interface RecordsClientProps {
    workspaceId: string;
    workspaceName: string;
    fields: any[];
    records: any[];
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    globalSearch: string;
    parsedFilters: ParsedFilter[];
    sortField: string | null;
    sortDirection: "asc" | "desc";
}

export function RecordsClient({
    workspaceId, workspaceName, fields, records,
    totalRecords, currentPage, totalPages, globalSearch,
    parsedFilters, sortField, sortDirection
}: RecordsClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Dialog state for Save/Edit
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Duplicate Dialog warning state
    const [dupWarningOpen, setDupWarningOpen] = useState(false);
    const [dupDetails, setDupDetails] = useState<{ field: string, value: string } | null>(null);

    // Filters dialog/popover state
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterDraft, setFilterDraft] = useState<{ fieldName: string, operator: FilterOperator, value: string }>({ fieldName: "", operator: "contains", value: "" });

    // Local Search State
    const [searchInput, setSearchInput] = useState(globalSearch);

    // Search trigger
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (searchInput.trim()) {
            params.set("search", searchInput.trim());
        } else {
            params.delete("search");
        }
        params.set("page", "1");
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const applySorting = (field: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (sortField === field) {
            params.set("sort", `${field}:${sortDirection === "asc" ? "desc" : "asc"}`);
        } else {
            params.set("sort", `${field}:asc`);
        }
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const addFilter = () => {
        if (!filterDraft.fieldName || (!filterDraft.value && filterDraft.operator !== 'checked' && filterDraft.operator !== 'unchecked')) return;
        const params = new URLSearchParams(searchParams.toString());
        const key = `f_${filterDraft.fieldName}`;
        const val = filterDraft.operator === 'checked' || filterDraft.operator === 'unchecked' ? filterDraft.operator : `${filterDraft.operator}:${filterDraft.value}`;
        params.append(key, val);
        params.set("page", "1");
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
            setIsFilterOpen(false);
            setFilterDraft({ fieldName: "", operator: "contains", value: "" });
        });
    };

    const removeFilter = (filter: ParsedFilter) => {
        const params = new URLSearchParams(searchParams.toString());
        const key = `f_${filter.fieldName}`;
        // next.js URLSearchParams append/delete handling is tricky. easiest is clearing the key and appending the remaining.
        const allVals = params.getAll(key);
        params.delete(key);

        allVals.forEach(v => {
            const isMatch = (filter.operator === 'checked' || filter.operator === 'unchecked')
                ? v === filter.operator
                : v === `${filter.operator}:${filter.value}`;
            if (!isMatch) {
                params.append(key, v);
            }
        });

        params.set("page", "1");
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const clearFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        Array.from(params.keys()).forEach(k => {
            if (k.startsWith("f_")) params.delete(k);
        });
        params.set("page", "1");
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    }

    const setPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const handleOpenDialog = (record?: any) => {
        setFormErrors({});
        setDupWarningOpen(false);
        if (record) {
            setEditingRecordId(record.id);
            setFormData(record.data || {});
        } else {
            setEditingRecordId(null);
            setFormData({});
        }
        setIsDialogOpen(true);
    };

    const handleActionSave = async (ignoreDuplicates: boolean = false) => {
        startTransition(async () => {
            const payload = {
                workspaceId,
                data: formData,
                ignoreDuplicates
            };

            let res;
            if (editingRecordId) {
                res = await updateRecord({ ...payload, id: editingRecordId });
            } else {
                res = await createRecord(payload);
            }

            if (res.success) {
                setIsDialogOpen(false);
                setDupWarningOpen(false);
            } else if (res.isDuplicate) {
                setDupDetails({ field: res.duplicateField, value: res.duplicateValue });
                setDupWarningOpen(true);
            } else {
                if (res.validationErrors) {
                    setFormErrors(res.validationErrors);
                } else {
                    alert(res.error);
                }
            }
        });
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this record?")) {
            startTransition(async () => {
                const res = await deleteRecord(id, workspaceId);
                if (!res.success) {
                    alert(res.error);
                }
            });
        }
    };

    const handleFieldChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const renderFieldInput = (field: any) => {
        const val = formData[field.name];
        let parsedOptions = field.options;
        if (typeof parsedOptions === 'string') {
            try { parsedOptions = JSON.parse(parsedOptions); } catch { }
        }

        switch (field.type) {
            case "LONG_TEXT":
                return (
                    <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={val || ""}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    />
                );
            case "NUMBER":
                return <Input type="number" value={val || ""} onChange={(e) => handleFieldChange(field.name, e.target.value)} />;
            case "EMAIL":
                return <Input type="email" value={val || ""} onChange={(e) => handleFieldChange(field.name, e.target.value)} />;
            case "DATE":
                return <Input type="date" value={val || ""} onChange={(e) => handleFieldChange(field.name, e.target.value)} />;
            case "PHONE":
            case "URL":
                return <Input type={field.type === "URL" ? "url" : "tel"} value={val || ""} onChange={(e) => handleFieldChange(field.name, e.target.value)} />;
            case "CHECKBOX":
                return (
                    <div className="pt-2 h-10 flex items-center">
                        <Checkbox checked={!!val} onCheckedChange={(checked) => handleFieldChange(field.name, !!checked)} />
                    </div>
                );
            case "DROPDOWN":
                return (
                    <Select value={val || ""} onValueChange={(v) => handleFieldChange(field.name, v)}>
                        <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
                        <SelectContent>
                            {Array.isArray(parsedOptions) && parsedOptions.map((opt: string) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case "MULTI_SELECT":
                return (
                    <div className="space-y-2 pt-1 max-h-[120px] overflow-y-auto border p-2 rounded text-sm">
                        {Array.isArray(parsedOptions) && parsedOptions.map((opt: string) => {
                            const isChecked = Array.isArray(val) ? val.includes(opt) : false;
                            return (
                                <div key={opt} className="flex items-center space-x-2">
                                    <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                            const currentArr = Array.isArray(val) ? val : [];
                                            if (checked) {
                                                handleFieldChange(field.name, [...currentArr, opt]);
                                            } else {
                                                handleFieldChange(field.name, currentArr.filter(i => i !== opt));
                                            }
                                        }}
                                    />
                                    <Label className="font-normal">{opt}</Label>
                                </div>
                            )
                        })}
                    </div>
                );
            case "TEXT":
            default:
                return <Input value={val || ""} onChange={(e) => handleFieldChange(field.name, e.target.value)} />;
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden h-full">
            <header className="bg-white border-b border-gray-200 h-16 flex-none flex items-center justify-between px-6 z-10 shrink-0">
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-semibold text-gray-800">{workspaceName}</h1>
                    <form onSubmit={handleSearch} className="flex space-x-2">
                        <Input
                            type="text"
                            placeholder="Global Search..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-64 bg-gray-50 focus:bg-white"
                        />
                        <Button type="submit" variant="secondary" disabled={isPending}>Search</Button>
                    </form>
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline" onClick={() => setIsFilterOpen(true)}>
                        Filters {parsedFilters.length > 0 && `(${parsedFilters.length})`}
                    </Button>
                    <Link href={`/workspaces/${workspaceId}/settings`}>
                        <Button variant="outline">Manage Columns</Button>
                    </Link>
                    <Button onClick={() => handleOpenDialog()}>+ New Record</Button>
                </div>
            </header>

            {/* Active Filters Display */}
            {parsedFilters.length > 0 && (
                <div className="bg-gray-50 border-b px-6 py-2 flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-semibold text-gray-500 mr-2">ACTIVE FILTERS:</span>
                    {parsedFilters.map((pf, i) => (
                        <div key={i} className="flex items-center bg-white border rounded-full px-3 py-1 text-xs">
                            <span className="font-medium mr-1">{pf.fieldName}</span>
                            <span className="text-gray-500 mr-1">{pf.operator}</span>
                            <span className="font-medium mr-2">{pf.value}</span>
                            <button onClick={() => removeFilter(pf)} className="text-gray-400 hover:text-red-500 transition-colors">✕</button>
                        </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7 text-gray-500">Clear all</Button>
                </div>
            )}

            <main className="flex-1 overflow-auto bg-gray-50 flex flex-col relative w-full min-h-0">
                {records.length === 0 ? (
                    <div className="m-auto mt-20 text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                            <span className="text-2xl">📋</span>
                        </div>
                        <h2 className="text-xl font-medium text-gray-900">
                            {globalSearch || parsedFilters.length > 0 ? "No records match your search or filters." : "No records yet."}
                        </h2>
                        {(!globalSearch && parsedFilters.length === 0) && (
                            <>
                                <p className="text-sm text-gray-500">Create your first record to get started.</p>
                                <div className="pt-4 flex justify-center">
                                    <Button onClick={() => handleOpenDialog()}>Add First Record</Button>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="p-4 flex-1 flex flex-col min-h-0 w-full overflow-hidden">
                        <div className="border border-gray-200 rounded-xl bg-white shadow-sm flex flex-col flex-1 min-h-0">
                            <div className="overflow-auto flex-1">
                                <table className="min-w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-gray-50/80 border-b border-gray-200 sticky top-0 backdrop-blur-sm z-10">
                                        <tr>
                                            {fields.map(f => (
                                                <th key={f.id} className="px-6 py-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none transition-colors" onClick={() => applySorting(f.name)}>
                                                    <div className="flex items-center space-x-1">
                                                        <span>{f.name} {f.isRequired && <span className="text-red-500">*</span>}</span>
                                                        {sortField === f.name && (
                                                            <span className="text-gray-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                        )}
                                                    </div>
                                                </th>
                                            ))}
                                            <th className="px-6 py-3 font-semibold text-gray-700 sticky right-0 bg-gray-50/80 backdrop-blur-sm text-right border-l border-gray-100">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {records.map(record => {
                                            const rData = record.data as Record<string, any>;
                                            return (
                                                <tr key={record.id} className="hover:bg-gray-50/50 transition-colors group">
                                                    {fields.map(f => {
                                                        const val = rData[f.name];
                                                        let displayVal = val;
                                                        if (f.type === "CHECKBOX") {
                                                            displayVal = val ? "Yes" : "No";
                                                        } else if (f.type === "MULTI_SELECT" && Array.isArray(val)) {
                                                            displayVal = val.join(', ');
                                                        } else if (val === null || val === undefined) {
                                                            displayVal = "-";
                                                        }
                                                        return (
                                                            <td key={f.id} className="px-6 py-3 text-gray-600 max-w-[200px] truncate" title={String(displayVal)}>
                                                                {String(displayVal)}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="px-6 py-3 sticky right-0 bg-white group-hover:bg-gray-50 text-right border-l border-gray-50 space-x-2">
                                                        <Button variant="ghost" size="sm" className="h-8 px-2 text-primary" onClick={() => handleOpenDialog(record)}>Edit</Button>
                                                        <Button variant="ghost" size="sm" className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(record.id)}>Delete</Button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="bg-gray-50 border-t flex items-center justify-between px-6 py-3 shrink-0">
                                <span className="text-sm text-gray-500">
                                    Showing {((currentPage - 1) * 25) + 1} to {Math.min(currentPage * 25, totalRecords)} of {totalRecords} records
                                </span>
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm" disabled={currentPage <= 1 || isPending} onClick={() => setPage(currentPage - 1)}>Previous</Button>
                                    <span className="text-sm text-gray-600 mx-2">Page {currentPage} of {totalPages === 0 ? 1 : totalPages}</span>
                                    <Button variant="outline" size="sm" disabled={currentPage >= totalPages || isPending} onClick={() => setPage(currentPage + 1)}>Next</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Editing / Creating Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingRecordId ? "Edit Record" : "New Record"}</DialogTitle>
                    </DialogHeader>
                    {!dupWarningOpen ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                {fields.map(f => (
                                    <div key={f.id} className={`space-y-2 ${f.type === 'LONG_TEXT' || f.type === 'MULTI_SELECT' ? 'md:col-span-2' : ''}`}>
                                        <Label className="text-sm font-medium text-gray-700">
                                            {f.name} {f.isRequired && <span className="text-red-500">*</span>}
                                        </Label>
                                        {renderFieldInput(f)}
                                        {formErrors[f.name] && <p className="text-sm text-red-500">{formErrors[f.name]}</p>}
                                    </div>
                                ))}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isPending}>Cancel</Button>
                                <Button onClick={() => handleActionSave(false)} disabled={isPending}>{isPending ? 'Saving...' : 'Save'}</Button>
                            </DialogFooter>
                        </>
                    ) : (
                        <div className="py-6 space-y-4">
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                                <h3 className="font-semibold text-yellow-900 mb-2">Possible Duplicate Found!</h3>
                                <p className="text-sm">We found an existing record containing similar information:</p>
                                <div className="mt-2 text-sm bg-white p-3 rounded border opacity-90 font-medium">
                                    Matches field <span className="font-bold underline">{dupDetails?.field}</span> with value <span className="font-bold">{dupDetails?.value}</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600">Are you sure you want to create this anyway?</p>
                            <DialogFooter className="pt-4">
                                <Button variant="outline" onClick={() => setDupWarningOpen(false)} disabled={isPending}>Go Back & Edit</Button>
                                <Button variant="destructive" onClick={() => handleActionSave(true)} disabled={isPending}>{isPending ? 'Saving...' : 'Create Anyway'}</Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Filter Setup Dialog */}
            <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Filter</DialogTitle>
                        <DialogDescription>Filter records by specific field values.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Field</Label>
                            <Select value={filterDraft.fieldName || undefined} onValueChange={(v) => setFilterDraft({ ...filterDraft, fieldName: v || "", operator: "contains", value: "" })}>
                                <SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger>
                                <SelectContent>
                                    {fields.map(f => (
                                        <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {filterDraft.fieldName && (() => {
                            const fDef = fields.find(f => f.name === filterDraft.fieldName);
                            const t = fDef?.type || "TEXT";
                            return (
                                <>
                                    <div className="space-y-2">
                                        <Label>Operator</Label>
                                        <Select value={filterDraft.operator} onValueChange={(v) => setFilterDraft({ ...filterDraft, operator: v as FilterOperator })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {(t === 'TEXT' || t === 'LONG_TEXT' || t === 'EMAIL' || t === 'PHONE' || t === 'URL') && (
                                                    <>
                                                        <SelectItem value="contains">Contains</SelectItem>
                                                        <SelectItem value="not_contains">Does not contain</SelectItem>
                                                        <SelectItem value="eq">Equals</SelectItem>
                                                    </>
                                                )}
                                                {(t === 'NUMBER') && (
                                                    <>
                                                        <SelectItem value="eq">Equals</SelectItem>
                                                        <SelectItem value="gt">Greater than</SelectItem>
                                                        <SelectItem value="lt">Less than</SelectItem>
                                                        <SelectItem value="gte">Greater than or equal</SelectItem>
                                                        <SelectItem value="lte">Less than or equal</SelectItem>
                                                    </>
                                                )}
                                                {(t === 'DATE') && (
                                                    <>
                                                        <SelectItem value="on">On</SelectItem>
                                                        <SelectItem value="before">Before</SelectItem>
                                                        <SelectItem value="after">After</SelectItem>
                                                    </>
                                                )}
                                                {(t === 'CHECKBOX') && (
                                                    <>
                                                        <SelectItem value="checked">Is checked</SelectItem>
                                                        <SelectItem value="unchecked">Is unchecked</SelectItem>
                                                    </>
                                                )}
                                                {(t === 'DROPDOWN') && (
                                                    <>
                                                        <SelectItem value="eq">Is</SelectItem>
                                                        <SelectItem value="neq">Is not</SelectItem>
                                                    </>
                                                )}
                                                {(t === 'MULTI_SELECT') && (
                                                    <>
                                                        <SelectItem value="contains">Contains</SelectItem>
                                                        <SelectItem value="not_contains">Does not contain</SelectItem>
                                                    </>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {filterDraft.operator !== 'checked' && filterDraft.operator !== 'unchecked' && (
                                        <div className="space-y-2">
                                            <Label>Value</Label>
                                            <Input
                                                type={t === 'NUMBER' ? 'number' : t === 'DATE' ? 'date' : 'text'}
                                                value={filterDraft.value}
                                                onChange={(e) => setFilterDraft({ ...filterDraft, value: e.target.value })}
                                                onKeyDown={(e) => { if (e.key === 'Enter') addFilter() }}
                                            />
                                        </div>
                                    )}
                                </>
                            )
                        })()}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFilterOpen(false)}>Cancel</Button>
                        <Button onClick={addFilter} disabled={!filterDraft.fieldName || (!filterDraft.value && filterDraft.operator !== 'checked' && filterDraft.operator !== 'unchecked')}>Apply Filter</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
