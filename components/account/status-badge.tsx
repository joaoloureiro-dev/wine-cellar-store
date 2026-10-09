const tones = {
    warning: "bg-warning/10 text-warning",
    success: "bg-success/10 text-success",
    neutral: "bg-surface-muted text-muted",
    info: "bg-wine-light text-wine",
} as const;

export function StatusBadge({ label, tone }: { label: string; tone: keyof typeof tones }) {
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
            {label}
        </span>
    );
}

export function orderStatusTone(status: string): keyof typeof tones {
    switch (status) {
        case "AWAITING_PAYMENT":
            return "warning";
        case "PAID":
        case "PROCESSING":
        case "SHIPPED":
            return "info";
        case "DELIVERED":
            return "success";
        default:
            return "neutral";
    }
}

export function reservationStatusTone(status: string): keyof typeof tones {
    switch (status) {
        case "PENDING":
        case "AWAITING_PAYMENT":
            return "warning";
        case "CONFIRMED":
            return "info";
        case "PAID":
            return "success";
        default:
            return "neutral";
    }
}
