import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const Settings = () => {
  const handleSave = () => {
    toast.success("Configurações salvas com sucesso!");
  };

  return (
    <DashboardLayout>
      <div id="dashboard-content" className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Propriedade</CardTitle>
              <CardDescription>Configure os dados básicos da fazenda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="farm-name">Nome da Propriedade</Label>
                  <Input id="farm-name" defaultValue="Fazenda Santa Clara" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner">Proprietário</Label>
                  <Input id="owner" defaultValue="João Silva" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="crop">Cultura</Label>
                  <Input id="crop" defaultValue="Soja" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="season">Safra</Label>
                  <Input id="season" defaultValue="2024/2025" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Área Total (hectares)</Label>
                <Input id="area" type="number" defaultValue="520" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Consultor Responsável</CardTitle>
              <CardDescription>Informações do consultor agrícola</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="consultant-name">Nome do Consultor</Label>
                  <Input id="consultant-name" defaultValue="Dr. Carlos Silva" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consultant-email">Email</Label>
                  <Input id="consultant-email" type="email" defaultValue="carlos@sensoriAI.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="consultant-phone">Telefone</Label>
                <Input id="consultant-phone" defaultValue="(11) 98765-4321" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferências de Análise</CardTitle>
              <CardDescription>Configure os parâmetros de análise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações de Alerta</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber alertas sobre níveis críticos de infestação
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Análise Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Processar automaticamente novos voos
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Relatórios Semanais</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar resumo semanal por email
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limites de Alerta</CardTitle>
              <CardDescription>Defina os limites para alertas automáticos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weed-threshold">Limite de Infestação de Plantas Daninhas (%)</Label>
                <Input id="weed-threshold" type="number" defaultValue="25" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="failure-threshold">Limite de Falhas de Plantio (%)</Label>
                <Input id="failure-threshold" type="number" defaultValue="15" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vigor-threshold">Limite Mínimo de Vigor (%)</Label>
                <Input id="vigor-threshold" type="number" defaultValue="40" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline">Cancelar</Button>
            <Button onClick={handleSave}>Salvar Configurações</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
