import { motion } from "framer-motion";
import { Clock, Database, TrendingDown, HelpCircle } from "lucide-react";

const problems = [
  {
    icon: Clock,
    title: "Processos manuais que consomem tempo",
    description: "Horas gastas em tarefas repetitivas que poderiam ser automatizadas",
  },
  {
    icon: Database,
    title: "Dados espalhados e sem valor prático",
    description: "Informações valiosas perdidas em planilhas e sistemas desconectados",
  },
  {
    icon: TrendingDown,
    title: "Sistemas que não escalam",
    description: "Soluções que funcionam hoje, mas travam o crescimento de amanhã",
  },
  {
    icon: HelpCircle,
    title: "Decisões baseadas em achismo",
    description: "Falta de insights concretos para orientar estratégias de negócio",
  },
];

const ProblemsSection = () => {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />

      <div className="section-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-destructive/10 text-destructive text-sm font-medium mb-6">
            O problema
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Seu negócio enfrenta esses desafios?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Se você se identificou com algum desses problemas, você está no lugar
            certo.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="glass-card p-8 h-full transition-all duration-300 hover:border-destructive/50 hover:bg-destructive/5">
                <div className="flex gap-5">
                  <div className="shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                      <problem.icon className="w-7 h-7 text-destructive" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                      {problem.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {problem.description}
                    </p>
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

export default ProblemsSection;
