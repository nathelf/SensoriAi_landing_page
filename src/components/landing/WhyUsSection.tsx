import { motion } from "framer-motion";
import {
  Target,
  Users,
  Zap,
  Shield,
  MessageCircle,
  Trophy,
} from "lucide-react";

const differentials = [
  {
    icon: Target,
    title: "IA para Problemas Reais",
    description:
      "Não usamos IA como buzzword. Aplicamos onde realmente gera valor para o seu negócio.",
  },
  {
    icon: Users,
    title: "Soluções Sob Medida",
    description:
      "Cada projeto é único. Desenvolvemos do zero pensando nas suas necessidades específicas.",
  },
  {
    icon: Zap,
    title: "Time Especializado",
    description:
      "Engenheiros e cientistas de dados com experiência em projetos complexos de IA.",
  },
  {
    icon: Shield,
    title: "Foco em Escalabilidade",
    description:
      "Arquiteturas robustas que crescem com seu negócio, de startup a enterprise.",
  },
  {
    icon: MessageCircle,
    title: "Comunicação Clara",
    description:
      "Sem jargões técnicos desnecessários. Você entende cada etapa do projeto.",
  },
  {
    icon: Trophy,
    title: "Resultados Mensuráveis",
    description:
      "KPIs definidos desde o início. Você acompanha o ROI da sua investida.",
  },
];

const WhyUsSection = () => {
  return (
    <section id="sobre" className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl" />

      <div className="section-container relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              Por que a SensoriAI
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              O que nos diferencia no mercado
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Não fazemos IA para impressionar. <br />
              <span className="text-foreground font-semibold">
                Fazemos IA para funcionar.
              </span>
            </p>

            <div className="grid grid-cols-3 gap-6">
              {[
                { value: "50+", label: "Projetos entregues" },
                { value: "98%", label: "Satisfação" },
                { value: "5 anos", label: "Experiência" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-4 text-center"
                >
                  <div className="font-display text-2xl md:text-3xl font-bold gradient-text">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4">
            {differentials.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="glass-card p-6 hover:border-primary/50 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyUsSection;
