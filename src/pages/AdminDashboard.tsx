import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Heart, LogOut, Home, Users, Bell, DollarSign, Calendar, AlertCircle, Plus } from 'lucide-react'; // Fixed import for Plus icon
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { EmergencyAlert } from '@/components/EmergencyAlert';
import { ShiftCard } from '@/components/ShiftCard';
import { StatsCard } from '@/components/admin/StatsCard';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { RecentActivity } from '@/components/admin/RecentActivity';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    volunteers: 0,
    donors: 0,
    admins: 0,
    totalDonations: 0,
    activeAlerts: 0,
    upcomingShifts: 0,
    totalShiftSignups: 0,
  });
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
    setupRealtimeSubscriptions();
  }, []);

  const setupRealtimeSubscriptions = () => {
    const alertsChannel = supabase
      .channel('admin_alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_alerts' }, () => {
        loadData();
      })
      .subscribe();

    const shiftsChannel = supabase
      .channel('admin_shifts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'volunteer_shifts' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(shiftsChannel);
    };
  };

  const loadData = async () => {
    await Promise.all([loadAlerts(), loadShifts(), loadUsers(), loadStats(), loadRecentActivity()]);
  };

  const loadAlerts = async () => {
    const { data } = await supabase
      .from('emergency_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) setAlerts(data);
  };

  const loadShifts = async () => {
    const { data } = await supabase
      .from('volunteer_shifts')
      .select('*')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(10);

    if (data) setShifts(data);
  };

  const loadUsers = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profiles) {
      const usersWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id);

          return {
            ...profile,
            roles: roles?.map((r) => r.role) || [],
          };
        })
      );

      setUsers(usersWithRoles);
    }
  };

  const loadStats = async () => {
    const [profilesData, rolesData, donationsData, alertsData, shiftsData, signupsData] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('user_roles').select('role'),
      supabase.from('donations').select('amount'),
      supabase.from('emergency_alerts').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('volunteer_shifts').select('id', { count: 'exact', head: true }).gte('start_time', new Date().toISOString()),
      supabase.from('shift_signups').select('id', { count: 'exact', head: true }),
    ]);

    const volunteers = rolesData.data?.filter((r) => r.role === 'volunteer').length || 0;
    const donors = rolesData.data?.filter((r) => r.role === 'donor').length || 0;
    const admins = rolesData.data?.filter((r) => r.role === 'admin').length || 0;
    const totalDonations = donationsData.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

    setStats({
      totalUsers: profilesData.count || 0,
      volunteers,
      donors,
      admins,
      totalDonations,
      activeAlerts: alertsData.count || 0,
      upcomingShifts: shiftsData.count || 0,
      totalShiftSignups: signupsData.count || 0,
    });
  };

  const loadRecentActivity = async () => {
    const [donationsData, signupsData] = await Promise.all([
      supabase
        .from('donations')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('shift_signups')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const activities: any[] = [];

    donationsData.data?.forEach((d: any) => {
      activities.push({
        id: d.id,
        user_name: d.profiles?.full_name || 'Unknown',
        action: `donated ZAR ${Number(d.amount).toFixed(2)}`,
        timestamp: d.created_at,
        type: 'donation',
      });
    });

    signupsData.data?.forEach((s: any) => {
      activities.push({
        id: s.id,
        user_name: s.profiles?.full_name || 'Unknown',
        action: 'signed up for a volunteer shift',
        timestamp: s.created_at,
        type: 'signup',
      });
    });

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setRecentActivity(activities.slice(0, 10));
  };

  // Handles alert creation
  const handleCreateAlert = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const { error } = await supabase.from('emergency_alerts').insert({
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      severity: formData.get('severity') as any,
      location: formData.get('location') as string,
      created_by: 'admin', // Hardcoding 'admin' for bypass
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Emergency alert created' });
    setIsAlertDialogOpen(false);
    loadData();
  };

  return (
    <div className="min-h-screen bg-secondary">
           {/* Dashboard Content */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-primary fill-primary" />
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Comprehensive operations management</p>
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

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            description={`${stats.volunteers} volunteers, ${stats.donors} donors`}
            icon={Users}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Total Donations"
            value={`ZAR ${stats.totalDonations.toFixed(0)}`}
            description="All-time contributions"
            icon={DollarSign}
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title="Active Alerts"
            value={stats.activeAlerts}
            description="Requiring attention"
            icon={AlertCircle}
          />
          <StatsCard
            title="Upcoming Shifts"
            value={stats.upcomingShifts}
            description={`${stats.totalShiftSignups} total signups`}
            icon={Calendar}
          />
        </div>

        <Tabs defaultValue="alerts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="alerts">
              <Bell className="mr-2 h-4 w-4" />
              Emergency Alerts
            </TabsTrigger>
            <TabsTrigger value="shifts">
              <Calendar className="mr-2 h-4 w-4" />
              Volunteer Shifts
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              User Management
            </TabsTrigger>
          </TabsList>

          {/* Emergency Alerts Tab */}
          <TabsContent value="alerts">
            <div className="space-y-4">
              {alerts.map((alert) => (
                <EmergencyAlert key={alert.id} {...alert} />
              ))}
              {alerts.length === 0 && (
                <p className="text-center text-muted-foreground py-12">No alerts created yet</p>
              )}
            </div>
          </TabsContent>

          {/* Volunteer Shifts Tab */}
          <TabsContent value="shifts">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shifts.map((shift) => (
                <ShiftCard key={shift.id} {...shift} />
              ))}
              {shifts.length === 0 && (
                <p className="col-span-full text-center text-muted-foreground py-12">
                  No upcoming shifts scheduled
                </p>
              )}
            </div>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users">
            <div className="space-y-4">
              <UserManagementTable users={users} />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Emergency Alert Creation Dialog */}
      <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" onClick={() => setIsAlertDialogOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Emergency Alert</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAlert}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" required />
              </div>
              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select name="severity" defaultValue="low">
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" required />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-4">
              <Button variant="outline" onClick={() => setIsAlertDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Alert</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;

