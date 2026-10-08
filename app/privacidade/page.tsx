import type { Metadata } from "next";
import Link from "next/link";

import { CompanyDetail, LegalDocument, Section, ToConfirm } from "@/components/legal/legal-document";
import { pageMetadata } from "@/lib/seo/metadata";

const title = "Política de Privacidade";
const description = "Que dados pessoais tratamos, para quê, com quem os partilhamos, durante quanto tempo e como exercer os seus direitos.";

export const metadata: Metadata = pageMetadata({ title, description, path: "/privacidade" });

export default function PrivacyPage() {
    return (
        <LegalDocument title={title} description={description}>
            <Section id="responsavel" title="1. Responsável pelo tratamento">
                <p>
                    <CompanyDetail field="name" />, NIPC <CompanyDetail field="taxId" />, <CompanyDetail field="address" />. Para qualquer questão
                    sobre os seus dados: <CompanyDetail field="email" />.
                </p>
            </Section>

            <Section id="dados" title="2. Que dados tratamos e para quê">
                <h3>Encomendas</h3>
                <p>
                    Nome, email, telefone, morada de entrega, NIF (se o indicar), notas, produtos e pagamentos. Servem para processar, faturar e
                    entregar a encomenda. Base legal: execução do contrato e cumprimento de obrigações legais (faturação).
                </p>
                <h3>Pedidos de reserva</h3>
                <p>Nome, email, telefone e notas, para gerir o pedido e contactá-lo sobre ele. Base legal: o seu consentimento e diligências pré-contratuais a seu pedido.</p>
                <h3>Conta de cliente (opcional)</h3>
                <p>
                    Nome, email, password (guardada apenas em formato cifrado, irreversível), moradas e favoritos, para facilitar compras futuras e
                    mostrar o histórico. Se entrar com a Google, recebemos o nome e o email da sua conta Google. Base legal: execução do contrato
                    de utilização da conta.
                </p>
                <h3>Segurança</h3>
                <p>
                    Endereço IP e dados técnicos do pedido, para limitar tentativas abusivas de login e proteger a loja. São guardados por pouco
                    tempo (minutos, no caso dos limites de tentativas). Base legal: interesse legítimo na segurança do serviço.
                </p>
                <p>Não fazemos marketing nem perfis de clientes, e não vendemos dados pessoais.</p>
            </Section>

            <Section id="partilha" title="3. Com quem partilhamos">
                <p>Apenas com prestadores de serviços que tratam os dados por nossa conta, ao abrigo de contrato e só para as finalidades acima:</p>
                <ul>
                    <li>Alojamento e base de dados: Vercel, Railway, Neon e Upstash (servidores na União Europeia sempre que configurável).</li>
                    <li>Armazenamento de imagens e rede: Cloudflare.</li>
                    <li>Pagamentos: ifthenpay e eupago (MB WAY e Multibanco), Stripe e Klarna (pagamento Klarna). Os dados de pagamento são tratados por eles; não guardamos dados de cartões.</li>
                    <li>Login com Google (só se o escolher): Google.</li>
                    <li>Transporte: a transportadora que faz a entrega recebe nome, telefone e morada.</li>
                </ul>
                <p>
                    Alguns destes prestadores pertencem a grupos com sede nos Estados Unidos. Nesses casos, as transferências são feitas ao abrigo
                    do Quadro de Proteção de Dados UE-EUA ou de cláusulas contratuais-tipo aprovadas pela Comissão Europeia.
                </p>
                <p>Partilhamos ainda dados com autoridades quando a lei o exige (por exemplo, a Autoridade Tributária).</p>
            </Section>

            <Section id="conservacao" title="4. Durante quanto tempo">
                <ul>
                    <li>Encomendas e faturas: 10 anos, pelas obrigações fiscais e contabilísticas.</li>
                    <li>Conta, moradas e favoritos: enquanto a conta existir. Ao eliminar a conta, são apagados de imediato.</li>
                    <li>Pedidos de reserva: <ToConfirm>prazo de conservação a definir</ToConfirm> após a sua conclusão; ao eliminar a conta, os contactos das reservas concluídas são apagados.</li>
                    <li>Sessões de login: até 30 dias, ou até terminar a sessão.</li>
                </ul>
            </Section>

            <Section id="direitos" title="5. Os seus direitos">
                <p>
                    Tem direito de acesso, retificação, apagamento, limitação, portabilidade e oposição, e pode retirar o consentimento a qualquer
                    momento. Com conta, pode fazê-lo diretamente em <Link href="/conta/perfil">Conta › Perfil</Link>: descarregar os seus dados
                    ou eliminar a conta. Para tudo o resto, contacte-nos em <CompanyDetail field="email" />; respondemos no prazo de um mês.
                </p>
                <p>
                    Pode também apresentar reclamação à Comissão Nacional de Proteção de Dados (
                    <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer">
                        www.cnpd.pt
                    </a>
                    ).
                </p>
            </Section>

            <Section id="seguranca" title="6. Segurança">
                <p>
                    Usamos ligações cifradas (HTTPS), passwords guardadas com algoritmo de dispersão, acesso restrito ao backoffice com registo de
                    alterações e limites de tentativas de login.
                </p>
            </Section>

            <Section id="cookies" title="7. Cookies">
                <p>
                    Usamos apenas cookies essenciais ao funcionamento da loja. Saiba mais na <Link href="/cookies">Política de Cookies</Link>.
                </p>
            </Section>
        </LegalDocument>
    );
}
