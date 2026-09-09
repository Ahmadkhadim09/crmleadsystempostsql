import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FieldOptionsSchema = z.array(z.string()).optional().nullable();

const CreateFieldSchema = z.object({
    workspaceId: z.string().min(1),
    name: z.string().min(1, "Name is required"),
    type: z.string().min(1),
    options: FieldOptionsSchema,
    isRequired: z.boolean().default(false),
    order: z.number().default(0)
});

async function main() {
    const data = {
        workspaceId: "test_workspace_2",
        name: "Test Field " + Date.now(),
        type: "DROPDOWN",
        options: ["A", "B"],
        isRequired: false,
        order: 0
    };

    const result = CreateFieldSchema.safeParse(data);
    if (!result.success) {
        console.log("Zod failed:", result.error);
        return;
    }

    try {
        const field = await prisma.fieldDefinition.create({
            data: {
                workspaceId: result.data.workspaceId,
                name: result.data.name,
                type: result.data.type,
                options: result.data.options ? result.data.options : undefined,
                isRequired: result.data.isRequired,
                order: result.data.order
            }
        });
        console.log("Created successfully:", field);
    } catch (e) {
        console.error("Prisma error:", e);
    }
}
main().finally(() => prisma.$disconnect());
