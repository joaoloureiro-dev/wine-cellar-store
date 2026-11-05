"use client";

import { Camera, RotateCcw } from "lucide-react";
import { getImageProps } from "next/image";
import { useEffect, useState } from "react";

const initial = { horizontal: 50, vertical: 70, size: 24 };
const controls = [
    { key: "horizontal", label: "Posição horizontal", min: 0, max: 100 },
    { key: "vertical", label: "Posição vertical", min: 0, max: 100 },
    { key: "size", label: "Tamanho visual", min: 8, max: 80 },
] as const;

export function RoomPreview({ image, name }: { image: string; name: string }) {
    const overlay = getImageProps({ src: image, alt: name, width: 640, height: 640 }).props.src;
    const [photo, setPhoto] = useState<string>();
    const [cutoutReady, setCutoutReady] = useState(false);
    const [error, setError] = useState("");
    const [placement, setPlacement] = useState(initial);

    useEffect(() => {
        if (photo) return () => URL.revokeObjectURL(photo);
    }, [photo]);

    return (
        <details className="group rounded-3xl border border-border bg-surface p-5 shadow-card">
            <summary className="flex cursor-pointer list-none items-center gap-3 text-wine [&::-webkit-details-marker]:hidden">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-wine-light"><Camera size={20} aria-hidden="true" /></span>
                <span className="flex-1 font-semibold">Ver a cave no meu espaço</span>
                <span aria-hidden="true" className="text-xl group-open:rotate-45">+</span>
            </summary>
            <div className="mt-4 space-y-4 border-t border-border pt-4">
                <p className="text-sm leading-6 text-muted">Escolha uma fotografia de frente para o local onde quer colocar a cave. A fotografia é usada apenas neste navegador.</p>
                <label className="grid gap-2 text-sm font-semibold text-charcoal">
                    Fotografia do espaço
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-wine-light file:px-3 file:py-2 file:text-wine"
                        onChange={(event) => {
                            const next = event.currentTarget.files?.[0];
                            event.currentTarget.value = "";
                            if (!next) return;
                            if (!["image/jpeg", "image/png", "image/webp"].includes(next.type) || next.size > 12 * 1024 * 1024) {
                                setError("Escolha uma imagem JPG, PNG ou WebP até 12 MB.");
                                return;
                            }
                            setError("");
                            setCutoutReady(false);
                            setPlacement(initial);
                            setPhoto(URL.createObjectURL(next));
                        }}
                    />
                </label>
                {error && <p role="alert" className="text-sm text-wine">{error}</p>}
                {photo && (
                    <>
                        <div className="relative overflow-hidden rounded-2xl bg-surface-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element -- browser-local photo */}
                            <img src={photo} alt="Fotografia do seu espaço" className="block w-full"
                                onError={() => { setPhoto(undefined); setError("Não foi possível abrir esta fotografia."); }}
                            />
                            {/* eslint-disable-next-line @next/next/no-img-element -- overlay uses the catalogue image as supplied */}
                            <img src={overlay} alt={name} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-sm"
                                onLoad={(event) => {
                                    const cutout = event.currentTarget;
                                    const canvas = document.createElement("canvas");
                                    canvas.width = canvas.height = 64;
                                    const context = canvas.getContext("2d");
                                    try {
                                        context?.drawImage(cutout, 0, 0, 64, 64);
                                        const pixels = context?.getImageData(0, 0, 64, 64).data;
                                        if (pixels?.some((alpha, index) => index % 4 === 3 && alpha === 0)) {
                                            setCutoutReady(true);
                                            return;
                                        }
                                    } catch {
                                        // An unreadable overlay cannot be checked for transparency.
                                    }
                                    setError("O recorte transparente deste modelo não está disponível.");
                                }}
                                onError={() => setError("O recorte transparente deste modelo não está disponível.")}
                                style={{ visibility: cutoutReady ? "visible" : "hidden", left: `${placement.horizontal}%`, top: `${placement.vertical}%`, width: `${placement.size}%` }}
                            />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {controls.map(({ key, label, min, max }) => (
                                <label key={key} className="grid gap-1 text-sm font-medium text-charcoal">
                                    {label}
                                    <input type="range" min={min} max={max} value={placement[key]} className="w-full accent-wine"
                                        onChange={(event) => setPlacement({ ...placement, [key]: Number(event.target.value) })}
                                    />
                                </label>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm font-semibold text-wine">
                            <button type="button" onClick={() => setPlacement(initial)} className="inline-flex items-center gap-1 underline"><RotateCcw size={14} aria-hidden="true" /> Repor posição</button>
                            <button type="button" className="underline" onClick={() => { setPhoto(undefined); setError(""); }}>Remover fotografia</button>
                        </div>
                    </>
                )}
                <p className="text-xs leading-5 text-muted">Pré-visualização aproximada. Confirme as dimensões e as folgas de instalação antes de comprar.</p>
            </div>
        </details>
    );
}
