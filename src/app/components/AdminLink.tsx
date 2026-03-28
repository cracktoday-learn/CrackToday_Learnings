import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { supabase } from "../../utils/supabase/client";

export const AdminLink = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user?.id)
      .eq("role", "admin")
      .single();
    setIsAdmin(!!data);
  };

  if (!isAdmin) return null;

  return (
    <Link to="/admin" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1">
      <Settings className="h-4 w-4" /> Admin
    </Link>
  );
};
