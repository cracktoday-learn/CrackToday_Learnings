import { useState, useEffect } from "react";
import { BookOpen, Search, Filter, Clock, Users, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";

interface Exam {
  id: string;
  name: string;
  category: string;
  exam_type: string;
  price: number;
  total_tests: number;
  description: string;
  enrolled_count: number;
}

export function Exams() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from("batches")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Get enrolled count for each batch from purchases table
      const { data: purchases, error: purchasesError } = await supabase
        .from("purchases")
        .select("batch_id");
      
      if (purchasesError) throw purchasesError;
      
      // Count enrollments per batch
      const countMap = new Map<string, number>();
      purchases?.forEach(p => {
        countMap.set(p.batch_id, (countMap.get(p.batch_id) || 0) + 1);
      });
      
      const examsWithCount = (data || []).map(exam => ({
        ...exam,
        enrolled_count: countMap.get(exam.id) || 0
      }));
      
      setExams(examsWithCount);
    } catch (err) {
      toast.error("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = exams.filter(exam => {
    const categoryMatch = selectedCategory === "All" || exam.exam_type === selectedCategory;
    const searchMatch = !searchQuery || 
      exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.exam_type.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Available Exams</h1>
            <p className="text-slate-500 mt-2">Explore our comprehensive range of exam preparation batches.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search exams..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors font-medium">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {["All", "Central Exams", "State PSC Exams", "Police Exams", "Banking Exams", "Railway Exams", "Defence Exams", "Teaching Exams", "Engineering Govt Exams", "Forest Exams", "Insurance Exams"].map((category) => (
            <button 
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category 
                  ? "bg-indigo-600 text-white" 
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredExams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                    {exam.exam_type}
                  </span>
                  <span className={`text-lg font-bold ${exam.price === 0 ? 'text-emerald-500 flex items-center gap-1' : 'text-slate-900'}`}>
                    {exam.price === 0 ? (
                      <>
                        <Sparkles className="h-4 w-4 animate-pulse" /> FREE
                      </>
                    ) : (
                      `₹${exam.price}`
                    )}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{exam.name}</h3>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-slate-500">
                    <BookOpen className="h-4 w-4 mr-2" /> {exam.total_tests} Full Tests
                  </div>
                  <div className="flex items-center text-sm text-slate-500">
                    <Users className="h-4 w-4 mr-2" /> {exam.enrolled_count} Enrolled Students
                  </div>
                  <div className="flex items-center text-sm text-slate-500">
                    <Clock className="h-4 w-4 mr-2" /> Full Access
                  </div>
                </div>
              </div>
              <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/50">
                <Link to={`/checkout/${exam.id}`} className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border-2 border-indigo-600 text-indigo-700 rounded-xl font-semibold hover:bg-indigo-600 hover:text-white transition-colors group">
                  Enroll Now
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
