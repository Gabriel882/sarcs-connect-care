import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface EmergencyAlertProps {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  location: string;
  createdAt: string;
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    badge: 'destructive',
    color: 'text-destructive',
  },
  high: {
    icon: AlertTriangle,
    badge: 'destructive',
    color: 'text-destructive',
  },
  medium: {
    icon: AlertTriangle,
    badge: 'default',
    color: 'text-warning',
  },
  low: {
    icon: Info,
    badge: 'secondary',
    color: 'text-accent',
  },
};

export const EmergencyAlert = ({ title, description, severity, location, createdAt }: EmergencyAlertProps) => {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Icon className={`h-6 w-6 mt-1 ${config.color}`} />
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-lg">{title}</h3>
              <Badge variant={config.badge as any} className="capitalize">
                {severity}
              </Badge>
            </div>
            <p className="text-muted-foreground">{description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>📍 {location}</span>
              <span>🕒 {format(new Date(createdAt), 'PPp')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
