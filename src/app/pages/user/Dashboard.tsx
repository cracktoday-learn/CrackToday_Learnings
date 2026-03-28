import { Link } from "react-router-dom";
import { 
  PlayCircle, 
  Trophy, 
  Clock, 
  BarChart3, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  FileText
} from "lucide-react";
import { useAuth } from "../../components/AuthProvider";

export function UserDashboard() {
  const { user } = useAuth();
  
  const ongoingBatches = [
    { id: 1, name: "SSC CGL Tier 1 Mock Test Series", progress: 45, totalTests: 20, completed: 9, nextTest: "Quant Sectional Test 4" },
    { id: 2, name: "UPSC Prelims CSAT Masterclass", progress: 20, totalTests: 10, completed: 2, nextTest: "Reading Comprehension 1" }
  ];

  const recentPerformance = [
    { id: 1, testName: "SSC CGL Full Mock 3", score: 145, maxScore: 200, percentile: 92, date: "2 days ago", rank: 450 },
    { id: 2, testName: "Reasoning Sectional 2", score: 45, maxScore: 50, percentile: 95, date: "4 days ago", rank: 120 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.user_metadata?.name || user?.email || "User"}! 👋</h1>
          <p className="text-slate-500">Here's your preparation overview for today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            View Analytics
          </button>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm">
            <PlayCircle className="h-4 w-4" /> Resume Prep
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Tests Completed</p>
              <h3 className="text-2xl font-bold text-slate-900">24</h3>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Accuracy</p>
              <h3 className="text-2xl font-bold text-slate-900">82%</h3>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Avg Time/Ques</p>
              <h3 className="text-2xl font-bold text-slate-900">45s</h3>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Avg Percentile</p>
              <h3 className="text-2xl font-bold text-slate-900">88.5</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Batches */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Your Active Batches</h2>
              <Link to="/exams" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Browse more</Link>
            </div>
            <div className="space-y-4">
              {ongoingBatches.map(batch => (
                <div key={batch.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-indigo-200 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-lg mb-1">{batch.name}</h3>
                      <p className="text-sm text-slate-500">{batch.completed} of {batch.totalTests} tests completed</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        Active
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2.5 mb-4">
                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${batch.progress}%` }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      Next up: <span className="font-medium text-slate-900">{batch.nextTest}</span>
                    </div>
                    <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                      Take Test <PlayCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Performance */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Tests</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Test Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Score</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rank</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {recentPerformance.map((test) => (
                    <tr key={test.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-slate-400" />
                          <div>
                            <div className="text-sm font-medium text-slate-900">{test.testName}</div>
                            <div className="text-xs text-slate-500">{test.date}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-slate-900">{test.score} <span className="text-slate-400 font-normal">/ {test.maxScore}</span></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">#{test.rank}</div>
                        <div className="text-xs text-emerald-600 font-medium">{test.percentile}%ile</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1">
                          <BarChart3 className="h-4 w-4" /> Analysis
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-8">
          {/* Upcoming Live Tests */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              Live & Upcoming
            </h2>
            <div className="space-y-4">
              <div className="border border-slate-100 bg-slate-50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-slate-900 text-sm">All India SSC CGL Live Mock</h3>
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded-md">Live Now</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">Ends in 2h 45m • 15k+ attempted</p>
                <button className="w-full bg-slate-900 text-white text-sm font-medium py-2 rounded-lg hover:bg-slate-800 transition-colors">
                  Join Test
                </button>
              </div>
              
              <div className="border border-slate-100 rounded-lg p-4">
                <h3 className="font-medium text-slate-900 text-sm mb-1">Weekly Current Affairs Quiz</h3>
                <p className="text-xs text-slate-500 mb-3">Tomorrow, 10:00 AM</p>
                <button className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-medium py-2 rounded-lg hover:bg-slate-50 transition-colors">
                  Set Reminder
                </button>
              </div>
            </div>
          </section>
          
          {/* Daily Goal */}
          <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-6 text-white shadow-lg shadow-indigo-200">
            <h2 className="text-lg font-bold mb-2">Daily Goal</h2>
            <p className="text-indigo-100 text-sm mb-4">Complete 2 tests today to maintain your streak.</p>
            
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-bold">1</span>
              <span className="text-indigo-200 pb-1">/ 2 tests</span>
            </div>
            
            <div className="w-full bg-indigo-900/50 rounded-full h-2 mb-4">
              <div className="bg-white h-2 rounded-full" style={{ width: '50%' }}></div>
            </div>
            
            <p className="text-xs text-indigo-200 flex items-center gap-1">
              🔥 5 day streak! Keep it up.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
