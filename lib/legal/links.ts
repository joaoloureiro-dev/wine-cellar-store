/**
 * Legal links every page must offer. The Livro de Reclamações Eletrónico
 * link is mandatory for online stores (DL 156/2005, as amended by DL 74/2017).
 * The site footer should render these.
 */
export const legalLinks = [
    { label: "Termos e Condições", href: "/termos" },
    { label: "Devoluções", href: "/devolucoes" },
    { label: "Privacidade", href: "/privacidade" },
    { label: "Cookies", href: "/cookies" },
] as const;

export const complaintsBookUrl = "https://www.livroreclamacoes.pt";
