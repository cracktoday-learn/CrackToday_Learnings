-- Fix Current Affairs cron job with direct HTTP POST
-- IMPORTANT: Replace YOUR_SERVICE_ROLE_KEY with actual key from Supabase Dashboard
-- Run this in Supabase SQL Editor

-- First, unschedule all existing jobs
DO $$
BEGIN
  PERFORM cron.unschedule('generate-current-affairs-daily');
  EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('generate-current-affairs-http');
  EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('generate-current-affairs-fixed');
  EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('generate-current-affairs-morning');
  EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Enable pg_net extension for HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Get your Service Role Key from:
-- https://supabase.com/dashboard/project/ftzeacitpnfwfhjlpriu/settings/api
-- Then replace YOUR_SERVICE_ROLE_KEY below

-- Schedule direct HTTP POST at 11 PM IST (5:30 PM UTC) daily
SELECT cron.schedule(
  'generate-current-affairs-11pm',
  '30 17 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ftzeacitpnfwfhjlpriu.supabase.co/functions/v1/generate-current-affairs',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Verify jobs
SELECT jobname, schedule, active FROM cron.job WHERE jobname LIKE '%current-affairs%';
