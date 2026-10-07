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
