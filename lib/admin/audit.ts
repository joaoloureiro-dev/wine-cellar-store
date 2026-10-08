import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { Admin } from "@/lib/admin/auth";

type AuditEntry = {
    action: string;
    entityType: "order" | "reservation" | "product" | "payment" | "brand";
    entityId: string;
    data?: Prisma.InputJsonValue;
};

/** Records a backoffice change inside the same transaction as the change. */
export async function recordAudit(tx: Prisma.TransactionClient, admin: Admin, entry: AuditEntry) {
    await tx.adminAuditLog.create({
        data: { actorId: admin.id, actorEmail: admin.email, ...entry },
    });
}
