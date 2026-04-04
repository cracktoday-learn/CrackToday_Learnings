-- Set up cron job to generate daily challenge questions at 6 AM IST
-- Requires pg_cron extension to be enabled

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to invoke the daily challenge edge function via HTTP
CREATE OR REPLACE FUNCTION public.invoke_generate_daily_challenge()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://ftzeacitpnfwfhjlpriu.supabase.co/functions/v1/generate-daily-challenge',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Schedule the cron job to run daily at 6 AM (06:00)
-- Note: pg_cron uses UTC, so 6:00 AM IST = 00:30 UTC (previous day)
SELECT cron.schedule(
  'generate-daily-challenge-morning',  -- job name
  '30 0 * * *',                      -- cron expression (12:30 AM UTC = 6:00 AM IST)
  'SELECT public.invoke_generate_daily_challenge()'  -- SQL to execute
);

-- Alternative: Use direct HTTP cron if pg_net is available
SELECT cron.schedule(
  'generate-daily-challenge-http',
  '30 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ftzeacitpnfwfhjlpriu.supabase.co/functions/v1/generate-daily-challenge',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);

-- Unschedule the old 11 PM job if it exists
SELECT cron.unschedule('generate-daily-challenge-daily') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'generate-daily-challenge-daily'
);

-- Verify the job was created
SELECT jobname, schedule, command FROM cron.job WHERE jobname LIKE '%daily-challenge%';
