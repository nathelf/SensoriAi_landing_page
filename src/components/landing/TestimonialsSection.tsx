import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "A SensoriAI reduziu em 40% o tempo do nosso processo de análise em apenas 2 meses. Resultados impressionantes.",
    author: "Carlos Mendes",
    role: "Diretor de Operações",
    company: "AgroTech Solutions",
    rating: 5,
  },
  {
    quote:
      "Finalmente uma empresa que entende de IA de verdade e entrega soluções que funcionam na prática.",
    author: "Ana Paula Santos",
    role: "CTO",
    company: "RetailMax",
    rating: 5,
  },
  {
    quote:
      "O time técnico é excepcional. A comunicação é clara e os prazos são sempre cumpridos.",
    author: "Roberto Silva",
    role: "CEO",
    company: "LogiFlow",
    rating: 5,
  },
];

const clientLogos = [
  "AgroTech",
  "RetailMax",
  "LogiFlow",
  "DataPrime",
  "SmartOps",
  "InnovateTech",
];

const TestimonialsSection = () => {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-card/50 via-background to-card/50" />

      <div className="section-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Depoimentos
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Quem já confiou na SensoriAI
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Empresas que transformaram seus negócios com nossas soluções.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-8 md:gap-12 mb-16"
        >
          {clientLogos.map((logo, index) => (
            <div
              key={index}
              className="px-6 py-3 rounded-xl bg-muted/50 text-muted-foreground font-display font-medium text-sm md:text-base hover:bg-muted hover:text-foreground transition-colors"
            >
              {logo}
            </div>
          ))}
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="glass-card p-8 h-full flex flex-col">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-rating text-rating" />
                  ))}
                </div>

                <Quote className="w-10 h-10 text-primary/30 mb-4" />

                <p className="text-foreground text-lg leading-relaxed mb-6 flex-1">
                  "{testimonial.quote}"
                </p>

                <div className="flex items-center gap-4 pt-6 border-t border-border">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} • {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
