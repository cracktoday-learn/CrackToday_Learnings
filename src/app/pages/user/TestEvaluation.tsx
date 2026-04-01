import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Trophy, Clock, CheckCircle, AlertCircle, ArrowRight, Users, Target, TrendingUp, Star, Share2, MessageCircle, RotateCcw, BookOpen, Flame, BarChart3, Zap } from "lucide-react";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

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

interface Question {
  id: string;
  question: string;
  type: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  marks: number;
  negative_marks: number;
}

interface SmartInsight {
  subject: string;
  lostMarks: number;
  suggestion: string;
  severity: 'high' | 'medium' | 'low';
}

interface SubjectPerformance {
  subject: string;
  correct: number;
  total: number;
  accuracy: number;
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
  const [allAttempts, setAllAttempts] = useState<any[]>([]);
  const [userNames, setUserNames] = useState<{[key: string]: string}>({});
  const [userRank, setUserRank] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showReattempt, setShowReattempt] = useState(false);
  const [wrongQuestions, setWrongQuestions] = useState<Question[]>([]);
  const [reattemptLoading, setReattemptLoading] = useState(false);

  const [smartInsights, setSmartInsights] = useState<SmartInsight[]>([
    { subject: 'Polity', lostMarks: 15, suggestion: 'Revise Fundamental Rights', severity: 'high' },
    { subject: 'Economy', lostMarks: 8, suggestion: 'Practice Budget concepts', severity: 'medium' },
  ]);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([
    { subject: 'Polity', correct: 3, total: 10, accuracy: 30 },
    { subject: 'Economy', correct: 5, total: 8, accuracy: 62 },
    { subject: 'History', correct: 7, total: 9, accuracy: 78 },
    { subject: 'Geography', correct: 8, total: 10, accuracy: 80 },
    { subject: 'Science', correct: 6, total: 8, accuracy: 75 },
  ]);

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
        const { data: userAttemptData, error: userAttemptError } = await supabase
          .from("test_attempts")
          .select("*")
          .eq("batch_id", batchId)
          .eq("test_number", parseInt(testNumber))
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();
        if (userAttemptError) {
          console.error("User attempt fetch error:", userAttemptError);
        }
        setUserAttempt(userAttemptData);
      }

      // Fetch all attempts for ranking
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("test_attempts")
        .select("*")
        .eq("batch_id", batchId)
        .eq("test_number", parseInt(testNumber))
        .order("score", { ascending: false })
        .order("time_taken", { ascending: true });
      
      if (attemptsError) {
        console.error("All attempts fetch error:", attemptsError);
      }

      if (attemptsData) {
        setAllAttempts(attemptsData);
        const rank = attemptsData.findIndex(attempt => attempt.user_id === user?.id) + 1;
        setUserRank(rank);
        
        // Fetch user names for all attempts
        const uniqueUserIds = [...new Set(attemptsData.map(a => a.user_id))];
        const namesMap: {[key: string]: string} = {};
        
        for (const userId of uniqueUserIds) {
          try {
            const { data: userData } = await supabase
              .from("profiles")
              .select("name, email")
              .eq("id", userId)
              .maybeSingle();
            if (userData) {
              namesMap[userId] = userData.name || userData.email?.split("@")[0] || `User ${userId.slice(0, 8)}`;
            } else {
              namesMap[userId] = `User ${userId.slice(0, 8)}`;
            }
          } catch {
            namesMap[userId] = `User ${userId.slice(0, 8)}`;
          }
        }
        setUserNames(namesMap);
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

  const handleReattemptWrong = async () => {
    if (!userAttempt?.wrong_answers || userAttempt.wrong_answers === 0) {
      toast.success('Great job! You got all questions correct!');
      return;
    }
    
    setReattemptLoading(true);
    try {
      const { data: questionsData, error } = await supabase
        .from('questions')
        .select('*')
        .eq('batch_id', batchId)
        .eq('test_number', parseInt(testNumber || '1'));
      
      if (error) throw error;
      
      const wrongQs = (questionsData || []).filter((q: Question) => {
        const userAnswer = userAttempt.answers[q.id];
        return userAnswer && userAnswer !== q.correct_answer;
      });
      
      if (wrongQs.length === 0) {
        toast.success('No wrong questions found!');
        return;
      }
      
      setWrongQuestions(wrongQs);
      setShowReattempt(true);
    } catch (err) {
      toast.error('Failed to load questions');
    } finally {
      setReattemptLoading(false);
    }
  };

  const calculatePercentile = () => {
    if (allAttempts.length === 0) return 0;
    const rank = userRank;
    const total = allAttempts.length;
    return Math.round(((total - rank) / total) * 100);
  };

  const handleShareResult = () => {
    const percentile = calculatePercentile();
    const text = `🏆 I just scored ${percentage}% on CrackToday!\n\n🎯 Rank: #${userRank} / ${allAttempts.length}\n📊 Percentile: ${percentile}th\n🔥 Streak: 7 days\n\nCan you beat my score? 👇\nhttps://cracktoday.com`;
    
    if (navigator.share) {
      navigator.share({ title: 'My CrackToday Result', text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Result copied to clipboard!');
    }
  };

  const handleShareWhatsApp = () => {
    const percentile = calculatePercentile();
    const text = encodeURIComponent(`🏆 I just scored ${percentage}% on CrackToday!\n\n🎯 Rank: #${userRank} / ${allAttempts.length}\n📊 Percentile: ${percentile}th\n🔥 Streak: 7 days\n\nCan you beat my score? 👇\nhttps://cracktoday.com`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const percentage = userAttempt && userAttempt.total_marks > 0 
    ? Math.round((userAttempt.score / userAttempt.total_marks) * 100) 
    : 0;
  const isLastTest = parseInt(testNumber || "0") === (batch?.total_tests || 0);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{test.name}</h1>
          <p className="text-slate-500">Test {testNumber} of {batch.total_tests} in {batch.name}</p>
        </div>

        {/* VIRAL RESULT SCREEN - Rank & Percentile Hero */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-8 text-white shadow-2xl"
        >
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Trophy className="h-12 w-12 text-yellow-300" />
            </motion.div>
            <h2 className="text-5xl font-bold mb-2">#{userRank}</h2>
            <p className="text-xl text-white/90">Your Rank</p>
            <p className="text-white/70">out of {allAttempts.length.toLocaleString()} participants</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/10 rounded-2xl p-4 text-center">
              <p className="text-4xl font-bold text-yellow-300">{calculatePercentile()}th</p>
              <p className="text-sm text-white/80">Percentile</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 text-center">
              <p className="text-4xl font-bold">{percentage}%</p>
              <p className="text-sm text-white/80">Score</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-6 text-center text-sm">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="font-bold text-emerald-300">{userAttempt?.correct_answers || 0}</p>
              <p className="text-white/70">Correct</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="font-bold text-red-300">{userAttempt?.wrong_answers || 0}</p>
              <p className="text-white/70">Wrong</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="font-bold">{userAttempt?.skipped || 0}</p>
              <p className="text-white/70">Skipped</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="font-bold text-yellow-300">{userAttempt ? formatTime(userAttempt.time_taken) : "0m 0s"}</p>
              <p className="text-white/70">Time</p>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex gap-3 justify-center">
            <button 
              onClick={handleShareWhatsApp}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-xl font-semibold transition-colors"
            >
              <MessageCircle className="h-5 w-5" /> WhatsApp
            </button>
            <button 
              onClick={handleShareResult}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-3 rounded-xl font-semibold transition-colors"
            >
              <Share2 className="h-5 w-5" /> Share
            </button>
          </div>
        </motion.div>

        {/* Performance Graph - Subject-wise Accuracy */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600" /> Performance by Subject
          </h3>
          <div className="space-y-4">
            {subjectPerformance.map((subject) => (
              <div key={subject.subject} className="flex items-center gap-4">
                <div className="w-24 font-medium text-slate-700">{subject.subject}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{subject.correct}/{subject.total} correct</span>
                    <span className={`font-semibold ${
                      subject.accuracy >= 70 ? 'text-emerald-600' : 
                      subject.accuracy >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>{subject.accuracy}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${subject.accuracy}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={`h-3 rounded-full ${
                        subject.accuracy >= 70 ? 'bg-emerald-500' : 
                        subject.accuracy >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Smart Insights - USP Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Zap className="h-6 w-6 text-amber-500" /> Smart Insights
          </h3>
          <div className="space-y-4">
            {smartInsights.map((insight, index) => (
              <div 
                key={index}
                className={`rounded-xl p-4 border-l-4 ${
                  insight.severity === 'high' ? 'bg-red-50 border-red-500' :
                  insight.severity === 'medium' ? 'bg-amber-50 border-amber-500' :
                  'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-slate-900">{insight.subject}</p>
                    <p className="text-sm text-slate-600">{insight.suggestion}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                    insight.severity === 'high' ? 'bg-red-500 text-white' :
                    insight.severity === 'medium' ? 'bg-amber-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    -{insight.lostMarks} marks
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA LOOP - Reattempt & Next Test */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-indigo-600" /> Continue Learning
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleReattemptWrong}
              className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border-2 border-red-200 py-4 rounded-xl font-semibold transition-colors"
            >
              <RotateCcw className="h-5 w-5" />
              Reattempt Wrong Questions
            </button>
            {!isLastTest ? (
              <button
                onClick={() => navigate(`/test/${batchId}`)}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-semibold transition-colors"
              >
                <ArrowRight className="h-5 w-5" />
                Take Next Test ({parseInt(testNumber || "0") + 1}/{batch.total_tests})
              </button>
            ) : (
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-semibold transition-colors"
              >
                <Trophy className="h-5 w-5" />
                Complete Batch
              </button>
            )}
          </div>
        </motion.div>

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
                      {userNames[attempt.user_id] || `User ${attempt.user_id?.slice(0, 8)}`}
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

        {/* Reattempt Modal */}
        {showReattempt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Reattempt Wrong Questions</h2>
                  <p className="text-sm text-slate-500">Practice makes perfect! Review your mistakes.</p>
                </div>
                <button 
                  onClick={() => setShowReattempt(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <AlertCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {reattemptLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-amber-800 font-medium">
                        You got {wrongQuestions.length} question(s) wrong. Review them below:
                      </p>
                    </div>
                    
                    {wrongQuestions.map((q, index) => (
                      <div key={q.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-start gap-3 mb-3">
                          <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-sm font-bold">Q{index + 1}</span>
                          <p className="font-medium text-slate-900">{q.question}</p>
                        </div>
                        
                        <div className="space-y-2 ml-8">
                          <div className={`p-2 rounded-lg text-sm ${q.correct_answer === 'A' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-white'}`}>
                            <span className="font-bold mr-2">A.</span>{q.option_a}
                          </div>
                          <div className={`p-2 rounded-lg text-sm ${q.correct_answer === 'B' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-white'}`}>
                            <span className="font-bold mr-2">B.</span>{q.option_b}
                          </div>
                          <div className={`p-2 rounded-lg text-sm ${q.correct_answer === 'C' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-white'}`}>
                            <span className="font-bold mr-2">C.</span>{q.option_c}
                          </div>
                          <div className={`p-2 rounded-lg text-sm ${q.correct_answer === 'D' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-white'}`}>
                            <span className="font-bold mr-2">D.</span>{q.option_d}
                          </div>
                        </div>
                        
                        <div className="mt-3 ml-8 flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-600">Correct Answer:</span>
                          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">{q.correct_answer}</span>
                        </div>
                        
                        {q.explanation && (
                          <div className="mt-3 ml-8 bg-blue-50 border border-blue-100 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                              <span className="font-semibold">Explanation:</span> {q.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
              
              <div className="p-6 border-t border-slate-200 flex gap-3">
                <button
                  onClick={() => navigate(`/test/${batchId}`)}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Take Full Test Again
                </button>
                <button
                  onClick={() => setShowReattempt(false)}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
}
