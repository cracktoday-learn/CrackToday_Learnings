-- Set up cron job to generate current affairs daily at 11 PM
-- Requires pg_cron extension to be enabled

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to invoke the edge function via HTTP
CREATE OR REPLACE FUNCTION public.invoke_generate_current_affairs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This will be called by the cron job
  -- The actual invocation is handled by pg_net or a webhook
  PERFORM net.http_post(
    url := 'https://ftzeacitpnfwfhjlpriu.supabase.co/functions/v1/generate-current-affairs',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Schedule the cron job to run daily at 11 PM (23:00)
-- Note: pg_cron uses UTC, so 23:00 IST = 17:30 UTC
SELECT cron.schedule(
  'generate-current-affairs-daily',  -- job name
  '30 17 * * *',                    -- cron expression (5:30 PM UTC = 11:00 PM IST)
  'SELECT public.invoke_generate_current_affairs()'  -- SQL to execute
);

-- Alternative: Use direct HTTP cron if pg_net is available
-- This calls the edge function directly via HTTP
SELECT cron.schedule(
  'generate-current-affairs-http',
  '30 17 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ftzeacitpnfwfhjlpriu.supabase.co/functions/v1/generate-current-affairs',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);

-- Verify the job was created
SELECT jobname, schedule, command FROM cron.job WHERE jobname LIKE '%current-affairs%';
