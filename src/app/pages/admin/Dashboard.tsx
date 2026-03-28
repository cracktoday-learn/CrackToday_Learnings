import { useEffect, useState } from "react";
import { Users, CreditCard, Activity, ArrowUpRight, FileText, BookOpen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeBatches: 0,
    totalRevenue: 0,
    totalPurchases: 0,
  });
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Count active batches
      const { count: batchCount } = await supabase
        .from("batches")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Count total purchases
      const { count: purchaseCount } = await supabase
        .from("purchases")
        .select("*", { count: "exact", head: true });

      // Get total revenue
      const { data: revenueData } = await supabase
        .from("purchases")
        .select("amount_paid");

      const totalRevenue = (revenueData || []).reduce(
        (acc, row) => acc + (row.amount_paid || 0), 0
      );

      // Count unique users
      const { data: uniqueUsers } = await supabase
        .from("purchases")
        .select("user_id");

      const uniqueUserCount = new Set((uniqueUsers || []).map((u) => u.user_id)).size;

      setStats({
        totalUsers: uniqueUserCount,
        activeBatches: batchCount || 0,
        totalRevenue,
        totalPurchases: purchaseCount || 0,
      });

      // Get recent purchases with batch name
      const { data: recent } = await supabase
        .from("purchases")
        .select("*, batches(name, price)")
        .order("purchased_at", { ascending: false })
        .limit(5);

      setRecentPurchases(recent || []);
    } catch (err) {
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: "Total Users", value: stats.totalUsers.toString(), change: "+live", isPositive: true, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Active Batches", value: stats.activeBatches.toString(), change: "+live", isPositive: true, icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-100" },
    { title: "Total Purchases", value: stats.totalPurchases.toString(), change: "+live", isPositive: true, icon: FileText, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Total Revenue", value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`, change: "+live", isPositive: true, icon: CreditCard, color: "text-orange-600", bg: "bg-orange-100" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
        <button
          onClick={fetchStats}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          Refresh Data
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat) => (
              <div key={stat.title} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="flex items-center text-sm font-medium text-emerald-600">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    {stat.change}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Purchases Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Recent Purchases</h3>
              <span className="text-sm text-slate-500">{recentPurchases.length} latest</span>
            </div>
            {recentPurchases.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Activity className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                <p>No purchases yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-medium">User ID</th>
                      <th className="p-4 font-medium">Batch</th>
                      <th className="p-4 font-medium">Amount</th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {recentPurchases.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                              {row.user_id?.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-sm font-medium text-slate-900">
                              {row.user_id?.slice(0, 12)}...
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-slate-600">{row.batches?.name || "—"}</td>
                        <td className="p-4 text-sm font-medium text-slate-900">
                          ₹{row.amount_paid || row.batches?.price || "—"}
                        </td>
                        <td className="p-4 text-sm text-slate-500">
                          {new Date(row.purchased_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric"
                          })}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
