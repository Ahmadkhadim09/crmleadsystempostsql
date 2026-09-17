import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_RNeh60JMcTkf@ep-flat-smoke-aeu0ajm9-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require",
    },
});
