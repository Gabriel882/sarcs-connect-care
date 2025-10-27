import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, AlertTriangle, Clock } from "lucide-react";

type SeverityLevel = "low" | "medium" | "high" | "critical";

interface EmergencyAlertProps {
  title: string;
  description: string;
  severity: SeverityLevel;
  location: string;
  createdAt: string;
}

/**
 * Displays a single emergency alert card with severity-based colors.
 */
export const EmergencyAlert = ({
  title,
  description,
  severity,
  location,
  createdAt,
}: EmergencyAlertProps) => {
  // Define color scheme for severity levels
  const severityStyles: Record<
    SeverityLevel,
    { label: string; color: string }
  > = {
    low: { label: "Low", color: "bg-green-500" },
    medium: { label: "Medium", color: "bg-yellow-500" },
    high: { label: "High", color: "bg-orange-500" },
    critical: { label: "Critical", color: "bg-red-600" },
  };

  const formattedDate = new Date(createdAt).toLocaleString();

  return (
    <Card className="border-l-4 shadow-md transition-all hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </div>
        <Badge className={`${severityStyles[severity].color} text-white`}>
          {severityStyles[severity].label}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-primary" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
