-- Create email_alert_log table for rate limiting
CREATE TABLE IF NOT EXISTS public.email_alert_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  threshold_id TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.email_alert_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own email logs" ON public.email_alert_log;
DROP POLICY IF EXISTS "Users can insert own email logs" ON public.email_alert_log;

-- Create policies
CREATE POLICY "Users can view own email logs"
  ON public.email_alert_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email logs"
  ON public.email_alert_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_alert_log_user_id ON public.email_alert_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_alert_log_threshold_id ON public.email_alert_log(threshold_id);
CREATE INDEX IF NOT EXISTS idx_email_alert_log_created_at ON public.email_alert_log(created_at);

-- Grant permissions to service role
GRANT ALL ON public.email_alert_log TO service_role;

-- Optional: Clean up old logs (older than 7 days) - can be run as a scheduled job
-- DELETE FROM public.email_alert_log WHERE created_at < NOW() - INTERVAL '7 days';
