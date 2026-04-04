-- Fix Current Affairs cron job - properly configured with auth
-- Run this in Supabase SQL Editor

-- First, unschedule existing jobs to avoid duplicates
SELECT cron.unschedule('generate-current-affairs-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-current-affairs-daily');
SELECT cron.unschedule('generate-current-affairs-http') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-current-affairs-http');

-- Create the invoker function with proper error handling
CREATE OR REPLACE FUNCTION public.invoke_generate_current_affairs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response net.http_response_result;
BEGIN
  response := net.http_post(
    url := 'https://ftzeacitpnfwfhjlpriu.supabase.co/functions/v1/generate-current-affairs',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  
  -- Log the response for debugging
  RAISE NOTICE 'Current Affairs generation response: %', response;
END;
$$;

-- Schedule the cron job to run daily at 11 PM IST (5:30 PM UTC)
SELECT cron.schedule(
  'generate-current-affairs-fixed',
  '30 17 * * *',
  'SELECT public.invoke_generate_current_affairs()'
);

-- Also schedule for 6 AM IST as backup (12:30 AM UTC)
SELECT cron.schedule(
  'generate-current-affairs-morning',
  '30 0 * * *',
  'SELECT public.invoke_generate_current_affairs()'
);

-- Verify jobs were created
SELECT jobname, schedule, command, active 
FROM cron.job 
WHERE jobname LIKE '%current-affairs%'
ORDER BY jobname;
