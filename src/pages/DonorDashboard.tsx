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

// Mock data for demonstration purposes
const mockDonations = [
  { id: '1', amount: 100, description: 'Food Donation', payment_reference: 'REF123', created_at: '2023-10-01', currency: 'ZAR' },
  { id: '2', amount: 200, description: 'Clothing Donation', payment_reference: 'REF124', created_at: '2023-10-02', currency: 'ZAR' },
];

const DonorDashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [donations, setDonations] = useState(mockDonations);
  const [totalDonated, setTotalDonated] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const total = donations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    setTotalDonated(total);
  }, [donations]);

  // Handle new donation submission
  const handleDonation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;
    const paymentMethod = formData.get('paymentMethod') as string;

    // Simulate adding donation
    setDonations([
      ...donations,
      {
        id: `${donations.length + 1}`,
        amount,
        description,
        payment_reference: `REF-${Date.now()}`,
        created_at: new Date().toISOString(),
        currency: 'ZAR',
      },
    ]);
    toast({ title: 'Thank you!', description: 'Your donation has been recorded.' });
    setIsDialogOpen(false);
  };

  if (loading) {
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
                        <Input
                          id="amount"
                          name="amount"
                          type="number"
                          step="0.01"
                          min="1"
                          placeholder="100.00"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                          id="description"
                          name="description"
                          placeholder="What is this donation for?"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Input
                          id="paymentMethod"
                          name="paymentMethod"
                          placeholder="e.g., Credit Card, Bank Transfer"
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Submit Donation
                      </Button>
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
