import { Search, Filter, MoreVertical, Shield, Ban, CheckCircle, Mail } from "lucide-react";

export function AdminUsers() {
  const users = [
    { id: 1, name: "Rahul Verma", email: "rahul.v@example.com", joined: "Oct 12, 2025", status: "Active", enrolledBatches: 3, lastLogin: "2 hours ago" },
    { id: 2, name: "Priya Singh", email: "priya.s@example.com", joined: "Nov 05, 2025", status: "Active", enrolledBatches: 1, lastLogin: "1 day ago" },
    { id: 3, name: "Amit Sharma", email: "amit.sharma@example.com", joined: "Dec 20, 2025", status: "Inactive", enrolledBatches: 0, lastLogin: "2 weeks ago" },
    { id: 4, name: "Sneha Gupta", email: "sneha.g@example.com", joined: "Jan 15, 2026", status: "Banned", enrolledBatches: 2, lastLogin: "1 month ago" },
    { id: 5, name: "Vikram Malhotra", email: "vikram.m@example.com", joined: "Feb 02, 2026", status: "Active", enrolledBatches: 5, lastLogin: "Just now" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Users</h1>
          <p className="text-slate-500 text-sm mt-1">View, edit, and manage all registered students.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filter
          </button>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, email, or ID..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Showing {users.length} users</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">User Info</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Enrolled Batches</th>
                <th className="px-6 py-4 font-medium">Joined Date</th>
                <th className="px-6 py-4 font-medium">Last Login</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-cyan-100 flex items-center justify-center text-indigo-700 font-bold text-sm border border-indigo-200 shadow-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer">{user.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3" /> {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      user.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      user.status === 'Banned' ? 'bg-red-50 text-red-700 border-red-200' : 
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {user.status === 'Active' && <CheckCircle className="h-3 w-3" />}
                      {user.status === 'Banned' && <Ban className="h-3 w-3" />}
                      {user.status === 'Inactive' && <div className="h-1.5 w-1.5 rounded-full bg-slate-400"></div>}
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">
                    {user.enrolledBatches} batches
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{user.joined}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{user.lastLogin}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/30">
          <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white transition-colors bg-white shadow-sm disabled:opacity-50">
            Previous
          </button>
          <div className="text-sm text-slate-500 font-medium">
            Page 1 of 12
          </div>
          <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white transition-colors bg-white shadow-sm">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
