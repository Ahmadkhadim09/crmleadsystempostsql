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
import { Search, Filter, Settings2, Plus, Pencil, Trash2, X, FileText, ChevronLeft, ChevronRight, ArrowDown, ArrowUp, Info } from "lucide-react";

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
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
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
                    <div className="space-y-2 pt-1 max-h-[120px] overflow-y-auto border border-input p-3 rounded-md bg-white shadow-sm text-sm">
                        {Array.isArray(parsedOptions) && parsedOptions.map((opt: string) => {
                            const isChecked = Array.isArray(val) ? val.includes(opt) : false;
                            return (
                                <div key={opt} className="flex items-center space-x-2.5">
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
                                    <Label className="font-normal text-gray-700 cursor-pointer">{opt}</Label>
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
        <div className="flex-1 flex flex-col overflow-hidden h-full bg-white">
            {/* Main Toolbar */}
            <header className="bg-white border-b border-gray-200/60 py-3 md:h-16 flex-none flex flex-col md:flex-row md:items-center justify-between px-4 md:px-6 z-10 shrink-0 gap-3">
                <div className="flex items-center w-full md:max-w-sm">
                    <form onSubmit={handleSearch} className="flex-1 relative group w-full">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 group-hover:text-gray-500 transition-colors" />
                        <Input
                            type="text"
                            placeholder="Search records..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full bg-gray-50 border-transparent hover:border-gray-300 focus:bg-white pl-9 h-9 transition-all text-sm rounded-lg shadow-sm md:shadow-none"
                        />
                        {/* Hidden submit to handle enter */}
                        <button type="submit" className="hidden" disabled={isPending}>Search</button>
                    </form>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" className="h-9 px-3 text-gray-600 border-gray-200 hover:bg-gray-50" onClick={() => setIsFilterOpen(true)}>
                        <Filter className="w-4 h-4 mr-2 text-gray-400" />
                        Filters {parsedFilters.length > 0 && <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-800">{parsedFilters.length}</span>}
                    </Button>
                    <Link href={`/workspaces/${workspaceId}/settings`}>
                        <Button variant="outline" size="sm" className="h-9 px-3 text-gray-600 border-gray-200 hover:bg-gray-50 hidden sm:flex">
                            <Settings2 className="w-4 h-4 mr-2 text-gray-400" />
                            Columns
                        </Button>
                    </Link>
                    <Button size="sm" className="h-9 px-4 shadow-sm flex-1 sm:flex-none" onClick={() => handleOpenDialog()}>
                        <Plus className="w-4 h-4 mr-1.5" /> New Record
                    </Button>
                </div>
            </header>

            {/* Active Filters Display */}
            {parsedFilters.length > 0 && (
                <div className="bg-gray-50/50 border-b border-gray-200/60 px-6 py-2.5 flex flex-wrap gap-2 items-center">
                    <span className="text-[11px] font-semibold text-gray-400 mr-1 uppercase tracking-wider">Filters</span>
                    {parsedFilters.map((pf, i) => (
                        <div key={i} className="inline-flex items-center border border-gray-200 bg-white rounded-md px-2.5 py-1 text-xs shadow-sm text-gray-700">
                            <span className="font-medium mr-1.5">{pf.fieldName}</span>
                            <span className="text-gray-400 mr-1.5">
                                {pf.operator === 'contains' ? 'contains' : pf.operator === 'eq' ? '=' : pf.operator}
                            </span>
                            <span className="font-semibold">{pf.value}</span>
                            <button onClick={() => removeFilter(pf)} className="ml-2 text-gray-400 hover:text-red-500 transition-colors focus:outline-none rounded">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7 px-2 text-gray-500 hover:text-gray-900 ml-1">Clear all</Button>
                </div>
            )}

            <main className="flex-1 overflow-auto bg-gray-50/30 flex flex-col relative w-full min-h-0">
                {records.length === 0 ? (
                    <div className="m-auto mt-24 text-center flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-5 border border-gray-200 shadow-sm">
                            <FileText className="w-7 h-7 text-gray-400" />
                        </div>
                        <h2 className="text-lg font-medium text-gray-900 mb-1">
                            {globalSearch || parsedFilters.length > 0 ? "No matching records" : "Start building your records"}
                        </h2>
                        {(!globalSearch && parsedFilters.length === 0) ? (
                            <>
                                <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
                                    This workspace doesn't have any data yet. Create your first record manually or adjust your column fields.
                                </p>
                                <Button className="shadow-sm pl-3 pr-4" onClick={() => handleOpenDialog()}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Your First Record
                                </Button>
                            </>
                        ) : (
                            <p className="text-sm text-gray-500">Try adjusting your filters or search terms.</p>
                        )}
                    </div>
                ) : (
                    <div className="p-6 flex-1 flex flex-col min-h-0 w-full overflow-hidden">
                        <div className="border border-gray-200 rounded-xl bg-white shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
                            <div className="overflow-auto flex-1">
                                <table className="min-w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-gray-50/90 border-b border-gray-200 sticky top-0 backdrop-blur-sm z-10">
                                        <tr>
                                            {fields.map(f => (
                                                <th key={f.id} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-gray-100 group transition-colors select-none" onClick={() => applySorting(f.name)}>
                                                    <div className="flex items-center">
                                                        <span className="truncate">{f.name} {f.isRequired && <span className="text-rose-500 ml-0.5">*</span>}</span>
                                                        {sortField === f.name ? (
                                                            sortDirection === 'asc'
                                                                ? <ArrowUp className="w-3.5 h-3.5 ml-1.5 text-gray-600 inline-block" />
                                                                : <ArrowDown className="w-3.5 h-3.5 ml-1.5 text-gray-600 inline-block" />
                                                        ) : (
                                                            <ArrowDown className="w-3.5 h-3.5 ml-1.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        )}
                                                    </div>
                                                </th>
                                            ))}
                                            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 sticky right-0 bg-gray-50/90 backdrop-blur-sm text-right border-l border-gray-100/50 w-24">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {records.map(record => {
                                            const rData = record.data as Record<string, any>;
                                            return (
                                                <tr key={record.id} className="hover:bg-gray-50/60 transition-colors group">
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
                                                            <td key={f.id} className="px-5 py-3.5 text-gray-700 max-w-[220px] truncate leading-relaxed" title={String(displayVal)}>
                                                                {String(displayVal)}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="px-5 py-3.5 sticky right-0 bg-white group-hover:bg-gray-50/50 text-right border-l border-gray-50 space-x-1.5">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-200 bg-transparent hover:bg-white shadow-none transition-all" aria-label="Edit record" title="Edit" onClick={() => handleOpenDialog(record)}>
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" aria-label="Delete record" title="Delete" onClick={() => handleDelete(record.id)}>
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="bg-white border-t border-gray-200 flex items-center justify-between px-6 py-3 shrink-0">
                                <span className="text-sm text-gray-500">
                                    Showing <span className="font-medium text-gray-900">{((currentPage - 1) * 25) + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * 25, totalRecords)}</span> of <span className="font-medium text-gray-900">{totalRecords}</span> results
                                </span>
                                <div className="flex items-center space-x-2.5">
                                    <Button variant="outline" size="sm" className="h-8 border-gray-200" disabled={currentPage <= 1 || isPending} onClick={() => setPage(currentPage - 1)}>
                                        <ChevronLeft className="w-4 h-4 mr-1 text-gray-500" />
                                        Prev
                                    </Button>
                                    <span className="text-sm text-gray-600 font-medium">Page {currentPage} of {totalPages === 0 ? 1 : totalPages}</span>
                                    <Button variant="outline" size="sm" className="h-8 border-gray-200" disabled={currentPage >= totalPages || isPending} onClick={() => setPage(currentPage + 1)}>
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-1 text-gray-500" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Editing / Creating Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader className="pb-3 border-b border-gray-100">
                        <DialogTitle className="text-xl font-semibold tracking-tight">{editingRecordId ? "Edit Record" : "New Record"}</DialogTitle>
                    </DialogHeader>
                    {!dupWarningOpen ? (
                        <>
                            <div className="py-4 space-y-5">
                                {fields.map(f => (
                                    <div key={f.id} className="space-y-1.5 focus-within:text-gray-900 text-gray-600 transition-colors duration-200">
                                        <Label className="text-sm font-medium">
                                            {f.name} {f.isRequired && <span className="text-rose-500 ml-0.5">*</span>}
                                        </Label>
                                        {renderFieldInput(f)}
                                        {formErrors[f.name] && <p className="text-[13px] text-rose-500 font-medium pt-1">{formErrors[f.name]}</p>}
                                    </div>
                                ))}
                            </div>
                            <DialogFooter className="pt-5 border-t border-gray-100 mt-2">
                                <Button variant="outline" className="border-gray-200" onClick={() => setIsDialogOpen(false)} disabled={isPending}>Cancel</Button>
                                <Button onClick={() => handleActionSave(false)} disabled={isPending} className="shadow-sm">
                                    {isPending ? 'Saving...' : 'Save Record'}
                                </Button>
                            </DialogFooter>
                        </>
                    ) : (
                        <div className="py-6 space-y-5">
                            <div className="p-4 bg-orange-50/80 border border-orange-200/60 rounded-xl flex items-start space-x-3">
                                <Info className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-orange-900 mb-1">Potential Duplicate Found</h3>
                                    <p className="text-sm text-orange-800/90 leading-relaxed mb-3">
                                        We found an existing record containing similar information in the system.
                                    </p>
                                    <div className="text-[13px] bg-white px-3 py-2.5 rounded-lg border border-orange-100 shadow-sm text-gray-700">
                                        Matches field <span className="font-semibold text-gray-900">{dupDetails?.field}</span> with value <span className="font-semibold text-gray-900">"{dupDetails?.value}"</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm font-medium text-gray-700 px-1">Are you sure you want to create this anyway?</p>
                            <DialogFooter className="pt-4">
                                <Button variant="outline" className="border-gray-200 text-gray-600" onClick={() => setDupWarningOpen(false)} disabled={isPending}>Go Back & Edit</Button>
                                <Button variant="secondary" className="bg-rose-600 text-white hover:bg-rose-700 shadow-sm" onClick={() => handleActionSave(true)} disabled={isPending}>
                                    {isPending ? 'Saving...' : 'Create Anyway'}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Filter Setup Dialog */}
            <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader className="pb-3 border-b border-gray-100">
                        <DialogTitle className="text-lg font-semibold">New Filter</DialogTitle>
                        <DialogDescription>Filter records by specific field conditions.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 py-5">
                        <div className="space-y-1.5 focus-within:text-gray-900 text-gray-600">
                            <Label className="font-medium text-sm">Select Field</Label>
                            <Select value={filterDraft.fieldName || undefined} onValueChange={(v) => setFilterDraft({ ...filterDraft, fieldName: v || "", operator: "contains", value: "" })}>
                                <SelectTrigger className="border-gray-200">
                                    <SelectValue placeholder="Choose a field..." />
                                </SelectTrigger>
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
                                <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-1.5 focus-within:text-gray-900 text-gray-600">
                                        <Label className="font-medium text-sm">Condition (Operator)</Label>
                                        <Select value={filterDraft.operator} onValueChange={(v) => setFilterDraft({ ...filterDraft, operator: v as FilterOperator })}>
                                            <SelectTrigger className="border-gray-200"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {(t === 'TEXT' || t === 'LONG_TEXT' || t === 'EMAIL' || t === 'PHONE' || t === 'URL') && (
                                                    <>
                                                        <SelectItem value="contains">Contains</SelectItem>
                                                        <SelectItem value="not_contains">Does not contain</SelectItem>
                                                        <SelectItem value="eq">Equals exact</SelectItem>
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
                                                        <SelectItem value="on">On exact date</SelectItem>
                                                        <SelectItem value="before">Before</SelectItem>
                                                        <SelectItem value="after">After</SelectItem>
                                                    </>
                                                )}
                                                {(t === 'CHECKBOX') && (
                                                    <>
                                                        <SelectItem value="checked">Is Checked</SelectItem>
                                                        <SelectItem value="unchecked">Is Unchecked</SelectItem>
                                                    </>
                                                )}
                                                {(t === 'DROPDOWN') && (
                                                    <>
                                                        <SelectItem value="eq">Is precisely</SelectItem>
                                                        <SelectItem value="neq">Is NOT</SelectItem>
                                                    </>
                                                )}
                                                {(t === 'MULTI_SELECT') && (
                                                    <>
                                                        <SelectItem value="contains">Includes option</SelectItem>
                                                        <SelectItem value="not_contains">Excludes option</SelectItem>
                                                    </>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {filterDraft.operator !== 'checked' && filterDraft.operator !== 'unchecked' && (
                                        <div className="space-y-1.5 focus-within:text-gray-900 text-gray-600">
                                            <Label className="font-medium text-sm">Target Value</Label>
                                            <Input
                                                type={t === 'NUMBER' ? 'number' : t === 'DATE' ? 'date' : 'text'}
                                                value={filterDraft.value}
                                                className="border-gray-200"
                                                onChange={(e) => setFilterDraft({ ...filterDraft, value: e.target.value })}
                                                onKeyDown={(e) => { if (e.key === 'Enter') addFilter() }}
                                                placeholder="e.g. Acme Corp..."
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })()}
                    </div>
                    <DialogFooter className="pt-3">
                        <Button variant="outline" className="border-gray-200" onClick={() => setIsFilterOpen(false)}>Cancel</Button>
                        <Button onClick={addFilter} disabled={!filterDraft.fieldName || (!filterDraft.value && filterDraft.operator !== 'checked' && filterDraft.operator !== 'unchecked')}>
                            Apply Filter
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
