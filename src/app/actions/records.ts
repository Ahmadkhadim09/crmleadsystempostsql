"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentEmployeeId } from "./workspaces";

const RecordPayloadSchema = z.object({
    workspaceId: z.string().min(1),
    data: z.record(z.string(), z.any()),
    ignoreDuplicates: z.boolean().optional()
});

const UpdateRecordPayloadSchema = z.object({
    id: z.string().min(1),
    workspaceId: z.string().min(1),
    data: z.record(z.string(), z.any()),
    ignoreDuplicates: z.boolean().optional()
});

function normalizeValue(value: string | undefined, type: string, name: string) {
    if (value === undefined || value === null) return "";
    let str = String(value).trim();
    if (str === "") return "";

    const t = type.toUpperCase();
    const n = name.toLowerCase();

    if (t === "EMAIL" || n.includes("email")) {
        return str.toLowerCase();
    }
    if (t === "PHONE" || n.includes("phone")) {
        return str.replace(/[^\d+]/g, '');
    }
    if (t === "URL" || n.includes("website") || n.includes("url")) {
        let v = str.toLowerCase();
        v = v.replace(/^https?:\/\//, '').replace(/^www\./, '');
        return v.split('/')[0] || v;
    }
    return str.toLowerCase();
}

async function checkForDuplicates(workspaceId: string, data: Record<string, any>, fields: any[], skipRecordId?: string) {
    const candidateFields = fields.filter(f =>
        f.type === "EMAIL" ||
        f.type === "PHONE" ||
        f.type === "URL" ||
        f.name.toLowerCase().includes("email") ||
        f.name.toLowerCase().includes("phone") ||
        f.name.toLowerCase().includes("website") ||
        f.name.toLowerCase().includes("url")
    );

    for (const field of candidateFields) {
        const val = data[field.name];
        if (!val) continue;

        const normalizedVal = normalizeValue(val, field.type, field.name);
        if (!normalizedVal) continue;

        // Search inside workspace
        const recordsQuery = Prisma.sql`
            SELECT id, data FROM "Record"
            WHERE "workspaceId" = ${workspaceId}
            ${skipRecordId ? Prisma.sql`AND id != ${skipRecordId}` : Prisma.empty}
            AND data->>${field.name} IS NOT NULL
        `;
        const existingRecords: any[] = await prisma.$queryRaw(recordsQuery);

        for (const record of existingRecords) {
            const existingVal = record.data?.[field.name];
            if (existingVal) {
                if (normalizeValue(existingVal, field.type, field.name) === normalizedVal) {
                    return {
                        isDuplicate: true,
                        duplicateField: field.name,
                        duplicateValue: existingVal
                    };
                }
            }
        }
    }
    return null;
}

function validateDataAgainstFields(data: any, fields: any[]) {
    const errors: Record<string, string> = {};
    const validatedData: Record<string, any> = {};

    for (const field of fields) {
        const value = data[field.name];

        if (field.isRequired && (value === undefined || value === null || value === "")) {
            errors[field.name] = `${field.name} is required`;
            continue;
        }

        if (value !== undefined && value !== null && value === "" && !field.isRequired) {
            // Let empty string pass if not required but skip format validation
            validatedData[field.name] = value;
            continue;
        }

        if (value !== undefined && value !== null && value !== "") {
            // Type validation could be enhanced here (e.g., checking if email is valid)
            if (field.type === "EMAIL") {
                const schema = z.string().email();
                const res = schema.safeParse(value);
                if (!res.success) {
                    errors[field.name] = `Invalid email format`;
                    continue;
                }
            }
            if (field.type === "NUMBER") {
                if (isNaN(Number(value))) {
                    errors[field.name] = `Must be a number`;
                    continue;
                }
                validatedData[field.name] = Number(value);
                continue;
            }
        }

        if (value !== undefined) {
            validatedData[field.name] = value;
        }
    }

    return { errors, validatedData };
}

export async function createRecord(payload: { workspaceId: string, data: any, ignoreDuplicates?: boolean }) {
    const result = RecordPayloadSchema.safeParse(payload);
    if (!result.success) {
        return { success: false, error: "Invalid payload format" };
    }

    const { workspaceId, data, ignoreDuplicates } = result.data;

    const fields = await prisma.fieldDefinition.findMany({
        where: { workspaceId }
    });

    const { errors, validatedData } = validateDataAgainstFields(data, fields);

    if (Object.keys(errors).length > 0) {
        return { success: false, error: "Validation failed", validationErrors: errors };
    }

    if (!ignoreDuplicates) {
        const dupMatch = await checkForDuplicates(workspaceId, validatedData, fields);
        if (dupMatch) {
            return { success: false, isDuplicate: true, duplicateField: dupMatch.duplicateField, duplicateValue: dupMatch.duplicateValue };
        }
    }

    // Ensure workspace exists (like fields.ts does)
    await prisma.workspace.upsert({
        where: { id: workspaceId },
        create: {
            id: workspaceId,
            name: workspaceId.charAt(0).toUpperCase() + workspaceId.slice(1),
            employee: {
                connectOrCreate: {
                    where: { id: "default_employee" },
                    create: { id: "default_employee", name: "Default Employee" }
                }
            }
        },
        update: {}
    });

    try {
        const currentEmployeeId = await getCurrentEmployeeId();

        const record = await prisma.record.create({
            data: {
                workspaceId,
                createdById: currentEmployeeId,
                updatedById: currentEmployeeId,
                data: validatedData
            }
        });

        await prisma.activityLog.create({
            data: {
                recordId: record.id,
                employeeId: currentEmployeeId,
                action: "CREATE"
            }
        });

        revalidatePath(`/workspaces/${workspaceId}`);
        return { success: true, data: record };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to create record" };
    }
}

export async function updateRecord(payload: { id: string, workspaceId: string, data: any, ignoreDuplicates?: boolean }) {
    const result = UpdateRecordPayloadSchema.safeParse(payload);
    if (!result.success) {
        return { success: false, error: "Invalid payload format" };
    }

    const { id, workspaceId, data, ignoreDuplicates } = result.data;

    // Verify record exists and belongs to workspace
    const existingRecord = await prisma.record.findUnique({
        where: { id }
    });

    if (!existingRecord) {
        return { success: false, error: "Record not found" };
    }

    if (existingRecord.workspaceId !== workspaceId) {
        return { success: false, error: "Unauthorized: Record does not belong to this workspace" };
    }

    const fields = await prisma.fieldDefinition.findMany({
        where: { workspaceId }
    });

    const { errors, validatedData } = validateDataAgainstFields(data, fields);

    if (Object.keys(errors).length > 0) {
        return { success: false, error: "Validation failed", validationErrors: errors };
    }

    if (!ignoreDuplicates) {
        const dupMatch = await checkForDuplicates(workspaceId, validatedData, fields, id);
        if (dupMatch) {
            return { success: false, isDuplicate: true, duplicateField: dupMatch.duplicateField, duplicateValue: dupMatch.duplicateValue };
        }
    }

    try {
        const currentEmployeeId = await getCurrentEmployeeId();

        const record = await prisma.record.update({
            where: { id },
            data: {
                data: validatedData,
                updatedById: currentEmployeeId
            }
        });

        await prisma.activityLog.create({
            data: {
                recordId: record.id,
                employeeId: currentEmployeeId,
                action: "UPDATE"
            }
        });

        revalidatePath(`/workspaces/${workspaceId}`);
        return { success: true, data: record };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to update record" };
    }
}

export async function deleteRecord(id: string, workspaceId: string) {
    try {
        const existingRecord = await prisma.record.findUnique({
            where: { id }
        });

        if (!existingRecord) {
            return { success: false, error: "Record not found" };
        }

        if (existingRecord.workspaceId !== workspaceId) {
            return { success: false, error: "Unauthorized" };
        }

        await prisma.record.delete({
            where: { id }
        });

        revalidatePath(`/workspaces/${workspaceId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to delete record" };
    }
}

export async function validateBulkRecords(payload: { workspaceId: string, records: any[] }) {
    try {
        const fields = await prisma.fieldDefinition.findMany({ where: { workspaceId: payload.workspaceId } });

        const results = [];
        for (const [index, data] of payload.records.entries()) {
            const { errors, validatedData } = validateDataAgainstFields(data, fields);
            let status: "Valid" | "Warning" | "Error" = "Valid";
            const rowErrors = { ...errors };
            let warning = null;

            if (Object.keys(errors).length > 0) {
                status = "Error";
            } else {
                const dupMatch = await checkForDuplicates(payload.workspaceId, validatedData, fields);
                if (dupMatch) {
                    status = "Warning";
                    warning = `Possible duplicate match for ${dupMatch.duplicateField} (${dupMatch.duplicateValue})`;
                }
            }

            results.push({
                index,
                status,
                errors: rowErrors,
                warning,
                validatedData
            });
        }
        return { success: true, results };
    } catch (error: any) {
        return { success: false, error: error.message || "Bulk validation failed" };
    }
}

export async function bulkCreateRecords(payload: { workspaceId: string, records: any[] }) {
    try {
        const fields = await prisma.fieldDefinition.findMany({ where: { workspaceId: payload.workspaceId } });
        const currentEmployeeId = await getCurrentEmployeeId();

        let createdCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (const data of payload.records) {
            const { errors, validatedData } = validateDataAgainstFields(data, fields);
            if (Object.keys(errors).length > 0) {
                errorCount++;
                continue;
            }

            try {
                const record = await prisma.record.create({
                    data: {
                        workspaceId: payload.workspaceId,
                        createdById: currentEmployeeId,
                        updatedById: currentEmployeeId,
                        data: validatedData
                    }
                });

                await prisma.activityLog.create({
                    data: {
                        recordId: record.id,
                        employeeId: currentEmployeeId,
                        action: "CREATE"
                    }
                });
                createdCount++;
            } catch (error) {
                errorCount++;
            }
        }

        revalidatePath(`/workspaces/${payload.workspaceId}`);
        return { success: true, createdCount, errorCount, skippedCount };
    } catch (error: any) {
        return { success: false, error: error.message || "Bulk creation failed" };
    }
}
