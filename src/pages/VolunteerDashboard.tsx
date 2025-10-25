import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ShiftCard } from '@/components/ShiftCard';
import { Heart, LogOut, Calendar, Home } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const VolunteerDashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [availableShifts, setAvailableShifts] = useState<any[]>([]);
  const [myShifts, setMyShifts] = useState<any[]>([]);
  const [signupIds, setSignupIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (user) {
      loadShifts();
      loadMyShifts();
    }
  }, [user, loading, navigate]);

  const loadShifts = async () => {
    const { data } = await supabase
      .from('volunteer_shifts')
      .select('*')
      .eq('status', 'open')
      .order('start_time', { ascending: true });

    if (data) setAvailableShifts(data);
  };

  const loadMyShifts = async () => {
    const { data: signups } = await supabase
      .from('shift_signups')
      .select('*, volunteer_shifts(*)')
      .eq('volunteer_id', user?.id);

    if (signups) {
      setMyShifts(signups.map((s) => s.volunteer_shifts));
      setSignupIds(new Set(signups.map((s) => s.shift_id)));
    }
  };

  const handleSignUp = async (shiftId: string) => {
    const { error } = await supabase.from('shift_signups').insert({
      shift_id: shiftId,
      volunteer_id: user?.id,
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

  const handleCancel = async (shiftId: string) => {
    const { error } = await supabase
      .from('shift_signups')
      .delete()
      .eq('shift_id', shiftId)
      .eq('volunteer_id', user?.id);

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
                <h1 className="text-2xl font-bold">Volunteer Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage your volunteer shifts</p>
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
        <Tabs defaultValue="available">
          <TabsList>
            <TabsTrigger value="available">
              <Calendar className="mr-2 h-4 w-4" />
              Available Shifts
            </TabsTrigger>
            <TabsTrigger value="my-shifts">My Shifts</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableShifts.map((shift) => (
                <ShiftCard
                  key={shift.id}
                  {...shift}
                  isSignedUp={signupIds.has(shift.id)}
                  onSignUp={handleSignUp}
                  onCancel={handleCancel}
                />
              ))}
              {availableShifts.length === 0 && (
                <p className="col-span-full text-center text-muted-foreground py-12">
                  No shifts available at the moment.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-shifts" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myShifts.map((shift) => (
                <ShiftCard
                  key={shift.id}
                  {...shift}
                  isSignedUp={true}
                  onCancel={handleCancel}
                />
              ))}
              {myShifts.length === 0 && (
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
