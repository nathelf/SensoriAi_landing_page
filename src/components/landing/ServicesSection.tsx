import { motion } from "framer-motion";
import { Brain, Eye, Workflow, Code, Puzzle, ArrowRight } from "lucide-react";

const services = [
  {
    icon: Brain,
    title: "IA Personalizada",
    description:
      "Modelos de machine learning treinados para os desafios específicos do seu negócio.",
    features: ["Deep Learning", "NLP", "Análise Preditiva"],
  },
  {
    icon: Eye,
    title: "Visão Computacional",
    description:
      "Sistemas que enxergam e interpretam imagens e vídeos com precisão sobre-humana.",
    features: ["Detecção de Objetos", "OCR", "Análise de Imagens"],
  },
  {
    icon: Workflow,
    title: "Automação Inteligente",
    description: "Processos automatizados que aprendem e melhoram continuamente.",
    features: ["RPA com IA", "Workflows Smart", "Otimização"],
  },
  {
    icon: Code,
    title: "APIs Inteligentes",
    description:
      "Interfaces robustas e escaláveis para integrar IA em qualquer sistema.",
    features: ["REST/GraphQL", "Real-time", "Alta Performance"],
  },
  {
    icon: Puzzle,
    title: "Integração de IA",
    description:
      "Adicionamos inteligência artificial aos seus produtos e sistemas existentes.",
    features: ["Plug & Play", "SDK Custom", "Consultoria"],
  },
];

const ServicesSection = () => {
  return (
    <section
      id="servicos"
      className="py-24 md:py-32 relative overflow-hidden bg-gradient-to-b from-background via-card/30 to-background"
    >
      <div className="section-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
            Nossos serviços
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            O que fazemos
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Soluções completas de Inteligência Artificial para transformar seu
            negócio.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`group ${index === 4 ? "lg:col-start-2" : ""}`}
            >
              <div className="glass-card p-8 h-full hover:border-primary/50 transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <service.icon className="w-7 h-7 text-primary" />
                </div>

                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {service.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  {service.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {service.features.map((feature, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <a
                    href="#contato"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all"
                  >
                    Saiba mais
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
