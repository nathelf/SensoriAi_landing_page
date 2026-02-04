import { motion } from "framer-motion";
import { ArrowRight, Calendar, Mail, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/ContactForm";

const CTASection = () => {
  return (
    <section id="contato" className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 rounded-full blur-3xl"
      />

      <div className="section-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Vamos começar?
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Pronto para transformar seus dados em{" "}
            <span className="gradient-text">inteligência</span>?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-10">
            Fale com um especialista da SensoriAI e descubra como a IA pode
            trabalhar para o seu negócio.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center mb-16">
            <Button variant="glow" size="lg" className="gap-2 group text-base" asChild>
              <a href="#contato-form">
                <Calendar className="w-5 h-5" />
                Agendar conversa
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 text-base"
              asChild
            >
              <a
                href="https://wa.me/5511999999999?text=Ol%C3%A1%2C%20quero%20agendar%20uma%20conversa%20com%20a%20SensoriAI."
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 text-base"
              asChild
            >
              <a href="mailto:contato@sensoriai.com">
                <Mail className="w-5 h-5" />
                contato@sensoriai.com
              </a>
            </Button>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Mail, label: "E-mail", value: "contato@sensoriai.com" },
              { icon: Phone, label: "Telefone", value: "+55 (11) 99999-9999" },
              { icon: Calendar, label: "Resposta", value: "Em até 24 horas" },
            ].map((contact, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 text-center"
              >
                <contact.icon className="w-6 h-6 text-primary mx-auto mb-3" />
                <div className="text-sm text-muted-foreground mb-1">
                  {contact.label}
                </div>
                <div className="font-medium text-foreground">
                  {contact.value}
                </div>
              </motion.div>
            ))}
          </div>

          <div id="contato-form" className="mt-16 text-left">
            <h3 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-4 text-center">
              Envie sua mensagem
            </h3>
            <p className="text-muted-foreground mb-8 text-center">
              Preencha o formulário e nossa equipe entrará em contato por e-mail.
            </p>
            <ContactForm />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
