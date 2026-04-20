import { useEffect, useState } from "react";
import { Bell, Plus, Trash2, Edit, X, Megaphone, Calendar, Eye, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  is_active: boolean;
  created_at: string;
  expires_at?: string;
  created_by: string;
  emails_sent?: number;
  emails_failed?: number;
}

interface FormState {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  is_active: boolean;
  expires_at: string;
}

const emptyForm: FormState = {
  title: "",
  message: "",
  type: "info",
  is_active: true,
  expires_at: "",
};

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          setNotifications([]);
          return;
        }
        throw error;
      }
      setNotifications(data || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreateForm = () => {
    setEditingNotification(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (notification: Notification) => {
    setEditingNotification(notification);
    setForm({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      is_active: notification.is_active,
      expires_at: notification.expires_at ? notification.expires_at.split("T")[0] : "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        message: form.message,
        type: form.type,
        is_active: form.is_active,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      };

      if (editingNotification) {
        const { error } = await supabase
          .from("notifications")
          .update(payload)
          .eq("id", editingNotification.id);

        if (error) throw error;
        toast.success("Notification updated successfully!");
      } else {
        const { error } = await supabase.from("notifications").insert({
          ...payload,
          created_at: new Date().toISOString(),
        });

        if (error) {
          if (error.code === "42P01" || error.message?.includes("does not exist")) {
            toast.error("Notifications table not found. Please create it in Supabase.");
            return;
          }
          throw error;
        }
        toast.success("Notification created successfully!");
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingNotification(null);
      fetchNotifications();
    } catch (err) {
      console.error("Error saving notification:", err);
      toast.error("Failed to save notification");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;

    try {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;

      toast.success("Notification deleted!");
      fetchNotifications();
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-200";
      case "warning":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "success":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "urgent":
        return "🔴";
      case "warning":
        return "⚠️";
      case "success":
        return "✅";
      default:
        return "ℹ️";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-slate-500 text-sm mt-1">Create and manage announcements for all users</p>
        </div>
        <button
          onClick={openCreateForm}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2"
        >
          <Plus className="h-5 w-5" /> Create Notification
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              {editingNotification ? "Edit Notification" : "Create New Notification"}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingNotification(null);
                setForm(emptyForm);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., New Test Series Available"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Enter your notification message..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="info">ℹ️ Info</option>
                <option value="success">✅ Success</option>
                <option value="warning">⚠️ Warning</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700">Active (visible to users)</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : editingNotification ? "Update Notification" : "Create Notification"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingNotification(null);
                setForm(emptyForm);
              }}
              className="bg-white border border-slate-200 text-slate-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-5 rounded-2xl text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-indigo-100 text-sm">Total</span>
            <Megaphone className="h-5 w-5 text-indigo-200" />
          </div>
          <div className="text-3xl font-bold">{notifications.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm">Active</span>
            <Eye className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-emerald-600">
            {notifications.filter((n) => n.is_active).length}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm">Urgent</span>
            <Bell className="h-5 w-5 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-red-600">
            {notifications.filter((n) => n.type === "urgent").length}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm">Expiring Soon</span>
            <Calendar className="h-5 w-5 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-amber-600">
            {notifications.filter((n) => n.expires_at && new Date(n.expires_at) > new Date() && new Date(n.expires_at).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000).length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">All Notifications</h2>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Bell className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p>No notifications created yet.</p>
            <button
              onClick={openCreateForm}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Create First Notification
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-5 hover:bg-slate-50 transition-colors ${!notification.is_active ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getTypeIcon(notification.type)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(notification.type)}`}>
                        {notification.type.toUpperCase()}
                      </span>
                      {notification.is_active ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">{notification.title}</h3>
                    <p className="text-sm text-slate-600 mb-2">{notification.message}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-slate-400">Created: {new Date(notification.created_at).toLocaleDateString()}</span>
                      {notification.expires_at && (
                        <span className="text-slate-400">Expires: {new Date(notification.expires_at).toLocaleDateString()}</span>
                      )}
                      {/* Email Status */}
                      {(notification.emails_sent || notification.emails_failed) ? (
                        <span className={`flex items-center gap-1 ${notification.emails_failed ? 'text-amber-600' : 'text-emerald-600'}`}>
                          <Mail className="h-3 w-3" />
                          {notification.emails_sent || 0} sent
                          {notification.emails_failed ? `, ${notification.emails_failed} failed` : ''}
                        </span>
                      ) : notification.is_active ? (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Mail className="h-3 w-3" /> Sending emails...
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditForm(notification)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
