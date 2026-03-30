import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { supabase } from "../../utils/supabase/client";

export const AdminLink = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) {
        console.error("Admin check error:", error);
        setIsAdmin(false);
        return;
      }
      setIsAdmin(!!data);
    } catch (err) {
      console.error("Admin check exception:", err);
      setIsAdmin(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <Link
      to="/admin"
      className="flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
    >
      <LayoutDashboard className="h-4 w-4" />
      Admin Panel
    </Link>
  );
};
