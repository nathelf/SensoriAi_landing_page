import { Card, CardContent } from "@/components/ui/card";
import { User, Wheat, Calendar } from "lucide-react";

interface FarmInfo {
  consultant: string;
  crop: string;
  season: string;
}

interface FarmInfoHeaderProps {
  info: FarmInfo;
}

export const FarmInfoHeader = ({ info }: FarmInfoHeaderProps) => {
  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Consultor</p>
              <p className="font-semibold text-foreground">{info.consultant}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Wheat className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cultura</p>
              <p className="font-semibold text-foreground">{info.crop}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <Calendar className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Safra</p>
              <p className="font-semibold text-foreground">{info.season}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
