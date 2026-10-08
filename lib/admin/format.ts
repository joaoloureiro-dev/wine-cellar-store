export const dateTime = new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Lisbon",
});

export const shortDate = new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    timeZone: "Europe/Lisbon",
});

export const actorLabels: Record<string, string> = {
    CUSTOMER: "Cliente",
    ADMIN: "Backoffice",
    SYSTEM: "Sistema",
};

export const paymentStatusLabels: Record<string, string> = {
    PENDING: "Pendente",
    PAID: "Pago",
    FAILED: "Falhado",
    EXPIRED: "Expirado",
    CANCELLED: "Cancelado",
};

export const paymentProviderLabels: Record<string, string> = {
    IFTHENPAY: "ifthenpay",
    EUPAGO: "eupago",
    STRIPE: "Stripe",
    MANUAL: "Manual",
};

export const auditActionLabels: Record<string, string> = {
    "order.transition": "Estado alterado",
    "payment.confirm_manual": "Transferência confirmada",
    "reservation.transition": "Estado alterado",
    "reservation.notes": "Notas internas atualizadas",
    "product.update": "Produto atualizado",
};

export function stockStatusTone(status: string) {
    switch (status) {
        case "IN_STOCK":
            return "success" as const;
        case "LOW_STOCK":
            return "warning" as const;
        case "PREORDER":
            return "info" as const;
        default:
            return "neutral" as const;
    }
}

const productFieldLabels: Record<string, string> = {
    priceCents: "preço",
    compareAtPriceCents: "preço anterior",
    stockQuantity: "stock",
    stockStatus: "disponibilidade",
    active: "visibilidade",
    featured: "destaque",
};

/** "Produto criado", "Detalhes", or "preço, stock" for a product audit entry. */
export function describeProductAudit(action: string, data: unknown) {
    if (action === "product.create") return "produto criado";
    if (action === "product.details_update") return "detalhes e especificações";
    return describeProductChanges(data);
}

/** "preço, stock" from a product.update audit entry. */
export function describeProductChanges(data: unknown) {
    if (!data || typeof data !== "object") return "sem alterações";
    const keys = Object.keys(data);
    return keys.length > 0 ? keys.map((key) => productFieldLabels[key] ?? key).join(", ") : "sem alterações";
}
