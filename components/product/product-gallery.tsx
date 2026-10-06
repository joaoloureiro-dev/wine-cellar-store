"use client";

import { useState } from "react";

import { ProductImage } from "@/components/product/product-image";

type ProductGalleryProps = {
    images: string[];
    alt: string;
};

const mainImageSizes = "(min-width: 1440px) 720px, (min-width: 1024px) 52vw, 100vw";

export function ProductGallery({ images, alt }: ProductGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const hasThumbnails = images.length > 1;

    return (
        <div className="flex flex-col gap-4">
            <div className="relative aspect-4/5 overflow-hidden rounded-xl border border-border bg-surface-muted">
                {/* Main product image is the LCP element: preload it. */}
                <ProductImage
                    src={images[activeIndex]}
                    alt={hasThumbnails ? `${alt} (imagem ${activeIndex + 1} de ${images.length})` : alt}
                    sizes={mainImageSizes}
                    preload={activeIndex === 0}
                />
            </div>

            {hasThumbnails && (
                <ul role="list" className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                    {images.map((image, index) => (
                        <li key={image}>
                            <button
                                type="button"
                                onClick={() => setActiveIndex(index)}
                                aria-label={`Ver imagem ${index + 1} de ${images.length}`}
                                aria-pressed={index === activeIndex}
                                className={`relative block aspect-square w-full overflow-hidden rounded-md border bg-surface-muted transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine ${
                                    index === activeIndex
                                        ? "border-wine"
                                        : "border-border hover:border-charcoal/40"
                                }`}
                            >
                                <ProductImage src={image} alt="" sizes="120px" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
