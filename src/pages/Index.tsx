import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { DollarSign, Heart, LogOut, Users } from 'lucide-react';
import { EmergencyAlert } from '@/components/EmergencyAlert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [open1, setOpen1] = useState(false);
const [open2, setOpen2] = useState(false);
const [open3, setOpen3] = useState(false);
const [open4, setOpen4] = useState(false);

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
              Join thousands of volunteers and donors helping communities in need across South Africa.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" onClick={() => navigate('/auth')}>
                <Heart className="mr-2 h-5 w-5" />
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/active-emergencies')}>
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

{/* Testimonials Section */}
<section className="py-16 bg-gradient-to-br from-primary/10 via-background to-accent/10">
  <div className="container mx-auto px-4 text-center">
    <h2 className="text-4xl font-bold text-foreground mb-8">What Our Volunteers & Donors Say</h2>

    {/* Testimonial Carousel */}
    <div className="flex flex-wrap justify-center gap-8">
      {/* Testimonial 1 */}
      <div className="max-w-sm p-6 border rounded-lg bg-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
        <div className="flex items-center justify-center mb-4">
          <img 
            src="images\download.jpeg" 
            alt="John D." 
            className="w-16 h-16 rounded-full object-cover border-2 border-primary"
          />
        </div>
        <p className="italic text-muted-foreground">"Volunteering with SARCS has been one of the most rewarding experiences of my life. I’m proud to be part of a team making a real difference in the lives of others."</p>
        <div className="mt-4">
          <p className="font-semibold text-primary">– John D., Volunteer</p>
          <div className="flex justify-center mt-2">
            <span className="text-yellow-500">⭐⭐⭐⭐⭐</span>
          </div>
        </div>
      </div>

      {/* Testimonial 2 */}
      <div className="max-w-sm p-6 border rounded-lg bg-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
        <div className="flex items-center justify-center mb-4">
          <img 
            src="images/images.jpeg " 
            alt="Sarah L." 
            className="w-16 h-16 rounded-full object-cover border-2 border-primary"
          />
        </div>
        <p className="italic text-muted-foreground">"Donating to SARCS feels good because I know my contribution is going directly to those in need. Every cent counts!"</p>
        <div className="mt-4">
          <p className="font-semibold text-primary">– Sarah L., Donor</p>
          <div className="flex justify-center mt-2">
            <span className="text-yellow-500">⭐⭐⭐⭐</span>
          </div>
        </div>
      </div>

      {/* Testimonial 3 */}
      <div className="max-w-sm p-6 border rounded-lg bg-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
        <div className="flex items-center justify-center mb-4">
          <img 
            src="images\download (1).jpeg"
            alt="Alex R." 
            className="w-16 h-16 rounded-full object-cover border-2 border-primary"
          />
        </div>
        <p className="italic text-muted-foreground">"The SARCS team makes you feel like you're part of something bigger. The impact you make is real, and you can see it in the eyes of those you help."</p>
        <div className="mt-4">
          <p className="font-semibold text-primary">– Alex R., Volunteer</p>
          <div className="flex justify-center mt-2">
            <span className="text-yellow-500">⭐⭐⭐⭐⭐</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* FAQ Section */}
<section className="py-16 bg-background">
  <div className="container mx-auto px-4">
    <h2 className="text-4xl font-bold text-center text-foreground mb-8">Frequently Asked Questions</h2>

    <div className="space-y-6">
      {/* FAQ Item 1 */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">How can I donate to SARCS?</h3>
          <svg
            className="h-6 w-6 text-muted-foreground transform transition-transform duration-200"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            onClick={() => setOpen1(!open1)}
            style={{ transform: open1 ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {open1 && (
          <p className="mt-2">
            Donations can be made through our website or via bank transfer. Every donation makes a difference!
          </p>
        )}
      </div>

      {/* FAQ Item 2 */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">How do I receive updates on active emergencies?</h3>
          <svg
            className="h-6 w-6 text-muted-foreground transform transition-transform duration-200"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            onClick={() => setOpen2(!open2)}
            style={{ transform: open2 ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {open2 && (
          <p className="mt-2">
            Once you sign up, you will receive notifications on your email or mobile device for active emergencies that need immediate attention.
          </p>
        )}
      </div>

      {/* FAQ Item 3 */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Can I volunteer remotely for SARCS?</h3>
          <svg
            className="h-6 w-6 text-muted-foreground transform transition-transform duration-200"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            onClick={() => setOpen3(!open3)}
            style={{ transform: open3 ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {open3 && (
          <p className="mt-2">
            While most of our volunteer work is hands-on, we do offer remote opportunities such as content creation, virtual fundraising, and digital outreach. Get in touch to learn more.
          </p>
        )}
      </div>

      {/* FAQ Item 4 */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">How can I become a volunteer?</h3>
          <svg
            className="h-6 w-6 text-muted-foreground transform transition-transform duration-200"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            onClick={() => setOpen4(!open4)}
            style={{ transform: open4 ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {open4 && (
          <p className="mt-2">
            Becoming a volunteer is easy! Simply sign up on our platform, select your role, and you’ll start receiving updates on volunteer opportunities.
          </p>
        )}
      </div>
    </div>
  </div>
</section>

    </div>
  );
};

export default Index;
