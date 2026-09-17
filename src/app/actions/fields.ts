"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireWorkspaceAccess } from "@/lib/auth";

const FieldOptionsSchema = z.array(z.string()).optional().nullable();

const CreateFieldSchema = z.object({
    workspaceId: z.string().min(1),
    name: z.string().min(1, "Name is required"),
    type: z.string().min(1),
    options: FieldOptionsSchema,
    isRequired: z.boolean().default(false),
    order: z.number().default(0)
});

const UpdateFieldSchema = CreateFieldSchema.extend({
    id: z.string().min(1)
});

const ReorderFieldsSchema = z.object({
    workspaceId: z.string().min(1),
    fields: z.array(z.object({
        id: z.string().min(1),
        order: z.number()
    }))
});

export async function createFieldDefinition(data: z.infer<typeof CreateFieldSchema>) {
    const result = CreateFieldSchema.safeParse(data);

    if (!result.success) {
        return { success: false, error: "Validation failed: " + JSON.stringify(result.error.issues) };
    }

    try {
        await requireWorkspaceAccess(result.data.workspaceId);

        const field = await prisma.fieldDefinition.create({
            data: {
                workspaceId: result.data.workspaceId,
                name: result.data.name,
                type: result.data.type,
                options: result.data.options ? result.data.options : Prisma.DbNull,
                isRequired: result.data.isRequired,
                order: result.data.order
            }
        });

        revalidatePath(`/workspaces/${result.data.workspaceId}/settings`);
        return { success: true, data: field };
    } catch (error: any) {
        return { success: false, error: "Failed to create field: " + (error.message || String(error)) };
    }
}

export async function updateFieldDefinition(data: z.infer<typeof UpdateFieldSchema>) {
    const result = UpdateFieldSchema.safeParse(data);

    if (!result.success) {
        return { success: false, error: result.error.issues[0].message };
    }

    try {
        await requireWorkspaceAccess(result.data.workspaceId);

        const field = await prisma.fieldDefinition.update({
            where: { id: result.data.id },
            data: {
                name: result.data.name,
                type: result.data.type,
                options: result.data.options ? result.data.options : Prisma.DbNull,
                isRequired: result.data.isRequired,
                order: result.data.order
            }
        });

        revalidatePath(`/workspaces/${result.data.workspaceId}/settings`);
        return { success: true, data: field };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to update field" };
    }
}

export async function deleteFieldDefinition(id: string, workspaceId: string) {
    try {
        await requireWorkspaceAccess(workspaceId);

        const field = await prisma.fieldDefinition.delete({
            where: { id }
        });

        revalidatePath(`/workspaces/${workspaceId}/settings`);
        return { success: true, data: field };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to delete field" };
    }
}

export async function reorderFieldDefinitions(data: z.infer<typeof ReorderFieldsSchema>) {
    const result = ReorderFieldsSchema.safeParse(data);

    if (!result.success) {
        return { success: false, error: result.error.issues[0].message };
    }

    try {
        await requireWorkspaceAccess(result.data.workspaceId);

        await prisma.$transaction(
            result.data.fields.map(field =>
                prisma.fieldDefinition.update({
                    where: { id: field.id },
                    data: { order: field.order }
                })
            )
        );

        revalidatePath(`/workspaces/${result.data.workspaceId}/settings`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to reorder fields" };
    }
}
