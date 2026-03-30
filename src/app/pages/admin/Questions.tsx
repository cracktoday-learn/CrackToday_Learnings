import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, Trash2, Edit, ArrowLeft, Upload, CheckCircle, X, FileText } from "lucide-react";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface Question {
  id: string;
  batch_id: string;
  test_id?: string;
  test_number?: number;
  question: string;
  type: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  marks: number;
  negative_marks: number;
  order_number: number;
}

interface Test {
  id: string;
  batch_id: string;
  name: string;
  test_number: number;
  time_duration: number;
  question_count: number;
}

const emptyForm = {
  question: "",
  type: "mcq",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_answer: "",
  explanation: "",
  marks: "1",
  negative_marks: "0.25",
};

export function AdminQuestions() {
  const { batchId } = useParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  const [batchName, setBatchName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBatch();
    fetchTests();
    fetchQuestions();
  }, [batchId]);

  const fetchBatch = async () => {
    const { data } = await supabase.from("batches").select("name").eq("id", batchId).single();
    setBatchName(data?.name || "");
  };

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from("tests")
        .select("*")
        .eq("batch_id", batchId)
        .order("test_number");
      if (error) {
        console.error("Error fetching tests:", error);
        setTests([]);
      } else {
        setTests(data || []);
        // Auto-select first test if available
        if (data && data.length > 0 && !selectedTestId) {
          setSelectedTestId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setTests([]);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("batch_id", batchId)
        .order("order_number", { ascending: true });
      if (error) throw error;
      setQuestions(data || []);
    } catch (err) {
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const openCreateForm = () => {
    setEditingQuestion(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (q: Question) => {
    setEditingQuestion(q);
    setForm({
      question: q.question,
      type: q.type,
      option_a: q.option_a || "",
      option_b: q.option_b || "",
      option_c: q.option_c || "",
      option_d: q.option_d || "",
      correct_answer: q.correct_answer,
      explanation: q.explanation || "",
      marks: q.marks.toString(),
      negative_marks: q.negative_marks.toString(),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.question || !form.correct_answer) {
      toast.error("Please fill question and correct answer");
      return;
    }
    if (form.type === "mcq" && (!form.option_a || !form.option_b || !form.option_c || !form.option_d)) {
      toast.error("Please fill all 4 options for MCQ");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        batch_id: batchId,
        test_id: selectedTestId || null,
        test_number: selectedTestId ? tests.find(t => t.id === selectedTestId)?.test_number || 1 : 1,
        question: form.question,
        type: form.type,
        option_a: form.type === "mcq" ? form.option_a : "True",
        option_b: form.type === "mcq" ? form.option_b : "False",
        option_c: form.type === "mcq" ? form.option_c : null,
        option_d: form.type === "mcq" ? form.option_d : null,
        correct_answer: form.correct_answer,
        explanation: form.explanation,
        marks: parseInt(form.marks) || 1,
        negative_marks: parseFloat(form.negative_marks) || 0.25,
        order_number: editingQuestion ? editingQuestion.order_number : questions.length + 1,
      };

      if (editingQuestion) {
        const { error } = await supabase.from("questions").update(payload).eq("id", editingQuestion.id);
        if (error) throw error;
        toast.success("Question updated!");
      } else {
        const { error } = await supabase.from("questions").insert(payload);
        if (error) throw error;
        toast.success("Question added!");
      }
      setShowForm(false);
      setEditingQuestion(null);
      setForm(emptyForm);
      fetchQuestions();
    } catch (err) {
      toast.error("Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    try {
      const { error } = await supabase.from("questions").delete().eq("id", id);
      if (error) throw error;
      toast.success("Question deleted!");
      fetchQuestions();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (jsonData.length < 2) {
        toast.error("Excel file is empty or has no data");
        return;
      }
      
      const headers = jsonData[0].map((h: any) => String(h).trim().toLowerCase());
      const rows = jsonData.slice(1);
      let successCount = 0;
      
      for (let i = 0; i < rows.length; i++) {
        const cols = rows[i];
        if (cols.length < 3) continue;
        
        const row: any = {};
        headers.forEach((h: string, idx: number) => { 
          row[h] = cols[idx] !== undefined ? String(cols[idx]) : ""; 
        });
        
        const payload = {
          batch_id: batchId,
          test_id: selectedTestId || null,
          test_number: selectedTestId ? tests.find(t => t.id === selectedTestId)?.test_number || 1 : 1,
          question: row["question"] || row["q"] || "",
          type: (row["type"] || "mcq").toLowerCase(),
          option_a: row["option_a"] || row["a"] || "True",
          option_b: row["option_b"] || row["b"] || "False",
          option_c: row["option_c"] || row["c"] || null,
          option_d: row["option_d"] || row["d"] || null,
          correct_answer: row["correct_answer"] || row["answer"] || row["correct"] || "",
          explanation: row["explanation"] || "",
          marks: parseInt(row["marks"]) || 1,
          negative_marks: parseFloat(row["negative_marks"]) || 0.25,
          order_number: questions.length + i + 1,
        };
        
        if (!payload.question || !payload.correct_answer) continue;
        const { error } = await supabase.from("questions").insert(payload);
        if (!error) successCount++;
      }
      
      toast.success(`${successCount} questions uploaded successfully!`);
      fetchQuestions();
    } catch (err) {
      console.error("Excel upload error:", err);
      toast.error("Failed to upload Excel file. Please check the format.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const downloadSampleExcel = () => {
    const sampleData = [
      {
        question: "What is the capital of India?",
        type: "mcq",
        option_a: "Mumbai",
        option_b: "Delhi",
        option_c: "Chennai",
        option_d: "Kolkata",
        correct_answer: "B",
        explanation: "Delhi is the capital of India",
        marks: 1,
        negative_marks: 0.25
      },
      {
        question: "The sun rises in the east.",
        type: "tf",
        option_a: "True",
        option_b: "False",
        option_c: "",
        option_d: "",
        correct_answer: "A",
        explanation: "The sun rises in the east",
        marks: 1,
        negative_marks: 0.25
      },
      {
        question: "2 + 2 = ?",
        type: "mcq",
        option_a: "3",
        option_b: "4",
        option_c: "5",
        option_d: "6",
        correct_answer: "B",
        explanation: "Basic arithmetic",
        marks: 1,
        negative_marks: 0.25
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
    XLSX.writeFile(workbook, "sample_questions.xlsx");
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/admin/tests" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-1">
            <ArrowLeft className="h-4 w-4" /> Back to Test Batches
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{batchName}</h1>
          <p className="text-slate-500 text-sm">{questions.length} questions total</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Test Selector */}
          {tests.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Upload to Test:</label>
              <select
                value={selectedTestId}
                onChange={(e) => setSelectedTestId(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                {tests.map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.name} (Test {test.test_number})
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={downloadSampleExcel}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <FileText className="h-4 w-4" /> Sample Excel
          </button>
          <label className={`flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors cursor-pointer ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}>
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Excel"}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} disabled={uploading} />
          </label>
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Question
          </button>
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">{editingQuestion ? "Edit Question" : "Add New Question"}</h2>
            <button onClick={() => setShowForm(false)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Question Type */}
            <div className="flex gap-3">
              <button
                onClick={() => setForm({ ...form, type: "mcq", correct_answer: "" })}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${form.type === "mcq" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
              >
                MCQ (4 options)
              </button>
              <button
                onClick={() => setForm({ ...form, type: "tf", option_a: "True", option_b: "False", option_c: "", option_d: "", correct_answer: "" })}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${form.type === "tf" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
              >
                True / False
              </button>
            </div>

            {/* Question Text */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Question *</label>
              <textarea
                rows={3}
                placeholder="Type your question here..."
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Options */}
            {form.type === "mcq" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {["a", "b", "c", "d"].map((opt) => (
                  <div key={opt}>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Option {opt.toUpperCase()} *</label>
                    <input
                      type="text"
                      placeholder={`Option ${opt.toUpperCase()}`}
                      value={form[`option_${opt}` as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [`option_${opt}`]: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="flex-1 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-medium text-emerald-700 text-center">A — True</div>
                <div className="flex-1 p-3 bg-red-50 border border-red-200 rounded-lg text-sm font-medium text-red-700 text-center">B — False</div>
              </div>
            )}

            {/* Correct Answer */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Correct Answer *</label>
              <div className="flex gap-2">
                {form.type === "mcq"
                  ? ["A", "B", "C", "D"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setForm({ ...form, correct_answer: opt })}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${form.correct_answer === opt ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                      >
                        {opt}
                      </button>
                    ))
                  : ["A", "B"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setForm({ ...form, correct_answer: opt })}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${form.correct_answer === opt ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                      >
                        {opt === "A" ? "A — True" : "B — False"}
                      </button>
                    ))}
              </div>
            </div>

            {/* Marks and Negative Marks */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Marks</label>
                <input
                  type="number"
                  value={form.marks}
                  onChange={(e) => setForm({ ...form, marks: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Negative Marks</label>
                <input
                  type="number"
                  step="0.25"
                  value={form.negative_marks}
                  onChange={(e) => setForm({ ...form, negative_marks: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Explanation */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Explanation (optional)</label>
              <textarea
                rows={2}
                placeholder="Explanation for the correct answer..."
                value={form.explanation}
                onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : editingQuestion ? "Update Question" : "Add Question"}
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

      {/* Questions List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">All Questions</h2>
          <span className="text-sm text-slate-500">{questions.length} questions</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No questions yet.</p>
            <p className="text-slate-400 text-xs mt-1">Click "Add Question" or upload a CSV file.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {questions.map((q, index) => (
              <div key={q.id} className="p-5 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-400">Q{index + 1}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${q.type === "mcq" ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"}`}>
                        {q.type === "mcq" ? "MCQ" : "True/False"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {q.marks} mark{q.marks > 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 mb-2">{q.question}</p>
                    {q.type === "mcq" && (
                      <div className="grid grid-cols-2 gap-1 mb-2">
                        {[["A", q.option_a], ["B", q.option_b], ["C", q.option_c], ["D", q.option_d]].map(([opt, val]) => (
                          <div key={opt} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${q.correct_answer === opt ? "bg-emerald-50 text-emerald-700 font-semibold" : "bg-slate-50 text-slate-600"}`}>
                            {q.correct_answer === opt && <CheckCircle className="h-3 w-3" />}
                            <span>{opt}. {val}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {q.type === "tf" && (
                      <div className="flex gap-2 mb-2">
                        <div className={`px-3 py-1 rounded-lg text-xs ${q.correct_answer === "A" ? "bg-emerald-50 text-emerald-700 font-semibold" : "bg-slate-50 text-slate-600"}`}>
                          {q.correct_answer === "A" && <CheckCircle className="h-3 w-3 inline mr-1" />}A. True
                        </div>
                        <div className={`px-3 py-1 rounded-lg text-xs ${q.correct_answer === "B" ? "bg-emerald-50 text-emerald-700 font-semibold" : "bg-slate-50 text-slate-600"}`}>
                          {q.correct_answer === "B" && <CheckCircle className="h-3 w-3 inline mr-1" />}B. False
                        </div>
                      </div>
                    )}
                    {q.explanation && (
                      <p className="text-xs text-slate-500 italic">💡 {q.explanation}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditForm(q)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(q.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
