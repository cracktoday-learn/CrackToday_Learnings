-- ============================================================================
-- SETTINGS TABLE FOR ADMIN SETTINGS PAGE
-- ============================================================================

-- Create the settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  site_name TEXT DEFAULT 'CrackToday',
  contact_email TEXT DEFAULT 'support@cracktoday.com',
  enable_notifications BOOLEAN DEFAULT true,
  enable_registration BOOLEAN DEFAULT true,
  maintenance_mode BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default settings
INSERT INTO public.settings (id, site_name, contact_email, enable_notifications, enable_registration, maintenance_mode)
VALUES (1, 'CrackToday', 'support@cracktoday.com', true, true, false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on settings table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to read settings
CREATE POLICY "Allow admins to read settings"
  ON public.settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy: Allow admins to update settings
CREATE POLICY "Allow admins to update settings"
  ON public.settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Verify table was created
SELECT * FROM public.settings;
