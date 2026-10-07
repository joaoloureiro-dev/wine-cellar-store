"use client";

import Link from "next/link";
import {
    CircleCheck,
    CircleX,
    Info,
    TriangleAlert,
    X,
    type LucideIcon,
} from "lucide-react";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export type ToastOptions = {
    description?: string;
    action?: {
        label: string;
        href: string;
    };
    /** Milliseconds before auto-dismiss. Defaults depend on the variant. */
    duration?: number;
};

type Toast = ToastOptions & {
    id: number;
    variant: ToastVariant;
    title: string;
};

type ToastApi = {
    show: (variant: ToastVariant, title: string, options?: ToastOptions) => number;
    success: (title: string, options?: ToastOptions) => number;
    error: (title: string, options?: ToastOptions) => number;
    warning: (title: string, options?: ToastOptions) => number;
    info: (title: string, options?: ToastOptions) => number;
    dismiss: (id: number) => void;
};

const MAX_VISIBLE_TOASTS = 3;

const variants: Record<
    ToastVariant,
    { icon: LucideIcon; iconClassName: string; duration: number; urgent: boolean }
> = {
    success: { icon: CircleCheck, iconClassName: "text-success", duration: 5000, urgent: false },
    info: { icon: Info, iconClassName: "text-charcoal", duration: 5000, urgent: false },
    warning: { icon: TriangleAlert, iconClassName: "text-warning", duration: 7000, urgent: true },
    error: { icon: CircleX, iconClassName: "text-danger", duration: 8000, urgent: true },
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error("useToast must be used inside <ToastProvider>.");
    }

    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const nextId = useRef(0);

    const dismiss = useCallback((id: number) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const show = useCallback(
        (variant: ToastVariant, title: string, options: ToastOptions = {}) => {
            const id = ++nextId.current;

            setToasts((current) =>
                [...current, { id, variant, title, ...options }].slice(-MAX_VISIBLE_TOASTS),
            );

            return id;
        },
        [],
    );

    const api = useMemo<ToastApi>(
        () => ({
            show,
            success: (title, options) => show("success", title, options),
            error: (title, options) => show("error", title, options),
            warning: (title, options) => show("warning", title, options),
            info: (title, options) => show("info", title, options),
            dismiss,
        }),
        [show, dismiss],
    );

    const politeToasts = toasts.filter((toast) => !variants[toast.variant].urgent);
    const urgentToasts = toasts.filter((toast) => variants[toast.variant].urgent);

    return (
        <ToastContext.Provider value={api}>
            {children}

            {/*
              Live regions are always mounted so screen readers pick up new
              toasts reliably. Errors/warnings are announced assertively.
            */}
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-60 flex flex-col items-center gap-3 p-4 sm:items-end sm:p-6">
                <ol role="alert" aria-live="assertive" className="flex w-full flex-col items-center gap-3 sm:items-end">
                    {urgentToasts.map((toast) => (
                        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
                    ))}
                </ol>

                <ol role="status" aria-live="polite" className="flex w-full flex-col items-center gap-3 sm:items-end">
                    {politeToasts.map((toast) => (
                        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
                    ))}
                </ol>
            </div>
        </ToastContext.Provider>
    );
}

type ToastItemProps = {
    toast: Toast;
    onDismiss: (id: number) => void;
};

function ToastItem({ toast, onDismiss }: ToastItemProps) {
    const { icon: Icon, iconClassName, duration: defaultDuration } =
        variants[toast.variant];
    const [isPaused, setIsPaused] = useState(false);
    const remaining = useRef(toast.duration ?? defaultDuration);

    // Auto-dismiss, paused while the toast is hovered or focused
    // (WCAG 2.2.1: users must have enough time to read and act).
    useEffect(() => {
        if (isPaused) {
            return;
        }

        const startedAt = Date.now();
        const timer = window.setTimeout(() => onDismiss(toast.id), remaining.current);

        return () => {
            window.clearTimeout(timer);
            remaining.current -= Date.now() - startedAt;
        };
    }, [isPaused, onDismiss, toast.id]);

    return (
        <li
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocus={() => setIsPaused(true)}
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    setIsPaused(false);
                }
            }}
            className="animate-toast-in motion-reduce:animate-none pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-border bg-surface p-4 shadow-lg"
        >
            <Icon
                size={20}
                strokeWidth={1.8}
                aria-hidden="true"
                className={`mt-0.5 shrink-0 ${iconClassName}`}
            />

            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-charcoal">{toast.title}</p>

                {toast.description && (
                    <p className="mt-1 text-sm leading-5 text-muted">{toast.description}</p>
                )}

                {toast.action && (
                    <Link
                        href={toast.action.href}
                        onClick={() => onDismiss(toast.id)}
                        className="mt-2 inline-flex rounded-sm text-sm font-semibold text-wine underline underline-offset-4 hover:text-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                    >
                        {toast.action.label}
                    </Link>
                )}
            </div>

            <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Fechar notificação"
                className="-m-1 shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-surface-muted hover:text-charcoal focus-visible:outline-2 focus-visible:outline-wine"
            >
                <X size={16} strokeWidth={1.8} />
            </button>
        </li>
    );
}
