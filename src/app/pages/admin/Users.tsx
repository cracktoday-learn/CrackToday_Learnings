import { useEffect, useState } from "react";
import { Search, Shield, Ban, CheckCircle, Mail } from "lucide-react";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  user_metadata: { name?: string };
}

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch all users from auth (via profiles or auth.users)
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, name, created_at");

      if (profilesError) throw profilesError;

      // Fetch purchases to show enrolled batches
      const { data: purchasesData } = await supabase
        .from("purchases")
        .select("user_id, purchased_at, batches(name)");

      // Group purchases by user
      const purchasesByUser: Record<string, any[]> = {};
      (purchasesData || []).forEach((row: any) => {
        if (!purchasesByUser[row.user_id]) {
          purchasesByUser[row.user_id] = [];
        }
        purchasesByUser[row.user_id].push(row);
      });

      // Combine profiles with purchase data
      const usersWithPurchases = (profilesData || []).map((profile: any) => {
        const userPurchases = purchasesByUser[profile.id] || [];
        return {
          user_id: profile.id,
          email: profile.email,
          name: profile.name || "User",
          created_at: profile.created_at,
          batches: userPurchases.map((p: any) => p.batches?.name).filter(Boolean),
          purchased_at: userPurchases[0]?.purchased_at || profile.created_at,
        };
      });

      setUsers(usersWithPurchases);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Users</h1>
          <p className="text-slate-500 text-sm mt-1">View all registered students and their purchases.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium border border-indigo-200">
            {users.length} Total Users
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by user ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Shield className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p>No users registered yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">User Name</th>
                  <th className="px-6 py-4 font-medium">Enrolled Batches</th>
                  <th className="px-6 py-4 font-medium">Joined Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users
                  .filter((u) => (u.email || u.user_id).toLowerCase().includes(search.toLowerCase()))
                  .map((user) => (
                    <tr key={user.user_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm border border-indigo-200">
                            {(user.name || user.email || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{user.name || "User"}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3" /> {(user.email || user.user_id).slice(0, 20)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.batches.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.batches.map((batchName: string, idx: number) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {batchName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(user.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${user.batches.length > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                          <CheckCircle className="h-3 w-3" /> {user.batches.length > 0 ? "Active" : "Registered"}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
