-- Migration: Add notification table and email trigger
-- Created: 2024-04-20

-- Create notifications table if not exists
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'urgent')),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at timestamp with time zone,
  created_by uuid REFERENCES auth.users(id),
  emails_sent integer DEFAULT 0,
  emails_failed integer DEFAULT 0
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY IF NOT EXISTS "Allow admin full access" ON notifications
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Create policy for public read of active notifications
CREATE POLICY IF NOT EXISTS "Allow read active notifications" ON notifications
  FOR SELECT USING (is_active = true);

-- Create function to invoke edge function when notification is created
CREATE OR REPLACE FUNCTION public.handle_new_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Invoke the edge function to send emails
  PERFORM net.http_post(
    url := CONCAT(current_setting('app.settings.supabase_url'), '/functions/v1/send-notification-emails'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', CONCAT('Bearer ', current_setting('app.settings.service_role_key'))
    ),
    body := jsonb_build_object('notification', row_to_json(NEW))
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call function on notification insert
DROP TRIGGER IF EXISTS on_notification_created ON notifications;
CREATE TRIGGER on_notification_created
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_notification();

-- Add comment explaining the setup
COMMENT ON TABLE notifications IS 'Admin notifications with automatic email delivery to all users';
