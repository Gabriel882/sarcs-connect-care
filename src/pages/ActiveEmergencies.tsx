import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmergencyAlert } from '@/components/EmergencyAlert';  // Importing the EmergencyAlert component
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client'; // Assuming you're using Supabase to fetch data

type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  location: string;
  created_at: string;
}

const ActiveEmergencies = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]); // State to hold fetched alerts
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state

  // Fetch active emergencies from Supabase (or your API)
  const fetchActiveEmergencies = async () => {
  setLoading(true);
  setError(null);

  try {
    // Fetching data from the 'emergency_alerts' table
    const { data, error } = await supabase
      .from<'emergency_alerts', any>('emergency_alerts') // Correct table name
      .select('*')
      .eq('is_active', true); // Use 'is_active' field instead of 'status'

    if (error) {
      throw new Error(error.message);
    }

    // Transform the data to match the Alert type
    const transformedAlerts = data.map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      severity: item.severity,
      location: item.location,
      created_at: item.created_at,
    }));

    setAlerts(transformedAlerts); // Set the correctly typed data

  } catch (err: any) {
    setError('Failed to fetch active emergencies');
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  // Fetch active emergencies when the component mounts
  useEffect(() => {
    fetchActiveEmergencies();
  }, []);

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
        {loading ? (
          <Card className="max-w-lg mx-auto text-center py-12">
            <CardHeader>
              <CardTitle>Loading Active Emergencies...</CardTitle>
              <CardDescription>Fetching the latest emergencies, please wait.</CardDescription>
            </CardHeader>
          </Card>
        ) : error ? (
          <Card className="max-w-lg mx-auto text-center py-12">
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : alerts.length === 0 ? (
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
                <Button
          variant="secondary"
          className="rounded-full p-4 shadow-lg"
          onClick={fetchActiveEmergencies} // Trigger refresh on button click
        >
          <RefreshCw className="h-6 w-6 text-white" />
        </Button>
      </div>
    </div>
  );
};

export default ActiveEmergencies;

