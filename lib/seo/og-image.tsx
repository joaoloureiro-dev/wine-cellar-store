import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/site";

export const ogImageSize = { width: 1200, height: 630 };

const fonts = Promise.all([
    readFile(join(process.cwd(), "assets/fonts/cormorant-garamond-latin-600-normal.woff")),
    readFile(join(process.cwd(), "assets/fonts/manrope-latin-600-normal.woff")),
]);

const colors = {
    cellar: "#14100e",
    wine: "#46121d",
    champagne: "#b89b65",
    cream: "#f7f5f0",
    muted: "#cbbfb2",
};

type OgImageInput = {
    eyebrow: string;
    title: string;
    subtitle?: string;
    details?: string[];
};

/**
 * Social sharing card in the store's colours: a dark "cellar" backdrop,
 * a champagne rule and the display serif. Text only, so it renders the
 * same for every product until real photography exists.
 */
export async function renderOgImage({ eyebrow, title, subtitle, details = [] }: OgImageInput) {
    const [serif, sans] = await fonts;

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "72px 80px",
                    color: colors.cream,
                    backgroundColor: colors.cellar,
                    backgroundImage: `radial-gradient(circle at 85% 15%, rgba(184,155,101,0.28), transparent 45%), linear-gradient(135deg, ${colors.cellar} 0%, #2a1016 55%, ${colors.wine} 100%)`,
                    fontFamily: "Manrope",
                }}
            >
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                        <div style={{ width: 64, height: 2, backgroundColor: colors.champagne }} />
                        <div style={{ fontSize: 24, letterSpacing: 6, textTransform: "uppercase", color: colors.champagne }}>
                            {eyebrow}
                        </div>
                    </div>
                    <div
                        style={{
                            marginTop: 36,
                            fontFamily: "Cormorant Garamond",
                            fontSize: title.length > 28 ? 84 : 108,
                            lineHeight: 1.02,
                            letterSpacing: -2,
                            maxWidth: 1000,
                        }}
                    >
                        {title}
                    </div>
                    {subtitle && (
                        <div style={{ marginTop: 24, fontSize: 30, lineHeight: 1.4, color: colors.muted, maxWidth: 900 }}>
                            {subtitle}
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 14 }}>
                        {details.map((detail) => (
                            <div
                                key={detail}
                                style={{
                                    display: "flex",
                                    padding: "12px 22px",
                                    fontSize: 26,
                                    borderRadius: 999,
                                    border: "1px solid rgba(184,155,101,0.55)",
                                    color: colors.cream,
                                }}
                            >
                                {detail}
                            </div>
                        ))}
                    </div>
                    <div style={{ fontFamily: "Cormorant Garamond", fontSize: 44, color: colors.champagne }}>
                        {siteConfig.name}
                    </div>
                </div>
            </div>
        ),
        {
            ...ogImageSize,
            fonts: [
                { name: "Cormorant Garamond", data: serif, weight: 600, style: "normal" },
                { name: "Manrope", data: sans, weight: 600, style: "normal" },
            ],
        },
    );
}
