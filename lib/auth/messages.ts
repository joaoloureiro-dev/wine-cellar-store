/** Maps Better Auth error codes to customer-facing Portuguese messages. */
const messages: Record<string, string> = {
    INVALID_EMAIL_OR_PASSWORD: "Email ou password incorretos.",
    INVALID_EMAIL: "Indique um email válido.",
    INVALID_PASSWORD: "A password atual não está correta.",
    PASSWORD_TOO_SHORT: "A password é demasiado curta.",
    PASSWORD_TOO_LONG: "A password é demasiado longa.",
    USER_ALREADY_EXISTS: "Já existe uma conta com este email. Inicie sessão.",
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Já existe uma conta com este email. Inicie sessão.",
    SESSION_EXPIRED: "A sessão expirou. Inicie sessão novamente.",
    CREDENTIAL_ACCOUNT_NOT_FOUND: "Esta conta usa o login com Google.",
};

export function getAuthErrorMessage(error: { code?: string; status?: number; message?: string } | null) {
    if (!error) {
        return "Ocorreu um erro inesperado. Tente novamente.";
    }

    if (error.status === 429) {
        return "Demasiadas tentativas. Aguarde um minuto e tente novamente.";
    }

    return (error.code && messages[error.code]) || "Ocorreu um erro inesperado. Tente novamente.";
}
