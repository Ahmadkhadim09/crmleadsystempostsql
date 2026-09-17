"use client";

import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, AlertCircle, Check, X, Loader2, Info, RefreshCw } from "lucide-react";

export interface FieldDef {
    id: string;
    name: string;
    type: string;
    options?: any;
    isRequired?: boolean;
}

export interface RecordItem {
    id: string;
    data: Record<string, any>;
}

export interface DraftNewRow {
    tempId: string;
    data: Record<string, any>;
    errors: Record<string, string>;
    isSaving: boolean;
}

export interface SpreadsheetGridHandle {
    addDraftRow: () => void;
}

interface SpreadsheetGridProps {
    workspaceId: string;
    fields: FieldDef[];
    records: RecordItem[];
    currentPage: number;
    totalRecords: number;
    isPending: boolean;
    onSaveCell: (recordId: string, fieldName: string, newValue: any, ignoreDuplicates?: boolean) => Promise<{ success: boolean; isDuplicate?: boolean; duplicateField?: string; duplicateValue?: string; validationErrors?: Record<string, string>; error?: string }>;
    onCreateRow: (rowData: Record<string, any>) => Promise<{ success: boolean; error?: string; validationErrors?: Record<string, string> }>;
    onDeleteRecord: (id: string) => void;
    onOpenEditModal: (record: RecordItem) => void;
    onBulkImportOpen: () => void;
}

interface SelectedCell {
    rowIndex: number;
    rowId: string;
    colIndex: number;
    fieldName: string;
    isDraftRow: boolean;
}

interface MultiPastePreview {
    targetRowIndex: number;
    targetColIndex: number;
    rowsData: string[][];
    affectedExistingCount: number;
    affectedNewCount: number;
}

