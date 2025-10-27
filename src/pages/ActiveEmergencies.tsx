import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmergencyAlert } from '@/components/EmergencyAlert';  // Importing the EmergencyAlert component
import { ArrowLeft, RefreshCw } from 'lucide-react';

type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

interface Alert {
  id: number;
  title: string;
  description: string;
  severity: SeverityLevel;
  location: string;
  created_at: string;
}

const ActiveEmergencies = () => {
  const navigate = useNavigate();

  // ✅ Hardcoded alerts with correct literal types
  const alerts: Alert[] = [
    {
      id: 1,
      title: 'Flood in Cape Town',
      description:
        'Severe flooding in the downtown area. Immediate assistance required for evacuation and relief.',
      severity: 'high',
      location: 'Cape Town, Western Cape',
      created_at: '2023-10-27T10:00:00Z',
    },
    {
      id: 2,
      title: 'Wildfire in Limpopo',
      description:
        'A large wildfire is spreading rapidly. Volunteers needed for containment and firefighting efforts.',
      severity: 'medium',
      location: 'Limpopo, Northern Province',
      created_at: '2023-10-26T15:30:00Z',
    },
    {
      id: 3,
      title: 'Earthquake in Johannesburg',
      description:
        'A moderate earthquake has struck Johannesburg. Immediate relief teams needed for damage assessment and search-and-rescue operations.',
      severity: 'critical',
      location: 'Johannesburg, Gauteng',
      created_at: '2023-10-25T08:45:00Z',
    },
  ];

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 text-destructive">
              <RefreshCw className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Active Emergencies</h1>
              <p className="text-sm text-muted-foreground">
                Current crises requiring immediate assistance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {alerts.length === 0 ? (
          <Card className="max-w-lg mx-auto text-center py-12">
            <CardHeader>
              <CardTitle>No Active Emergencies</CardTitle>
              <CardDescription>
                There are currently no ongoing emergencies. Please check back later.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <EmergencyAlert
                key={alert.id}
                title={alert.title}
                description={alert.description}
                severity={alert.severity}
                location={alert.location}
                createdAt={alert.created_at}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button for Refresh */}
      <div className="fixed bottom-6 right-6">
        <Button variant="secondary" className="rounded-full p-4 shadow-lg">
          <RefreshCw className="h-6 w-6 text-white" />
        </Button>
      </div>
    </div>
  );
};

export default ActiveEmergencies;
