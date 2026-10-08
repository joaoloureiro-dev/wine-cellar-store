"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useToast } from "@/components/ui/toast";
import type { AdminFormState } from "@/lib/admin/form-state";

/**
 * Toasts for a backoffice form after each submission; after creating a
 * record, opens its edit page.
 */
export function useAdminFormFeedback(state: AdminFormState, { createdHref }: { createdHref?: (id: string) => string } = {}) {
    const toast = useToast();
    const router = useRouter();

    useEffect(() => {
        if (state.submissionId === 0) return;

        if (state.status === "success") {
            toast.success(state.message ?? "Guardado");
            if (state.createdId && createdHref) router.push(createdHref(state.createdId));
        } else if (state.message) {
            toast.error("Não foi possível guardar", { description: state.message });
        }
        // Only react to new submissions.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.submissionId]);
}
