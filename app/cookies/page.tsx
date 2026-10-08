import type { Metadata } from "next";

import { LegalDocument, Section } from "@/components/legal/legal-document";
import { AUTH_COOKIE_PREFIX } from "@/lib/auth/server";
import { CART_COOKIE, CART_COUNT_COOKIE } from "@/lib/cart/constants";
import { pageMetadata } from "@/lib/seo/metadata";

const title = "Política de Cookies";
const description = "Os cookies e o armazenamento local que a loja usa: apenas os essenciais, sem publicidade nem análise.";

export const metadata: Metadata = pageMetadata({ title, description, path: "/cookies" });

const cookies = [
    { name: `${AUTH_COOKIE_PREFIX}.session_token`, purpose: "Mantém a sessão iniciada na sua conta.", duration: "Até 30 dias ou até terminar a sessão" },
    { name: CART_COOKIE, purpose: "Guarda os produtos do carrinho.", duration: "30 dias" },
    { name: CART_COUNT_COOKIE, purpose: "Mostra o número de artigos no ícone do carrinho.", duration: "30 dias" },
    { name: "Armazenamento local: favoritos", purpose: "Guarda os favoritos de quem não tem sessão iniciada, apenas neste browser.", duration: "Até os apagar" },
];

export default function CookiesPage() {
    return (
        <LegalDocument title={title} description={description}>
            <Section id="essenciais" title="Só cookies essenciais">
                <p>
                    A loja usa apenas cookies e armazenamento local estritamente necessários ao serviço que pede: carrinho, sessão e favoritos. Não
                    usamos cookies de publicidade, de análise ou de redes sociais, por isso não pedimos consentimento.
                </p>
            </Section>

            <Section id="lista" title="Lista">
                <div className="mt-2 overflow-x-auto rounded-xl border border-border">
                    <table className="w-full min-w-[32rem] text-left text-sm">
                        <thead className="bg-surface-muted text-charcoal">
                            <tr>
                                <th scope="col" className="p-3 font-semibold">Nome</th>
                                <th scope="col" className="p-3 font-semibold">Finalidade</th>
                                <th scope="col" className="p-3 font-semibold">Duração</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {cookies.map((cookie) => (
                                <tr key={cookie.name}>
                                    <td className="p-3 font-mono text-xs">{cookie.name}</td>
                                    <td className="p-3">{cookie.purpose}</td>
                                    <td className="p-3">{cookie.duration}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>

            <Section id="terceiros" title="Pagamentos e login de terceiros">
                <p>
                    Se pagar com Klarna ou entrar com a Google, é redirecionado para os sites desses serviços, que usam os seus próprios cookies de
                    acordo com as respetivas políticas.
                </p>
            </Section>

            <Section id="gerir" title="Como gerir">
                <p className="text-sm text-muted">
                    Em ligações seguras (HTTPS), o browser mostra o cookie de sessão com o prefixo <span className="font-mono">__Secure-</span>.
                </p>
                <p>
                    Pode apagar ou bloquear cookies nas definições do browser. Se bloquear os cookies essenciais, o carrinho e o login deixam de
                    funcionar.
                </p>
            </Section>
        </LegalDocument>
    );
}
