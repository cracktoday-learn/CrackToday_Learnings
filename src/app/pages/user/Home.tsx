import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, TrendingUp, Users, Award, Clock, BookOpen } from "lucide-react";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";

export function Home() {
  const features = [
    { icon: TrendingUp, title: "Real-time Analytics", desc: "Track your progress with detailed performance insights." },
    { icon: Users, title: "All India Rank", desc: "Compete with lakhs of aspirants nationwide." },
    { icon: Award, title: "Expert Curated", desc: "Tests designed by top educators and past toppers." },
    { icon: Clock, title: "Exam Environment", desc: "Experience the real exam interface and timing." },
  ];

  const popularExams = [
    { title: "SSC CGL", count: "1,200+ Tests", color: "bg-blue-50 text-blue-700" },
    { title: "UPSC CSE", count: "800+ Tests", color: "bg-emerald-50 text-emerald-700" },
    { title: "IBPS PO", count: "1,500+ Tests", color: "bg-purple-50 text-purple-700" },
    { title: "RRB NTPC", count: "900+ Tests", color: "bg-orange-50 text-orange-700" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0 opacity-20">
          <ImageWithFallback 
            src="https://images.unsplash.com/photo-1772059409102-86d89782265b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50cyUyMHN0dWR5aW5nJTIwZm9jdXNlZHxlbnwxfHx8fDE3NzQ2ODA0NTF8MA&ixlib=rb-4.1.0&q=80&w=1080" 
            alt="Students studying"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/95 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 font-medium text-sm mb-6 border border-indigo-500/20">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500"></span>
              New Batches Starting March 2026
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
              Crack Your Government Exam <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Today</span>
            </h1>
            <p className="text-lg text-slate-300 mb-10 leading-relaxed max-w-xl">
              Join India's most trusted test series platform. Get exam-ready with high-quality mock tests, previous year papers, and detailed video solutions.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/dashboard" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-500/30">
                Start Free Trial <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/exams" className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold backdrop-blur-sm transition-all border border-white/10">
                Explore Exams
              </Link>
            </div>
            
            <div className="mt-12 flex items-center gap-6 text-sm font-medium text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-indigo-400" /> 10M+ Users
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-indigo-400" /> 500+ Exams Covered
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Exams */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Popular Exam Categories</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Select your target exam and start preparing with our specialized test batches.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularExams.map((exam) => (
              <Link key={exam.title} to="/exams" className="group relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer block">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${exam.color}`}>
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{exam.title}</h3>
                <p className="text-slate-500 text-sm mb-6">{exam.count} available</p>
                <div className="flex items-center text-indigo-600 font-medium text-sm group-hover:gap-2 transition-all">
                  View Batches <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Why Choose <span className="text-indigo-600">CrackToday</span>?</h2>
              <p className="text-slate-600 mb-8 text-lg">We provide an unparalleled testing environment that perfectly mimics the actual examination, giving you the edge you need to succeed.</p>
              
              <div className="grid sm:grid-cols-2 gap-8">
                {features.map((feature, idx) => (
                  <div key={idx}>
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-cyan-50 rounded-[2.5rem] transform rotate-3 scale-105" />
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/50 bg-white p-2">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1758525861622-f4e7ac86a2d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleGFtJTIwcHJlcGFyYXRpb24lMjBib29rc3xlbnwxfHx8fDE3NzQ2ODA0NTJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Exam Prep"
                  className="w-full h-[400px] object-cover rounded-3xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-24 bg-indigo-600 text-center px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to clear your dream exam?</h2>
        <p className="text-indigo-100 mb-10 max-w-2xl mx-auto text-lg">Join the test batch today and start your journey towards success.</p>
        <Link to="/dashboard" className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-indigo-600 font-bold hover:bg-slate-50 transition-colors shadow-xl">
          Get Started Now
        </Link>
      </section>
    </div>
  );
}
