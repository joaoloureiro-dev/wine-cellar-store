import type { Metadata } from "next";

import { CompanyDetail, LegalDocument, Section, ToConfirm } from "@/components/legal/legal-document";
import { pageMetadata } from "@/lib/seo/metadata";

const title = "Devoluções e livre resolução";
const description = "Como desistir de uma compra no prazo de 14 dias, custos de devolução, reembolsos e modelo de formulário.";

export const metadata: Metadata = pageMetadata({ title, description, path: "/devolucoes" });

export default function ReturnsPage() {
    return (
        <LegalDocument title={title} description={description}>
            <Section id="prazo" title="Prazo">
                <p>
                    Tem o direito de desistir da compra no prazo de 14 dias, sem indicar qualquer motivo (Decreto-Lei n.º 24/2014). O prazo conta a
                    partir do dia em que recebe a cave ou, numa encomenda com várias entregas, do dia em que recebe o último artigo.
                </p>
            </Section>

            <Section id="como" title="Como exercer">
                <p>
                    Envie-nos, antes de terminar o prazo, uma declaração clara da sua decisão: por email para <CompanyDetail field="email" /> ou por
                    carta para <CompanyDetail field="address" />. Pode usar o modelo de formulário abaixo, mas não é obrigatório. Indique a
                    referência da encomenda (ENC-…).
                </p>
            </Section>

            <Section id="devolucao" title="Devolução do produto">
                <ul>
                    <li>Devolva a cave no prazo de 14 dias a contar da comunicação da desistência. Combinamos consigo a recolha.</li>
                    <li>
                        Como as caves de vinho não podem ser devolvidas por correio normal, o custo direto da devolução é suportado por si e é
                        estimado em <ToConfirm>custo estimado da recolha a definir</ToConfirm>.
                    </li>
                    <li>
                        Pode examinar o produto como faria numa loja. É responsável pela depreciação que resulte de uma utilização para além do
                        necessário para verificar a sua natureza e funcionamento. Sempre que possível, devolva-o na embalagem original.
                    </li>
                </ul>
            </Section>

            <Section id="reembolso" title="Reembolso">
                <p>
                    Reembolsamos todos os pagamentos recebidos, incluindo os portes de entrega da opção padrão, no prazo de 14 dias a contar da
                    data em que formos informados da desistência. Usamos o mesmo meio de pagamento da compra, salvo acordo em contrário, sem custos
                    para si. Podemos reter o reembolso até recebermos a cave ou até apresentar prova de que a enviou, se esta data for anterior.
                </p>
            </Section>

            <Section id="formulario" title="Modelo de formulário de livre resolução">
                <p className="text-sm text-muted">Preencha e devolva este formulário apenas se quiser desistir do contrato.</p>
                <div className="mt-4 rounded-xl border border-border bg-surface p-5 text-sm leading-7">
                    <p>
                        Para: <CompanyDetail field="name" />, <CompanyDetail field="address" />, <CompanyDetail field="email" />
                    </p>
                    <p>
                        Pela presente comunico que desisto do meu contrato de compra e venda do seguinte bem: ……………………
                    </p>
                    <p>Referência da encomenda: ……………………</p>
                    <p>Encomendado em ……………… / recebido em ………………</p>
                    <p>Nome do consumidor: ……………………</p>
                    <p>Morada do consumidor: ……………………</p>
                    <p>Assinatura do consumidor (só no caso de o formulário ser enviado em papel): ……………………</p>
                    <p>Data: ……………………</p>
                </div>
            </Section>

            <Section id="garantia" title="Produto com defeito">
                <p>
                    Um defeito não é uma desistência: está coberto pela garantia legal de 3 anos, sem custos para si. Contacte-nos com a referência da
                    encomenda e uma descrição ou fotografia do problema.
                </p>
            </Section>
        </LegalDocument>
    );
}
