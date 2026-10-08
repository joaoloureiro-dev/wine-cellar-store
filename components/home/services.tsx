import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { services } from "@/components/product/product-services";

export function Services() {
    return (
        <section aria-labelledby="services-heading" className="py-16 sm:py-20 lg:py-28">
            <Container>
                <SectionHeading
                    id="services-heading"
                    eyebrow="Serviços"
                    title="Da escolha à instalação na sua casa."
                    className="reveal"
                />

                <ul role="list" className="mt-10 grid gap-4 sm:mt-12 md:grid-cols-3 lg:gap-6">
                    {services.map(({ icon: Icon, title, description }) => (
                        <li
                            key={title}
                            className="reveal rounded-3xl border border-charcoal/8 bg-surface p-6 shadow-card transition-[border-color,transform] duration-300 ease-cellar hover:-translate-y-0.5 hover:border-champagne/50 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-8"
                        >
                            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-wine-light text-wine">
                                <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
                            </span>
                            <h3 className="mt-6 font-display text-[1.65rem] font-medium leading-tight tracking-[-0.02em] text-charcoal">
                                {title}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
                        </li>
                    ))}
                </ul>
            </Container>
        </section>
    );
}
