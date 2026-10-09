import type { ReactNode } from "react";

export function AccountHeading({
    title,
    description,
    action,
}: {
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className="text-balance font-display text-[2.5rem] font-medium leading-none tracking-[-0.04em] text-charcoal sm:text-5xl">
                    {title}
                </h1>
                {description && <p className="mt-3 text-sm text-muted">{description}</p>}
            </div>
            {action}
        </div>
    );
}
