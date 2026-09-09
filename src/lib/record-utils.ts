import { Prisma } from "@prisma/client";

export type FilterOperator =
    | "eq" | "neq" | "contains" | "not_contains"
    | "gt" | "lt" | "gte" | "lte"
    | "before" | "after" | "on"
    | "checked" | "unchecked";

export interface ParsedFilter {
    fieldName: string;
    operator: FilterOperator;
    value: string;
}

export function parseFilters(searchParams: { [key: string]: string | string[] | undefined }): ParsedFilter[] {
    const filters: ParsedFilter[] = [];

    for (const [key, rawValue] of Object.entries(searchParams)) {
        if (key.startsWith("f_") && rawValue) {
            const fieldName = key.substring(2);
            const values = Array.isArray(rawValue) ? rawValue : [rawValue];

            for (const val of values) {
                const colonIdx = val.indexOf(":");
                if (colonIdx > -1) {
                    const operator = val.substring(0, colonIdx) as FilterOperator;
                    const value = val.substring(colonIdx + 1);
                    filters.push({ fieldName, operator, value });
                } else if (val === "checked" || val === "unchecked") {
                    filters.push({ fieldName, operator: val as FilterOperator, value: "" });
                }
            }
        }
    }
    return filters;
}

export function buildRecordsQuery(
    workspaceId: string,
    fields: any[],
    globalSearch: string,
    filters: ParsedFilter[],
    sortField: string | null,
    sortDirection: "asc" | "desc",
    take: number,
    skip: number
) {
    // Validate fields to prevent SQL injection via crafted field names
    const validFieldNames = new Set(fields.map(f => f.name));

    const conditions: Prisma.Sql[] = [Prisma.sql`"workspaceId" = ${workspaceId}`];

    if (globalSearch) {
        const searchConditions: Prisma.Sql[] = [];
        for (const f of fields) {
            if (f.type === "TEXT" || f.type === "LONG_TEXT" || f.type === "EMAIL" || f.type === "PHONE" || f.type === "URL") {
                searchConditions.push(Prisma.sql`data->>${f.name} ILIKE ${'%' + globalSearch + '%'}`);
            }
        }
        if (searchConditions.length > 0) {
            conditions.push(Prisma.sql`(${Prisma.join(searchConditions, ' OR ')})`);
        } else {
            conditions.push(Prisma.sql`1=0`); // No textual fields to search
        }
    }

    for (const filter of filters) {
        if (!validFieldNames.has(filter.fieldName)) continue;

        const fieldDef = fields.find(f => f.name === filter.fieldName);
        if (!fieldDef) continue;

        // Safety identifier (which is safe because it's validated against workspace fields)
        const fieldStr = filter.fieldName;

        switch (filter.operator) {
            case "eq":
            case "on":
                conditions.push(Prisma.sql`data->>${fieldStr} = ${filter.value}`);
                break;
            case "neq":
                conditions.push(Prisma.sql`data->>${fieldStr} != ${filter.value} OR data->>${fieldStr} IS NULL`);
                break;
            case "contains":
                conditions.push(Prisma.sql`data->>${fieldStr} ILIKE ${'%' + filter.value + '%'}`);
                break;
            case "not_contains":
                conditions.push(Prisma.sql`data->>${fieldStr} NOT ILIKE ${'%' + filter.value + '%'} OR data->>${fieldStr} IS NULL`);
                break;
            case "gt":
            case "after":
                if (fieldDef.type === "NUMBER") {
                    conditions.push(Prisma.sql`(data->>${fieldStr})::numeric > ${Number(filter.value)}`);
                } else {
                    conditions.push(Prisma.sql`data->>${fieldStr} > ${filter.value}`);
                }
                break;
            case "gte":
                if (fieldDef.type === "NUMBER") {
                    conditions.push(Prisma.sql`(data->>${fieldStr})::numeric >= ${Number(filter.value)}`);
                }
                break;
            case "lt":
            case "before":
                if (fieldDef.type === "NUMBER") {
                    conditions.push(Prisma.sql`(data->>${fieldStr})::numeric < ${Number(filter.value)}`);
                } else {
                    conditions.push(Prisma.sql`data->>${fieldStr} < ${filter.value}`);
                }
                break;
            case "lte":
                if (fieldDef.type === "NUMBER") {
                    conditions.push(Prisma.sql`(data->>${fieldStr})::numeric <= ${Number(filter.value)}`);
                }
                break;
            case "checked":
                conditions.push(Prisma.sql`(data->>${fieldStr}) = 'true'`);
                break;
            case "unchecked":
                conditions.push(Prisma.sql`(data->>${fieldStr}) != 'true' OR data->>${fieldStr} IS NULL`);
                break;
        }
    }

    const whereClause = Prisma.join(conditions, ' AND ');

    let orderClause = Prisma.sql`ORDER BY "createdAt" DESC`;
    if (sortField && validFieldNames.has(sortField)) {
        const fieldDef = fields.find(f => f.name === sortField);
        if (fieldDef?.type === "NUMBER") {
            orderClause = sortDirection === "asc"
                ? Prisma.sql`ORDER BY (data->>${sortField})::numeric ASC`
                : Prisma.sql`ORDER BY (data->>${sortField})::numeric DESC`;
        } else {
            orderClause = sortDirection === "asc"
                ? Prisma.sql`ORDER BY data->>${sortField} ASC`
                : Prisma.sql`ORDER BY data->>${sortField} DESC`;
        }
    }

    // Final queries
    const recordsQuery = Prisma.sql`
    SELECT id, "workspaceId", "createdById", "updatedById", data, "createdAt", "updatedAt"
    FROM "Record"
    WHERE ${whereClause}
    ${orderClause}
    LIMIT ${take} OFFSET ${skip}
  `;

    const countQuery = Prisma.sql`
    SELECT CAST(COUNT(*) AS integer) as count
    FROM "Record"
    WHERE ${whereClause}
  `;

    return { recordsQuery, countQuery };
}
