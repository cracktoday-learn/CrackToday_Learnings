import { useState, useEffect } from "react";
import { Settings, Bell, Shield, Mail, Database, Save } from "lucide-react";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";

export function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    siteName: "CrackToday",
    contactEmail: "",
    enableNotifications: true,
    enableRegistration: true,
    maintenanceMode: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Try to fetch settings from a settings table or use defaults
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .single();
      
      if (data && !error) {
        setSettings({
          siteName: data.site_name || "CrackToday",
          contactEmail: data.contact_email || "",
          enableNotifications: data.enable_notifications ?? true,
          enableRegistration: data.enable_registration ?? true,
          maintenanceMode: data.maintenance_mode ?? false,
        });
      }
    } catch {
      // Use default settings if table doesn't exist
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("settings")
        .upsert({
          id: 1,
          site_name: settings.siteName,
          contact_email: settings.contactEmail,
          enable_notifications: settings.enableNotifications,
          enable_registration: settings.enableRegistration,
          maintenance_mode: settings.maintenanceMode,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success("Settings saved successfully");
    } catch (err: any) {
      toast.error("Failed to save settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">Manage your application settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">General</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Site Name
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contact Email
              </label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  placeholder="support@cracktoday.com"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Bell className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Enable Notifications</p>
                <p className="text-sm text-slate-500">Send email notifications to users</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableNotifications}
                  onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Security</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Enable Registration</p>
                <p className="text-sm text-slate-500">Allow new users to sign up</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableRegistration}
                  onChange={(e) => setSettings({ ...settings, enableRegistration: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Maintenance Mode</p>
                <p className="text-sm text-slate-500">Put site in maintenance mode</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Database className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Database</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">
                Database connection is managed through Supabase. No additional configuration needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
