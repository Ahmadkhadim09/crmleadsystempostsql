"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const CreateEmployeeSchema = z.object({
    name: z.string().min(1, "Name is required")
});

export async function createEmployee(data: { name: string }) {
    const result = CreateEmployeeSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.issues[0].message };
    }

    try {
        const employee = await prisma.employee.create({
            data: { name: result.data.name }
        });
        revalidatePath("/");
        revalidatePath("/overview");
        return { success: true, employeeId: employee.id };
    } catch (e: any) {
        console.error("error creating employee:", e);
        return { success: false, error: "Failed to create employee: " + (e.message || String(e)) };
    }
}
