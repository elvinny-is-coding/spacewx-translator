-- Enable RLS on user_thresholds if not already enabled
ALTER TABLE public.user_thresholds ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own thresholds" ON public.user_thresholds;
DROP POLICY IF EXISTS "Users can insert own thresholds" ON public.user_thresholds;
DROP POLICY IF EXISTS "Users can update own thresholds" ON public.user_thresholds;
DROP POLICY IF EXISTS "Users can delete own thresholds" ON public.user_thresholds;

-- Create policies using auth.uid() for automatic user identification
CREATE POLICY "Users can view own thresholds"
  ON public.user_thresholds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own thresholds"
  ON public.user_thresholds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own thresholds"
  ON public.user_thresholds FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own thresholds"
  ON public.user_thresholds FOR DELETE
  USING (auth.uid() = user_id);

-- Ensure service role has all permissions
GRANT ALL ON public.user_thresholds TO service_role;
