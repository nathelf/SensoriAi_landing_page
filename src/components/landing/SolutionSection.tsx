import { motion } from "framer-motion";
import { Search, Cpu, Rocket, TrendingUp, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Search,
    number: "01",
    title: "Diagnóstico Inteligente",
    description:
      "Analisamos seus dados, processos e objetivos de negócio para entender exatamente onde a IA pode gerar mais valor.",
  },
  {
    icon: Cpu,
    number: "02",
    title: "IA Sob Medida",
    description:
      "Nada de solução genérica. Desenvolvemos modelos treinados especificamente para resolver o seu problema real.",
  },
  {
    icon: Rocket,
    number: "03",
    title: "Implementação Escalável",
    description:
      "Integração perfeita com seus sistemas, cloud, APIs e segurança. Tudo funcionando em produção.",
  },
  {
    icon: TrendingUp,
    number: "04",
    title: "Evolução Contínua",
    description:
      "O modelo aprende, melhora e cresce junto com o seu negócio. Resultados cada vez melhores.",
  },
];

const SolutionSection = () => {
  return (
    <section id="solucoes" className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-3xl" />

      <div className="section-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Nossa solução
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Como a <span className="gradient-text">SensoriAI</span> resolve isso
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Um processo estruturado e comprovado para transformar sua operação
            com Inteligência Artificial.
          </p>
        </motion.div>

        <div className="relative">
          <div className="hidden lg:block absolute top-24 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative group"
              >
                <div className="glass-card p-8 h-full text-center hover:border-primary/50 transition-all duration-300">
                  <div className="relative z-10 mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                    <step.icon className="w-7 h-7 text-white" />
                  </div>

                  <span className="text-xs font-bold text-primary uppercase tracking-wider mb-3 block">
                    Passo {step.number}
                  </span>

                  <h3 className="font-display text-xl font-semibold text-foreground mb-4">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center my-4">
                    <ArrowRight className="w-6 h-6 text-primary rotate-90 md:rotate-0" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
