-- Enable the pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to run the Edge Function daily at 6:00 PM IST (12:30 PM UTC)
SELECT cron.schedule(
  'generate-current-affairs-daily',  -- Job name
  '30 12 * * *',                     -- Cron expression: 12:30 UTC = 6:00 PM IST
  $$
  SELECT net.http_post(
    url := 'https://ftzeacitpnfwfhjlpriu.supabase.co/functions/v1/generate-current-affairs',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0emVhY2l0cG5md2Zoamxwcml1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDc4MDIwNSwiZXhwIjoyMDU2MzU2MjA1fQ.C1ceYQ_u3ZcNk8NciujwvaV2dgL2gzE4M6t2BCKF8Xs',
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- Verify the job was created
SELECT * FROM cron.job WHERE jobname = 'generate-current-affairs-daily';
