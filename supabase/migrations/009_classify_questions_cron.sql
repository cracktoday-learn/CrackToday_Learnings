-- Cron job to auto-classify questions daily
-- Run this in Supabase SQL Editor after adding subject column

SELECT cron.schedule(
  'classify-questions-daily',
  '0 2 * * *', -- Run at 2 AM daily
  $$
  SELECT net.http_post(
    url:='https://ftzeacitpnfwfhjlpriu.supabase.co/functions/v1/classify-questions',
    headers:='{"Authorization": "Bearer SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
