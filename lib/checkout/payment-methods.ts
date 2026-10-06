export const paymentMethods = [
    {
        id: "MBWAY",
        label: "MB WAY",
        description: "Receberá um pedido de pagamento na app MB WAY.",
    },
    {
        id: "MULTIBANCO",
        label: "Multibanco",
        description: "Pague com a referência Multibanco no homebanking ou numa caixa ATM.",
    },
    {
        id: "BANK_TRANSFER",
        label: "Transferência bancária",
        description: "Transfira para o nosso IBAN. A encomenda segue após a confirmação do pagamento.",
    },
    {
        id: "KLARNA",
        label: "Klarna",
        description: "Pague agora ou em prestações. Será redirecionado para a Klarna para concluir o pagamento.",
    },
] as const;

export type PaymentMethodId = (typeof paymentMethods)[number]["id"];

export type AnyPaymentMethod = PaymentMethodId;

export function getPaymentMethodLabel(id: PaymentMethodId) {
    return paymentMethods.find((method) => method.id === id)?.label ?? id;
}
