import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Plus, Search, FileText, Clock, Edit, Trash2, X, BookOpen, Upload, ArrowLeft } from "lucide-react";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";

interface Test {
  id: string;
  batch_id: string;
  name: string;
  test_number: number;
  time_duration: number;
  question_count: number;
  created_at: string;
}

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

export function TestManagement() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", time_duration: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBatch();
    fetchTests();
  }, [batchId]);

  const fetchBatch = async () => {
    try {
      const { data, error } = await supabase.from("batches").select("*").eq("id", batchId).single();
      if (error) throw error;
      setBatch(data);
    } catch (err) {
      toast.error("Failed to load batch");
    }
  };

  const fetchTests = async () => {
    setLoading(true);
    try {
      const { data: testsData, error } = await supabase
        .from("tests")
        .select("id, batch_id, name, test_number, time_duration, question_count, created_at")
        .eq("batch_id", batchId)
        .order("test_number");
      
      if (error) {
        console.error("Error fetching tests:", error);
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          toast.error("Tests table not found. Please run the database migration first.");
        } else {
          toast.error("Failed to load tests: " + error.message);
        }
        setTests([]);
      } else {
        // Fetch actual question counts for each test
        const { data: questionsData } = await supabase
          .from("questions")
          .select("test_id, test_number")
          .eq("batch_id", batchId);
        
        const questionCounts: { [key: string]: number } = {};
        const questionCountsByNumber: { [key: number]: number } = {};
        
        questionsData?.forEach((q: any) => {
          const testId = q.test_id;
          const testNum = q.test_number;
          
          if (testId) {
            questionCounts[testId] = (questionCounts[testId] || 0) + 1;
          }
          if (testNum) {
            questionCountsByNumber[testNum] = (questionCountsByNumber[testNum] || 0) + 1;
          }
        });
        
        // Merge actual counts with test data
        const testsWithCounts = (testsData || []).map((test: any) => ({
          ...test,
          question_count: questionCounts[test.id] || questionCountsByNumber[test.test_number] || 0,
          time_duration: test.time_duration || 0,
          created_at: test.created_at || new Date().toISOString()
        }));
        
        console.log("Tests data:", testsData);
        console.log("Questions data:", questionsData);
        console.log("Tests with counts:", testsWithCounts);
        
        setTests(testsWithCounts);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Failed to load tests. Please check database connection.");
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.time_duration) {
      toast.error("Please fill all required fields");
      return;
    }
    setSaving(true);
    try {
      const nextTestNumber = tests.length + 1;

      const { data, error } = await supabase.from("tests").insert({
        batch_id: batchId,
        name: form.name,
        test_number: nextTestNumber,
        time_duration: parseInt(form.time_duration),
        question_count: 0,
      }).select();

      if (error) {
        console.error("Error creating test:", error);
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          toast.error("Tests table not found. Please run the database migration first.");
        } else {
          toast.error("Failed to create test: " + error.message);
        }
        return;
      }

      toast.success("Test created successfully!");
      setShowForm(false);
      setForm({ name: "", time_duration: "" });
      fetchTests();
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Failed to create test. Please check database connection.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (test: Test) => {
    if (!confirm("Are you sure you want to delete this test? All questions in this test will also be deleted.")) return;
    try {
      // Delete questions by test_id
      const { error: questionsError1 } = await supabase
        .from("questions")
        .delete()
        .eq("test_id", test.id);
      
      if (questionsError1) {
        console.error("Error deleting questions by test_id:", questionsError1);
      }
      
      // Also delete questions by test_number and batch_id (fallback)
      const { error: questionsError2 } = await supabase
        .from("questions")
        .delete()
        .eq("batch_id", batchId)
        .eq("test_number", test.test_number);
      
      if (questionsError2) {
        console.error("Error deleting questions by test_number:", questionsError2);
      }
      
      // Then delete the test
      const { error } = await supabase.from("tests").delete().eq("id", test.id);
      if (error) throw error;
      
      toast.success("Test and its questions deleted!");
      fetchTests();
    } catch (err) {
      toast.error("Failed to delete test");
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/tests")}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{batch?.name}</h1>
            <p className="text-slate-500 text-sm mt-1">Manage individual tests within this batch</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2"
        >
          <Plus className="h-5 w-5" /> Add New Test
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Add New Test</h2>
            <button onClick={() => setShowForm(false)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Test Name *</label>
              <input type="text" placeholder="e.g. Test 1 - General Knowledge" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Time Duration (minutes) *</label>
              <input type="number" placeholder="e.g. 60" value={form.time_duration}
                onChange={(e) => setForm({ ...form, time_duration: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} disabled={saving}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Create Test"}
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
            <h3 className="text-indigo-100 font-medium text-sm uppercase tracking-wider">Total Tests</h3>
            <div className="p-2 bg-indigo-400/30 rounded-lg"><FileText className="h-5 w-5 text-indigo-50" /></div>
          </div>
          <div className="text-4xl font-bold">{tests.length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wider">Total Questions</h3>
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100"><BookOpen className="h-5 w-5 text-blue-600" /></div>
          </div>
          <div className="text-4xl font-bold text-slate-900">{tests.reduce((acc, t) => acc + t.question_count, 0)}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wider">Avg Duration</h3>
            <div className="p-2 bg-orange-50 rounded-lg border border-orange-100"><Clock className="h-5 w-5 text-orange-600" /></div>
          </div>
          <div className="text-4xl font-bold text-slate-900">
            {tests.length > 0 ? Math.round(tests.reduce((acc, t) => acc + t.time_duration, 0) / tests.length) : 0}m
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Tests in {batch?.name}</h2>
        </div>

        {tests.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <FileText className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p>No tests created yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Create First Test
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Test Name</th>
                  <th className="px-6 py-4 font-medium">Test Number</th>
                  <th className="px-6 py-4 font-medium">Duration</th>
                  <th className="px-6 py-4 font-medium">Questions</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tests.map((test) => (
                  <tr key={test.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{test.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                          Created {test.created_at ? new Date(test.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        Test {test.test_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{test.time_duration || 0} minutes</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{test.question_count || 0} questions</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/tests/${batchId}/test/${test.id}/questions`}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Manage Questions">
                          <BookOpen className="h-4 w-4" />
                        </Link>
                        <button onClick={() => handleDelete(test)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Test">
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
