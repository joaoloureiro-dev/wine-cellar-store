/**
 * Renders structured data. `<` is escaped so values coming from the
 * database can never close the script tag (XSS).
 */
export function JsonLd({ data }: { data: object }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
        />
    );
}
