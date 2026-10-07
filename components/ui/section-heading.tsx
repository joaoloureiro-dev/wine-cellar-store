import type { ReactNode } from "react";

import { Eyebrow } from "@/components/ui/eyebrow";

type SectionHeadingProps = {
    id?: string;
    eyebrow?: string;
    title: ReactNode;
    description?: ReactNode;
    as?: "h1" | "h2";
    tone?: "light" | "dark";
    className?: string;
};

/** Eyebrow, editorial title and optional lead paragraph for a section. */
export function SectionHeading({
    id,
    eyebrow,
    title,
    description,
    as: Heading = "h2",
    tone = "light",
    className = "",
}: SectionHeadingProps) {
    const isDark = tone === "dark";

    return (
        <div className={`flex max-w-2xl flex-col gap-4 ${className}`}>
            {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}

            <Heading
                id={id}
                className={`text-balance font-display text-[2.5rem] font-medium leading-[0.98] tracking-[-0.035em] sm:text-5xl lg:text-6xl ${
                    isDark ? "text-cellar-ink" : "text-charcoal"
                }`}
            >
                {title}
            </Heading>

            {description && (
                <p className={`text-base leading-7 ${isDark ? "text-cellar-muted" : "text-muted"}`}>
                    {description}
                </p>
            )}
        </div>
    );
}
