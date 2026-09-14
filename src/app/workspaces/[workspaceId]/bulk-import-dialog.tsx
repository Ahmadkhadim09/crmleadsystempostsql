"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { validateBulkRecords, bulkCreateRecords } from "@/app/actions/records";
import { createFieldDefinition } from "@/app/actions/fields";
import { AlertCircle, CheckCircle2, ChevronRight, Files, Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

interface BulkImportDialogProps {
    workspaceId: string;
    fields: any[];
    isOpen: boolean;
    onClose: () => void;
}

type Step = "PASTE" | "MATCH_AND_PREVIEW" | "IMPORTING" | "SUCCESS";

interface ParsedRow {
    [key: string]: string;
}

interface ValidationResult {
    index: number;
    status: "Valid" | "Warning" | "Error";
    errors: Record<string, string>;
    warning: string | null;
    validatedData: Record<string, any>;
}

export function BulkImportDialog({ workspaceId, fields, isOpen, onClose }: BulkImportDialogProps) {
    const router = useRouter();
    const [step, setStep] = useState<Step>("PASTE");
    const [pasteText, setPasteText] = useState("");
    const [isPending, startTransition] = useTransition();

    // Data states
    const [headers, setHeaders] = useState<string[]>([]);
    const [rows, setRows] = useState<string[][]>([]);

    // Header tracking
    const [headerMapping, setHeaderMapping] = useState<Record<string, string>>({});
    // column index -> field name OR 'NEW:Type' or 'SKIP'
    const [newFieldsState, setNewFieldsState] = useState<Record<string, { type: string }>>({});

    // Validation
    const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
    const [validating, setValidating] = useState(false);

    // Stats
    const [importStats, setImportStats] = useState({ created: 0, errors: 0, skipped: 0 });

    const handlePasteAndParse = () => {
        if (!pasteText.trim()) return;

        // Parse TSV / Newlines
        const lines = pasteText.split(/\r?\n/).filter(line => line.trim() !== "");
        if (lines.length < 2) {
            alert("Please paste at least one row of headers and one row of data.");
            return;
        }

        const parsedRows = lines.map(line => line.split(/\t/));
        const firstRow = parsedRows[0].map(h => h.trim());
        const dataRows = parsedRows.slice(1);

        setHeaders(firstRow);
        setRows(dataRows);

        // Auto-match
        const initialMap: Record<string, string> = {};
        firstRow.forEach((header, index) => {
            const h = header.toLowerCase();
            const fieldMatch = fields.find(f => {
                const fn = f.name.toLowerCase();
                return fn === h ||
                    (h.includes("email") && fn.includes("email")) ||
                    (h.includes("phone") && fn.includes("phone"));
            });
            if (fieldMatch) {
                initialMap[index.toString()] = fieldMatch.name;
            } else {
                initialMap[index.toString()] = "SKIP"; // Or 'NEW:TEXT'
            }
        });
        setHeaderMapping(initialMap);
        setStep("MATCH_AND_PREVIEW");
        runValidation(dataRows, initialMap);
    };

    const runValidation = async (currentRows: string[][], map: Record<string, string>) => {
        setValidating(true);
        // Build payload
        const recordsToValidate = [];
        for (const r of currentRows) {
            const rec: Record<string, string> = {};
            r.forEach((val, i) => {
                const target = map[i.toString()];
                if (target && target !== "SKIP" && !target.startsWith("NEW:")) {
                    rec[target] = val; // Actually for new fields we can't validate yet since they are not in DB, so validation will just pass them if not mapped as existing.
                }
            });
            recordsToValidate.push(rec);
        }

        try {
            const res = await validateBulkRecords({ workspaceId, records: recordsToValidate });
            if (res.success && res.results) {
                setValidationResults(res.results as ValidationResult[]);
            }
        } catch (e) {
            console.error(e);
        }
        setValidating(false);
    };

    const handleMappingChange = (index: number, val: string) => {
        const newMap = { ...headerMapping, [index.toString()]: val };
        setHeaderMapping(newMap);
        if (val.startsWith("NEW:")) {
            setNewFieldsState(prev => ({ ...prev, [index.toString()]: { type: "TEXT" } }));
        }
        runValidation(rows, newMap);
    };

    const handleRemoveRow = (idx: number) => {
        const newRows = rows.filter((_, i) => i !== idx);
        setRows(newRows);
        runValidation(newRows, headerMapping);
    };

    const handleConfirmImport = async () => {
        setStep("IMPORTING");

        // 1. Create any "NEW" fields
        let currentOrder = fields.length;
        const finalMap = { ...headerMapping };

        for (const [idx, val] of Object.entries(headerMapping)) {
            if (val.startsWith("NEW:")) {
                const headerName = headers[parseInt(idx)];
                const fieldType = newFieldsState[idx]?.type || "TEXT";

                try {
                    await createFieldDefinition({
                        workspaceId,
                        name: headerName,
                        type: fieldType,
                        isRequired: false,
                        order: currentOrder++
                    });
                    finalMap[idx] = headerName;
                } catch (e) {
                    console.error("Failed to create field", headerName, e);
                    finalMap[idx] = "SKIP";
                }
            }
        }

        // 2. Build final data
        const recordsToImport = [];
        for (let i = 0; i < rows.length; i++) {
            // Only import Valid and Warning (which might get duplicate checked again or ignored)
            const validationStatus = validationResults[i]?.status;
            if (validationStatus === "Error") continue; // Skip errors entirely

            const rec: Record<string, any> = {};
            rows[i].forEach((val, colIdx) => {
                const target = finalMap[colIdx.toString()];
                if (target && target !== "SKIP") {
                    rec[target] = val;
                }
            });
            if (Object.keys(rec).length > 0) {
                recordsToImport.push(rec);
            }
        }

        // 3. Import Bulk
        try {
            const res = await bulkCreateRecords({ workspaceId, records: recordsToImport });
            if (res.success) {
                setImportStats({
                    created: res.createdCount || 0,
                    errors: res.errorCount || 0,
                    skipped: res.skippedCount || 0
                });
                setStep("SUCCESS");
                router.refresh();
            } else {
                alert("Import failed: " + res.error);
                setStep("MATCH_AND_PREVIEW");
            }
        } catch (e) {
            alert("Import error");
            setStep("MATCH_AND_PREVIEW");
        }
    };

    const reset = () => {
        setStep("PASTE");
        setPasteText("");
        setHeaders([]);
        setRows([]);
        setHeaderMapping({});
        setValidationResults([]);
    };

    useEffect(() => {
        if (!isOpen) reset();
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open && step !== "IMPORTING") onClose();
        }}>
            <DialogContent className={`max-w-6xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden`}>
                <div className="px-6 py-4 border-b border-gray-100 flex-none shrink-0 bg-white">
                    <DialogTitle className="text-xl font-semibold flex items-center">
                        Bulk Paste / Import
                    </DialogTitle>
                    <DialogDescription className="mt-1.5">
                        {step === "PASTE" && "Copy cells from Excel or Google Sheets and paste them here"}
                        {step === "MATCH_AND_PREVIEW" && "Review your data and map columns to workspace fields"}
                        {step === "IMPORTING" && "Saving records to workspace..."}
                        {step === "SUCCESS" && "Import Complete"}
                    </DialogDescription>
                </div>

                <div className="flex-1 min-h-0 bg-gray-50/50 p-6 overflow-hidden flex flex-col">
                    {step === "PASTE" && (
                        <div className="flex-1 flex flex-col items-center justify-center h-full">
                            <textarea
                                value={pasteText}
                                onChange={(e) => setPasteText(e.target.value)}
                                placeholder={`Name\tEmail\tPhone\nJohn Doe\tjohn@example.com\t555-0100\nJane Smith\tjane@example.com\t555-0102\n\n(Paste directly from Excel or Google Sheets)`}
                                className="w-full h-full max-h-full border border-gray-200 rounded-xl p-5 shadow-inner focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-sm leading-relaxed"
                            />
                        </div>
                    )}

                    {step === "MATCH_AND_PREVIEW" && (
                        <div className="flex-1 flex flex-col min-h-0 border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                            <div className="flex-1 overflow-auto">
                                <Table className="border-collapse">
                                    <TableHeader className="bg-gray-50/90 sticky top-0 z-10 backdrop-blur-sm border-b border-gray-200">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-12 text-center border-r border-gray-200/60 p-2"></TableHead>
                                            <TableHead className="w-10 text-center border-r border-gray-200/60 p-2"></TableHead>
                                            {headers.map((h, i) => (
                                                <TableHead key={i} className="min-w-[200px] border-r border-gray-200/60 font-semibold p-3 align-top text-gray-800">
                                                    <div className="mb-2 text-[13px] text-gray-500 truncate" title={h}>
                                                        Pasted: <span className="font-semibold text-gray-800">{h}</span>
                                                    </div>
                                                    <Select value={headerMapping[i.toString()] || "SKIP"} onValueChange={(val) => handleMappingChange(i, val || "")}>
                                                        <SelectTrigger className="h-8 text-xs border-gray-200 shadow-sm">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="SKIP" className="text-gray-400 italic">-- Skip Column --</SelectItem>
                                                            <SelectItem value="NEW:TEXT" className="font-semibold text-blue-600">✨ Create New Field</SelectItem>
                                                            {fields.map(f => (
                                                                <SelectItem key={f.id} value={f.name}>
                                                                    {f.name} {f.isRequired && <span className="text-rose-500">*</span>}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {headerMapping[i.toString()]?.startsWith("NEW:") && (
                                                        <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                                                            <Select value={newFieldsState[i]?.type || "TEXT"} onValueChange={(t) => {
                                                                setNewFieldsState(prev => ({ ...prev, [i.toString()]: { type: t || "TEXT" } }));
                                                            }}>
                                                                <SelectTrigger className="h-7 text-[11px] bg-blue-50/50 border-blue-100 text-blue-700">
                                                                    <SelectValue placeholder="Field Type" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="TEXT">Short Text</SelectItem>
                                                                    <SelectItem value="LONG_TEXT">Long Text</SelectItem>
                                                                    <SelectItem value="EMAIL">Email</SelectItem>
                                                                    <SelectItem value="PHONE">Phone</SelectItem>
                                                                    <SelectItem value="NUMBER">Number</SelectItem>
                                                                    <SelectItem value="URL">Website</SelectItem>
                                                                    <SelectItem value="DATE">Date</SelectItem>
                                                                    <SelectItem value="CHECKBOX">Checkbox</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    )}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.map((row, rIdx) => {
                                            const vData = validationResults[rIdx];
                                            let statusColor = "bg-white";
                                            let StatusIcon = null;

                                            if (vData?.status === "Error") {
                                                statusColor = "bg-rose-50/60";
                                                StatusIcon = <XCircle className="w-4 h-4 text-rose-500" />;
                                            } else if (vData?.status === "Warning") {
                                                statusColor = "bg-orange-50/60";
                                                StatusIcon = <AlertCircle className="w-4 h-4 text-orange-500" />;
                                            } else if (vData?.status === "Valid") {
                                                StatusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
                                            }

                                            return (
                                                <TableRow key={rIdx} className={`${statusColor} hover:${statusColor} border-b border-gray-100 transition-colors`}>
                                                    <TableCell className="text-center p-0 w-12 border-r border-gray-100">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50" onClick={() => handleRemoveRow(rIdx)}>
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell className="text-center p-2 border-r border-gray-100" title={vData?.warning || (Object.keys(vData?.errors || {}).length > 0 ? Object.values(vData?.errors || {}).join(", ") : undefined)}>
                                                        {validating ? (
                                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin mx-auto" />
                                                        ) : StatusIcon}
                                                    </TableCell>
                                                    {row.map((cell, cIdx) => {
                                                        const targetField = headerMapping[cIdx.toString()];
                                                        const hasError = vData?.errors && targetField && vData.errors[targetField];
                                                        return (
                                                            <TableCell key={cIdx} className={`p-3 border-r border-gray-100 min-w-[150px] truncate max-w-[200px] text-[13px] ${hasError ? 'text-rose-600 font-medium' : 'text-gray-700'} ${targetField === 'SKIP' ? 'opacity-40 line-through' : ''}`} title={hasError || cell}>
                                                                {cell || <span className="text-gray-300 italic">Empty</span>}
                                                            </TableCell>
                                                        )
                                                    })}
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="bg-white border-t border-gray-200 p-4 flex items-center justify-between shadow-sm">
                                <div className="flex space-x-6 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Total Rows</span>
                                        <span className="font-bold text-gray-900 text-lg">{rows.length}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-emerald-600 text-xs uppercase tracking-wider font-semibold hover:underline cursor-help" title="Will be imported">Valid</span>
                                        <span className="font-bold text-emerald-700 text-lg">{validationResults.filter(r => r.status === "Valid").length}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-orange-600 text-xs uppercase tracking-wider font-semibold hover:underline cursor-help" title="Possible duplicates, will be imported">Warnings</span>
                                        <span className="font-bold text-orange-700 text-lg">{validationResults.filter(r => r.status === "Warning").length}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-rose-600 text-xs uppercase tracking-wider font-semibold hover:underline cursor-help" title="Missing required fields or invalid formats. Will be skipped.">Errors</span>
                                        <span className="font-bold text-rose-700 text-lg">{validationResults.filter(r => r.status === "Error").length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === "IMPORTING" && (
                        <div className="flex-1 flex flex-col items-center justify-center h-full">
                            <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-blue-600 animate-spin mb-6" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Importing Records</h3>
                            <p className="text-gray-500">Please wait while we process your data...</p>
                        </div>
                    )}

                    {step === "SUCCESS" && (
                        <div className="flex-1 flex flex-col items-center justify-center h-full text-center">
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 border-8 border-emerald-50">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Import Complete</h3>
                            <div className="bg-white border text-left border-gray-200 shadow-sm rounded-xl p-6 min-w-[320px] space-y-4 inline-block">
                                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                    <span className="text-sm font-medium text-gray-600">Records Created</span>
                                    <span className="text-lg font-bold text-emerald-600">{importStats.created}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                    <span className="text-sm font-medium text-gray-600">Possible Duplicates (Created)</span>
                                    <span className="text-lg font-bold text-orange-500">{importStats.skipped}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600">Rows Skipped (Errors)</span>
                                    <span className="text-lg font-bold text-rose-500">{importStats.errors}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between flex-none shrink-0">
                    <Button variant="ghost" onClick={onClose} disabled={step === "IMPORTING"} className="text-gray-500 hover:text-gray-900">
                        {step === "SUCCESS" ? "Close" : "Cancel"}
                    </Button>

                    {step === "PASTE" && (
                        <Button onClick={handlePasteAndParse} disabled={!pasteText.trim()} className="shadow-sm">
                            Next: Match Columns <ChevronRight className="w-4 h-4 ml-1.5" />
                        </Button>
                    )}

                    {step === "MATCH_AND_PREVIEW" && (
                        <Button onClick={handleConfirmImport} disabled={validating || rows.length === 0} className="shadow-sm bg-blue-600 hover:bg-blue-700 text-white">
                            {validating ? "Validating..." : `Import ${rows.length - validationResults.filter(r => r.status === "Error").length} Records`}
                        </Button>
                    )}

                    {step === "SUCCESS" && (
                        <Button onClick={() => { onClose(); router.refresh(); }} className="shadow-sm">
                            View Records
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
