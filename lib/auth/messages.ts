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
    PASSWORD_REQUIRED: "Indique a sua password.",
    ADMIN_ACCOUNT: "Contas de administração não podem ser eliminadas aqui. Retire primeiro o acesso ao backoffice.",
    OPEN_ORDERS: "Tem encomendas em curso. Pode eliminar a conta depois de serem entregues ou canceladas.",
    OPEN_RESERVATIONS: "Tem reservas ativas. Cancele-as ou aguarde a sua conclusão antes de eliminar a conta.",
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
