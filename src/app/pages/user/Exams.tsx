import React from 'react';
import { BookOpen, Search, Filter, Clock, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Exams() {
  const exams = [
    {
      id: 1,
      title: "SSC CGL Tier 1",
      category: "SSC",
      tests: 24,
      students: "15k+",
      duration: "6 Months",
      price: "₹999"
    },
    {
      id: 2,
      title: "IBPS PO Prelims",
      category: "Banking",
      tests: 20,
      students: "12k+",
      duration: "3 Months",
      price: "₹799"
    },
    {
      id: 3,
      title: "UPSC CSE Prelims",
      category: "UPSC",
      tests: 35,
      students: "25k+",
      duration: "1 Year",
      price: "₹1499"
    },
    {
      id: 4,
      title: "RRB NTPC CBT 1",
      category: "Railways",
      tests: 18,
      students: "10k+",
      duration: "4 Months",
      price: "₹599"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Available Exams</h1>
            <p className="text-slate-500 mt-2">Explore our comprehensive range of exam preparation batches.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search exams..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors font-medium">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {["All", "SSC", "Banking", "UPSC", "Railways", "State PSC", "Teaching"].map((category) => (
            <button 
              key={category}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                category === "All" 
                  ? "bg-indigo-600 text-white" 
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                    {exam.category}
                  </span>
                  <span className="text-lg font-bold text-slate-900">{exam.price}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{exam.title}</h3>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-slate-500">
                    <BookOpen className="h-4 w-4 mr-2" /> {exam.tests} Full Tests
                  </div>
                  <div className="flex items-center text-sm text-slate-500">
                    <Users className="h-4 w-4 mr-2" /> {exam.students} Enrolled
                  </div>
                  <div className="flex items-center text-sm text-slate-500">
                    <Clock className="h-4 w-4 mr-2" /> {exam.duration} Validity
                  </div>
                </div>
              </div>
              <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/50">
                <Link to="/dashboard" className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border-2 border-indigo-600 text-indigo-700 rounded-xl font-semibold hover:bg-indigo-600 hover:text-white transition-colors group">
                  Enroll Now
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
