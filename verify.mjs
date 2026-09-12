import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    try {
        const empCount = await prisma.employee.count();
        const wsCount = await prisma.workspace.count();
        const records = await prisma.record.count();
        console.log(`Connection successful. Tables verified: Employee (${empCount}), Workspace (${wsCount}), Record (${records})`);
        console.log('PASS');
    } catch (err) {
        console.error('FAIL:', err.message);
        process.exit(1);
    }
}
main().then(() => process.exit(0));
