import type { Metadata } from "next";
import Link from "next/link";

import { CompanyDetail, LegalDocument, Section, ToConfirm } from "@/components/legal/legal-document";
import { shippingMethods } from "@/lib/checkout/shipping";
import { formatCurrency } from "@/lib/format";
import { pageMetadata } from "@/lib/seo/metadata";

const title = "Termos e Condições";
const description = "Condições de venda das caves de vinho Cellarium: encomendas, preços, pagamento, entrega, devoluções e garantia.";

export const metadata: Metadata = pageMetadata({ title, description, path: "/termos" });

const delivery = shippingMethods[0];

export default function TermsPage() {
    return (
        <LegalDocument title={title} description={description}>
            <Section id="identificacao" title="1. Quem somos">
                <p>
                    A loja online Cellarium é explorada por <CompanyDetail field="name" />, com sede em <CompanyDetail field="address" />, pessoa coletiva
                    n.º <CompanyDetail field="taxId" />, matriculada na <CompanyDetail field="registry" />.
                </p>
                <p>
                    Contactos: <CompanyDetail field="email" /> · <CompanyDetail field="phone" />.
                </p>
            </Section>

            <Section id="ambito" title="2. Âmbito">
                <p>
                    Estes termos aplicam-se às compras e pedidos de reserva feitos neste site por consumidores com morada de entrega em Portugal
                    Continental. Ao concluir uma encomenda, declara que leu e aceita estes termos e a{" "}
                    <Link href="/privacidade">Política de Privacidade</Link>.
                </p>
            </Section>

            <Section id="produtos-precos" title="3. Produtos e preços">
                <ul>
                    <li>As características de cada cave (capacidade, zonas, dimensões, consumo e ruído) são as indicadas na respetiva página.</li>
                    <li>Os preços são em euros e incluem IVA à taxa legal em vigor. Os portes são apresentados antes de confirmar a encomenda.</li>
                    <li>
                        O preço aplicável é o que está indicado no momento da encomenda e fica registado nela; alterações posteriores não afetam
                        encomendas já feitas.
                    </li>
                    <li>A disponibilidade é atualizada em tempo real. Se, por erro, um produto encomendado não estiver disponível, informamos e reembolsamos qualquer valor pago.</li>
                </ul>
            </Section>

            <Section id="encomendas" title="4. Encomendas">
                <p>
                    Pode encomendar com ou sem conta. Antes de confirmar, o resumo mostra os produtos, a morada, o método de pagamento, os portes e o
                    total. Depois de confirmar, recebe uma referência de encomenda (ENC-…) que permite acompanhar o estado na página da encomenda.
                </p>
                <p>O contrato considera-se celebrado quando o pagamento é confirmado.</p>
            </Section>

            <Section id="pagamento" title="5. Pagamento">
                <ul>
                    <li><strong>MB WAY</strong>: confirme o pedido na aplicação MB WAY.</li>
                    <li><strong>Multibanco</strong>: pague com a entidade e a referência apresentadas, num multibanco ou no homebanking.</li>
                    <li><strong>Transferência bancária</strong>: use os dados e a referência indicados; a encomenda avança quando a transferência for recebida.</li>
                    <li><strong>Klarna</strong>: pagamento através da Klarna, sujeito às condições e à aprovação da Klarna.</li>
                </ul>
                <p>
                    Encomendas não pagas dentro do prazo indicado (48 horas) são canceladas automaticamente e o stock é libertado. Nunca pedimos
                    dados de cartão ou códigos por email ou telefone.
                </p>
            </Section>

            <Section id="entrega" title="6. Entrega">
                <ul>
                    <li>
                        Entregamos em Portugal Continental. {delivery.label}: {formatCurrency(delivery.priceCents / 100)}
                        {delivery.freeFromSubtotalCents !== null && <>, grátis em encomendas a partir de {formatCurrency(delivery.freeFromSubtotalCents / 100)}</>}.
                    </li>
                    <li>
                        Depois de confirmado o pagamento, contactamo-lo para agendar a entrega. O prazo de entrega é de{" "}
                        <ToConfirm>prazo habitual de entrega a definir</ToConfirm> e nunca excede 30 dias, salvo acordo em contrário.
                    </li>
                    <li>Verifique o estado da embalagem na entrega e registe qualquer dano visível no comprovativo do transportador.</li>
                </ul>
            </Section>

            <Section id="reservas" title="7. Reservas">
                <p>
                    Para produtos esgotados ou a chegar, pode fazer um pedido de reserva. O pedido não é uma compra nem obriga a pagamento: analisamos
                    a disponibilidade e respondemos. Se confirmarmos a reserva, indicamos o prazo durante o qual a unidade fica guardada para si e
                    como concluir a compra; passado esse prazo, a reserva expira sem custos.
                </p>
            </Section>

            <Section id="livre-resolucao" title="8. Direito de livre resolução (devoluções)">
                <p>
                    Tem 14 dias a contar da receção da encomenda para desistir da compra, sem indicar o motivo. Saiba como exercer este direito,
                    os custos e os prazos de reembolso em <Link href="/devolucoes">Devoluções e livre resolução</Link>.
                </p>
            </Section>

            <Section id="garantia" title="9. Garantia">
                <p>
                    Os produtos têm a garantia legal de conformidade de 3 anos a contar da entrega (Decreto-Lei n.º 84/2021). Se o produto não
                    estiver conforme, tem direito à reparação ou substituição e, nos casos previstos na lei, à redução do preço ou à resolução do
                    contrato. Para acionar a garantia, contacte-nos com a referência da encomenda e uma descrição do problema.
                </p>
                <p>A garantia não cobre danos causados por uso indevido, instalação contrária às instruções do fabricante ou acidentes.</p>
            </Section>

            <Section id="reclamacoes" title="10. Reclamações e resolução de litígios">
                <p>
                    Pode apresentar reclamação através dos nossos contactos ou no{" "}
                    <a href="https://www.livroreclamacoes.pt" target="_blank" rel="noopener noreferrer">
                        Livro de Reclamações Eletrónico
                    </a>
                    .
                </p>
                <p>
                    Em caso de litígio de consumo, pode recorrer a uma entidade de resolução alternativa de litígios (Lei n.º 144/2015), como o{" "}
                    <a href="https://www.cniacc.pt" target="_blank" rel="noopener noreferrer">
                        CNIACC — Centro Nacional de Informação e Arbitragem de Conflitos de Consumo
                    </a>
                    . A lista completa de entidades está disponível no{" "}
                    <a href="https://www.consumidor.gov.pt" target="_blank" rel="noopener noreferrer">
                        Portal do Consumidor
                    </a>
                    .
                </p>
            </Section>

            <Section id="lei" title="11. Lei aplicável">
                <p>
                    Estes termos regem-se pela lei portuguesa, sem prejuízo dos direitos que a lei de proteção do consumidor lhe confere. Podemos
                    atualizar estes termos; a versão aplicável a cada encomenda é a que estava em vigor na data em que foi feita.
                </p>
            </Section>
        </LegalDocument>
    );
}
