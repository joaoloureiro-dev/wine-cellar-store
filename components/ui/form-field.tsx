import type { ReactNode } from "react";

export const inputClassName =
    "mt-1.5 block h-12 w-full rounded-md border border-border bg-surface px-3.5 text-sm text-charcoal transition-colors focus:border-wine focus:outline-2 focus:outline-offset-0 focus:outline-wine/30 aria-invalid:border-danger";

type FieldProps = {
    label: string;
    name: string;
    error?: string;
    hint?: string;
    children: ReactNode;
};

/**
 * Label + control + error. The control must use `id={name}` and, when there
 * is an error, `aria-describedby={`${name}-error`}`.
 */
export function Field({ label, name, error, hint, children }: FieldProps) {
    return (
        <div>
            <label htmlFor={name} className="text-sm font-medium text-charcoal">
                {label}
            </label>
            {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
            {children}
            <FieldError name={name} error={error} />
        </div>
    );
}

export function FieldError({ name, error }: { name: string; error?: string }) {
    if (!error) {
        return null;
    }

    return (
        <p id={`${name}-error`} className="mt-1.5 text-xs font-medium text-danger">
            {error}
        </p>
    );
}

/** Accessibility attributes for a control with an optional error. */
export function errorProps(name: string, error?: string) {
    return {
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? `${name}-error` : undefined,
    } as const;
}
