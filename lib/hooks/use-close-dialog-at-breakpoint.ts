"use client";

import { useEffect, type RefObject } from "react";

/** Matches the Tailwind `lg` breakpoint. */
export const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";

/**
 * Closes a modal <dialog> when the viewport reaches `mediaQuery`.
 *
 * Mobile-only modals are hidden on larger screens with CSS; if one were left
 * open it would keep the rest of the page inert while being invisible.
 */
export function useCloseDialogAtBreakpoint(
    dialogRef: RefObject<HTMLDialogElement | null>,
    mediaQuery = DESKTOP_MEDIA_QUERY,
) {
    useEffect(() => {
        const query = window.matchMedia(mediaQuery);

        function handleChange(event: MediaQueryListEvent) {
            if (event.matches && dialogRef.current?.open) {
                dialogRef.current.close();
            }
        }

        query.addEventListener("change", handleChange);

        return () => query.removeEventListener("change", handleChange);
    }, [dialogRef, mediaQuery]);
}
