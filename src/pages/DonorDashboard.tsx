import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { DonationCard } from '@/components/DonationCard';
import { Heart, LogOut, Plus, Home } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DonorDashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [donations, setDonations] = useState<any[]>([]);
  const [totalDonated, setTotalDonated] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
    return data?.role;
  };

  useEffect(() => {
    const initialize = async () => {
      if (!loading && !user) {
        navigate('/auth');
      } else if (user) {
        const userRole = await fetchUserRole(user.id);
        setRole(userRole);

        // Redirect if user is not a donor
        if (userRole === 'admin') navigate('/admin-dashboard');
        else if (userRole === 'volunteer') navigate('/volunteer-dashboard');
        else if (userRole !== 'donor') navigate('/auth'); // fallback
        else loadDonations();
      }
    };
    initialize();
  }, [user, loading, navigate]);

  const loadDonations = async () => {
    const { data } = await supabase
      .from('donations')
      .select('*')
      .eq('donor_id', user?.id)
      .order('created_at', { ascending: false });

    if (data) {
      setDonations(data);
      const total = data.reduce((sum, d) => sum + Number(d.amount), 0);
      setTotalDonated(total);
    }
  };

  const handleDonation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;
    const paymentMethod = formData.get('paymentMethod') as string;

    const { error } = await supabase.from('donations').insert({
      donor_id: user?.id,
      amount,
      description,
      payment_method: paymentMethod,
      payment_reference: `REF-${Date.now()}`,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Thank you!', description: 'Your donation has been recorded.' });
    setIsDialogOpen(false);
    loadDonations();
  };

  if (loading || !user || role === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Heart className="h-12 w-12 text-primary fill-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-primary fill-primary" />
              <div>
                <h1 className="text-2xl font-bold">Donor Dashboard</h1>
                <p className="text-sm text-muted-foreground">Track your contributions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/')}>
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
              <Button variant="outline" size="icon" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Donated</p>
                  <p className="text-3xl font-bold text-success">
                    ZAR {totalDonated.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {donations.length} donation{donations.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg">
                      <Plus className="mr-2 h-5 w-5" />
                      Make a Donation
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Make a Donation</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleDonation} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (ZAR)</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" min="1" placeholder="100.00" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea id="description" name="description" placeholder="What is this donation for?" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Input id="paymentMethod" name="paymentMethod" placeholder="e.g., Credit Card, Bank Transfer" />
                      </div>
                      <Button type="submit" className="w-full">Submit Donation</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Donation History</h2>
          <div className="space-y-4">
            {donations.map((donation) => (
              <DonationCard key={donation.id} {...donation} />
            ))}
            {donations.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                You haven't made any donations yet.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DonorDashboard;
