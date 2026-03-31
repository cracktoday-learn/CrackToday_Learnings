import { useState, useEffect } from "react";
import { Trophy, Medal, Award, TrendingUp, Users, Clock, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../../../utils/supabase/client";
import { useAuth } from "../../components/AuthProvider";
import { toast } from "sonner";

// DUMMY DATA - Replace with real data from Supabase when you have users
const DUMMY_RANKINGS = [
  { id: "1", rank: 1, name: "Rahul Kumar", score: 95, totalMarks: 100, accuracy: 95, timeTaken: 1800, testsCompleted: 15, avatar: "RK", date: new Date().toISOString() },
  { id: "2", rank: 2, name: "Priya Sharma", score: 92, totalMarks: 100, accuracy: 92, timeTaken: 1950, testsCompleted: 12, avatar: "PS", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "3", rank: 3, name: "Amit Patel", score: 89, totalMarks: 100, accuracy: 89, timeTaken: 2100, testsCompleted: 18, avatar: "AP", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "4", rank: 4, name: "Sneha Gupta", score: 87, totalMarks: 100, accuracy: 87, timeTaken: 1750, testsCompleted: 10, avatar: "SG", date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "5", rank: 5, name: "Vikram Singh", score: 85, totalMarks: 100, accuracy: 85, timeTaken: 2200, testsCompleted: 14, avatar: "VS", date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "6", rank: 6, name: "Neha Reddy", score: 83, totalMarks: 100, accuracy: 83, timeTaken: 2000, testsCompleted: 11, avatar: "NR", date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "7", rank: 7, name: "Arjun Nair", score: 81, totalMarks: 100, accuracy: 81, timeTaken: 1850, testsCompleted: 16, avatar: "AN", date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "8", rank: 8, name: "Divya Iyer", score: 79, totalMarks: 100, accuracy: 79, timeTaken: 2050, testsCompleted: 9, avatar: "DI", date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "9", rank: 9, name: "Karan Mehta", score: 77, totalMarks: 100, accuracy: 77, timeTaken: 2150, testsCompleted: 13, avatar: "KM", date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "10", rank: 10, name: "Ananya Bose", score: 75, totalMarks: 100, accuracy: 75, timeTaken: 1900, testsCompleted: 8, avatar: "AB", date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() },
];

interface RankingUser {
  id: string;
  rank: number;
  name: string;
  score: number;
  totalMarks: number;
  accuracy: number;
  timeTaken: number;
  testsCompleted: number;
  avatar: string;
  avatarUrl?: string | null;
  date?: string;
}

export function Rankings() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<RankingUser[]>(DUMMY_RANKINGS);
  const [useRealData, setUseRealData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data && !error);
    } catch {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    if (useRealData) {
      fetchRealRankings();
    } else {
      setRankings(DUMMY_RANKINGS);
    }
  }, [useRealData, timeFilter]);

  const fetchRealRankings = async () => {
    setLoading(true);
    try {
      // Fetch test attempts with user profile data including avatar_url
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("test_attempts")
        .select("*")
        .order("score", { ascending: false })
        .limit(100);
      
      if (attemptsError) throw attemptsError;
      
      // Get unique user IDs to fetch their profiles
      const userIds = [...new Set(attemptsData?.map(a => a.user_id) || [])];
      
      // Fetch profiles for avatar URLs
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, avatar_url")
        .in("id", userIds);
      
      // Create a map of user_id to avatar_url
      const avatarMap = new Map();
      profilesData?.forEach(profile => {
        avatarMap.set(profile.id, profile.avatar_url);
      });
      
      // Process and rank the data with avatar URLs
      const processed = attemptsData?.map((attempt, index) => ({
        id: attempt.user_id,
        rank: index + 1,
        name: `User ${attempt.user_id?.slice(0, 8)}`,
        score: attempt.score,
        totalMarks: attempt.total_marks || 100,
        accuracy: Math.round((attempt.score / (attempt.total_marks || 100)) * 100),
        timeTaken: attempt.time_taken || 1800,
        testsCompleted: 1,
        avatar: `U${index + 1}`,
        avatarUrl: avatarMap.get(attempt.user_id) || null,
        date: attempt.created_at,
      })) || [];
      
      setRankings(processed);
    } catch (err: any) {
      console.error("Failed to fetch rankings:", err);
      toast.error("Failed to load real data");
      setError(err?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Filter rankings based on time filter
  const filteredRankings = (() => {
    if (timeFilter === "all") return rankings;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    if (timeFilter === "weekly") {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (timeFilter === "monthly") {
      cutoffDate.setDate(now.getDate() - 30);
    }
    
    return rankings.filter(user => {
      if (!user.date) return true;
      return new Date(user.date) >= cutoffDate;
    });
  })();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case 2: return "bg-gray-100 text-gray-700 border-gray-300";
      case 3: return "bg-orange-100 text-orange-700 border-orange-300";
      default: return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5" />;
      case 2: return <Medal className="h-5 w-5" />;
      case 3: return <Award className="h-5 w-5" />;
      default: return <span className="text-sm font-bold">#{rank}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
            <TrendingUp className="h-4 w-4" />
            Live Rankings
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Performance Rankings
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            See how you stack up against other students. Complete more tests to climb the leaderboard!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Students</p>
                <p className="text-xl font-bold text-slate-900">1,247</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Tests Taken</p>
                <p className="text-xl font-bold text-slate-900">5,832</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Trophy className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Top Score</p>
                <p className="text-xl font-bold text-slate-900">95%</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Avg Time</p>
                <p className="text-xl font-bold text-slate-900">32m</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Data Toggle */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
            {["all", "weekly", "monthly"].map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeFilter === filter
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Toggle for real vs dummy data - Only visible to admins */}
          {isAdmin && (
            <button
              onClick={() => setUseRealData(!useRealData)}
              className="text-sm text-slate-500 hover:text-indigo-600 underline"
            >
              {useRealData ? "Using Real Data" : "Using Dummy Data (Click to switch)"}
            </button>
          )}
        </div>

        {/* Rankings Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Top 3 Podium */}
          <div className="bg-gradient-to-b from-indigo-50 to-white p-6">
            <div className="flex justify-center items-end gap-4 md:gap-8">
              {filteredRankings.slice(0, 3).map((user, index) => {
                const heights = ["h-32", "h-40", "h-28"];
                const positions = [2, 1, 3];
                const actualIndex = index === 0 ? 1 : index === 1 ? 0 : 2;
                const userAtPos = filteredRankings[actualIndex];
                
                if (!userAtPos) return null;
                
                return (
                  <div key={userAtPos.id} className="flex flex-col items-center">
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full ${getRankColor(positions[actualIndex])} border-4 flex items-center justify-center mb-2 overflow-hidden`}>
                      {userAtPos.avatarUrl ? (
                        <img src={userAtPos.avatarUrl} alt={userAtPos.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg md:text-xl font-bold">{userAtPos.avatar}</span>
                      )}
                    </div>
                    <div className="text-center mb-2">
                      <p className="font-semibold text-slate-900 text-sm md:text-base">{userAtPos.name}</p>
                      <p className="text-indigo-600 font-bold">{userAtPos.accuracy}%</p>
                    </div>
                    <div className={`${heights[actualIndex]} w-20 md:w-28 ${getRankColor(positions[actualIndex]).split(" ")[0]} rounded-t-lg flex items-center justify-center border-t-4 ${getRankColor(positions[actualIndex]).split(" ")[2]}`}>
                      {getRankIcon(positions[actualIndex])}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* List View */}
          <div className="divide-y divide-slate-100">
            {filteredRankings.slice(3).map((user) => (
              <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.avatar
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{user.name}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>Rank #{user.rank}</span>
                    <span>•</span>
                    <span>{user.testsCompleted} tests</span>
                    <span>•</span>
                    <span>{formatTime(user.timeTaken)} avg</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-indigo-600">{user.accuracy}%</p>
                  <p className="text-xs text-slate-500">{user.score}/{user.totalMarks} marks</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 mb-4">Want to see your name on the leaderboard?</p>
          <Link
            to="/exams"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Take a Test Now
            <TrendingUp className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
