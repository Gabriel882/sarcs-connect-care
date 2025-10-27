import { DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Donation } from "@/pages/DonorDashboard"; // ✅ import type

interface DonationCardProps {
  donation: Donation;
}

export const DonationCard = ({ donation }: DonationCardProps) => {
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
                {donation.currency} {donation.amount.toFixed(2)}
              </h3>
              <Badge variant="secondary">
                {donation.payment_method || "Donation"}
              </Badge>
            </div>
            {donation.description && (
              <p className="text-sm text-muted-foreground">
                {donation.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {format(new Date(donation.created_at), "PPp")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
