import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ShiftCard } from '@/components/ShiftCard';
import { Heart, LogOut, Plus, Home, Calendar, Search, DollarSign, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';  // Import the Input component here
import { StatsCard } from '@/components/admin/StatsCard';
import { DonationCard } from '@/components/DonationCard';

const VolunteerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [availableShifts, setAvailableShifts] = useState<any[]>([]);
  const [myShifts, setMyShifts] = useState<any[]>([]);
  const [signupIds, setSignupIds] = useState<Set<string>>(new Set());
  const [donations, setDonations] = useState<any[]>([]);

  const [stats, setStats] = useState({
    totalShifts: 0,
    totalDonations: 0,
  });

  // Load available shifts for volunteering
  const loadShifts = async () => {
    const { data, error } = await supabase
      .from('volunteer_shifts')
      .select('*')
      .eq('status', 'open')
      .order('start_time', { ascending: true });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else if (data) {
      setAvailableShifts(data);
    }
  };

  // Load shifts that the user has signed up for
  const loadMyShifts = async () => {
    const { data: signups, error } = await supabase
      .from('shift_signups')
      .select('*, volunteer_shifts(*)')
; // Bypass auth by using a mock user ID

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else if (signups) {
      setMyShifts(signups.map((s) => s.volunteer_shifts));
      setSignupIds(new Set(signups.map((s) => s.shift_id)));
    }
  };

  // Handle the signup process for a volunteer shift
  const handleSignUp = async (shiftId: string) => {
    const { error } = await supabase.from('shift_signups').insert({
      shift_id: shiftId,
      volunteer_id: 'mock-user-id', // Use mock user ID for bypass
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success!',
      description: 'You have signed up for this shift.',
    });

    loadShifts();
    loadMyShifts();
  };

  // Handle cancelling the shift signup
  const handleCancel = async (shiftId: string) => {
    const { error } = await supabase
      .from('shift_signups')
      .delete()
      .eq('shift_id', shiftId)
      .eq('volunteer_id', 'mock-user-id'); // Use mock user ID for bypass

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Cancelled',
      description: 'Your shift signup has been cancelled.',
    });

    loadShifts();
    loadMyShifts();
  };

  // Load total donations for stats
  const loadStats = async () => {
    const { data: donationData } = await supabase.from('donations').select('amount');
    const totalDonations = donationData?.reduce((sum: number, donation: any) => sum + donation.amount, 0);

    setStats((prevStats: any) => ({
      ...prevStats,
      totalShifts: availableShifts.length,
      totalDonations: totalDonations || 0,
    }));
  };

  // Load donations data
  const loadDonations = async () => {
    const { data } = await supabase.from('donations').select('*');
    if (data) setDonations(data);
  };

  // Search users or shifts
  const searchShifts = async (query: string) => {
    const { data } = await supabase
      .from('volunteer_shifts')
      .select('*')
      .ilike('title', `%${query}%`);
    if (data) setAvailableShifts(data);
  };

  // Load all data on mount
  useEffect(() => {
    loadShifts();
    loadMyShifts();
    loadStats();
    loadDonations();
  }, []);

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-primary fill-primary" />
              <div>
                <h1 className="text-2xl font-bold">Volunteer Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage your volunteer shifts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/')}>
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigate('/auth')}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard title="Total Shifts" value={stats.totalShifts} icon={Calendar} />
          <StatsCard title="Total Donations" value={`ZAR ${stats.totalDonations}`} icon={DollarSign} />
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="available">
          <TabsList>
            <TabsTrigger value="available">
              <Calendar className="mr-2 h-4 w-4" />
              Available Shifts
            </TabsTrigger>
            <TabsTrigger value="my-shifts">My Shifts</TabsTrigger>
          </TabsList>

          {/* Available Shifts Tab */}
          <TabsContent value="available" className="mt-6">
            <div className="flex justify-between mb-6">
              <Input
                placeholder="Search Shifts"
                className="w-1/2"
                onChange={(e) => searchShifts(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableShifts.length > 0 ? (
                availableShifts.map((shift) => (
                  <ShiftCard
                    key={shift.id}
                    {...shift}
                    isSignedUp={signupIds.has(shift.id)}
                    onSignUp={handleSignUp}
                    onCancel={handleCancel}
                  />
                ))
              ) : (
                <p className="col-span-full text-center text-muted-foreground py-12">
                  No shifts available at the moment.
                </p>
              )}
            </div>
          </TabsContent>

          {/* My Shifts Tab */}
          <TabsContent value="my-shifts" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myShifts.length > 0 ? (
                myShifts.map((shift) => (
                  <ShiftCard
                    key={shift.id}
                    {...shift}
                    isSignedUp={true}
                    onCancel={handleCancel}
                  />
                ))
              ) : (
                <p className="col-span-full text-center text-muted-foreground py-12">
                  You haven't signed up for any shifts yet.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default VolunteerDashboard;
