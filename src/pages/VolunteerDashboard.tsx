import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ShiftCard, Shift } from '@/components/ShiftCard'; // ✅ Import the Shift type
import { Heart, LogOut, Home, Calendar, DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast'; 
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { StatsCard } from '@/components/admin/StatsCard';

const VolunteerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
// Inside your component:
const { user } = useAuth();
  const [availableShifts, setAvailableShifts] = useState<Shift[]>([]);
  const [myShifts, setMyShifts] = useState<Shift[]>([]);
  const [signupIds, setSignupIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    totalShifts: 0,
    totalDonations: 0,
    
  });

  // ✅ Load available shifts
  const loadShifts = async () => {
    const { data, error } = await supabase
      .from('volunteer_shifts')
      .select('*')
      .eq('status', 'open')
      .order('start_time', { ascending: true });

    if (error) {
      toast({
        title: 'Error loading shifts',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      // ✅ Ensure data conforms to Shift type
      const formatted = (data || []).map((s) => ({
        ...s,
        status: (s.status as 'open' | 'completed' | 'assigned') || 'open',
      }));
      setAvailableShifts(formatted);
    }
  };

 // ✅ Load shifts the volunteer signed up for
const loadMyShifts = async () => {
  if (!user) {
    console.warn('User not logged in — skipping shift load');
    return;
  }

  const { data: signups, error } = await supabase
    .from('shift_signups')
    .select('shift_id, volunteer_shifts(*)')
    .eq('volunteer_id', user.id); // ✅ use real UUID from Supabase Auth

  if (error) {
    toast({
      title: 'Error loading your shifts',
      description: error.message,
      variant: 'destructive',
    });
  } else if (signups) {
    const formatted = signups.map((s) => ({
      ...s.volunteer_shifts,
      status:
        (s.volunteer_shifts.status as 'open' | 'completed' | 'assigned') || 'open',
    }));
    setMyShifts(formatted);
    setSignupIds(new Set(signups.map((s) => s.shift_id)));
  }
};

// ✅ Sign up for a shift
const handleSignUp = async (shiftId: string) => {
  if (!user) {
    toast({
      title: 'Not logged in',
      description: 'You must be logged in to sign up for a shift.',
      variant: 'destructive',
    });
    return;
  }

  const { error } = await supabase.from('shift_signups').insert({
    shift_id: shiftId,
    volunteer_id: user.id, // ✅ use real UUID
  });

  if (error) {
    toast({
      title: 'Error signing up',
      description: error.message,
      variant: 'destructive',
    });
  } else {
    toast({
      title: 'Signed up!',
      description: 'You have successfully signed up for the shift.',
    });
    await loadShifts();
    await loadMyShifts();
  }
};

// ✅ Cancel signup
const handleCancel = async (shiftId: string) => {
  if (!user) {
    toast({
      title: 'Not logged in',
      description: 'You must be logged in to cancel a shift.',
      variant: 'destructive',
    });
    return;
  }

  const { error } = await supabase
    .from('shift_signups')
    .delete()
    .eq('shift_id', shiftId)
    .eq('volunteer_id', user.id); // ✅ use real UUID

  if (error) {
    toast({
      title: 'Error cancelling shift',
      description: error.message,
      variant: 'destructive',
    });
  } else {
    toast({
      title: 'Cancelled',
      description: 'You have cancelled your shift signup.',
    });
    await loadShifts();
    await loadMyShifts();
  }
};

  // ✅ Load donation and shift stats
  const loadStats = async () => {
    const { data: donationData } = await supabase.from('donations').select('amount');
    const totalDonations = donationData?.reduce(
      (sum, d) => sum + (d.amount || 0),
      0
    ) || 0;

    setStats({
      totalShifts: availableShifts.length,
      totalDonations,
    });
  };

  // ✅ Search shifts
  const searchShifts = async (query: string) => {
    if (!query.trim()) {
      loadShifts();
      return;
    }

    const { data } = await supabase
      .from('volunteer_shifts')
      .select('*')
      .ilike('title', `%${query}%`);

    const formatted = (data || []).map((s) => ({
      ...s,
      status: (s.status as 'open' | 'completed' | 'assigned') || 'open',
    }));
    setAvailableShifts(formatted);
  };

  useEffect(() => {
    loadShifts();
    loadMyShifts();
    loadStats();
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
                <p className="text-sm text-muted-foreground">
                  Manage your volunteer activities
                </p>
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

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard title="Total Shifts" value={stats.totalShifts} icon={Calendar} />
          <StatsCard title="Total Donations" value={`ZAR ${stats.totalDonations}`} icon={DollarSign} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="available">
          <TabsList>
            <TabsTrigger value="available">Available Shifts</TabsTrigger>
            <TabsTrigger value="my-shifts">My Shifts</TabsTrigger>
          </TabsList>

          {/* Available Shifts */}
          <TabsContent value="available" className="mt-6">
            <div className="flex justify-between mb-6">
              <Input
                placeholder="Search shifts..."
                className="w-1/2"
                onChange={(e) => searchShifts(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableShifts.length > 0 ? (
                availableShifts.map((shift) => (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
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

          {/* My Shifts */}
          <TabsContent value="my-shifts" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myShifts.length > 0 ? (
                myShifts.map((shift) => (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    isSignedUp={true}
                    onCancel={handleCancel}
                  />
                ))
              ) : (
                <p className="col-span-full text-center text-muted-foreground py-12">
                  You haven’t signed up for any shifts yet.
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
