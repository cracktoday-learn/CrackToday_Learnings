import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Trophy, Medal, Clock, ArrowLeft, Target } from "lucide-react";
import { useAuth } from "../../components/AuthProvider";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";

interface LeaderboardEntry {
  user_id: string;
  email: string;
  name: string;
  score: number;
  total_marks: number;
  correct_answers: number;
  wrong_answers: number;
  time_taken: number;
  percentage: number;
  rank: number;
}

export function Leaderboard() {
  const { batchId } = useParams();
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [batchName, setBatchName] = useState("");
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    fetchBatch();
    fetchLeaderboard();
  }, [batchId]);

  const fetchBatch = async () => {
    const { data } = await supabase.from("batches").select("name").eq("id", batchId).single();
    setBatchName(data?.name || "");
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .eq("batch_id", batchId)
        .order("rank", { ascending: true })
        .limit(50);

      if (error) throw error;
      setEntries(data || []);

      const myRank = data?.find((e) => e.user_id === user?.id);
      setUserRank(myRank || null);
    } catch (err) {
      toast.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return "bg-amber-50 border-amber-200";
    if (rank === 2) return "bg-slate-50 border-slate-200";
    if (rank === 3) return "bg-orange-50 border-orange-200";
    return "bg-white border-slate-200";
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
          <Trophy className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leaderboard</h1>
          <p className="text-sm text-slate-500">{batchName}</p>
        </div>
      </div>

      {/* My Rank Card */}
      {userRank && (
        <div className="bg-indigo-600 rounded-2xl p-5 mb-6 text-white">
          <p className="text-indigo-200 text-sm mb-1">Your Position</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold">{getRankIcon(userRank.rank)}</span>
              <div>
                <p className="font-bold text-lg">{userRank.name || userRank.email?.split("@")[0]}</p>
                <p className="text-indigo-200 text-sm">{userRank.score} / {userRank.total_marks} marks</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{userRank.percentage}%</p>
              <p className="text-indigo-200 text-sm">{formatTime(userRank.time_taken)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* 2nd place */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center mt-6">
            <div className="text-3xl mb-2">🥈</div>
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm mx-auto mb-2">
              {(entries[1]?.name || entries[1]?.email)?.charAt(0).toUpperCase()}
            </div>
            <p className="text-xs font-bold text-slate-900 truncate">{entries[1]?.name || entries[1]?.email?.split("@")[0]}</p>
            <p className="text-sm font-bold text-indigo-600 mt-1">{entries[1]?.percentage}%</p>
          </div>
          {/* 1st place */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center shadow-lg">
            <div className="text-3xl mb-2">🥇</div>
            <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-bold text-sm mx-auto mb-2">
              {(entries[0]?.name || entries[0]?.email)?.charAt(0).toUpperCase()}
            </div>
            <p className="text-xs font-bold text-slate-900 truncate">{entries[0]?.name || entries[0]?.email?.split("@")[0]}</p>
            <p className="text-sm font-bold text-indigo-600 mt-1">{entries[0]?.percentage}%</p>
          </div>
          {/* 3rd place */}
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center mt-6">
            <div className="text-3xl mb-2">🥉</div>
            <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-800 font-bold text-sm mx-auto mb-2">
              {(entries[2]?.name || entries[2]?.email)?.charAt(0).toUpperCase()}
            </div>
            <p className="text-xs font-bold text-slate-900 truncate">{entries[2]?.name || entries[2]?.email?.split("@")[0]}</p>
            <p className="text-sm font-bold text-indigo-600 mt-1">{entries[2]?.percentage}%</p>
          </div>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Top 50 Rankings</h2>
          <span className="text-sm text-slate-500">{entries.length} participants</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No attempts yet.</p>
            <p className="text-slate-400 text-xs mt-1">Be the first to take this test!</p>
            <Link to={`/test/${batchId}`} className="mt-4 inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
              Take Test Now
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {entries.map((entry) => (
              <div
                key={`${entry.user_id}-${entry.rank}`}
                className={`flex items-center gap-4 px-5 py-4 ${entry.user_id === user?.id ? "bg-indigo-50 border-l-4 border-indigo-600" : "hover:bg-slate-50"} transition-colors`}
              >
                {/* Rank */}
                <div className="w-10 text-center">
                  <span className={`text-sm font-bold ${entry.rank <= 3 ? "text-lg" : "text-slate-500"}`}>
                    {getRankIcon(entry.rank)}
                  </span>
                </div>

                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  entry.rank === 1 ? "bg-amber-200 text-amber-800" :
                  entry.rank === 2 ? "bg-slate-200 text-slate-700" :
                  entry.rank === 3 ? "bg-orange-200 text-orange-800" :
                  "bg-indigo-100 text-indigo-700"
                }`}>
                  {(entry.name || entry.email)?.charAt(0).toUpperCase()}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {entry.name || entry.email?.split("@")[0]}
                    {entry.user_id === user?.id && (
                      <span className="ml-2 text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">You</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1"><Target className="h-3 w-3" />{entry.correct_answers} correct</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(entry.time_taken)}</span>
                  </p>
                </div>

                {/* Score */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-slate-900">{entry.score}/{entry.total_marks}</p>
                  <p className={`text-xs font-bold ${entry.percentage >= 80 ? "text-emerald-600" : entry.percentage >= 60 ? "text-indigo-600" : "text-red-500"}`}>
                    {entry.percentage}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
