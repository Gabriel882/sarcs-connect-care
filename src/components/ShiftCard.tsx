import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

export type Shift = {
  id: string;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  max_volunteers: number;
  current_volunteers?: number;
  volunteer_count?: number; // ✅ Added this to match AdminDashboard usage
  status: "open" | "completed" | "assigned";
};

export interface ShiftCardProps {
  shift: Shift;
  isSignedUp?: boolean;
  onSignUp?: (shiftId: string) => Promise<void>;
  onCancel?: (shiftId: string) => Promise<void>;
}

export const ShiftCard = ({ shift, isSignedUp, onSignUp, onCancel }: ShiftCardProps) => {
  const handleAction = async () => {
    if (isSignedUp && onCancel) {
      await onCancel(shift.id);
    } else if (!isSignedUp && onSignUp) {
      await onSignUp(shift.id);
    }
  };

  const buttonLabel = isSignedUp ? "Cancel Signup" : "Sign Up";
  const buttonVariant = isSignedUp ? "destructive" : "default";

  return (
    <Card className="flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <CardTitle>{shift.title}</CardTitle>
        <CardDescription>{shift.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span>{shift.location}</span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span>
            {new Date(shift.start_time).toLocaleDateString()} -{" "}
            {new Date(shift.end_time).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span>
            {new Date(shift.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
            -{" "}
            {new Date(shift.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span>
            <strong>Volunteers:</strong>{" "}
            {shift.current_volunteers ?? shift.volunteer_count ?? 0}/{shift.max_volunteers}
          </span>
        </div>

        <div>
          <strong>Status:</strong>{" "}
          <span
            className={`${
              shift.status === "open"
                ? "text-green-600"
                : shift.status === "assigned"
                ? "text-yellow-600"
                : "text-gray-500"
            }`}
          >
            {shift.status}
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end">
        {(onSignUp || onCancel) && (
          <Button variant={buttonVariant} onClick={handleAction}>
            {buttonLabel}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
