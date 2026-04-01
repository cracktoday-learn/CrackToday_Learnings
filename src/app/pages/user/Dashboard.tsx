import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Trophy, Target, TrendingUp, ShoppingBag, FileText, ArrowRight, PlayCircle, Award, Zap, History, Users, CheckCircle, Newspaper, Flame, Clock, AlertTriangle, BarChart3, Share2, Smartphone, MessageCircle } from "lucide-react";
import { useAuth } from "../../components/AuthProvider";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Batch {
  id: string;
  name: string;
  description: string;
  price: number;
  total_tests: number;
  exam_type: string;
}

interface WeakArea {
  subject: string;
  accuracy: number;
  status: 'critical' | 'warning' | 'good';
}

interface DailyChallenge {
  questions: number;
  timeMinutes: number;
  liveUsers: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cutoff: number;
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

  const [streak, setStreak] = useState(7);
  const [yesterdayRank, setYesterdayRank] = useState(2345);
  const [accuracy, setAccuracy] = useState(72);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([
    { subject: 'Polity', accuracy: 45, status: 'critical' },
    { subject: 'Economy', accuracy: 62, status: 'warning' },
    { subject: 'History', accuracy: 78, status: 'good' },
    { subject: 'Geography', accuracy: 85, status: 'good' },
  ]);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge>({
    questions: 20,
    timeMinutes: 15,
    liveUsers: 12543,
    difficulty: 'Medium',
    cutoff: 65,
  });

  const handleShareRank = () => {
    const rank = overallRank || 2345;
    const text = `🔥 I just ranked #${rank} on CrackToday!\n\n📊 Accuracy: ${accuracy}%\n🔥 Streak: ${streak} days\n\nCan you beat my score? Join now! 👇\nhttps://cracktoday.com`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My CrackToday Rank',
        text: text,
      });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Rank copied to clipboard!');
    }
  };

  const handleShareWhatsApp = () => {
    const rank = overallRank || 2345;
    const text = encodeURIComponent(`🔥 I just ranked #${rank} on CrackToday!\n\n📊 Accuracy: ${accuracy}%\n🔥 Streak: ${streak} days\n\nCan you beat my score? Join now! 👇\nhttps://cracktoday.com`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

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

      {/* Today's Challenge - Top Hook Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-6 w-6 text-yellow-300" />
                <span className="text-yellow-300 font-bold">Today's Challenge</span>
              </div>
              <h2 className="text-2xl font-bold">{dailyChallenge.questions} Questions Challenge</h2>
              <p className="text-white/80">Test your knowledge with daily practice</p>
            </div>
            <div className="flex items-center gap-4 bg-white/10 rounded-xl px-4 py-2">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-300" />
                <span className="font-bold">{dailyChallenge.timeMinutes} mins</span>
              </div>
              <div className="w-px h-6 bg-white/20" />
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-300" />
                <span className="font-medium">{dailyChallenge.liveUsers.toLocaleString()} attempting</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-white/70 mb-1">Difficulty</p>
              <p className="font-semibold">{dailyChallenge.difficulty}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-white/70 mb-1">Expected Cutoff</p>
              <p className="font-semibold">{dailyChallenge.cutoff}%</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-white/70 mb-1">Questions</p>
              <p className="font-semibold">{dailyChallenge.questions}</p>
            </div>
          </div>
          
          <Link 
            to="/tests"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-yellow-50 transition-colors shadow-lg"
          >
            <PlayCircle className="h-5 w-5" />
            Start Now
          </Link>
        </div>
      </motion.div>

      {/* Addiction Loop - Streak, Rank, Accuracy */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" /> Your Progress
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center text-white">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Streak</p>
                  <p className="text-2xl font-bold text-slate-900">{streak} Days 🔥</p>
                </div>
              </div>
              <p className="text-xs text-orange-600">Keep it up!</p>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Rank (Yesterday)</p>
                  <p className="text-2xl font-bold text-slate-900">#{yesterdayRank}</p>
                </div>
              </div>
              <p className="text-xs text-indigo-600">/ 50,000 participants</p>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Accuracy</p>
                  <p className="text-2xl font-bold text-slate-900">{accuracy}%</p>
                </div>
              </div>
              <p className="text-xs text-emerald-600">Improving!</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Weak Areas - Retention Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> Weak Areas to Improve
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {weakAreas.map((area) => (
              <div 
                key={area.subject}
                className={`rounded-xl p-4 border ${
                  area.status === 'critical' ? 'bg-red-50 border-red-200' :
                  area.status === 'warning' ? 'bg-amber-50 border-amber-200' :
                  'bg-emerald-50 border-emerald-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-slate-900">{area.subject}</span>
                  {area.status === 'critical' && <span className="text-red-500">❌</span>}
                  {area.status === 'warning' && <span className="text-amber-500">⚠️</span>}
                  {area.status === 'good' && <span className="text-emerald-500">✅</span>}
                </div>
                <div className="w-full bg-white rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full ${
                      area.status === 'critical' ? 'bg-red-500' :
                      area.status === 'warning' ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${area.accuracy}%` }}
                  />
                </div>
                <p className="text-sm text-slate-600">{area.accuracy}% accuracy</p>
              </div>
            ))}
          </div>
          <Link 
            to="/tests"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            <PlayCircle className="h-5 w-5" />
            Improve Now → Auto Test
          </Link>
        </div>
      </motion.div>

      {/* Share Rank Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Share2 className="h-6 w-6" /> Share Your Achievement!
              </h3>
              <p className="text-white/80">
                Rank: #{overallRank || 2345} • Accuracy: {accuracy}% • Streak: {streak} days 🔥
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleShareWhatsApp}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-semibold transition-colors"
              >
                <MessageCircle className="h-5 w-5" /> WhatsApp
              </button>
              <button 
                onClick={handleShareRank}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-semibold transition-colors"
              >
                <Share2 className="h-5 w-5" /> Share
              </button>
            </div>
          </div>
        </div>
      </motion.div>

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
                  <div className="grid grid-cols-3 gap-2 relative z-10">
                    <Link
                      to={`/test/${purchase.batch_id}`}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1 relative z-10"
                    >
                      <PlayCircle className="h-4 w-4" /> Start
                    </Link>
                    <Link
                      to={`/batch/${purchase.batch_id}/live-tests`}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1 relative z-10"
                    >
                      <Users className="h-4 w-4" /> Compete
                    </Link>
                    <Link
                      to={`/batch/${purchase.batch_id}/previous-year-papers`}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1 relative z-10"
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
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 relative z-10"
                    >
                      <PlayCircle className="h-4 w-4" /> Start Test
                    </Link>
                  ) : (
                    <Link to={`/checkout/${batch.id}`} className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 relative z-10">
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
