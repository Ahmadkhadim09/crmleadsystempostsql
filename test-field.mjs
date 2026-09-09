// Testing PRisma
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    try {
        const ws = await prisma.workspace.findFirst();
        if (!ws) {
            console.log("No workspaces found");
            return;
        }

        console.log("Found workspace:", ws.id);

        const field = await prisma.fieldDefinition.create({
            data: {
                workspaceId: ws.id,
                name: "Test Field" + Date.now(),
                type: "TEXT",
                options: undefined,
                isRequired: false,
                order: 0
            }
        });

        console.log("Created field:", field);
    } catch (e) {
        console.error("Prisma error:", e);
    }
}
main().finally(() => prisma.$disconnect());
