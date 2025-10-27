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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';






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

    // ✅ Get the logged-in user's ID from Supabase Auth
const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  toast({ title: 'Error', description: 'User not authenticated', variant: 'destructive' });
  return;
}

// ✅ Use the user's UUID as created_by
const { error } = await supabase.from('emergency_alerts').insert({
  title: formData.get('title') as string,
  description: formData.get('description') as string,
  severity: formData.get('severity') as any,
  location: formData.get('location') as string,
  created_by: user.id,
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


{/* ====================================================
      🧭 EMERGENCY ALERTS TAB
  ==================================================== */}
  <TabsContent value="alerts">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold">Emergency Alerts</h2>

      {/* Create Alert Dialog */}
      <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Alert
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create a New Emergency Alert</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const title = formData.get("title") as string;
              const description = formData.get("description") as string;
              const severity = formData.get("severity") as string;
              const location = formData.get("location") as string;

              if (!title || !description || !location) {
                toast({
                  title: "Missing Fields",
                  description: "Please fill in all required fields.",
                  variant: "destructive",
                });
                return;
              }

              const {
                data: { user },
              } = await supabase.auth.getUser();

              if (!user) {
                toast({
                  title: "Error",
                  description: "User not authenticated.",
                  variant: "destructive",
                });
                return;
              }

              const { error } = await supabase.from('emergency_alerts').insert({
  title,
  description,
  severity: severity.toLowerCase() as 'high' | 'medium' | 'low' | 'critical',
  location,
  created_by: user?.id,
  is_active: true,
});


              if (error) {
                toast({
                  title: "Error creating alert",
                  description: error.message,
                  variant: "destructive",
                });
                return;
              }

              toast({
                title: "Alert Created",
                description: "New emergency alert has been created successfully.",
              });

              setIsAlertDialogOpen(false);
              loadAlerts();
              e.currentTarget.reset();
            }}
            className="space-y-4 mt-4"
          >
            {/* Title */}
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="e.g. Flood in Durban" required />
            </div>

            {/* Severity */}
            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select name="severity" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">🚨 Critical</SelectItem>
                  <SelectItem value="high">⚠️ High</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="low">🟢 Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Describe the emergency and what volunteers/donors can do."
                required
              />
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                placeholder="e.g. Cape Town Community Hall"
                required
              />
            </div>

            <Button type="submit" className="w-full mt-2">
              Create Alert
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>

    {/* Display Alerts */}
    <div className="space-y-4">
      {alerts.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No alerts created yet.
        </p>
      ) : (
        alerts.map((alert) => (
          <Card key={alert.id}>
            <CardContent className="flex justify-between items-start p-4">
              <div>
                <h3 className="font-semibold text-lg">{alert.title}</h3>
                <p className="text-sm text-muted-foreground">{alert.description}</p>
                <div className="mt-2 flex gap-2 items-center">
                  <Badge
                    variant={
                      alert.severity === "critical"
                        ? "destructive"
                        : alert.severity === "high"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {alert.severity.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {alert.location}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Created: {new Date(alert.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <Switch
                  checked={alert.is_active}
                  onCheckedChange={async (checked) => {
                    await supabase
                      .from("emergency_alerts")
                      .update({ is_active: checked })
                      .eq("id", alert.id);
                    loadAlerts();
                  }}
                />
                <Label>{alert.is_active ? "Active" : "Inactive"}</Label>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  </TabsContent>

          

       {/* Volunteer Shifts Tab */}
<TabsContent value="shifts">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-semibold">Upcoming Shifts</h2>

    {/* Create Shift Dialog */}
    <Dialog open={isShiftDialogOpen} onOpenChange={setIsShiftDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Shift
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a New Volunteer Shift</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);

            const startTime = new Date(formData.get('start_time') as string);
            const endTime = new Date(formData.get('end_time') as string);

            if (endTime <= startTime) {
              toast({
                title: 'Invalid Time Range',
                description: 'End time must be later than start time.',
                variant: 'destructive',
              });
              return;
            }

            // ✅ Get current user ID
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
              toast({
                title: 'Error',
                description: 'User not authenticated.',
                variant: 'destructive',
              });
              return;
            }

            // ✅ Insert shift with user ID
            const { error } = await supabase.from('volunteer_shifts').insert({
              title: formData.get('title') as string,
              
              description: formData.get('description') as string,
              location: formData.get('location') as string,
              start_time: formData.get('start_time') as string,
              end_time: formData.get('end_time') as string,
              max_volunteers: Number(formData.get('capacity')),
              current_volunteers: 0,
              status: 'open',
              created_by: user.id,
            });

            if (error) {
              toast({
                title: 'Error creating shift',
                description: error.message,
                variant: 'destructive',
              });
              return;
            }

            toast({
              title: 'Success',
              description: 'New volunteer shift created successfully.',
            });

            setIsShiftDialogOpen(false);
            loadShifts();
            e.currentTarget.reset();
          }}
          className="space-y-4 mt-4"
        >
          {/* Shift Title */}
          <div>
            <Label htmlFor="title">Shift Name</Label>
            <Input id="title" name="title" placeholder="e.g. Food Distribution Drive" required />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select name="category" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="food_drive">🍞 Food Drive</SelectItem>
                <SelectItem value="medical_support">💊 Medical Support</SelectItem>
                <SelectItem value="logistics">🚚 Logistics</SelectItem>
                <SelectItem value="education">📚 Education</SelectItem>
                <SelectItem value="community_outreach">🤝 Community Outreach</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Briefly describe the purpose and activities of this shift."
              required
            />
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="e.g. Cape Town Community Hall" required />
          </div>

          {/* Timing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Start Time</Label>
              <Input id="start_time" name="start_time" type="datetime-local" required />
            </div>
            <div>
              <Label htmlFor="end_time">End Time</Label>
              <Input id="end_time" name="end_time" type="datetime-local" required />
            </div>
          </div>

          {/* Capacity */}
          <div>
            <Label htmlFor="capacity">Volunteer Capacity</Label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min="1"
              placeholder="e.g. 20"
              required
            />
          </div>

          <Button type="submit" className="w-full mt-2">
            Create Shift
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  </div>

  {/* Display Upcoming Shifts */}
 <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
  {shifts.length === 0 ? (
    <p className="text-gray-500 text-center py-6 col-span-full">
      No upcoming shifts available.
    </p>
  ) : (
    shifts.map((shift) => (
     <ShiftCard
  key={shift.id}
  shift={{
    id: shift.id,
    title: shift.title,
    description: shift.description,
    location: shift.location,
    start_time: shift.start_time,
    end_time: shift.end_time,
    max_volunteers: shift.max_volunteers,
    volunteer_count: shift.current_volunteers, // if applicable
    status: shift.status,
  }}
/>

    ))
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

     
    </div>
  );
};

export default AdminDashboard;

