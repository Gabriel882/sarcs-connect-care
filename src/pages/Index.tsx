import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { EmergencyAlert } from '@/components/EmergencyAlert';
import { Heart, Users, DollarSign, Bell, LogOut } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Load alerts from Supabase
const fetchAlerts = async () => {
  try {
    const { data, error } = await supabase.from('emergency_alerts').select('*');
    if (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Unexpected error:', err);
    return [];
  }
};

const Index = () => {
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (!loading && user && userRole) {
      switch (userRole) {
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        case 'volunteer':
          navigate('/volunteer', { replace: true });
          break;
        case 'donor':
          navigate('/donor', { replace: true });
          break;
      }
    }
  }, [user, userRole, loading, navigate]);

  // Load alerts and subscribe to real-time changes
  useEffect(() => {
    let channel: ReturnType<typeof supabase['channel']> | null = null;

    const initAlerts = async () => {
      const initialAlerts = await fetchAlerts();
      setAlerts(initialAlerts);

      channel = supabase
        .channel('emergency_alerts')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'emergency_alerts' },
          async () => {
            const updatedAlerts = await fetchAlerts();
            setAlerts(updatedAlerts);
          }
        )
        .subscribe();
    };

    initAlerts();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-12 w-12 text-primary fill-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-primary fill-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">SARCS</h1>
                <p className="text-sm text-muted-foreground">Disaster Response Portal</p>
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-2">
                <Button onClick={() => navigate(`/${userRole}`)}>My Dashboard</Button>
                <Button variant="outline" size="icon" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Together We Make a Difference
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of volunteers and donors helping communities in need across South Africa
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" onClick={() => navigate(user ? `/${userRole}` : '/auth')}>
                <Heart className="mr-2 h-5 w-5" />
                Get Started
              </Button>
              <Button size="lg" variant="outline">
                <Bell className="mr-2 h-5 w-5" />
                View Active Emergencies
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Active Volunteers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">2,456</p>
                <CardDescription>Ready to help</CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-destructive" />
                  Active Emergencies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{alerts.length}</p>
                <CardDescription>Requiring immediate attention</CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-success" />
                  Total Donations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">ZAR 1.2M</p>
                <CardDescription>This month</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Active Alerts Section */}
      {alerts.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6">Active Emergency Alerts</h2>
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
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
