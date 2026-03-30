import { useEffect, useState } from "react";
import { Plus, Search, FileText, Clock, Award, Edit, Trash2, ToggleLeft, ToggleRight, X, BookOpen, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";

interface Batch {
  id: string;
  name: string;
  description: string;
  price: number;
  total_tests: number;
  exam_type: string;
  is_active: boolean;
  created_at: string;
}

interface Test {
  id: string;
  batch_id: string;
  name: string;
  test_number: number;
  time_duration: number;
  question_count: number;
  created_at: string;
}

const emptyForm = { name: "", description: "", price: "", total_tests: "", exam_type: "" };

export function AdminTests() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [testForm, setTestForm] = useState({ name: "", time_duration: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { 
    fetchBatches(); 
    fetchTests();
    setLoading(false);
  }, []);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase.from("batches").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setBatches(data || []);
    } catch (err) {
      toast.error("Failed to load batches");
    }
  };

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase.from("tests").select("*").order("batch_id,test_number");
      if (error) {
        console.error("Error fetching tests:", error);
        // If tests table doesn't exist, just set empty array
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          setTests([]);
        } else {
          toast.error("Failed to load tests: " + error.message);
          setTests([]);
        }
      } else {
        setTests(data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setTests([]);
    }
  };

  const openCreateForm = () => {
    setEditingBatch(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openTestForm = (batch: Batch) => {
    setSelectedBatch(batch);
    setTestForm({ name: "", time_duration: "" });
    setShowTestForm(true);
  };

  const handleSaveTest = async () => {
    if (!selectedBatch || !testForm.name || !testForm.time_duration) {
      toast.error("Please fill all required fields");
      return;
    }
    setSaving(true);
    try {
      // Get all existing test numbers for this batch
      const { data: existingTests } = await supabase
        .from("tests")
        .select("test_number")
        .eq("batch_id", selectedBatch.id)
        .order("test_number");
      
      // Find first available gap (1, 2, 3, 5 → returns 4)
      let nextTestNumber = 1;
      if (existingTests && existingTests.length > 0) {
        const usedNumbers = new Set(existingTests.map(t => t.test_number));
        while (usedNumbers.has(nextTestNumber)) {
          nextTestNumber++;
        }
      }
      
      const newTestId = crypto.randomUUID();
      console.log("Generated test ID:", newTestId);
      console.log("Selected batch ID:", selectedBatch.id);
      console.log("Next test number:", nextTestNumber);

      const insertData = {
        id: newTestId,
        batch_id: selectedBatch.id,
        name: testForm.name,
        test_number: nextTestNumber,
        time_duration: parseInt(testForm.time_duration),
        question_count: 0,
      };
      console.log("Insert data:", insertData);

      const { data, error } = await supabase.from("tests").insert(insertData).select();

      if (error) {
        console.error("Error creating test:", error);
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          toast.error("Tests table not found. Please run the database migration first.");
        } else if (error.message.includes('duplicate') || error.code === '23505') {
          toast.error("Test number already exists. Please refresh and try again.");
        } else {
          toast.error("Failed to create test: " + error.message);
        }
        return;
      }

      toast.success("Test created successfully!");
      setShowTestForm(false);
      setTestForm({ name: "", time_duration: "" });
      fetchTests();
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Failed to create test. Please check database connection.");
    } finally {
      setSaving(false);
    }
  };

  const openEditForm = (batch: Batch) => {
    setEditingBatch(batch);
    setForm({
      name: batch.name,
      description: batch.description || "",
      price: batch.price.toString(),
      total_tests: batch.total_tests.toString(),
      exam_type: batch.exam_type,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.exam_type) {
      toast.error("Please fill all required fields");
      return;
    }
    setSaving(true);
    try {
      if (editingBatch) {
        const { error } = await supabase.from("batches").update({
          name: form.name,
          description: form.description,
          price: parseInt(form.price),
          total_tests: parseInt(form.total_tests) || 0,
          exam_type: form.exam_type,
        }).eq("id", editingBatch.id);
        if (error) throw error;
        toast.success("Batch updated successfully!");
      } else {
        const { error } = await supabase.from("batches").insert({
          name: form.name,
          description: form.description,
          price: parseInt(form.price),
          total_tests: parseInt(form.total_tests) || 0,
          exam_type: form.exam_type,
          is_active: true,
        });
        if (error) throw error;
        toast.success("Batch created successfully!");
      }
      setShowForm(false);
      setEditingBatch(null);
      setForm(emptyForm);
      fetchBatches();
    } catch (err) {
      toast.error("Failed to save batch");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this batch?")) return;
    try {
      const { error } = await supabase.from("batches").delete().eq("id", id);
      if (error) throw error;
      toast.success("Batch deleted!");
      fetchBatches();
    } catch (err) {
      toast.error("Failed to delete batch");
    }
  };

  const handleToggleActive = async (batch: Batch) => {
    try {
      const { error } = await supabase.from("batches").update({ is_active: !batch.is_active }).eq("id", batch.id);
      if (error) throw error;
      toast.success(batch.is_active ? "Batch deactivated!" : "Batch activated!");
      fetchBatches();
    } catch (err) {
      toast.error("Failed to update batch status");
    }
  };

  const filtered = batches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.exam_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Test Batches</h1>
          <p className="text-slate-500 text-sm mt-1">Create and manage your mock test batches.</p>
        </div>
        <button
          onClick={openCreateForm}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2"
        >
          <Plus className="h-5 w-5" /> Create New Batch
        </button>
      </div>

      {showTestForm && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Add Test to {selectedBatch?.name}</h2>
            <button onClick={() => setShowTestForm(false)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Test Name *</label>
              <input type="text" placeholder="e.g. Test 1 - General Knowledge" value={testForm.name}
                onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Time Duration (minutes) *</label>
              <input type="number" placeholder="e.g. 60" value={testForm.time_duration}
                onChange={(e) => setTestForm({ ...testForm, time_duration: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSaveTest} disabled={saving}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Create Test"}
            </button>
            <button onClick={() => setShowTestForm(false)}
              className="bg-white border border-slate-200 text-slate-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">{editingBatch ? "Edit Batch" : "New Test Batch"}</h2>
            <button onClick={() => setShowForm(false)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Batch Name *</label>
              <input type="text" placeholder="e.g. SSC CGL Tier 1 Mock Series" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Exam Type *</label>
              <input type="text" placeholder="e.g. SSC, UPSC, Banking" value={form.exam_type}
                onChange={(e) => setForm({ ...form, exam_type: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Price (₹) *</label>
              <input type="number" placeholder="e.g. 999" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Total Tests</label>
              <input type="number" placeholder="e.g. 20" value={form.total_tests}
                onChange={(e) => setForm({ ...form, total_tests: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700 block mb-1">Description</label>
              <textarea placeholder="Brief description..." value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" rows={2} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} disabled={saving}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {saving ? "Saving..." : editingBatch ? "Update Batch" : "Save Batch"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="bg-white border border-slate-200 text-slate-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-indigo-100 font-medium text-sm uppercase tracking-wider">Total Batches</h3>
            <div className="p-2 bg-indigo-400/30 rounded-lg"><FileText className="h-5 w-5 text-indigo-50" /></div>
          </div>
          <div className="text-4xl font-bold">{batches.length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wider">Active Batches</h3>
            <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100"><Award className="h-5 w-5 text-emerald-600" /></div>
          </div>
          <div className="text-4xl font-bold text-slate-900">{batches.filter(b => b.is_active).length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wider">Total Tests</h3>
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100"><Clock className="h-5 w-5 text-blue-600" /></div>
          </div>
          <div className="text-4xl font-bold text-slate-900">{batches.reduce((acc, b) => acc + b.total_tests, 0)}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Search batches..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-indigo-500 outline-none" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <FileText className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p>No batches found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Batch Name</th>
                  <th className="px-6 py-4 font-medium">Exam Type</th>
                  <th className="px-6 py-4 font-medium">Price</th>
                  <th className="px-6 py-4 font-medium">Tests</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{batch.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{batch.description?.slice(0, 50)}{batch.description?.length > 50 ? "..." : ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {batch.exam_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-indigo-600">₹{batch.price}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">
  <div className="flex items-center gap-2">
    <span>{tests.filter(t => t.batch_id === batch.id).length} tests</span>
            <button 
              onClick={() => openTestForm(batch)}
              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
              title="Add Test">
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleToggleActive(batch)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                          batch.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                        }`}>
                        {batch.is_active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                        {batch.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/tests/${batch.id}/manage`}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Manage Tests">
                          <FileText className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => openTestForm(batch)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Add Test">
                          <Plus className="h-4 w-4" />
                        </button>
                        <Link to={`/admin/tests/${batch.id}/questions`}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Manage Questions">
                          <BookOpen className="h-4 w-4" />
                        </Link>
                        <button onClick={() => openEditForm(batch)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Batch">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(batch.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Batch">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
