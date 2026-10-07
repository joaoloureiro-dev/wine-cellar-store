import type { ReactNode } from "react";

type EyebrowProps = {
    children: ReactNode;
    tone?: "light" | "dark";
    className?: string;
};

/** Small uppercase label above a heading, led by a fine champagne line. */
export function Eyebrow({ children, tone = "light", className = "" }: EyebrowProps) {
    return (
        <span
            className={`inline-flex items-center gap-3 text-[0.6875rem] font-bold uppercase tracking-[0.28em] ${
                tone === "dark" ? "text-champagne-soft" : "text-wine"
            } ${className}`}
        >
            <span aria-hidden="true" className="h-px w-7 bg-champagne" />
            {children}
        </span>
    );
}
