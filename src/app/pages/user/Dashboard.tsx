import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Trophy, Target, TrendingUp, ShoppingBag, FileText, ArrowRight, PlayCircle, Award, Zap, History, Users, CheckCircle, Newspaper } from "lucide-react";
import { useAuth } from "../../components/AuthProvider";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";

interface Batch {
  id: string;
  name: string;
  description: string;
  price: number;
  total_tests: number;
  exam_type: string;
}

interface Purchase {
  id: string;
  batch_id: string;
  purchased_at: string;
  batches: Batch;
}

export function UserDashboard() {
  const { user } = useAuth();
  const [availableBatches, setAvailableBatches] = useState<Batch[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [completedTests, setCompletedTests] = useState<number>(0);
  const [overallRank, setOverallRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: batchData } = await supabase.from("batches").select("*").eq("is_active", true);
      setAvailableBatches(batchData || []);
      const { data: purchaseData } = await supabase.from("purchases").select("*, batches(*)").eq("user_id", user?.id);
      setPurchases(purchaseData || []);
      
      // Fetch completed tests count
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("test_attempts")
        .select("id, user_id, score, total_marks")
        .eq("user_id", user?.id);
      
      if (!attemptsError && attemptsData) {
        setCompletedTests(attemptsData.length);
      }

      // Calculate overall rank
      const { data: allAttempts, error: allAttemptsError } = await supabase
        .from("test_attempts")
        .select("user_id, score, total_marks");
      
      if (!allAttemptsError && allAttempts) {
        // Calculate total score for each user
        const userScores: Record<string, { totalScore: number; totalMarks: number; count: number }> = {};
        allAttempts.forEach((attempt: any) => {
          const uid = attempt.user_id;
          if (!userScores[uid]) {
            userScores[uid] = { totalScore: 0, totalMarks: 0, count: 0 };
          }
          userScores[uid].totalScore += attempt.score || 0;
          userScores[uid].totalMarks += attempt.total_marks || 100;
          userScores[uid].count += 1;
        });

        // Calculate average accuracy for each user and sort
        const rankedUsers = Object.entries(userScores)
          .map(([uid, data]) => ({
            userId: uid,
            accuracy: data.totalMarks > 0 ? (data.totalScore / data.totalMarks) * 100 : 0,
            count: data.count
          }))
          .sort((a, b) => b.accuracy - a.accuracy);

        // Find current user's rank
        const userRankIndex = rankedUsers.findIndex(u => u.userId === user?.id);
        setOverallRank(userRankIndex >= 0 ? userRankIndex + 1 : null);
      }
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const purchasedBatchIds = purchases.map((p) => p.batch_id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.user_metadata?.name || user?.email?.split("@")[0]}! 👋
          </h1>
          <p className="text-slate-500">Here's your preparation overview.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0"><ShoppingBag className="h-6 w-6" /></div>
            <div className="flex flex-col justify-center min-w-0">
              <p className="text-sm font-medium text-slate-500">Purchased Batches</p>
              <h3 className="text-2xl font-bold text-slate-900 leading-tight">{purchases.length}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0"><Target className="h-6 w-6" /></div>
            <div className="flex flex-col justify-center min-w-0">
              <p className="text-sm font-medium text-slate-500">Tests Completed</p>
              <h3 className="text-2xl font-bold text-slate-900 leading-tight">{completedTests}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600 flex-shrink-0"><Award className="h-6 w-6" /></div>
            <div className="flex flex-col justify-center min-w-0">
              <p className="text-sm font-medium text-slate-500">Overall Rank</p>
              <h3 className="text-2xl font-bold text-slate-900 leading-tight">{overallRank ? `#${overallRank}` : "-"}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0"><Trophy className="h-6 w-6" /></div>
            <div className="flex flex-col justify-center min-w-0">
              <p className="text-sm font-medium text-slate-500">Tests Available</p>
              <h3 className="text-2xl font-bold text-slate-900 leading-tight">{purchases.reduce((acc, p) => acc + (p.batches?.total_tests || 0), 0)}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0"><CheckCircle className="h-6 w-6" /></div>
            <div className="flex flex-col justify-center min-w-0">
              <p className="text-sm font-medium text-slate-500">Available Batches</p>
              <h3 className="text-2xl font-bold text-slate-900 leading-tight">{availableBatches.length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Current Affairs Quick Link */}
      <div className="mb-6">
        <Link
          to="/current-affairs"
          className="flex items-center gap-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
        >
          <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">
            <Newspaper className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">Current Affairs</h3>
            <p className="text-white/80">Stay updated with the latest news and events</p>
          </div>
          <ArrowRight className="h-6 w-6" />
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">

        {/* Purchased Batches */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-indigo-600" /> My Purchased Tests
          </h2>
          {purchases.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">You have not purchased any batches yet.</p>
              <Link to="/pricing" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">Browse Plans →</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-indigo-200 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{purchase.batches?.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{purchase.batches?.exam_type} • {purchase.batches?.total_tests} tests</p>
                    </div>
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">Active</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{purchase.batches?.description}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Link
                      to={`/test/${purchase.batch_id}`}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <PlayCircle className="h-4 w-4" /> Start
                    </Link>
                    <Link
                      to={`/batch/${purchase.batch_id}/live-tests`}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Users className="h-4 w-4" /> Compete
                    </Link>
                    <Link
                      to={`/batch/${purchase.batch_id}/previous-year-papers`}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <History className="h-4 w-4" /> PYQ
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Available Batches */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" /> Available Test Batches
          </h2>
          <div className="space-y-4">
            {availableBatches.map((batch) => {
              const isPurchased = purchasedBatchIds.includes(batch.id);
              return (
                <div key={batch.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">{batch.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{batch.exam_type} • {batch.total_tests} tests</p>
                    </div>
                    <span className="text-lg font-bold text-indigo-600">₹{batch.price}</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{batch.description}</p>
                  {isPurchased ? (
                    <Link
                      to={`/test/${batch.id}`}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <PlayCircle className="h-4 w-4" /> Start Test
                    </Link>
                  ) : (
                    <Link to={`/checkout/${batch.id}`} className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                      Buy Now
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
