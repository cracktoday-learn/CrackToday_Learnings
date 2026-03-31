import { useEffect, useState, useRef } from "react";
import { Plus, Search, FileText, Trash2, Upload, X, BookOpen, Calendar, Filter, Eye, ExternalLink } from "lucide-react";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";

interface Batch {
  id: string;
  name: string;
  description: string;
  exam_type: string;
  is_active: boolean;
}

interface PreviousYearPaper {
  id: string;
  batch_id: string;
  title: string;
  year: number;
  description: string | null;
  file_url: string | null;
  file_type: string;
  exam_name: string | null;
  paper_order: number;
  is_active: boolean;
  created_at: string;
}

const emptyForm = {
  title: "",
  year: new Date().getFullYear(),
  description: "",
  exam_name: "",
  paper_order: 0,
};

export function AdminPreviousYearPapers() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [papers, setPapers] = useState<PreviousYearPaper[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingPaper, setEditingPaper] = useState<PreviousYearPaper | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchPapers(selectedBatch.id);
    }
  }, [selectedBatch]);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from("batches")
        .select("id, name, description, exam_type, is_active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setBatches(data || []);
    } catch (err) {
      toast.error("Failed to load batches");
    } finally {
      setLoading(false);
    }
  };

  const fetchPapers = async (batchId: string) => {
    try {
      const { data, error } = await supabase
        .from("previous_year_papers")
        .select("*")
        .eq("batch_id", batchId)
        .order("year", { ascending: false })
        .order("paper_order", { ascending: true });
      if (error) throw error;
      setPapers(data || []);
    } catch (err) {
      toast.error("Failed to load previous year papers");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, JPG, and PNG files are allowed");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `pyq-papers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('pyq-papers')
      .upload(filePath, selectedFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      toast.error("Failed to upload file: " + uploadError.message);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('pyq-papers')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSave = async () => {
    if (!selectedBatch) {
      toast.error("Please select a batch first");
      return;
    }

    if (!form.title || !form.year) {
      toast.error("Title and year are required");
      return;
    }

    setUploading(true);
    try {
      let fileUrl = editingPaper?.file_url || null;
      let fileType = editingPaper?.file_type || 'pdf';

      // Upload new file if selected
      if (selectedFile) {
        const uploadedUrl = await uploadFile();
        if (uploadedUrl) {
          fileUrl = uploadedUrl;
          fileType = selectedFile.type === 'application/pdf' ? 'pdf' : 'image';
        }
      }

      const paperData = {
        batch_id: selectedBatch.id,
        title: form.title,
        year: form.year,
        description: form.description || null,
        file_url: fileUrl,
        file_type: fileType,
        exam_name: form.exam_name || selectedBatch.name,
        paper_order: form.paper_order,
        is_active: true,
      };

      if (editingPaper) {
        const { error } = await supabase
          .from("previous_year_papers")
          .update(paperData)
          .eq("id", editingPaper.id);
        if (error) throw error;
        toast.success("Paper updated successfully");
      } else {
        const { error } = await supabase
          .from("previous_year_papers")
          .insert(paperData);
        if (error) throw error;
        toast.success("Paper added successfully");
      }

      setShowForm(false);
      setForm(emptyForm);
      setSelectedFile(null);
      setEditingPaper(null);
      fetchPapers(selectedBatch.id);
    } catch (err: any) {
      toast.error("Failed to save: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (paper: PreviousYearPaper) => {
    if (!confirm(`Delete "${paper.title}"?`)) return;

    try {
      // Delete file from storage if exists
      if (paper.file_url) {
        const filePath = paper.file_url.split('/').pop();
        if (filePath) {
          await supabase.storage.from('pyq-papers').remove([`pyq-papers/${filePath}`]);
        }
      }

      const { error } = await supabase
        .from("previous_year_papers")
        .delete()
        .eq("id", paper.id);
      if (error) throw error;

      toast.success("Paper deleted");
      if (selectedBatch) fetchPapers(selectedBatch.id);
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const openCreateForm = () => {
    setEditingPaper(null);
    setForm({
      ...emptyForm,
      paper_order: papers.length,
      exam_name: selectedBatch?.name || "",
    });
    setSelectedFile(null);
    setShowForm(true);
  };

  const openEditForm = (paper: PreviousYearPaper) => {
    setEditingPaper(paper);
    setForm({
      title: paper.title,
      year: paper.year,
      description: paper.description || "",
      exam_name: paper.exam_name || "",
      paper_order: paper.paper_order,
    });
    setSelectedFile(null);
    setShowForm(true);
  };

  const filteredBatches = batches.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.exam_type.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Previous Year Papers</h1>
          <p className="text-slate-500">Manage previous year question papers for enrolled learners</p>
        </div>
      </div>

      {/* Batch Selection */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
          Select a Batch
        </h2>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search batches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBatches.map((batch) => (
            <button
              key={batch.id}
              onClick={() => setSelectedBatch(batch)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                selectedBatch?.id === batch.id
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-slate-200 hover:border-indigo-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  selectedBatch?.id === batch.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{batch.name}</h3>
                  <p className="text-xs text-slate-500">{batch.exam_type}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {filteredBatches.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No batches found
          </div>
        )}
      </div>

      {/* Papers List */}
      {selectedBatch && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Papers for {selectedBatch.name}
                </h2>
                <p className="text-sm text-slate-500">
                  {papers.length} paper{papers.length !== 1 ? 's' : ''} uploaded
                </p>
              </div>
              <button
                onClick={openCreateForm}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Paper
              </button>
            </div>
          </div>

          {papers.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No papers yet</h3>
              <p className="text-slate-500 mb-4">
                Upload previous year question papers for this batch
              </p>
              <button
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Upload First Paper
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {papers.map((paper) => (
                <div key={paper.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 truncate">{paper.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {paper.year}
                      </span>
                      {paper.exam_name && paper.exam_name !== paper.title && (
                        <span>• {paper.exam_name}</span>
                      )}
                      {paper.file_url && (
                        <span className="flex items-center gap-1 text-indigo-600">
                          <FileText className="h-3 w-3" />
                          {paper.file_type?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    {paper.description && (
                      <p className="text-sm text-slate-500 mt-1 truncate">{paper.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {paper.file_url && (
                      <a
                        href={paper.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View file"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={() => openEditForm(paper)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(paper)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && selectedBatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingPaper ? "Edit Paper" : "Add Previous Year Paper"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Paper Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., IBPS PO Prelims 2023"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Year *
                  </label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || new Date().getFullYear() })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={form.paper_order}
                    onChange={(e) => setForm({ ...form, paper_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Exam Name
                </label>
                <input
                  type="text"
                  value={form.exam_name}
                  onChange={(e) => setForm({ ...form, exam_name: e.target.value })}
                  placeholder="e.g., IBPS PO Prelims"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Upload File (PDF, JPG, PNG)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    selectedFile
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
                  }`}
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-indigo-600">
                      <FileText className="h-5 w-5" />
                      <span className="font-medium">{selectedFile.name}</span>
                      <span className="text-sm text-slate-500">
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  ) : editingPaper?.file_url ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-indigo-600">
                        <FileText className="h-5 w-5" />
                        <span className="font-medium">Current file uploaded</span>
                      </div>
                      <p className="text-sm text-slate-500">Click to replace or leave as is</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 text-slate-400 mx-auto" />
                      <p className="text-sm text-slate-600">
                        <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-slate-500">PDF, JPG, PNG up to 10MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading
                  ? "Uploading..."
                  : editingPaper
                  ? "Update Paper"
                  : "Add Paper"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
