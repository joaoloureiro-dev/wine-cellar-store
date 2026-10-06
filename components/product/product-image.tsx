import Image from "next/image";
import { Wine } from "lucide-react";

type ProductImageProps = {
    src?: string;
    alt: string;
    sizes: string;
    preload?: boolean;
    className?: string;
};

export function ProductImage({
    src,
    alt,
    sizes,
    preload = false,
    className = "",
}: ProductImageProps) {
    if (!src) {
        return (
            <div
                role="img"
                aria-label={alt}
                className={`flex size-full items-center justify-center bg-surface-muted text-muted ${className}`}
            >
                <Wine size={40} strokeWidth={1.2} aria-hidden="true" />
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            preload={preload}
            className={`object-cover ${className}`}
        />
    );
}
