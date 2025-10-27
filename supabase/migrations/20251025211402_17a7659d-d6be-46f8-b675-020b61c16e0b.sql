-- =============================================
-- ENUM TYPES
-- =============================================
CREATE TYPE IF NOT EXISTS public.app_role AS ENUM ('admin', 'volunteer', 'donor');
CREATE TYPE IF NOT EXISTS public.alert_severity AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE IF NOT EXISTS public.shift_status AS ENUM ('open', 'full', 'cancelled', 'completed');
CREATE TYPE IF NOT EXISTS public.shift_signup_status AS ENUM ('confirmed', 'cancelled');

-- =============================================
-- TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity alert_severity NOT NULL DEFAULT 'medium',
  location TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.volunteer_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  max_volunteers INTEGER NOT NULL DEFAULT 10,
  current_volunteers INTEGER NOT NULL DEFAULT 0,
  status shift_status NOT NULL DEFAULT 'open',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shift_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES public.volunteer_shifts(id) ON DELETE CASCADE NOT NULL,
  volunteer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status shift_signup_status NOT NULL DEFAULT 'confirmed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shift_id, volunteer_id)
);

CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  description TEXT,
  payment_method TEXT,
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_shift_volunteer_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.volunteer_shifts
    SET current_volunteers = current_volunteers + 1
    WHERE id = NEW.shift_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.volunteer_shifts
    SET current_volunteers = current_volunteers - 1
    WHERE id = OLD.shift_id;
  END IF;
  RETURN NULL;
END;
$$;

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emergency_alerts_updated_at
  BEFORE UPDATE ON public.emergency_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_volunteer_shifts_updated_at
  BEFORE UPDATE ON public.volunteer_shifts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_shift_count_on_signup
  AFTER INSERT OR DELETE ON public.shift_signups
  FOR EACH ROW EXECUTE FUNCTION public.update_shift_volunteer_count();

-- =============================================
-- RLS POLICIES
-- =============================================

-- PROFILES
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- USER ROLES
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- EMERGENCY ALERTS
CREATE POLICY "Everyone can view active alerts"
  ON public.emergency_alerts FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admins can manage alerts"
  ON public.emergency_alerts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- VOLUNTEER SHIFTS
CREATE POLICY "Everyone can view open shifts"
  ON public.volunteer_shifts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage shifts"
  ON public.volunteer_shifts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Allow authenticated insert"
  ON public.volunteer_shifts FOR INSERT TO authenticated WITH CHECK (true);

-- SHIFT SIGNUPS
CREATE POLICY "Volunteers can view own signups"
  ON public.shift_signups FOR SELECT TO authenticated USING (auth.uid() = volunteer_id);

CREATE POLICY "Volunteers can signup for shifts"
  ON public.shift_signups FOR INSERT TO authenticated WITH CHECK (auth.uid() = volunteer_id);

CREATE POLICY "Volunteers can cancel own signups"
  ON public.shift_signups FOR DELETE TO authenticated USING (auth.uid() = volunteer_id);

CREATE POLICY "Admins can view all signups"
  ON public.shift_signups FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- DONATIONS
CREATE POLICY "Donors can view own donations"
  ON public.donations FOR SELECT TO authenticated USING (auth.uid() = donor_id);

CREATE POLICY "Donors can create donations"
  ON public.donations FOR INSERT TO authenticated WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Admins can view all donations"
  ON public.donations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- ADMIN USER SEED
-- =============================================

DO $$
DECLARE
  _admin_id UUID;
BEGIN
  -- Check if admin user exists
  SELECT id INTO _admin_id FROM auth.users WHERE email = 'admin@sarcs.com';

  -- If not, create it
  IF _admin_id IS NULL THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
    VALUES (
      gen_random_uuid(),
      'admin@sarcs.com',
      crypt('admin123', gen_salt('bf')),
      now()
    )
    RETURNING id INTO _admin_id;
  END IF;

  -- Assign admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_admin_id, 'admin')
  ON CONFLICT (user_id) DO UPDATE
  SET role = EXCLUDED.role;
END $$;
