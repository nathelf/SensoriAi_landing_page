import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Phone, Building2, User } from "lucide-react";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  company: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  message: z.string().trim().min(10, "Mensagem deve ter pelo menos 10 caracteres").max(1000),
});

export const ContactForm = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      const validated = contactSchema.parse(formData);

      // URL da API: localhost em desenvolvimento, relativa em produção
      const apiBaseUrl = import.meta.env.DEV 
        ? "http://localhost:3001" 
        : ""; // Em produção na Vercel, usa URL relativa

      let response;
      try {
        response = await fetch(`${apiBaseUrl}/api/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validated),
        });
      } catch (fetchError: any) {
        // Erro de rede (servidor não está rodando, CORS, etc)
        if (fetchError.message?.includes('fetch') || fetchError.message?.includes('Failed to fetch')) {
          throw new Error("Não foi possível conectar ao servidor. Verifique se o servidor está rodando na porta 3001.");
        }
        throw fetchError;
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // Se não conseguir fazer parse do JSON, pode ser erro de servidor
        const text = await response.text();
        throw new Error(`Erro no servidor: ${response.status} - ${text.slice(0, 200)}`);
      }

      if (!response.ok) {
        throw new Error(data.userMessage || data.error || data.detail || "Erro ao enviar mensagem");
      }

      toast({
        title: "Mensagem enviada!",
        description: data.message || "Obrigado pelo contato. Responderemos em breve.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        company: "",
        phone: "",
        message: "",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        console.error("Error sending contact email:", error);
        
        // Mensagens de erro mais específicas
        let errorMessage = error.message || "Tente novamente mais tarde.";
        
        if (error.message?.includes('conectar ao servidor') || error.message?.includes('Failed to fetch')) {
          errorMessage = "Servidor não está respondendo. Verifique se o servidor está rodando na porta 3001.";
        } else if (error.message?.includes('CORS')) {
          errorMessage = "Erro de configuração do servidor. Verifique as configurações de CORS.";
        } else if (error.message?.includes('rate_limit')) {
          errorMessage = "Muitas requisições. Aguarde um momento antes de tentar novamente.";
        }
        
        toast({
          title: "Erro ao enviar mensagem",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Solicitar Demonstração</CardTitle>
        <CardDescription>
          Preencha o formulário e nossa equipe entrará em contato
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="João Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="joao@fazenda.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="company"
                  placeholder="Fazenda XYZ"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 98765-4321"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              placeholder="Conte-nos sobre suas necessidades e como podemos ajudar..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="min-h-[120px]"
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar Mensagem"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
