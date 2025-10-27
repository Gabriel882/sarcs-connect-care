import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Heart, Loader2 } from 'lucide-react';

type UserRole = 'admin' | 'volunteer' | 'donor';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch user role from Supabase
  const getUserRole = async (userId: string): Promise<UserRole | null> => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }

    return data?.role as UserRole;
  };

  // Redirect already logged-in users
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (user) {
        const role = await getUserRole(user.id);
        if (role === 'admin') navigate('/admin', { replace: true });
        else if (role === 'volunteer') navigate('/volunteer', { replace: true });
        else if (role === 'donor') navigate('/donor', { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const phone = formData.get('phone') as string;
    const roleInput = formData.get('role') as string;

    const validRoles: UserRole[] = ['admin', 'volunteer', 'donor'];
    if (!validRoles.includes(roleInput as UserRole)) {
      toast({ title: 'Error', description: 'Invalid role selected', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    const role = roleInput as UserRole;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName, phone },
      },
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    if (data.user) {
      const { error: roleError } = await supabase.from('user_roles').insert({ user_id: data.user.id, role });
      if (roleError) {
        toast({ title: 'Error', description: roleError.message, variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      toast({ title: 'Success!', description: 'Your account has been created.' });
      switch (role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'volunteer':
          navigate('/volunteer');
          break;
        case 'donor':
          navigate('/donor');
          break;
      }
    }

    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { data: sessionData, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    if (sessionData.user) {
      const role = await getUserRole(sessionData.user.id);
      toast({ title: 'Welcome back!', description: 'You have successfully signed in.' });

      // Redirect based on role
      if (role === 'admin') navigate('/admin');
      else if (role === 'volunteer') navigate('/volunteer');
      else if (role === 'donor') navigate('/donor');
      else navigate('/');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <Heart className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-foreground">SARCS Portal</h1>
          <p className="text-muted-foreground mt-2">South African Red Cross Society</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Sign in or create an account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin" className="hover:bg-primary hover:text-white transition-colors duration-200">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="hover:bg-primary hover:text-white transition-colors duration-200">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input id="signin-email" name="email" type="email" placeholder="your.email@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input id="signin-password" name="password" type="password" placeholder="••••••••" required />
                  </div>
                  <Button type="submit" className="w-full bg-primary text-white hover:bg-primary-dark" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input id="signup-name" name="fullName" type="text" placeholder="John Doe" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" name="email" type="email" placeholder="your.email@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <Input id="signup-phone" name="phone" type="tel" placeholder="+27 12 345 6789" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" name="password" type="password" placeholder="••••••••" required minLength={6} />
                  </div>
                  <div className="space-y-2">
                    <Label>I want to</Label>
                    <RadioGroup name="role" defaultValue="volunteer">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="volunteer" id="volunteer" />
                        <Label htmlFor="volunteer" className="font-normal cursor-pointer">Volunteer my time</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="donor" id="donor" />
                        <Label htmlFor="donor" className="font-normal cursor-pointer">Make donations</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <Button type="submit" className="w-full bg-primary text-white hover:bg-primary-dark" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</> : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
