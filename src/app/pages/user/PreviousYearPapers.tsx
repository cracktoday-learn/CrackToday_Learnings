import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FileText, Lock, ShoppingBag, Calendar, ExternalLink, ArrowLeft, BookOpen, Eye, Download, Loader2 } from "lucide-react";
import { useAuth } from "../../components/AuthProvider";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface Batch {
  id: string;
  name: string;
  description: string;
  price: number;
  exam_type: string;
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
  created_at: string;
}

export function PreviousYearPapers() {
  const { batchId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [papers, setPapers] = useState<PreviousYearPaper[]>([]);
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (batchId && user) {
      fetchBatchAndEnrollment();
    }
  }, [batchId, user]);

  const fetchBatchAndEnrollment = async () => {
    setLoading(true);
    try {
      // Fetch batch details
      const { data: batchData, error: batchError } = await supabase
        .from("batches")
        .select("id, name, description, price, exam_type")
        .eq("id", batchId)
        .single();

      if (batchError) throw batchError;
      setBatch(batchData);

      // Check enrollment
      const { data: purchaseData, error: purchaseError } = await supabase
        .from("purchases")
        .select("id")
        .eq("user_id", user?.id)
        .eq("batch_id", batchId)
        .single();

      if (purchaseError && purchaseError.code !== 'PGRST116') {
        // PGRST116 means no rows returned (not enrolled)
        throw purchaseError;
      }

      const enrolled = !!purchaseData;
      setIsEnrolled(enrolled);

      // Only fetch papers if enrolled
      if (enrolled) {
        await fetchPapers();
      }
    } catch (err: any) {
      toast.error("Failed to load data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPapers = async () => {
    try {
      const { data, error } = await supabase
        .from("previous_year_papers")
        .select("*")
        .eq("batch_id", batchId)
        .eq("is_active", true)
        .order("year", { ascending: false })
        .order("paper_order", { ascending: true });

      if (error) throw error;
      setPapers(data || []);
    } catch (err: any) {
      toast.error("Failed to load papers: " + err.message);
    }
  };

  const addWatermarkToPDF = async (pdfBytes: Uint8Array, userEmail: string): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    for (const page of pages) {
      const { width, height } = page.getSize();

      // Add "cracktoday" at top right corner
      page.drawText("cracktoday", {
        x: width - 120,
        y: height - 30,
        size: 16,
        font: helveticaBold,
        color: rgb(0.4, 0.4, 0.4),
      });

      // Add user email watermark diagonally across the page
      const watermarkText = `Licensed to: ${userEmail}`;
      page.drawText(watermarkText, {
        x: width / 2 - 150,
        y: height / 2,
        size: 14,
        font: helveticaFont,
        color: rgb(0.7, 0.7, 0.7),
        rotate: { type: 'degrees', angle: 45 } as any,
      });

      // Add small footer watermark on each page
      page.drawText(`Downloaded by ${userEmail} | cracktoday.com`, {
        x: width / 2 - 100,
        y: 20,
        size: 8,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    return await pdfDoc.save();
  };

  const handleDownload = async (paper: PreviousYearPaper) => {
    if (!paper.file_url || !user?.email) return;

    setDownloadingId(paper.id);
    try {
      // Fetch the PDF
      const response = await fetch(paper.file_url);
      if (!response.ok) {
        throw new Error("Failed to fetch PDF");
      }

      const pdfBytes = new Uint8Array(await response.arrayBuffer());

      // Add watermark
      const watermarkedPdfBytes = await addWatermarkToPDF(pdfBytes, user.email);

      // Create download link
      const blob = new Blob([watermarkedPdfBytes as BlobPart], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${paper.title.replace(/[^a-zA-Z0-9]/g, "_")}_watermarked.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("PDF downloaded with watermark");
    } catch (err: any) {
      toast.error("Failed to download: " + err.message);
      // Fallback: open original file
      window.open(paper.file_url, "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Batch not found</p>
          <Link to="/dashboard" className="text-indigo-600 hover:underline">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Not enrolled view
  if (isEnrolled === false) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="h-10 w-10 text-slate-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Enroll to Access Previous Year Papers
            </h1>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Previous year question papers for <strong>{batch.name}</strong> are only available to enrolled learners. 
              Purchase this batch to unlock all previous year papers.
            </p>

            <div className="bg-slate-50 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-600">Batch Price</span>
                <span className="text-2xl font-bold text-slate-900">₹{batch.price}</span>
              </div>
              <div className="text-sm text-slate-500 space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-600" />
                  <span>Full access to all tests</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  <span>Previous year question papers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <span>Lifetime access</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to={`/checkout/${batchId}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                <ShoppingBag className="h-5 w-5" />
                Enroll Now - ₹{batch.price}
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                View All Batches
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enrolled view
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">
            Previous Year Papers
          </h1>
          <p className="text-slate-500 mt-2">
            {batch.name} • {batch.exam_type}
          </p>
        </div>

        {/* Enrollment Badge */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-900">You have full access</h3>
              <p className="text-sm text-emerald-700">
                As an enrolled learner, you can view and download all previous year papers for this batch.
              </p>
            </div>
          </div>
        </div>

        {/* Papers Grid */}
        {papers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No papers available yet</h3>
            <p className="text-slate-500">
              Previous year papers for this batch will be added soon. Check back later!
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {papers.map((paper) => (
              <div
                key={paper.id}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-indigo-200 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <Calendar className="h-7 w-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {paper.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {paper.year}
                          </span>
                          {paper.exam_name && paper.exam_name !== paper.title && (
                            <span>• {paper.exam_name}</span>
                          )}
                        </div>
                        {paper.description && (
                          <p className="text-slate-600 mt-2 text-sm">{paper.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {paper.file_url ? (
                          <>
                            <a
                              href={paper.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </a>
                            <button
                              onClick={() => handleDownload(paper)}
                              disabled={downloadingId === paper.id}
                              className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {downloadingId === paper.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                              {downloadingId === paper.id ? "Processing..." : "Download"}
                            </button>
                          </>
                        ) : (
                          <span className="text-sm text-slate-400 italic">No file available</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <ExternalLink className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Tips for using previous year papers</h4>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>• Practice under timed conditions to simulate the real exam</li>
                <li>• Review your answers to understand the exam pattern</li>
                <li>• Focus on frequently asked topics and question types</li>
                <li>• Track your progress across different years</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
