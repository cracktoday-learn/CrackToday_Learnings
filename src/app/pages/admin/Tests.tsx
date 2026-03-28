import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  Award, 
  Edit, 
  Trash2,
  MoreHorizontal
} from "lucide-react";

export function AdminTests() {
  const tests = [
    { id: 1, title: "SSC CGL Full Mock 1", category: "SSC CGL", duration: "60 mins", marks: 200, status: "Published", attempts: 1245 },
    { id: 2, title: "UPSC CSAT Reading Comp 1", category: "UPSC Prelims", duration: "120 mins", marks: 200, status: "Draft", attempts: 0 },
    { id: 3, title: "IBPS PO Quant Sectional", category: "Banking", duration: "20 mins", marks: 35, status: "Published", attempts: 890 },
    { id: 4, title: "RRB NTPC CBT 1 Live", category: "Railways", duration: "90 mins", marks: 100, status: "Scheduled", attempts: 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Test Batches</h1>
          <p className="text-slate-500 text-sm mt-1">Create and manage your mock tests and test series.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filter
          </button>
          <button className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/30 flex items-center gap-2">
            <Plus className="h-5 w-5" /> Create New Test
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-2xl text-white shadow-lg shadow-indigo-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-indigo-100 font-medium text-sm uppercase tracking-wider">Total Tests Created</h3>
            <div className="p-2 bg-indigo-400/30 rounded-lg backdrop-blur-sm">
              <FileText className="h-5 w-5 text-indigo-50" />
            </div>
          </div>
          <div className="text-4xl font-bold mb-1">452</div>
          <p className="text-indigo-200 text-sm flex items-center gap-1">+12 this week</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wider">Total Attempts</h3>
            <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
              <Award className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <div className="text-4xl font-bold text-slate-900 mb-1">1.2M</div>
          <p className="text-emerald-600 text-sm font-medium flex items-center gap-1">↑ 5% from last month</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wider">Avg. Completion Rate</h3>
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="text-4xl font-bold text-slate-900 mb-1">84%</div>
          <p className="text-slate-500 text-sm flex items-center gap-1">Across all published tests</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search tests by name or category..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <button className="px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">All Tests</button>
            <button className="px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 whitespace-nowrap">Published</button>
            <button className="px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 whitespace-nowrap">Drafts</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Test Details</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Format</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Attempts</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tests.map((test) => (
                <tr key={test.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100/50">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{test.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">ID: #TST-{test.id.toString().padStart(4, '0')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {test.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900 font-medium">{test.duration}</div>
                    <div className="text-xs text-slate-500">{test.marks} marks</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      test.status === 'Published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      test.status === 'Scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      'bg-slate-100 text-slate-700 border-slate-300'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        test.status === 'Published' ? 'bg-emerald-500' : 
                        test.status === 'Scheduled' ? 'bg-blue-500' : 
                        'bg-slate-500'
                      }`}></span>
                      {test.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                    {test.attempts.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Test">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Test">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-900">1</span> to <span className="font-medium text-slate-900">{tests.length}</span> of <span className="font-medium text-slate-900">452</span> tests
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-400 bg-white shadow-sm cursor-not-allowed">
              Previous
            </button>
            <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors bg-white shadow-sm">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
