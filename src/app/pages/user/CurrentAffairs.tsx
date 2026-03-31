import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Newspaper, Calendar, ArrowRight, ExternalLink } from "lucide-react";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";

interface CurrentAffair {
  id: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  source_url?: string | null;
  created_at: string;
}

const CATEGORIES = [
  { id: "all", name: "All Categories" },
  { id: "schemes", name: "Government Schemes" },
  { id: "polity", name: "Constitution & Polity" },
  { id: "national", name: "National News" },
  { id: "defence", name: "Defence & Security" },
  { id: "appointments", name: "Appointments" },
  { id: "awards", name: "Awards & Honors" },
  { id: "international", name: "International" },
  { id: "bilateral", name: "Bilateral Relations" },
  { id: "science", name: "Science & Tech" },
  { id: "sports", name: "Sports" },
  { id: "economy", name: "Economy" },
  { id: "environment", name: "Environment" },
  { id: "banking", name: "Banking" },
  { id: "health", name: "Health" },
  { id: "education", name: "Education" },
];

// DUMMY DATA - Replace with real data from Supabase
const DUMMY_AFFAIRS: CurrentAffair[] = [
  {
    id: "1",
    title: "ISRO Launches New Satellite Mission",
    summary: "Indian Space Research Organisation successfully launched its latest communication satellite, enhancing connectivity in remote areas.",
    category: "science",
    date: "2026-03-30",
    source_url: "https://www.isro.gov.in",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Parliament Passes Education Bill",
    summary: "New education reforms bill passed with overwhelming majority, focusing on digital literacy and vocational training.",
    category: "polity",
    date: "2026-03-28",
    source_url: "https://loksabha.nic.in",
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    title: "India's GDP Growth Projection",
    summary: "International Monetary Fund raises India's GDP growth projection to 7.2% for fiscal year 2026-27.",
    category: "economy",
    date: "2026-03-27",
    source_url: "https://www.imf.org",
    created_at: new Date().toISOString(),
  },
  {
    id: "4",
    title: "Climate Summit in New Delhi",
    summary: "Global leaders gather for climate conference, India pledges to achieve net zero emissions by 2070.",
    category: "environment",
    date: "2026-03-25",
    source_url: "https://moef.gov.in",
    created_at: new Date().toISOString(),
  },
  {
    id: "5",
    title: "UN Security Council Reform",
    summary: "India renews push for permanent seat at UN Security Council, gains support from G4 nations.",
    category: "international",
    date: "2026-03-23",
    source_url: "https://www.un.org",
    created_at: new Date().toISOString(),
  },
  {
    id: "6",
    title: "Union Cabinet Approves Infrastructure Projects",
    summary: "Major highway and railway projects approved worth ₹50,000 crore across 12 states.",
    category: "national",
    date: "2026-03-22",
    source_url: "https://infrastructure.gov.in",
    created_at: new Date().toISOString(),
  },
];

export function CurrentAffairs() {
  const [affairs, setAffairs] = useState<CurrentAffair[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchAffairs();
  }, []);

  const fetchAffairs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("current_affairs")
        .select("*")
        .order("date", { ascending: false })
        .limit(50);

      if (error) throw error;
      setAffairs(data || []);
    } catch (err) {
      console.error("Failed to fetch current affairs:", err);
      toast.error("Failed to load current affairs");
    } finally {
      setLoading(false);
    }
  };

  const filteredAffairs = selectedCategory === "all"
    ? affairs
    : affairs.filter(affair => affair.category === selectedCategory);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      national: "bg-blue-100 text-blue-700",
      international: "bg-purple-100 text-purple-700",
      economy: "bg-green-100 text-green-700",
      polity: "bg-orange-100 text-orange-700",
      science: "bg-cyan-100 text-cyan-700",
      environment: "bg-emerald-100 text-emerald-700",
      culture: "bg-pink-100 text-pink-700",
    };
    return colors[category] || "bg-slate-100 text-slate-700";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Newspaper className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Current Affairs</h1>
          </div>
          <p className="text-slate-600">Stay updated with the latest news and events</p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          </div>
        ) : filteredAffairs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Newspaper className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No current affairs found for this category.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAffairs.map((affair) => (
              <div
                key={affair.id}
                className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(affair.category)}`}>
                        {CATEGORIES.find(c => c.id === affair.category)?.name || affair.category}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-slate-500">
                        <Calendar className="h-4 w-4" />
                        {formatDate(affair.date)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {affair.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {affair.summary}
                    </p>
                    {affair.source_url && (
                      <a
                        href={affair.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-3 text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        Read more <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
