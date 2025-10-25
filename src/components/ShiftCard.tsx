import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface ShiftCardProps {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  maxVolunteers: number;
  currentVolunteers: number;
  status: string;
  isSignedUp?: boolean;
  onSignUp?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export const ShiftCard = ({
  id,
  title,
  description,
  location,
  startTime,
  endTime,
  maxVolunteers,
  currentVolunteers,
  status,
  isSignedUp,
  onSignUp,
  onCancel,
}: ShiftCardProps) => {
  const availableSpots = maxVolunteers - currentVolunteers;
  const isFull = availableSpots === 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">{title}</CardTitle>
          <Badge variant={isFull ? 'secondary' : 'default'}>
            {status === 'open' ? (isFull ? 'Full' : 'Open') : status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{description}</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(startTime), 'PPP')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(new Date(startTime), 'p')} - {format(new Date(endTime), 'p')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {currentVolunteers}/{maxVolunteers} volunteers
              {!isFull && ` (${availableSpots} spots left)`}
            </span>
          </div>
        </div>
      </CardContent>
      {(onSignUp || onCancel) && (
        <CardFooter>
          {isSignedUp ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onCancel?.(id)}
            >
              Cancel Signup
            </Button>
          ) : (
            <Button
              className="w-full"
              disabled={isFull || status !== 'open'}
              onClick={() => onSignUp?.(id)}
            >
              {isFull ? 'Shift Full' : 'Sign Up'}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};
