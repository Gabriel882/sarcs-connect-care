import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DollarSign, Heart, LogOut, Users } from "lucide-react";
import { EmergencyAlert } from "@/components/EmergencyAlert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface EmergencyAlertType {
  id: string;
  title: string;
  description: string;
  severity: string;
  location: string;
  created_at: string;
}

const Index = () => {
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<EmergencyAlertType[]>([]);
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [open3, setOpen3] = useState(false);
  const [open4, setOpen4] = useState(false);

  // Fetch emergency alerts from Supabase
  useEffect(() => {
    const loadAlerts = async () => {
      const { data, error } = await supabase.from("emergency_alerts").select("*");
      if (error) {
        console.error("Error fetching alerts:", error);
      } else {
        console.log("Fetched alerts:", data);
        setAlerts(data || []);
      }
    };

    loadAlerts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center">
        <Heart className="h-12 w-12 text-primary fill-primary animate-pulse mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-primary fill-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">SARCS</h1>
              <p className="text-sm text-muted-foreground">Disaster Response Portal</p>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-2">
              {userRole === "admin" && (
                <Button onClick={() => navigate("/admin")}>Admin Dashboard</Button>
              )}
              {userRole === "volunteer" && (
                <Button onClick={() => navigate("/volunteer")}>Volunteer Dashboard</Button>
              )}
              {userRole === "donor" && (
                <Button onClick={() => navigate("/donor")}>Donor Dashboard</Button>
              )}
              <Button variant="outline" size="icon" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Together We Make a Difference
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of volunteers and donors helping communities in need across South Africa.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/auth")}>
              <Heart className="mr-2 h-5 w-5" /> Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/active-emergencies")}
            >
              <DollarSign className="mr-2 h-5 w-5" /> View Active Emergencies
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <Heart className="h-5 w-5 text-destructive" />
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
      </section>

      {/* Active Alerts */}
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
  severity={alert.severity as "low" | "medium" | "high" | "critical"}
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
          <h2 className="text-4xl font-bold mb-8">
            What Our Volunteers & Donors Say
          </h2>

          <div className="flex flex-wrap justify-center gap-8">
            {[
              {
                img: "images/download.jpeg",
                name: "John D.",
                role: "Volunteer",
                quote:
                  "Volunteering with SARCS has been one of the most rewarding experiences of my life. I’m proud to be part of a team making a real difference.",
                stars: "⭐⭐⭐⭐⭐",
              },
              {
                img: "images/images.jpeg",
                name: "Sarah L.",
                role: "Donor",
                quote:
                  "Donating to SARCS feels good because I know my contribution is going directly to those in need. Every cent counts!",
                stars: "⭐⭐⭐⭐",
              },
              {
                img: "images/download (1).jpeg",
                name: "Alex R.",
                role: "Volunteer",
                quote:
                  "The SARCS team makes you feel like you're part of something bigger. The impact you make is real and visible in the eyes of those you help.",
                stars: "⭐⭐⭐⭐⭐",
              },
            ].map((t, i) => (
              <div
                key={i}
                className="max-w-sm p-6 border rounded-lg bg-white shadow-lg hover:shadow-2xl transform transition-all duration-300 hover:scale-105"
              >
                <img
                  src={t.img}
                  alt={t.name}
                  className="w-16 h-16 rounded-full mx-auto mb-4 border-2 border-primary object-cover"
                />
                <p className="italic text-muted-foreground mb-4">"{t.quote}"</p>
                <p className="font-semibold text-primary">
                  – {t.name}, {t.role}
                </p>
                <div className="text-yellow-500 mt-2">{t.stars}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>

          {[
            {
              q: "How can I donate to SARCS?",
              a: "Donations can be made through our website or via bank transfer. Every donation makes a difference!",
              open: open1,
              setOpen: setOpen1,
            },
            {
              q: "How do I receive updates on active emergencies?",
              a: "Once you sign up, you will receive notifications on your email or mobile device for active emergencies that need immediate attention.",
              open: open2,
              setOpen: setOpen2,
            },
            {
              q: "Can I volunteer remotely for SARCS?",
              a: "While most volunteer work is hands-on, we do offer remote opportunities such as content creation, virtual fundraising, and digital outreach.",
              open: open3,
              setOpen: setOpen3,
            },
            {
              q: "How can I become a volunteer?",
              a: "Becoming a volunteer is easy! Simply sign up, select your role, and you’ll start receiving updates on opportunities.",
              open: open4,
              setOpen: setOpen4,
            },
          ].map((item, i) => (
            <div key={i} className="border-b pb-4 mb-4">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => item.setOpen(!item.open)}
              >
                <h3 className="text-xl font-semibold">{item.q}</h3>
                <svg
                  className={`h-6 w-6 text-muted-foreground transform transition-transform duration-200 ${
                    item.open ? "rotate-180" : ""
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              {item.open && <p className="mt-2">{item.a}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
