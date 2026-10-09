import Form from "next/form";
import Link from "next/link";
import { Search } from "lucide-react";

import { listHref } from "@/lib/admin/list-params";

type StatusOption = { value: string; label: string };

/**
 * Status tabs + search for backoffice lists. Plain links and a GET form,
 * so filtering works without JavaScript and every view has a shareable URL.
 */
export function ListToolbar({
    pathname,
    statuses,
    status,
    q,
    searchPlaceholder,
}: {
    pathname: string;
    statuses: readonly StatusOption[];
    status?: string;
    q?: string;
    searchPlaceholder: string;
}) {
    const tabs = [{ value: undefined, label: "Todas" }, ...statuses];

    return (
        <div className="mb-6 space-y-4">
            <Form action={pathname} role="search" className="flex gap-2 rounded-full border border-charcoal/8 bg-surface p-1.5 shadow-card">
                {status && <input type="hidden" name="estado" value={status} />}
                <label htmlFor="admin-search" className="sr-only">
                    Pesquisar
                </label>
                <input
                    id="admin-search"
                    type="search"
                    name="q"
                    defaultValue={q}
                    maxLength={100}
                    placeholder={searchPlaceholder}
                    className="block h-11 min-w-0 flex-1 rounded-full border border-transparent bg-transparent px-4 text-sm text-charcoal focus:border-wine/40 focus:outline-2 focus:outline-wine/30"
                />
                <button
                    type="submit"
                    className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-wine px-5 text-sm font-semibold text-white transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                >
                    <Search size={16} strokeWidth={1.8} aria-hidden="true" />
                    <span className="hidden sm:inline">Pesquisar</span>
                </button>
            </Form>

            <nav aria-label="Filtrar por estado" className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
                <ul className="flex gap-2">
                    {tabs.map((tab) => {
                        const isActive = tab.value === status;

                        return (
                            <li key={tab.label} className="shrink-0">
                                <Link
                                    href={listHref(pathname, { status: tab.value, q })}
                                    aria-current={isActive ? "page" : undefined}
                                    className={`inline-flex h-9 items-center rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine ${
                                        isActive
                                            ? "border-wine bg-wine text-white"
                                            : "border-border bg-surface text-charcoal hover:border-champagne"
                                    }`}
                                >
                                    {tab.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
}
