import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShiftCard, Shift } from "@/components/ShiftCard";
import { Heart, LogOut, Home, Calendar, CheckCircle, Award, Bell } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { StatsCard } from "@/components/admin/StatsCard";

type Notification = {
  id: string;
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  read: boolean;
  created_at: string;
};

const VolunteerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [availableShifts, setAvailableShifts] = useState<Shift[]>([]);
  const [myShifts, setMyShifts] = useState<Shift[]>([]);
  const [signupIds, setSignupIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  // Hardcoded stats
  const [stats, setStats] = useState({
    totalShifts: 0,
    completedShifts: 0,
    badgesEarned: 0,
    notifications: 3,
  });

  // Hardcoded notifications
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Welcome!",
      message: "Thanks for joining our volunteer program.",
      severity: "low",
      read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      title: "New Shift Available",
      message: "A new shift has been added in your area.",
      severity: "medium",
      read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: "3",
      title: "Congratulations!",
      message: "You completed 5 shifts! Keep it up!",
      severity: "high",
      read: false,
      created_at: new Date().toISOString(),
    },
  ]);

  /** -----------------------------
   * 🔄 Data Loaders
   * ----------------------------- */
  const loadAllData = async () => {
    await Promise.all([loadAvailableShifts(), loadMyShifts()]);
  };

  const loadAvailableShifts = async () => {
    const { data, error } = await supabase
      .from("volunteer_shifts")
      .select("*")
      .order("start_time", { ascending: true });

    if (error) {
      toast({
        title: "Error loading shifts",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const formatted = (data || []).map((s) => ({
      ...s,
      status: (s.status as "open" | "completed" | "assigned") || "open",
    }));

    setAvailableShifts(formatted);
    setStats((prev) => ({ ...prev, totalShifts: formatted.length }));
  };

  const loadMyShifts = async () => {
  if (!user) return;

  const { data: signups, error } = await supabase
    .from("shift_signups")
    .select("shift_id, volunteer_shifts(*)")
    .eq("volunteer_id", user.id);

  if (error) {
    toast({
      title: "Error loading your shifts",
      description: error.message,
      variant: "destructive",
    });
    return;
  }

  if (signups) {
    const formatted = signups.map((s) => ({
      ...s.volunteer_shifts,
      status:
        (s.volunteer_shifts.status as "open" | "completed" | "assigned") || "open",
    }));

    const completedCount = formatted.filter((s) => s.status === "completed").length;

    setMyShifts(formatted);
    setSignupIds(new Set(signups.map((s) => s.shift_id)));
    setStats((prev) => ({
      ...prev,
      completedShifts: completedCount,
      badgesEarned: Math.floor(completedCount / 2), // <-- compute badges
    }));
  }
};

  /** -----------------------------
   * ✋ Shift Actions
   * ----------------------------- */

  const handleSignUp = async (shiftId: string) => {
    if (!user || isProcessing) return;
    setIsProcessing(true);

    try {
      const { data: existing } = await supabase
        .from("shift_signups")
        .select("id")
        .eq("shift_id", shiftId)
        .eq("volunteer_id", user.id)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Already signed up",
          description: "You’re already signed up for this shift.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("shift_signups").insert({
        shift_id: shiftId,
        volunteer_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Signed up!",
        description: "You have joined this volunteer shift.",
      });

      await loadMyShifts();
    } catch (err: any) {
      toast({
        title: "Error signing up",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async (shiftId: string) => {
    if (!user || isProcessing) return;
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from("shift_signups")
        .delete()
        .eq("shift_id", shiftId)
        .eq("volunteer_id", user.id);

      if (error) throw error;

      toast({
        title: "Cancelled",
        description: "You have cancelled your shift signup.",
      });

      await loadMyShifts();
    } catch (err: any) {
      toast({
        title: "Error cancelling shift",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteShift = async (shiftId: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from("volunteer_shifts")
        .update({ status: "completed" })
        .eq("id", shiftId);

      if (error) throw error;

      setMyShifts((prev) =>
        prev.map((shift) =>
          shift.id === shiftId ? { ...shift, status: "completed" } : shift
        )
      );

     setStats((prev) => ({
  ...prev,
  completedShifts: prev.completedShifts + 1,
  badgesEarned: Math.floor((prev.completedShifts + 1) / 2),
}));


      toast({
        title: "Shift Completed!",
        description: "You successfully completed this shift 🎉",
      });
    } catch (err: any) {
      toast({
        title: "Error completing shift",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /** -----------------------------
   * ⚡ Lifecycle
   * ----------------------------- */
  useEffect(() => {
    loadAllData();
  }, []);

  const sortedMyShifts = [...myShifts].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;
    return 0;
  });

  /** -----------------------------
   * 🧱 UI
   * ----------------------------- */
  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-primary fill-primary" />
            <div>
              <h1 className="text-2xl font-bold">Volunteer Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Manage your volunteer activities
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/")}>
              <Home className="mr-2 h-4 w-4" /> Home
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate("/auth")}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard title="Total Shifts" value={stats.totalShifts} icon={Calendar} />
          <StatsCard
            title="Completed Shifts"
            value={stats.completedShifts}
            icon={CheckCircle}
          />
          <StatsCard
            title="Badges Earned"
            value={stats.badgesEarned}
            icon={Award}
          />
          <StatsCard
            title="Notifications"
            value={stats.notifications}
            icon={Bell}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="available">
          <TabsList>
            <TabsTrigger value="available">Available Shifts</TabsTrigger>
            <TabsTrigger value="my-shifts">My Shifts</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="mt-6">
            <div className="flex justify-between mb-6">
              <Input
                placeholder="Search shifts..."
                className="w-1/2"
                onChange={(e) => {}}
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

          <TabsContent value="my-shifts" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedMyShifts.length > 0 ? (
                sortedMyShifts.map((shift) => (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    isSignedUp={true}
                    onCancel={handleCancel}
                    onComplete={handleCompleteShift}
                  />
                ))
              ) : (
                <p className="col-span-full text-center text-muted-foreground py-12">
                  You haven’t signed up for any shifts yet.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <div className="space-y-4">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 border rounded-md bg-background shadow-sm"
                  >
                    <h3 className="font-semibold">{n.title}</h3>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      Severity: {n.severity} | Read: {n.read ? "Yes" : "No"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  No notifications.
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
