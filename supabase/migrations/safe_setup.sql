-- SAFE SETUP SCRIPT - Handles existing schema properly

-- First, let's check and fix user_thresholds table if needed
-- Check if user_id is TEXT and convert to UUID if necessary

-- Drop existing policies first (safe operation)
DROP POLICY IF EXISTS "Users can view own thresholds" ON public.user_thresholds;
DROP POLICY IF EXISTS "Users can insert own thresholds" ON public.user_thresholds;
DROP POLICY IF EXISTS "Users can update own thresholds" ON public.user_thresholds;
DROP POLICY IF EXISTS "Users can delete own thresholds" ON public.user_thresholds;

-- Enable RLS
ALTER TABLE public.user_thresholds ENABLE ROW LEVEL SECURITY;

-- Create policies with explicit type casting to handle both UUID and TEXT
CREATE POLICY "Users can view own thresholds"
  ON public.user_thresholds FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own thresholds"
  ON public.user_thresholds FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own thresholds"
  ON public.user_thresholds FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own thresholds"
  ON public.user_thresholds FOR DELETE
  USING (auth.uid()::text = user_id::text);

GRANT ALL ON public.user_thresholds TO service_role;

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_alerts_enabled BOOLEAN DEFAULT false NOT NULL,
  email_verified BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;

CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

GRANT ALL ON public.user_preferences TO service_role;

-- Create function for updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create email_alert_log table
CREATE TABLE IF NOT EXISTS public.email_alert_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  threshold_id TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.email_alert_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own email logs" ON public.email_alert_log;
DROP POLICY IF EXISTS "Users can insert own email logs" ON public.email_alert_log;

CREATE POLICY "Users can view own email logs"
  ON public.email_alert_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email logs"
  ON public.email_alert_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_email_alert_log_user_id ON public.email_alert_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_alert_log_threshold_id ON public.email_alert_log(threshold_id);
CREATE INDEX IF NOT EXISTS idx_email_alert_log_created_at ON public.email_alert_log(created_at);

GRANT ALL ON public.email_alert_log TO service_role;

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
