import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../utils/supabase/client";
import { useAuth } from "../../components/AuthProvider";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  Trophy, 
  Clock, 
  Target, 
  Users, 
  ArrowLeft,
  Medal,
  CheckCircle,
  XCircle
} from "lucide-react";

interface ParticipantResult {
  id: string;
  user_id: string;
  profile?: {
    name: string;
    email: string;
  };
  score: number;
  correct_answers: number;
  wrong_answers: number;
  time_taken_seconds: number;
  status: string;
}

interface LiveTest {
  id: string;
  batch_id: string;
  test_number: number;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
}

export function LiveTestResults() {
  const { liveTestId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liveTest, setLiveTest] = useState<LiveTest | null>(null);
  const [results, setResults] = useState<ParticipantResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [myResult, setMyResult] = useState<ParticipantResult | null>(null);

  useEffect(() => {
    fetchResults();
  }, [liveTestId]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      // Get live test details
      const { data: test, error: testError } = await supabase
        .from("live_tests")
        .select("*")
        .eq("id", liveTestId)
        .single();

      if (testError) throw testError;
      setLiveTest(test);

      // Get all participants results with profiles
      const { data: participants, error: partsError } = await supabase
        .from("live_test_participants")
        .select(`
          *,
          profile:profiles(name, email)
        `)
        .eq("live_test_id", liveTestId)
        .eq("status", 'completed')
        .order("score", { ascending: false });

      if (partsError) throw partsError;

      // Sort by score (desc) then by time (asc) - higher score first, if tied, faster time wins
      const sortedResults = (participants || []).sort((a: any, b: any) => {
        if (b.score !== a.score) return b.score - a.score;
        return (a.time_taken_seconds || 0) - (b.time_taken_seconds || 0);
      });

      setResults(sortedResults);

      // Find my result
      const myRes = sortedResults.find((p: any) => p.user_id === user?.id);
      setMyResult(myRes || null);
    } catch (err) {
      toast.error("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "from-yellow-400 to-amber-500";
    if (rank === 2) return "from-slate-300 to-slate-400";
    if (rank === 3) return "from-orange-400 to-orange-500";
    return "from-indigo-400 to-purple-500";
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return <Medal className="h-6 w-6" />;
    return <Trophy className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  const myRank = results.findIndex(r => r.user_id === user?.id) + 1;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button 
            onClick={() => navigate(`/batch/${liveTest?.batch_id}/live-tests`)}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Live Tests
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-slate-900">Competition Results</h1>
          </div>
          <p className="text-slate-500">
            Live Test #{liveTest?.test_number} • {results.length} participants
          </p>
        </motion.div>

        {/* My Result Card (if participated) */}
        {myResult && (
          <motion.div 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white mb-8 shadow-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 mb-1">Your Rank</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">#{myRank}</span>
                  <span className="text-indigo-100">of {results.length}</span>
                </div>
              </div>
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getRankColor(myRank)} flex items-center justify-center shadow-lg`}>
                {getRankIcon(myRank)}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
              <div>
                <p className="text-2xl font-bold">{myResult.score}</p>
                <p className="text-indigo-100 text-sm">Score</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{myResult.correct_answers}/{myResult.correct_answers + myResult.wrong_answers}</p>
                <p className="text-indigo-100 text-sm">Correct</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{formatTime(myResult.time_taken_seconds)}</p>
                <p className="text-indigo-100 text-sm">Time Taken</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Leaderboard */}
        <motion.div 
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Leaderboard
            </h2>
          </div>
          
          <div className="divide-y divide-slate-100">
            {results.map((result, index) => {
              const rank = index + 1;
              const isMe = result.user_id === user?.id;
              
              return (
                <motion.div
                  key={result.id}
                  className={`p-4 flex items-center gap-4 ${isMe ? 'bg-indigo-50' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Rank */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                    rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                    rank === 2 ? 'bg-slate-100 text-slate-700' :
                    rank === 3 ? 'bg-orange-100 text-orange-700' :
                    'bg-indigo-100 text-indigo-700'
                  }`}>
                    {rank <= 3 ? <Medal className="h-5 w-5" /> : rank}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">
                        {result.profile?.name || 'Anonymous'}
                      </p>
                      {isMe && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {result.score} points
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        {result.correct_answers} correct
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle className="h-4 w-4 text-red-500" />
                        {result.wrong_answers} wrong
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTime(result.time_taken_seconds)}
                      </span>
                    </div>
                  </div>

                  {/* Score Badge */}
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      result.score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                      result.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                      result.score >= 40 ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {result.score}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          className="flex gap-4 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate(`/batch/${liveTest?.batch_id}/live-tests`)}
            className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-semibold transition-colors"
          >
            More Live Tests
          </button>
        </motion.div>
      </div>
    </div>
  );
}
