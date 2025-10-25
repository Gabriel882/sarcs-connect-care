import { DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface DonationCardProps {
  amount: number;
  currency: string;
  description?: string;
  paymentMethod?: string;
  createdAt: string;
}

export const DonationCard = ({
  amount,
  currency,
  description,
  paymentMethod,
  createdAt,
}: DonationCardProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-success/10 p-3">
            <DollarSign className="h-6 w-6 text-success" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                {currency} {amount.toFixed(2)}
              </h3>
              <Badge variant="secondary">{paymentMethod || 'Donation'}</Badge>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {format(new Date(createdAt), 'PPp')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
