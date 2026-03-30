import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trophy, Clock, CheckCircle, AlertCircle, ArrowRight, Users, Target, TrendingUp, Star } from "lucide-react";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";

interface TestAttempt {
  id: string;
  user_id: string;
  batch_id: string;
  test_number: number;
  score: number;
  total_marks: number;
  correct_answers: number;
  wrong_answers: number;
  skipped: number;
  time_taken: number;
  answers: Record<string, string>;
  created_at: string;
  users: {
    email: string;
    user_metadata: {
      name?: string;
    };
  };
}

interface Test {
  id: string;
  batch_id: string;
  name: string;
  test_number: number;
  time_duration: number;
  question_count: number;
}

interface Batch {
  id: string;
  name: string;
  total_tests: number;
}

export function TestEvaluation() {
  const { batchId, testNumber } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [userAttempt, setUserAttempt] = useState<TestAttempt | null>(null);
  const [allAttempts, setAllAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number>(0);

  useEffect(() => {
    fetchData();
  }, [batchId, testNumber]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!batchId || !testNumber) return;
      
      // Fetch batch info
      const { data: batchData } = await supabase.from("batches").select("id,name,total_tests").eq("id", batchId).single();
      setBatch(batchData);

      // Fetch test info
      const { data: testData } = await supabase.from("tests").select("*").eq("batch_id", batchId).eq("test_number", parseInt(testNumber)).single();
      setTest(testData);

      // Fetch current user's attempt
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userAttemptData } = await supabase
          .from("test_attempts")
          .select("*")
          .eq("batch_id", batchId)
          .eq("test_number", parseInt(testNumber))
          .eq("user_id", user.id)
          .single();
        setUserAttempt(userAttemptData);
      }

      // Fetch all attempts for ranking
      const { data: attemptsData } = await supabase
        .from("test_attempts")
        .select("*")
        .eq("batch_id", batchId)
        .eq("test_number", parseInt(testNumber))
        .order("score", { ascending: false })
        .order("time_taken", { ascending: true });

      if (attemptsData) {
        setAllAttempts(attemptsData);
        const rank = attemptsData.findIndex(attempt => attempt.user_id === user?.id) + 1;
        setUserRank(rank);
      }
    } catch (err) {
      toast.error("Failed to load evaluation data");
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
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-slate-600">#{rank}</span>;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-50 border-yellow-200 text-yellow-700";
    if (rank === 2) return "bg-gray-50 border-gray-200 text-gray-700";
    if (rank === 3) return "bg-amber-50 border-amber-200 text-amber-700";
    return "bg-slate-50 border-slate-200 text-slate-700";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!userAttempt || !batch || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Test Not Found</h2>
          <p className="text-slate-500 mb-4">The test evaluation could not be loaded.</p>
          <button onClick={() => navigate("/dashboard")} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const percentage = Math.round((userAttempt.score / userAttempt.total_marks) * 100);
  const isLastTest = parseInt(testNumber || "0") === batch.total_tests;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{test.name}</h1>
          <p className="text-slate-500">Test {testNumber} of {batch.total_tests} in {batch.name}</p>
        </div>

        {/* User Performance Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="text-center mb-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${percentage >= 60 ? "bg-emerald-100" : "bg-red-100"}`}>
              {percentage >= 60
                ? <CheckCircle className="h-12 w-12 text-emerald-600" />
                : <AlertCircle className="h-12 w-12 text-red-600" />}
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-2">{percentage}%</h2>
            <p className="text-xl text-slate-600">{userAttempt.score} / {userAttempt.total_marks} marks</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              {getRankIcon(userRank)}
              <span className="text-lg font-semibold text-slate-700">Your Rank: {userRank}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-emerald-50 rounded-xl">
              <p className="text-2xl font-bold text-emerald-600">{userAttempt.correct_answers}</p>
              <p className="text-xs text-slate-600 mt-1">Correct</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <p className="text-2xl font-bold text-red-600">{userAttempt.wrong_answers}</p>
              <p className="text-xs text-slate-600 mt-1">Wrong</p>
            </div>
            <div className="text-center p-4 bg-slate-100 rounded-xl">
              <p className="text-2xl font-bold text-slate-600">{userAttempt.skipped}</p>
              <p className="text-xs text-slate-600 mt-1">Skipped</p>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-xl">
              <p className="text-2xl font-bold text-indigo-600">{formatTime(userAttempt.time_taken)}</p>
              <p className="text-xs text-slate-600 mt-1">Time Taken</p>
            </div>
          </div>
        </div>

        {/* Ranking Leaderboard */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="h-6 w-6 text-indigo-600" />
            <h3 className="text-xl font-bold text-slate-900">Performance Rankings</h3>
          </div>
          
          <div className="space-y-3">
            {allAttempts.slice(0, 10).map((attempt, index) => (
              <div key={attempt.id} className={`flex items-center justify-between p-4 rounded-xl border ${attempt.user_id === userAttempt?.user_id ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-slate-200"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRankColor(index + 1)}`}>
                    {getRankIcon(index + 1)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      User {attempt.user_id?.slice(0, 8)}
                      {attempt.user_id === userAttempt?.user_id && <span className="ml-2 text-xs bg-indigo-600 text-white px-2 py-1 rounded-full">You</span>}
                    </p>
                    <p className="text-sm text-slate-500">{Math.round((attempt.score / attempt.total_marks) * 100)}% • {formatTime(attempt.time_taken)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{attempt.score}/{attempt.total_marks}</p>
                  <p className="text-xs text-slate-500">{attempt.correct_answers} correct</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex gap-4">
            {!isLastTest ? (
              <>
                <button
                  onClick={() => navigate(`/test/${batchId}`)}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  Start Next Test ({parseInt(testNumber || "0") + 1}/{batch.total_tests})
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Back to Dashboard
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Trophy className="h-4 w-4" />
                  Complete Batch
                </button>
                <button
                  onClick={() => navigate(`/test/${batchId}/summary`)}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  View Batch Summary
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
