import { z } from "zod";

/** State returned by backoffice form actions (useActionState). */
export type AdminFormState<Field extends string = string> = {
    status: "idle" | "success" | "error";
    message?: string;
    fieldErrors?: Partial<Record<Field, string>>;
    values?: Record<string, string>;
    /** Set on success when the action created a record. */
    createdId?: string;
    submissionId: number;
};

export const initialAdminFormState: AdminFormState = { status: "idle", submissionId: 0 };

/** All string fields of a form submission (files and repeats ignored). */
export function formValues(formData: FormData) {
    const values: Record<string, string> = {};

    for (const [key, value] of formData.entries()) {
        if (typeof value === "string" && !(key in values)) {
            values[key] = value;
        }
    }

    return values;
}

/** First message per field, keyed by the field path ("zones.0.min"). */
export function fieldErrorsFrom(error: z.ZodError) {
    const errors: Record<string, string> = {};

    for (const issue of error.issues) {
        const key = issue.path.join(".") || "_form";
        errors[key] ??= issue.message;
    }

    return errors;
}
