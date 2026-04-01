import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Target, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "../../components/AuthProvider";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

export function Performance() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [typeData, setTypeData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [subjectData, setSubjectData] = useState<any[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalTests: 0,
    avgScore: 0,
    avgAccuracy: 0,
    totalCorrect: 0,
    totalWrong: 0,
    totalSkipped: 0,
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("test_attempts")
        .select("*, batches(name)")
        .eq("user_id", user?.id)
        .order("completed_at", { ascending: true });

      if (error) throw error;
      setAttempts(data || []);

      if (data && data.length > 0) {
        const totalCorrect = data.reduce((acc, a) => acc + a.correct_answers, 0);
        const totalWrong = data.reduce((acc, a) => acc + a.wrong_answers, 0);
        const totalSkipped = data.reduce((acc, a) => acc + a.skipped, 0);
        const totalQuestions = totalCorrect + totalWrong + totalSkipped;
        const avgAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

        setOverallStats({
          totalTests: data.length,
          avgScore: Math.round(data.reduce((acc, a) => acc + a.score, 0) / data.length),
          avgAccuracy,
          totalCorrect,
          totalWrong,
          totalSkipped,
        });

        setTypeData([
          { name: "Correct", value: totalCorrect, color: "#10b981" },
          { name: "Wrong", value: totalWrong, color: "#ef4444" },
          { name: "Skipped", value: totalSkipped, color: "#94a3b8" },
        ]);

        setTrendData(data.map((a, i) => ({
          name: `Test ${i + 1}`,
          score: a.total_marks > 0 ? Math.round((a.score / a.total_marks) * 100) : 0,
        })));

        const subjectMap: any = {};
        data.forEach((a) => {
          const key = a.batches?.name?.slice(0, 15) || "Unknown";
          if (!subjectMap[key]) subjectMap[key] = { subject: key, correct: 0, wrong: 0, skipped: 0 };
          subjectMap[key].correct += a.correct_answers;
          subjectMap[key].wrong += a.wrong_answers;
          subjectMap[key].skipped += a.skipped;
        });
        setSubjectData(Object.values(subjectMap));
      }
    } catch (err) {
      toast.error("Failed to load performance data");
    } finally {
      setLoading(false);
    }
  };

  const getAccuracyColor = (a: number) => a >= 80 ? "text-emerald-600" : a >= 60 ? "text-indigo-600" : a >= 40 ? "text-orange-500" : "text-red-500";
  const getAccuracyLabel = (a: number) => a >= 80 ? "Excellent" : a >= 60 ? "Good" : a >= 40 ? "Average" : "Needs Work";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
          <TrendingUp className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Performance Tracker</h1>
          <p className="text-sm text-slate-500">Track your strengths and weak areas</p>
        </div>
      </div>

      {attempts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
          <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Tests Taken Yet</h2>
          <p className="text-slate-500 mb-6">Take a test to see your performance analysis here.</p>
          <Link to="/dashboard" className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center">
              <p className="text-2xl font-bold text-indigo-600">{overallStats.totalTests}</p>
              <p className="text-xs text-slate-500 mt-1">Tests Taken</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center">
              <p className={`text-2xl font-bold ${getAccuracyColor(overallStats.avgAccuracy)}`}>{overallStats.avgAccuracy}%</p>
              <p className="text-xs text-slate-500 mt-1">Avg Accuracy</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center">
              <p className="text-2xl font-bold text-emerald-600">{overallStats.totalCorrect}</p>
              <p className="text-xs text-slate-500 mt-1">Correct</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center">
              <p className="text-2xl font-bold text-red-500">{overallStats.totalWrong}</p>
              <p className="text-xs text-slate-500 mt-1">Wrong</p>
            </div>
          </div>

          <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${overallStats.avgAccuracy >= 60 ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
            {overallStats.avgAccuracy >= 60
              ? <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />
              : <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />}
            <div>
              <p className={`font-bold ${getAccuracyColor(overallStats.avgAccuracy)}`}>Overall: {getAccuracyLabel(overallStats.avgAccuracy)}</p>
              <p className="text-sm text-slate-600">
                {overallStats.avgAccuracy >= 80 ? "Excellent! Keep maintaining this consistency." :
                 overallStats.avgAccuracy >= 60 ? "Good progress! Focus on weak areas to score higher." :
                 overallStats.avgAccuracy >= 40 ? "You need more practice. Attempt more tests daily." :
                 "Don't give up! Review your mistakes and practice more."}
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-600" /> Answer Breakdown
              </h2>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {typeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {typeData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs text-slate-600">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" /> Score Trend
              </h2>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
                    <Tooltip formatter={(value) => [`${value}%`, "Score"]} />
                    <Line type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={2.5} dot={{ r: 4, fill: "#4F46E5" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600" /> Batch-wise Performance
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="correct" name="Correct" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="wrong" name="Wrong" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="skipped" name="Skipped" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" /> Test History
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-5 py-3 font-medium">Batch</th>
                    <th className="px-5 py-3 font-medium">Score</th>
                    <th className="px-5 py-3 font-medium">Correct</th>
                    <th className="px-5 py-3 font-medium">Wrong</th>
                    <th className="px-5 py-3 font-medium">Skipped</th>
                    <th className="px-5 py-3 font-medium">Accuracy</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...attempts].reverse().map((a) => {
                    const total = a.correct_answers + a.wrong_answers + a.skipped;
                    const accuracy = total > 0 ? Math.round((a.correct_answers / total) * 100) : 0;
                    return (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 text-sm font-medium text-slate-900">{a.batches?.name?.slice(0, 20)}...</td>
                        <td className="px-5 py-4 text-sm font-bold text-indigo-600">{a.score}/{a.total_marks}</td>
                        <td className="px-5 py-4 text-sm text-emerald-600 font-medium">{a.correct_answers}</td>
                        <td className="px-5 py-4 text-sm text-red-500 font-medium">{a.wrong_answers}</td>
                        <td className="px-5 py-4 text-sm text-slate-500">{a.skipped}</td>
                        <td className="px-5 py-4"><span className={`text-sm font-bold ${getAccuracyColor(accuracy)}`}>{accuracy}%</span></td>
                        <td className="px-5 py-4 text-xs text-slate-500">
                          {new Date(a.completed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