function MultiSelectCellEditor({ options, selected, onChange, onClose }: { options: string[]; selected: string[]; onChange: (vals: string[]) => void; onClose: () => void }) {
    const [open, setOpen] = useState(true);

    return (
        <div className="relative w-full">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full text-xs h-7 px-1.5 bg-white border border-[#534AB7] rounded text-left flex items-center justify-between truncate"
            >
                <span className="truncate">
                    {selected.length > 0 ? selected.join(", ") : <span className="text-gray-400">Select options...</span>}
                </span>
                <span className="ml-1 text-[9px] text-gray-400">▼</span>
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-20" onClick={() => { setOpen(false); onClose(); }} />
                    <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-md shadow-lg z-30 p-2 space-y-1.5 max-h-48 overflow-y-auto">
                        {options.map((opt) => {
                            const isChecked = selected.includes(opt);
                            return (
                                <label key={opt} className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded select-none">
                                    <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                onChange([...selected, opt]);
                                            } else {
                                                onChange(selected.filter(i => i !== opt));
                                            }
                                        }}
                                    />
                                    <span className="truncate">{opt}</span>
                                </label>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

export const SpreadsheetGrid = forwardRef<SpreadsheetGridHandle, SpreadsheetGridProps>(({
    workspaceId, fields, records, currentPage, totalRecords,
    isPending, onSaveCell, onCreateRow, onDeleteRecord, onOpenEditModal, onBulkImportOpen
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Selected cell state
    const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState<any>("");

    // Multiple Draft New Rows
    const [draftNewRows, setDraftNewRows] = useState<DraftNewRow[]>([]);

    // Status tracking for existing record cells
    const [savingCellKey, setSavingCellKey] = useState<string | null>(null);
    const [recentlySavedCellKey, setRecentlySavedCellKey] = useState<string | null>(null);
    const [cellErrors, setCellErrors] = useState<Record<string, string>>({});

    // Duplicate Warning Popup state
    const [dupCellWarning, setDupCellWarning] = useState<{
        recordId: string;
        fieldName: string;
        newValue: any;
        dupField: string;
        dupValue: string;
    } | null>(null);

    // Multi-cell Paste Preview Modal State
    const [pastePreview, setPastePreview] = useState<MultiPastePreview | null>(null);
    const [isApplyingPaste, setIsApplyingPaste] = useState(false);

    // Active input ref for auto-focus
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

    // Total rows = existing records + draft rows
    const totalCombinedRows = records.length + draftNewRows.length;

    // Method to add a new blank draft row
    const addDraftRow = useCallback(() => {
        const newTempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const initialData: Record<string, any> = {};
        fields.forEach(f => {
            initialData[f.name] = f.type === "CHECKBOX" ? false : "";
        });

        setDraftNewRows(prev => [...prev, { tempId: newTempId, data: initialData, errors: {}, isSaving: false }]);

        const newRowIndex = records.length + draftNewRows.length;
        setSelectedCell({
            rowIndex: newRowIndex,
            rowId: newTempId,
            colIndex: 0,
            fieldName: fields[0]?.name || "",
            isDraftRow: true
        });
    }, [fields, records.length, draftNewRows.length]);

    // Expose addDraftRow via ref
    useImperativeHandle(ref, () => ({
        addDraftRow
    }), [addDraftRow]);

    // Remove a draft row
    const removeDraftRow = useCallback((tempId: string) => {
        setDraftNewRows(prev => prev.filter(r => r.tempId !== tempId));
        if (selectedCell?.rowId === tempId) {
            setSelectedCell(null);
            setIsEditing(false);
        }
    }, [selectedCell]);

    // Save a specific draft row (with deduplication)
    const saveDraftRow = useCallback(async (tempId: string) => {
        const draftRow = draftNewRows.find(r => r.tempId === tempId);
        if (!draftRow || draftRow.isSaving) return;

        // Validation check
        const errors: Record<string, string> = {};
        let hasRequiredErrors = false;

        fields.forEach(f => {
            const val = draftRow.data[f.name];
            if (f.isRequired && (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0))) {
                errors[f.name] = `${f.name} is required`;
                hasRequiredErrors = true;
            } else if (val !== undefined && val !== null && val !== "") {
                if (f.type === "EMAIL" && typeof val === "string") {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(val)) {
                        errors[f.name] = "Invalid email format";
                        hasRequiredErrors = true;
                    }
                }
                if (f.type === "NUMBER" && isNaN(Number(val))) {
                    errors[f.name] = "Must be a valid number";
                    hasRequiredErrors = true;
                }
            }
        });

        if (hasRequiredErrors) {
            setDraftNewRows(prev => prev.map(r => r.tempId === tempId ? { ...r, errors } : r));
            return;
        }

        // Lock row saving state
        setDraftNewRows(prev => prev.map(r => r.tempId === tempId ? { ...r, isSaving: true, errors: {} } : r));

        const res = await onCreateRow(draftRow.data);

        if (res.success) {
            // Remove temporary draft row upon successful server persist
            setDraftNewRows(prev => prev.filter(r => r.tempId !== tempId));
            if (selectedCell?.rowId === tempId) {
                setSelectedCell(null);
                setIsEditing(false);
            }
        } else {
            // Preserve data and display error badge + retry button
            setDraftNewRows(prev => prev.map(r => r.tempId === tempId ? {
                ...r,
                isSaving: false,
                errors: res.validationErrors || { _general: res.error || "Failed to save row" }
            } : r));
        }
    }, [draftNewRows, fields, onCreateRow, selectedCell]);

    // Evaluate auto-save for a draft row if all required fields are filled
    const checkAutoSaveDraftRow = useCallback((tempId: string, updatedData: Record<string, any>) => {
        const draftRow = draftNewRows.find(r => r.tempId === tempId);
        if (!draftRow || draftRow.isSaving) return;

        // Check if all required fields have non-empty values
        let allRequiredFilled = true;
        fields.forEach(f => {
            if (f.isRequired) {
                const val = updatedData[f.name];
                if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
                    allRequiredFilled = false;
                }
            }
        });

        if (allRequiredFilled) {
            saveDraftRow(tempId);
        }
    }, [draftNewRows, fields, saveDraftRow]);

    // Focus active input
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            if (typeof inputRef.current.select === "function") {
                inputRef.current.select();
            }
        }
    }, [isEditing]);

    const getCellKey = (rowId: string, fieldName: string) => `${rowId}__${fieldName}`;

    // Start cell editing
    const startEditing = useCallback((cell: SelectedCell, initialVal?: any) => {
        setSelectedCell(cell);
        setIsEditing(true);

        if (initialVal !== undefined) {
            setEditValue(initialVal);
        } else {
            if (cell.isDraftRow) {
                const draft = draftNewRows.find(r => r.tempId === cell.rowId);
                setEditValue(draft?.data?.[cell.fieldName] ?? "");
            } else {
                const rec = records.find(r => r.id === cell.rowId);
                setEditValue(rec?.data?.[cell.fieldName] ?? "");
            }
        }
    }, [records, draftNewRows]);

    // Commit cell changes & Auto-Save
    const commitCellEdit = useCallback(async (cell: SelectedCell, valToSave: any) => {
        setIsEditing(false);

        if (cell.isDraftRow) {
            // Update draft row data & check auto-save
            let nextData: Record<string, any> = {};
            setDraftNewRows(prev => prev.map(r => {
                if (r.tempId === cell.rowId) {
                    const newErr = { ...r.errors };
                    delete newErr[cell.fieldName];
                    delete newErr._general;
                    nextData = { ...r.data, [cell.fieldName]: valToSave };
                    return { ...r, data: nextData, errors: newErr };
                }
                return r;
            }));

            // Auto-save draft row if ready
            setTimeout(() => {
                checkAutoSaveDraftRow(cell.rowId, nextData);
            }, 100);
            return;
        }

        // Existing Record Cell Auto-Save
        const rec = records.find(r => r.id === cell.rowId);
        const originalVal = rec?.data?.[cell.fieldName];

        if (originalVal === valToSave || (originalVal === undefined && valToSave === "")) {
            return;
        }

        const cellKey = getCellKey(cell.rowId, cell.fieldName);
        setSavingCellKey(cellKey);

        const res = await onSaveCell(cell.rowId, cell.fieldName, valToSave, false);
        setSavingCellKey(null);

        if (res.success) {
            setCellErrors(prev => {
                const copy = { ...prev };
                delete copy[cellKey];
                return copy;
            });
            // Show temporary saved checkmark
            setRecentlySavedCellKey(cellKey);
            setTimeout(() => setRecentlySavedCellKey(null), 2000);
        } else if (res.isDuplicate) {
            setDupCellWarning({
                recordId: cell.rowId,
                fieldName: cell.fieldName,
                newValue: valToSave,
                dupField: res.duplicateField || cell.fieldName,
                dupValue: res.duplicateValue || String(valToSave)
            });
        } else {
            if (res.validationErrors?.[cell.fieldName]) {
                setCellErrors(prev => ({ ...prev, [cellKey]: res.validationErrors![cell.fieldName] }));
            } else if (res.error) {
                setCellErrors(prev => ({ ...prev, [cellKey]: res.error! }));
            }
        }
    }, [records, onSaveCell, checkAutoSaveDraftRow]);

    // Cancel editing
    const cancelCellEdit = useCallback(() => {
        setIsEditing(false);
    }, []);

    // Navigation helper
    const navigateToCell = useCallback((rowIndex: number, colIndex: number) => {
        const clampedRow = Math.max(0, Math.min(rowIndex, totalCombinedRows - 1));
        const clampedCol = Math.max(0, Math.min(colIndex, fields.length - 1));

        let targetRowId = "";
        let isDraft = false;

        if (clampedRow < records.length) {
            targetRowId = records[clampedRow].id;
        } else {
            const draftIndex = clampedRow - records.length;
            targetRowId = draftNewRows[draftIndex]?.tempId || "";
            isDraft = true;
        }

        setSelectedCell({
            rowIndex: clampedRow,
            rowId: targetRowId,
            colIndex: clampedCol,
            fieldName: fields[clampedCol].name,
            isDraftRow: isDraft
        });
    }, [records, draftNewRows, fields, totalCombinedRows]);

    // Grid Keyboard Navigation
    const handleGridKeyDown = (e: React.KeyboardEvent) => {
        if (!selectedCell) return;

        const { rowIndex, colIndex, rowId, fieldName, isDraftRow } = selectedCell;
        const currentField = fields[colIndex];

        if (!isEditing) {
            if (e.key === "ArrowUp") {
                e.preventDefault();
                if (rowIndex > 0) {
                    navigateToCell(rowIndex - 1, colIndex);
                }
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                if (rowIndex < totalCombinedRows - 1) {
                    navigateToCell(rowIndex + 1, colIndex);
                }
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                if (colIndex > 0) {
                    navigateToCell(rowIndex, colIndex - 1);
                }
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                if (colIndex < fields.length - 1) {
                    navigateToCell(rowIndex, colIndex + 1);
                }
            } else if (e.key === "Tab" && !e.shiftKey) {
                e.preventDefault();
                if (colIndex < fields.length - 1) {
                    navigateToCell(rowIndex, colIndex + 1);
                } else if (rowIndex < totalCombinedRows - 1) {
                    navigateToCell(rowIndex + 1, 0);
                }
            } else if (e.key === "Tab" && e.shiftKey) {
                e.preventDefault();
                if (colIndex > 0) {
                    navigateToCell(rowIndex, colIndex - 1);
                } else if (rowIndex > 0) {
                    navigateToCell(rowIndex - 1, fields.length - 1);
                }
            } else if (e.key === "Enter") {
                e.preventDefault();
                startEditing(selectedCell);
            } else if (e.key === " ") {
                if (currentField.type === "CHECKBOX") {
                    e.preventDefault();
                    let curVal = false;
                    if (isDraftRow) {
                        const d = draftNewRows.find(r => r.tempId === rowId);
                        curVal = !!d?.data?.[fieldName];
                    } else {
                        const rec = records.find(r => r.id === rowId);
                        curVal = !!rec?.data?.[fieldName];
                    }
                    commitCellEdit(selectedCell, !curVal);
                }
            } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                if (currentField.type !== "CHECKBOX" && currentField.type !== "DROPDOWN" && currentField.type !== "MULTI_SELECT") {
                    startEditing(selectedCell, e.key);
                }
            }
        }
    };

    // Global Paste Listener
    const handlePaste = (e: React.ClipboardEvent) => {
        if (!selectedCell) return;

        const pasteData = e.clipboardData.getData("text");
        if (!pasteData) return;

        const lines = pasteData.split(/\r?\n/).filter(line => line.trim() !== "");
        if (lines.length === 0) return;

        const gridRows = lines.map(line => line.split("\t"));

        // Single cell paste
        if (gridRows.length === 1 && gridRows[0].length === 1) {
            if (isEditing) return;
            e.preventDefault();
            commitCellEdit(selectedCell, gridRows[0][0].trim());
            return;
        }

        // Multi-cell paste -> Trigger Preview Confirmation
        e.preventDefault();

        const targetRowIndex = selectedCell.rowIndex;
        const targetColIndex = selectedCell.colIndex;

        let affectedExisting = 0;
        let affectedNew = 0;

        gridRows.forEach((_, rOffset) => {
            const destRowIdx = targetRowIndex + rOffset;
            if (destRowIdx < records.length) {
                affectedExisting++;
            } else {
                affectedNew++;
            }
        });

        setPastePreview({
            targetRowIndex,
            targetColIndex,
            rowsData: gridRows,
            affectedExistingCount: affectedExisting,
            affectedNewCount: affectedNew
        });
    };

    // Apply multi-cell paste
    const applyPasteData = async () => {
        if (!pastePreview) return;
        setIsApplyingPaste(true);

        const { targetRowIndex, targetColIndex, rowsData } = pastePreview;

        for (let rIdx = 0; rIdx < rowsData.length; rIdx++) {
            const rowValues = rowsData[rIdx];
            const destRowIdx = targetRowIndex + rIdx;

            if (destRowIdx < records.length) {
                const rec = records[destRowIdx];
                for (let cIdx = 0; cIdx < rowValues.length; cIdx++) {
                    const destColIdx = targetColIndex + cIdx;
                    if (destColIdx < fields.length) {
                        const fieldName = fields[destColIdx].name;
                        const val = rowValues[cIdx].trim();
                        await onSaveCell(rec.id, fieldName, val, true);
                    }
                }
            } else {
                const rowData: Record<string, any> = {};
                for (let cIdx = 0; cIdx < rowValues.length; cIdx++) {
                    const destColIdx = targetColIndex + cIdx;
                    if (destColIdx < fields.length) {
                        const fieldName = fields[destColIdx].name;
                        rowData[fieldName] = rowValues[cIdx].trim();
                    }
                }
                if (Object.keys(rowData).length > 0) {
                    await onCreateRow(rowData);
                }
            }
        }

        setIsApplyingPaste(false);
        setPastePreview(null);
    };

    // Render cell content based on mode & type
    const renderCellContent = (rowId: string, isDraftRow: boolean, field: FieldDef, rIndex: number, cIndex: number) => {
        let val: any = "";
        let errorMsg = "";

        if (isDraftRow) {
            const draft = draftNewRows.find(r => r.tempId === rowId);
            val = draft?.data?.[field.name];
            errorMsg = draft?.errors?.[field.name] || "";
        } else {
            const rec = records.find(r => r.id === rowId);
            val = rec?.data?.[field.name];
            const cellKey = getCellKey(rowId, field.name);
            errorMsg = cellErrors[cellKey] || "";
        }

        const isSelected = selectedCell?.rowId === rowId && selectedCell?.fieldName === field.name;
        const isCellEditing = isSelected && isEditing;
        const cellKey = getCellKey(rowId, field.name);
        const isSaving = savingCellKey === cellKey;
        const isRecentlySaved = recentlySavedCellKey === cellKey;

        let parsedOptions = field.options;
        if (typeof parsedOptions === "string") {
            try { parsedOptions = JSON.parse(parsedOptions); } catch { }
        }

        if (isCellEditing) {
            switch (field.type) {
                case "LONG_TEXT":
                    return (
                        <div className="relative w-full">
                            <textarea
                                ref={inputRef as any}
                                rows={2}
                                className="w-full text-xs p-1.5 bg-white border border-blue-600 rounded shadow-md z-20 focus:outline-none resize-y min-h-[40px] leading-snug"
                                value={editValue || ""}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                        e.preventDefault();
                                        commitCellEdit(selectedCell!, editValue);
                                        navigateToCell(rIndex + 1, cIndex);
                                    } else if (e.key === "Escape") {
                                        e.preventDefault();
                                        cancelCellEdit();
                                    }
                                }}
                                onBlur={() => commitCellEdit(selectedCell!, editValue)}
                            />
                            <span className="text-[9px] text-gray-400 block mt-0.5">Ctrl+Enter to save</span>
                        </div>
                    );
                case "DROPDOWN":
                    return (
                        <Select
                            value={editValue || ""}
                            onValueChange={(v) => {
                                setEditValue(v);
                                commitCellEdit(selectedCell!, v);
                            }}
                        >
                            <SelectTrigger className="h-7 text-xs bg-white border-blue-600 focus:ring-0">
                                <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent className="z-30">
                                {Array.isArray(parsedOptions) && parsedOptions.map((opt: string) => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    );
                case "MULTI_SELECT":
                    const currentArr = Array.isArray(editValue) ? editValue : [];
                    return (
                        <MultiSelectCellEditor
                            options={Array.isArray(parsedOptions) ? parsedOptions : []}
                            selected={currentArr}
                            onChange={(newArr) => {
                                setEditValue(newArr);
                                commitCellEdit(selectedCell!, newArr);
                            }}
                            onClose={cancelCellEdit}
                        />
                    );
                case "CHECKBOX":
                    return (
                        <div className="flex items-center justify-center h-full">
                            <Checkbox
                                checked={!!editValue}
                                onCheckedChange={(checked) => {
                                    setEditValue(!!checked);
                                    commitCellEdit(selectedCell!, !!checked);
                                }}
                            />
                        </div>
                    );
                case "NUMBER":
                case "EMAIL":
                case "PHONE":
                case "URL":
                case "DATE":
                case "TEXT":
                default:
                    return (
                        <Input
                            ref={inputRef as any}
                            type={field.type === "NUMBER" ? "number" : field.type === "EMAIL" ? "email" : field.type === "DATE" ? "date" : field.type === "URL" ? "url" : field.type === "PHONE" ? "tel" : "text"}
                            className="h-7 text-xs px-1.5 bg-white border-2 border-[#534AB7] focus-visible:ring-0 rounded-none w-full font-sans text-slate-900"
                            value={editValue !== undefined && editValue !== null ? editValue : ""}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    commitCellEdit(selectedCell!, editValue);
                                    // Enter moves to same column in NEXT row
                                    navigateToCell(rIndex + 1, cIndex);
                                } else if (e.key === "Tab") {
                                    e.preventDefault();
                                    commitCellEdit(selectedCell!, editValue);
                                    // Tab moves to NEXT column
                                    if (e.shiftKey) {
                                        navigateToCell(rIndex, cIndex - 1);
                                    } else {
                                        navigateToCell(rIndex, cIndex + 1);
                                    }
                                } else if (e.key === "Escape") {
                                    e.preventDefault();
                                    cancelCellEdit();
                                }
                            }}
                            onBlur={() => commitCellEdit(selectedCell!, editValue)}
                        />
                    );
            }
        }

        // Standard Display Mode
        let displayStr = "";
        if (field.type === "CHECKBOX") {
            displayStr = val ? "Yes" : "No";
        } else if (field.type === "MULTI_SELECT" && Array.isArray(val)) {
            displayStr = val.join(", ");
        } else if (val !== undefined && val !== null && val !== "") {
            displayStr = String(val);
        }

        return (
            <div className="flex items-center justify-between w-full h-full min-h-[28px] px-2 py-1 text-xs truncate select-none group/cell">
                <span className={`truncate ${!displayStr ? 'text-slate-400 italic' : 'text-slate-800'}`}>
                    {displayStr || (isSelected ? "" : "-")}
                </span>
                {isSaving && <span title="Saving..." className="shrink-0 ml-1"><Loader2 className="w-3 h-3 text-[#534AB7] animate-spin" /></span>}
                {isRecentlySaved && <span title="Saved" className="shrink-0 ml-1"><Check className="w-3.5 h-3.5 text-emerald-600 animate-in fade-in" /></span>}
                {errorMsg && <span title={errorMsg} className="shrink-0 ml-1"><AlertCircle className="w-3.5 h-3.5 text-rose-500" /></span>}
            </div>
        );
    };

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            onKeyDown={handleGridKeyDown}
            onPaste={handlePaste}
            className="flex-1 flex flex-col min-h-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden focus:outline-none"
        >
            {/* Grid Header Controls */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
                <div className="flex items-center space-x-3">
                    <span className="font-semibold text-slate-700">Spreadsheet Workspace Grid</span>
                    <span className="text-slate-300">|</span>
                    <span>Auto-saves on Tab / Enter / Blur</span>
                    <span>• Sticky 2D Scrolling</span>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs border-slate-200 hover:bg-slate-100 text-slate-700" onClick={onBulkImportOpen}>
                        Bulk Paste Dialog
                    </Button>
                    <Button size="sm" className="h-7 text-xs shadow-sm bg-[#534AB7] hover:bg-[#7F77DD] text-white font-medium" onClick={addDraftRow}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> New Record
                    </Button>
                </div>
            </div>

            {/* Bounded Scrollable Table Grid Container (Sticky Top Header & Sticky Left Row Numbers) */}
            <div className="flex-1 overflow-auto relative max-w-full max-h-full">
                <table className="min-w-full text-left text-xs whitespace-nowrap border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-20 backdrop-blur-sm select-none">
                        <tr>
                            {/* Sticky Top-Left Corner Column for Row Numbers */}
                            <th className="w-10 px-2 py-2.5 text-center text-[10px] font-semibold text-slate-500 border-r border-slate-200 uppercase bg-slate-50 sticky left-0 z-30 shadow-sm">
                                #
                            </th>
                            {fields.map(f => (
                                <th key={f.id} className="px-3 py-2.5 font-semibold text-slate-700 uppercase tracking-wider border-r border-slate-200 bg-slate-50">
                                    <div className="flex items-center justify-between space-x-1">
                                        <span className="truncate">{f.name} {f.isRequired && <span className="text-rose-500">*</span>}</span>
                                        <span className="text-[10px] text-slate-400 font-normal lowercase">({f.type.toLowerCase().replace('_', ' ')})</span>
                                    </div>
                                </th>
                            ))}
                            {/* Sticky Top-Right Corner Column for Actions */}
                            <th className="w-24 px-3 py-2.5 text-right font-semibold text-slate-500 sticky right-0 bg-slate-50 backdrop-blur-sm border-l border-slate-200 z-30">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80">
                        {/* Existing Record Rows */}
                        {records.map((record, rIdx) => {
                            const globalRowIndex = ((currentPage - 1) * 25) + rIdx + 1;
                            return (
                                <tr key={record.id} className="hover:bg-slate-50/60 transition-colors group">
                                    {/* Sticky Left Row Index Cell */}
                                    <td className="text-center text-[11px] font-mono text-slate-400 border-r border-slate-200 py-1 bg-slate-50/90 sticky left-0 z-10 select-none shadow-sm">
                                        {globalRowIndex}
                                    </td>
                                    {fields.map((f, cIdx) => {
                                        const isSelected = selectedCell?.rowId === record.id && selectedCell?.fieldName === f.name;
                                        const cellKey = getCellKey(record.id, f.name);
                                        const hasError = !!cellErrors[cellKey];

                                        return (
                                            <td
                                                key={f.id}
                                                onClick={() => {
                                                    setSelectedCell({ rowIndex: rIdx, rowId: record.id, colIndex: cIdx, fieldName: f.name, isDraftRow: false });
                                                }}
                                                onDoubleClick={() => {
                                                    startEditing({ rowIndex: rIdx, rowId: record.id, colIndex: cIdx, fieldName: f.name, isDraftRow: false });
                                                }}
                                                className={`p-0 border-r border-slate-200 relative transition-all max-w-[240px] ${
                                                    isSelected
                                                        ? 'ring-2 ring-[#534AB7] ring-inset bg-[#EEEDFE]/60 z-10'
                                                        : hasError
                                                        ? 'bg-rose-50/60 border-rose-300'
                                                        : ''
                                                }`}
                                            >
                                                {renderCellContent(record.id, false, f, rIdx, cIdx)}
                                            </td>
                                        );
                                    })}
                                    {/* Sticky Right Action Buttons */}
                                    <td className="px-2 py-1 sticky right-0 bg-white group-hover:bg-slate-50/60 text-right border-l border-slate-200 space-x-1 z-10">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200 bg-transparent hover:bg-white shadow-none transition-all"
                                            title="Full Edit Dialog"
                                            onClick={() => onOpenEditModal(record)}
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                            title="Delete Record"
                                            onClick={() => onDeleteRecord(record.id)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}

                        {/* Multiple Draft New Rows */}
                        {draftNewRows.map((draftRow, dIdx) => {
                            const rIdx = records.length + dIdx;
                            const hasRowErrors = Object.keys(draftRow.errors).length > 0;

                            return (
                                <tr key={draftRow.tempId} className="bg-[#EEEDFE]/30 border-b border-[#7F77DD]/30 transition-colors animate-in fade-in duration-150">
                                    {/* Sticky Left Plus Badge Cell */}
                                    <td className="text-center font-bold text-[#534AB7] border-r border-[#7F77DD]/30 text-[11px] py-1 bg-[#EEEDFE] sticky left-0 z-10 select-none shadow-sm">
                                        +
                                    </td>
                                    {fields.map((f, cIdx) => {
                                        const isSelected = selectedCell?.rowId === draftRow.tempId && selectedCell?.fieldName === f.name;
                                        const hasCellError = !!draftRow.errors[f.name];

                                        return (
                                            <td
                                                key={f.id}
                                                onClick={() => {
                                                    setSelectedCell({ rowIndex: rIdx, rowId: draftRow.tempId, colIndex: cIdx, fieldName: f.name, isDraftRow: true });
                                                }}
                                                onDoubleClick={() => {
                                                    startEditing({ rowIndex: rIdx, rowId: draftRow.tempId, colIndex: cIdx, fieldName: f.name, isDraftRow: true });
                                                }}
                                                className={`p-0 border-r border-[#7F77DD]/20 relative ${
                                                    isSelected
                                                        ? 'ring-2 ring-[#534AB7] ring-inset bg-[#EEEDFE] z-10'
                                                        : hasCellError
                                                        ? 'bg-rose-50 border-rose-300'
                                                        : ''
                                                }`}
                                            >
                                                {renderCellContent(draftRow.tempId, true, f, rIdx, cIdx)}
                                            </td>
                                        );
                                    })}
                                    {/* Sticky Right Draft Actions */}
                                    <td className="px-2 py-1 sticky right-0 bg-[#EEEDFE]/90 backdrop-blur-sm text-right border-l border-[#7F77DD]/30 space-x-1 z-10">
                                        <div className="flex items-center justify-end space-x-1">
                                            {hasRowErrors ? (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-6 text-[11px] px-2 bg-rose-600 text-white hover:bg-rose-700 shadow-sm flex items-center gap-1"
                                                    onClick={() => saveDraftRow(draftRow.tempId)}
                                                    disabled={draftRow.isSaving}
                                                    title="Retry Auto-Save"
                                                >
                                                    <RefreshCw className="w-3 h-3" />
                                                    <span>Retry</span>
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    className="h-6 text-[11px] px-2 bg-[#534AB7] text-white hover:bg-[#7F77DD] shadow-sm flex items-center gap-1"
                                                    onClick={() => saveDraftRow(draftRow.tempId)}
                                                    disabled={draftRow.isSaving || isPending}
                                                    title="Save Row"
                                                >
                                                    {draftRow.isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                                    <span>Save</span>
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 rounded"
                                                onClick={() => removeDraftRow(draftRow.tempId)}
                                                disabled={draftRow.isSaving}
                                                title="Cancel / Remove Row"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                        {hasRowErrors && draftRow.errors._general && (
                                            <p className="text-[10px] text-rose-600 font-medium pt-0.5">{draftRow.errors._general}</p>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Bottom Row Controls */}
            <div className="p-2 border-t border-gray-200 bg-gray-50/50 flex items-center justify-between shrink-0">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-600 hover:text-gray-900 font-medium" onClick={addDraftRow}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Blank Row to Sheet
                </Button>
                <div className="text-[11px] text-gray-500 flex items-center space-x-3">
                    {draftNewRows.length > 0 && (
                        <span className="font-semibold text-[#534AB7]">{draftNewRows.length} unsaved draft row(s) active (auto-saves on fill)</span>
                    )}
                    <span>Showing {records.length} saved records</span>
                </div>
            </div>

            {/* Duplicate Warning Dialog */}
            {dupCellWarning && (
                <Dialog open={!!dupCellWarning} onOpenChange={() => setDupCellWarning(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-semibold flex items-center text-orange-800">
                                <Info className="w-5 h-5 mr-2 text-orange-600" />
                                Duplicate Match Warning
                            </DialogTitle>
                            <DialogDescription>
                                Match found for field <span className="font-semibold text-gray-900">{dupCellWarning.dupField}</span> with value <span className="font-semibold text-gray-900">"{dupCellWarning.dupValue}"</span>.
                            </DialogDescription>
                        </DialogHeader>
                        <p className="text-xs text-gray-600 py-2">
                            Do you want to update this cell anyway?
                        </p>
                        <DialogFooter>
                            <Button variant="outline" size="sm" onClick={() => setDupCellWarning(null)}>
                                Cancel & Revert
                            </Button>
                            <Button
                                size="sm"
                                className="bg-rose-600 text-white hover:bg-rose-700"
                                onClick={async () => {
                                    const { recordId, fieldName, newValue } = dupCellWarning;
                                    setDupCellWarning(null);
                                    await onSaveCell(recordId, fieldName, newValue, true);
                                }}
                            >
                                Update Anyway
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Multi-Cell Paste Preview & Confirmation Dialog */}
            {pastePreview && (
                <Dialog open={!!pastePreview} onOpenChange={() => setPastePreview(null)}>
                    <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                        <DialogHeader className="pb-2 border-b border-gray-100">
                            <DialogTitle className="text-lg font-semibold">Confirm Multi-Cell Paste</DialogTitle>
                            <DialogDescription>
                                You are about to paste data affecting <span className="font-semibold text-gray-900">{pastePreview.rowsData.length}</span> rows starting from row {pastePreview.targetRowIndex + 1}.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-3 text-xs space-y-3 flex-1 overflow-auto">
                            <div className="flex space-x-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div>
                                    <span className="text-gray-500">Existing Records Updated:</span>{" "}
                                    <span className="font-bold text-gray-900">{pastePreview.affectedExistingCount}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">New Rows Created:</span>{" "}
                                    <span className="font-bold text-[#534AB7]">{pastePreview.affectedNewCount}</span>
                                </div>
                            </div>

                            <p className="font-medium text-gray-700">Preview of pasted values:</p>
                            <div className="border border-gray-200 rounded-md overflow-x-auto max-h-48">
                                <table className="min-w-full text-[11px] whitespace-nowrap">
                                    <tbody className="divide-y divide-gray-100">
                                        {pastePreview.rowsData.slice(0, 5).map((row, rI) => (
                                            <tr key={rI} className="bg-white">
                                                <td className="px-2 py-1 bg-gray-50 font-mono text-gray-400 text-center border-r border-gray-100 w-8">
                                                    {pastePreview.targetRowIndex + rI + 1}
                                                </td>
                                                {row.map((val, cI) => (
                                                    <td key={cI} className="px-2 py-1 border-r border-gray-100 text-gray-700 max-w-[150px] truncate">
                                                        {val || <span className="text-gray-300 italic">empty</span>}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {pastePreview.rowsData.length > 5 && (
                                <p className="text-[11px] text-gray-400 italic">...and {pastePreview.rowsData.length - 5} more rows</p>
                            )}
                        </div>

                        <DialogFooter className="pt-3 border-t border-gray-100">
                            <Button variant="outline" size="sm" onClick={() => setPastePreview(null)} disabled={isApplyingPaste}>
                                Cancel
                            </Button>
                            <Button size="sm" className="bg-[#534AB7] text-white hover:bg-[#7F77DD]" onClick={applyPasteData} disabled={isApplyingPaste}>
                                {isApplyingPaste ? "Applying Paste..." : "Confirm & Apply Paste"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
});

SpreadsheetGrid.displayName = "SpreadsheetGrid";
