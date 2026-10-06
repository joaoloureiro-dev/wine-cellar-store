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
        description: "Receberá os dados para transferência. A encomenda segue após a confirmação.",
    },
] as const;

export type PaymentMethodId = (typeof paymentMethods)[number]["id"];

export function getPaymentMethodLabel(id: PaymentMethodId) {
    return paymentMethods.find((method) => method.id === id)?.label ?? id;
}
