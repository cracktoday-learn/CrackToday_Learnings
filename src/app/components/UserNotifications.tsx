import { useEffect, useState } from "react";
import { Bell, X, Megaphone, AlertCircle, CheckCircle, Info } from "lucide-react";
import { supabase } from "../../utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  is_active: boolean;
  created_at: string;
  expires_at?: string;
}

export function UserNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load dismissed notifications from localStorage
    const saved = localStorage.getItem("dismissedNotifications");
    if (saved) {
      setDismissedIds(JSON.parse(saved));
    }
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        // Silently fail if table doesn't exist
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          setNotifications([]);
          return;
        }
        throw error;
      }

      // Filter out expired notifications
      const now = new Date();
      const activeNotifications = (data || []).filter((n: Notification) => {
        if (!n.is_active) return false;
        if (n.expires_at && new Date(n.expires_at) < now) return false;
        return true;
      });

      setNotifications(activeNotifications);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const dismissNotification = (id: string) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem("dismissedNotifications", JSON.stringify(newDismissed));
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "urgent":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-amber-50 border-amber-200 text-amber-800";
      case "success":
        return "bg-emerald-50 border-emerald-200 text-emerald-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "urgent":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  // Filter out dismissed notifications
  const visibleNotifications = notifications.filter(
    (n) => !dismissedIds.includes(n.id)
  );

  if (loading || visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      <AnimatePresence>
        {visibleNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`rounded-xl border p-4 ${getTypeStyles(notification.type)}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getTypeIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
                <p className="text-sm opacity-90">{notification.message}</p>
                <p className="text-xs opacity-60 mt-2">
                  Posted {new Date(notification.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => dismissNotification(notification.id)}
                className="flex-shrink-0 p-1 hover:bg-black/5 rounded-lg transition-colors"
                title="Dismiss"
              >
                <X className="h-4 w-4 opacity-60 hover:opacity-100" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
