-- 1. Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- 2. Insert initial global onboarding setting
INSERT INTO public.system_settings (key, value)
VALUES ('global_onboarding_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 3. Add onboarding_status to profiles table
-- default: Follow global setting
-- locked: Always locked for this user
-- unlocked: Always unlocked for this user
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'default' 
CHECK (onboarding_status IN ('default', 'locked', 'unlocked'));

-- 4. Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 5. Policies for system_settings
CREATE POLICY "Admins can manage system_settings" 
ON public.system_settings
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.raw_app_meta_data->>'role' = 'Admin' OR auth.users.raw_app_meta_data->>'role' = 'Staff')
  )
);

CREATE POLICY "All authenticated users can read system_settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);
