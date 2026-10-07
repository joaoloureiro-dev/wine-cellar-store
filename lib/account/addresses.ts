import "server-only";

import { db } from "@/lib/db";
import { MAX_ADDRESSES, type AddressInput } from "@/lib/account/schema";

export class AddressLimitError extends Error {}

/**
 * Creates or updates an address owned by `userId`. Ownership is enforced in
 * the WHERE clause (no IDOR), and the default flag is moved atomically.
 */
export async function saveAddress(userId: string, input: AddressInput, addressId?: string) {
    return db.$transaction(async (tx) => {
        const count = await tx.address.count({ where: { userId } });

        if (!addressId && count >= MAX_ADDRESSES) {
            throw new AddressLimitError(`Pode guardar até ${MAX_ADDRESSES} moradas.`);
        }

        const makeDefault = input.isDefault || count === 0;

        if (makeDefault) {
            await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
        }

        const data = {
            label: input.label ?? null,
            recipientName: input.recipientName,
            phone: input.phone,
            addressLine1: input.addressLine1,
            addressLine2: input.addressLine2 ?? null,
            postalCode: input.postalCode,
            city: input.city,
            isDefault: makeDefault,
        };

        if (addressId) {
            const { count: updated } = await tx.address.updateMany({
                where: { id: addressId, userId },
                data,
            });

            return updated === 1;
        }

        await tx.address.create({ data: { ...data, userId } });
        return true;
    });
}
