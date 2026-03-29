import { useEffect, useState } from "react";
import { Plus, Trash2, Tag, Users, Calendar, ToggleRight, ToggleLeft, X } from "lucide-react";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  max_uses: number;
  used_count: number;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

const emptyForm = { code: "", discount_percent: "", max_uses: "100", expires_at: "" };

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setCoupons(data || []);
    } catch (err) {
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.code || !form.discount_percent) {
      toast.error("Please fill all required fields");
      return;
    }
    if (parseInt(form.discount_percent) > 100 || parseInt(form.discount_percent) < 1) {
      toast.error("Discount must be between 1 and 100");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("coupons").insert({
        code: form.code.toUpperCase().trim(),
        discount_percent: parseInt(form.discount_percent),
        max_uses: parseInt(form.max_uses) || 100,
        expires_at: form.expires_at || null,
        is_active: true,
      });
      if (error) {
        if (error.code === "23505") {
          toast.error("Coupon code already exists!");
        } else {
          throw error;
        }
        return;
      }
      toast.success("Coupon created!");
      setShowForm(false);
      setForm(emptyForm);
      fetchCoupons();
    } catch (err) {
      toast.error("Failed to create coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
      toast.success("Coupon deleted!");
      fetchCoupons();
    } catch (err) {
      toast.error("Failed to delete coupon");
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    try {
      const { error } = await supabase.from("coupons").update({ is_active: !coupon.is_active }).eq("id", coupon.id);
      if (error) throw error;
      toast.success(coupon.is_active ? "Coupon deactivated!" : "Coupon activated!");
      fetchCoupons();
    } catch (err) {
      toast.error("Failed to update coupon");
    }
  };

  const isExpired = (expires_at: string) => expires_at && new Date(expires_at) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Coupons</h1>
          <p className="text-slate-500 text-sm mt-1">Create and manage discount coupons for users.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2"
        >
          <Plus className="h-5 w-5" /> Create Coupon
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">New Coupon</h2>
            <button onClick={() => setShowForm(false)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Coupon Code *</label>
              <input
                type="text"
                placeholder="e.g. WELCOME20"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Discount % *</label>
              <input
                type="number"
                placeholder="e.g. 20"
                min="1"
                max="100"
                value={form.discount_percent}
                onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Max Uses</label>
              <input
                type="number"
                placeholder="e.g. 100"
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Expiry Date</label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Create Coupon"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-white border border-slate-200 text-slate-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600"><Tag className="h-5 w-5" /></div>
            <div><p className="text-sm text-slate-500">Total Coupons</p><h3 className="text-2xl font-bold text-slate-900">{coupons.length}</h3></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><ToggleRight className="h-5 w-5" /></div>
            <div><p className="text-sm text-slate-500">Active Coupons</p><h3 className="text-2xl font-bold text-slate-900">{coupons.filter(c => c.is_active && !isExpired(c.expires_at)).length}</h3></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600"><Users className="h-5 w-5" /></div>
            <div><p className="text-sm text-slate-500">Total Uses</p><h3 className="text-2xl font-bold text-slate-900">{coupons.reduce((acc, c) => acc + c.used_count, 0)}</h3></div>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-16">
            <Tag className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No coupons yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Code</th>
                  <th className="px-6 py-4 font-medium">Discount</th>
                  <th className="px-6 py-4 font-medium">Uses</th>
                  <th className="px-6 py-4 font-medium">Expires</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded text-sm">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-emerald-600 font-bold text-sm">{coupon.discount_percent}% OFF</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700">{coupon.used_count} / {coupon.max_uses}</div>
                      <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1">
                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min((coupon.used_count / coupon.max_uses) * 100, 100)}%` }}></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {coupon.expires_at
                        ? isExpired(coupon.expires_at)
                          ? <span className="text-red-500 font-medium">Expired</span>
                          : new Date(coupon.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "No expiry"}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(coupon)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                          coupon.is_active && !isExpired(coupon.expires_at)
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        {coupon.is_active && !isExpired(coupon.expires_at)
                          ? <><ToggleRight className="h-3.5 w-3.5" /> Active</>
                          : <><ToggleLeft className="h-3.5 w-3.5" /> Inactive</>}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
