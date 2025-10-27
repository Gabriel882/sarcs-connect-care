import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmergencyAlert } from "@/components/EmergencyAlert";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type SeverityLevel = "low" | "medium" | "high" | "critical";

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  location: string;
  created_at: string;
}

/**
 * Displays all currently active emergency alerts from Supabase.
 */
const ActiveEmergencies = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch active emergencies from Supabase.
   */
  const fetchActiveEmergencies = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("emergency_alerts")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform Supabase data into Alert type
      const transformedAlerts =
        data?.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          severity: item.severity as SeverityLevel,
          location: item.location,
          created_at: item.created_at,
        })) || [];

      setAlerts(transformedAlerts);
    } catch (err) {
      console.error("Error fetching emergencies:", err);
      setError("Failed to fetch active emergencies. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch emergencies on mount
  useEffect(() => {
    fetchActiveEmergencies();
  }, []);

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-8 w-8 text-primary animate-spin-slow" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Active Emergencies
              </h1>
              <p className="text-sm text-muted-foreground">
                Current crises requiring immediate assistance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <Card className="max-w-lg mx-auto text-center py-12">
            <CardHeader>
              <CardTitle>Loading Active Emergencies...</CardTitle>
              <CardDescription>
                Fetching the latest emergencies, please wait.
              </CardDescription>
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
                There are currently no ongoing emergencies. Please check back
                later.
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

      {/* Floating Refresh Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          variant="secondary"
          className="rounded-full p-4 shadow-lg"
          onClick={fetchActiveEmergencies}
          disabled={loading}
        >
          <RefreshCw
            className={`h-6 w-6 text-white ${
              loading ? "animate-spin" : ""
            }`}
          />
        </Button>
      </div>
    </div>
  );
};

export default ActiveEmergencies;
