import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const emps = await prisma.employee.findMany();
    console.log(emps);
}
main().catch(console.error).finally(() => prisma.$disconnect());
