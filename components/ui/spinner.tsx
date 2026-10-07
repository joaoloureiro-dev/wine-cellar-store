type SpinnerProps = {
    className?: string;
};

/** Small circular loader for pending buttons. Decorative: pair it with text. */
export function Spinner({ className = "" }: SpinnerProps) {
    return (
        <span
            aria-hidden="true"
            className={`inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none ${className}`}
        />
    );
}
