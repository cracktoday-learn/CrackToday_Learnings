import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ftzeacitpnfwfhjlpriu.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0emVhY2l0cG5md2Zoamxwcml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2Nzc1MjQsImV4cCI6MjA5MDI1MzUyNH0.w51tM5Vnuvv6uHdMcnmKgW1l0rwJLAa_IyHaYpNqa8w";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
