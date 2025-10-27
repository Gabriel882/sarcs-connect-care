import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { DollarSign, Heart, LogOut } from 'lucide-react';
import { EmergencyAlert } from '@/components/EmergencyAlert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);

  // Load alerts from Supabase or your backend service
  useEffect(() => {
    const loadAlerts = async () => {
      const { data, error } = await supabase.from('emergency_alerts').select('*');
      if (error) console.error('Error fetching alerts:', error);
      console.log('Fetched alerts:', data); // Debugging line
      setAlerts(data || []);
    };
    loadAlerts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Heart className="h-12 w-12 text-primary fill-primary animate-pulse mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Hardcoded Pie Chart Data (Removed dynamic calculation)
  const pieData = [
    { title: 'Critical', value: 5, color: '#e74c3c' },
    { title: 'High', value: 3, color: '#f39c12' },
    { title: 'Medium', value: 8, color: '#f1c40f' },
    { title: 'Low', value: 12, color: '#2ecc71' },
  ];

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header Section */}
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
                <Button onClick={() => navigate(`/admin`)}>Admin Dashboard</Button>
                <Button onClick={() => navigate(`/volunteer`)}>Volunteer Dashboard</Button>
                <Button onClick={() => navigate(`/donor`)}>Donor Dashboard</Button>
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
              <Button size="lg" onClick={() => navigate('/auth')}>
                <Heart className="mr-2 h-5 w-5" />
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/active-emergencies')}
              >
                <DollarSign className="mr-2 h-5 w-5" />
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
                  <DollarSign className="h-5 w-5 text-primary" />
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
                  <DollarSign className="h-5 w-5 text-destructive" />
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
