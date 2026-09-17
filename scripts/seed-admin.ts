import prisma from "../src/lib/prisma";
import crypto from "crypto";

function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    return `${salt}:${hash}`;
}

async function main() {
    const email = process.env.ADMIN_EMAIL || "admin@company.com";
    const password = process.env.ADMIN_PASSWORD || "AdminPass123!";
    const name = process.env.ADMIN_NAME || "System Administrator";

    const emailNormalized = email.toLowerCase().trim();
    const existing = await prisma.employee.findFirst({ where: { email: emailNormalized } });

    if (existing) {
        console.log(`[SEED] Admin account '${emailNormalized}' already exists. Updating role to ADMIN...`);
        await prisma.employee.update({
            where: { id: existing.id },
            data: {
                role: "ADMIN",
                status: "ACTIVE",
                passwordHash: hashPassword(password)
            }
        });
        console.log(`[SEED] Successfully updated existing user to ADMIN role.`);
        return;
    }

    console.log(`[SEED] Creating new ADMIN account: ${emailNormalized}`);
    const admin = await prisma.employee.create({
        data: {
            name,
            email: emailNormalized,
            passwordHash: hashPassword(password),
            role: "ADMIN",
            status: "ACTIVE",
            emailVerified: true
        }
    });

    // Create Admin initial workspace
    await prisma.workspace.create({
        data: {
            name: "Admin Control Workspace",
            employeeId: admin.id,
            fields: {
                create: [
                    { name: "Name", type: "TEXT", isRequired: true, order: 0 },
                    { name: "Company", type: "TEXT", isRequired: false, order: 1 },
                    { name: "Email", type: "EMAIL", isRequired: false, order: 2 },
                    { name: "Phone Number", type: "PHONE", isRequired: false, order: 3 }
                ]
            }
        }
    });

    console.log(`[SEED] Admin provisioning completed successfully. Admin ID: ${admin.id}`);
}

main()
    .catch(e => {
        console.error("[SEED ERROR]", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
