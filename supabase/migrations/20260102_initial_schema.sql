-- RouteRank Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'agency')),
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text,
  scans_today integer DEFAULT 0,
  scans_reset_date date DEFAULT CURRENT_DATE,
  last_scan_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Scans table
CREATE TABLE IF NOT EXISTS public.scans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url text NOT NULL,
  domain text NOT NULL,
  final_url text,
  seo_score integer CHECK (seo_score >= 0 AND seo_score <= 100),
  performance_score integer CHECK (performance_score >= 0 AND performance_score <= 100),
  nextjs_score integer CHECK (nextjs_score >= 0 AND nextjs_score <= 100),
  overall_score integer GENERATED ALWAYS AS (
    CASE 
      WHEN seo_score IS NOT NULL AND performance_score IS NOT NULL AND nextjs_score IS NOT NULL
      THEN (seo_score + performance_score + nextjs_score) / 3
      ELSE NULL
    END
  ) STORED,
  lighthouse_data jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  error_message text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Audit issues table
CREATE TABLE IF NOT EXISTS public.audit_issues (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id uuid NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('seo', 'performance', 'nextjs')),
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'error')),
  rule_id text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  fix_suggestion text,
  fix_code text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_scan FOREIGN KEY (scan_id) REFERENCES public.scans(id) ON DELETE CASCADE
);

-- Sites table (for Agency tier)
CREATE TABLE IF NOT EXISTS public.sites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  domain text NOT NULL,
  name text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_domain UNIQUE(user_id, domain),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own scans" ON public.scans;
DROP POLICY IF EXISTS "Users can insert own scans" ON public.scans;
DROP POLICY IF EXISTS "Users can delete own scans" ON public.scans;
DROP POLICY IF EXISTS "Users can view issues from own scans" ON public.audit_issues;
DROP POLICY IF EXISTS "Users can manage own sites" ON public.sites;
DROP POLICY IF EXISTS "Service role can manage all" ON public.profiles;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for scans
CREATE POLICY "Users can view own scans"
  ON public.scans
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scans"
  ON public.scans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scans"
  ON public.scans
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage scans"
  ON public.scans
  FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for audit_issues
CREATE POLICY "Users can view issues from own scans"
  ON public.audit_issues
  FOR SELECT
  USING (
    scan_id IN (
      SELECT id FROM public.scans WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage issues"
  ON public.audit_issues
  FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for sites
CREATE POLICY "Users can manage own sites"
  ON public.sites
  FOR ALL
  USING (auth.uid() = user_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

-- Create trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON public.scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_issues_scan_id ON public.audit_issues(scan_id);
CREATE INDEX IF NOT EXISTS idx_audit_issues_category ON public.audit_issues(category);
CREATE INDEX IF NOT EXISTS idx_sites_user_id ON public.sites(user_id);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.scans TO authenticated;
GRANT SELECT ON public.audit_issues TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.sites TO authenticated;
