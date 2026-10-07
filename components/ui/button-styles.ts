/**
 * Shared button styles for <button> and <Link>, so actions look the same
 * whether they submit a form or navigate.
 */
type ButtonVariant = "primary" | "secondary" | "ghost-dark" | "light";
type ButtonSize = "md" | "sm";

type ButtonStyleOptions = {
    variant?: ButtonVariant;
    size?: ButtonSize;
    block?: boolean;
    className?: string;
};

const base =
    "group/button relative inline-flex items-center justify-center gap-2.5 rounded-full border text-sm font-semibold tracking-[0.01em] transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-cellar active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-3 disabled:pointer-events-none disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100";

const variants: Record<ButtonVariant, string> = {
    primary:
        "border-transparent bg-wine text-white shadow-wine hover:bg-wine-dark focus-visible:outline-wine",
    secondary:
        "border-border bg-surface text-charcoal hover:border-champagne focus-visible:outline-wine",
    "ghost-dark":
        "border-cellar-ink/15 bg-cellar-ink/5 text-cellar-ink backdrop-blur-sm hover:border-champagne-soft/50 hover:bg-cellar-ink/10 focus-visible:outline-champagne-soft",
    light: "border-transparent bg-cellar-ink text-cellar hover:bg-white focus-visible:outline-champagne-soft",
};

const sizes: Record<ButtonSize, string> = {
    md: "min-h-12 px-6 py-3",
    sm: "min-h-10 px-4 py-2 text-[0.8125rem]",
};

export function buttonStyles({
    variant = "primary",
    size = "md",
    block = false,
    className = "",
}: ButtonStyleOptions = {}) {
    return `${base} ${variants[variant]} ${sizes[size]} ${block ? "w-full" : ""} ${className}`;
}

/** Trailing arrow that nudges forward when its button is hovered. */
export const buttonArrowStyles =
    "transition-transform duration-300 ease-cellar group-hover/button:translate-x-0.5 motion-reduce:transition-none";
