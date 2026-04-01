import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, TrendingUp, Users, Award, Clock, BookOpen, Sparkles, Trophy } from "lucide-react";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: "easeOut" }
};

const floatingAnimation = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  }
};

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

  // Competition card data
  const competitionCard = {
    title: "Live Competition",
    count: "Compete & Win",
    color: "bg-gradient-to-br from-amber-500 to-orange-600 text-white",
    icon: Trophy,
    link: "/dashboard"
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-slate-900">
        {/* Animated Background Gradient */}
        <motion.div 
          className="absolute inset-0 z-0"
          animate={{
            background: [
              "radial-gradient(ellipse at 30% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)",
              "radial-gradient(ellipse at 70% 80%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)",
              "radial-gradient(ellipse at 30% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)"
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <div className="absolute inset-0 z-0 opacity-20">
          <ImageWithFallback 
            src="https://images.unsplash.com/photo-1772059409102-86d89782265b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50cyUyMHN0dWR5aW5nJTIwZm9jdXNlZHxlbnwxfHx8fDE3NzQ2ODA0NTF8MA&ixlib=rb-4.1.0&q=80&w=1080" 
            alt="Students studying"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/95 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="max-w-2xl"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            {/* Floating Badge */}
            <motion.div 
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 font-medium text-sm mb-6 border border-indigo-500/20"
              variants={fadeInUp}
              {...floatingAnimation}
            >
              <motion.span 
                className="flex h-2 w-2 rounded-full bg-indigo-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <Sparkles className="h-3 w-3" />
              New Batches Starting March 2026
            </motion.div>

            {/* Hero Title with Gradient Animation */}
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6"
              variants={fadeInUp}
            >
              Crack Your Government Exam{" "}
              <motion.span 
                className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 inline-block"
                animate={{ 
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                style={{ backgroundSize: "200% 200%" }}
              >
                Today
              </motion.span>
            </motion.h1>

            {/* Description */}
            <motion.p 
              className="text-lg text-slate-300 mb-10 leading-relaxed max-w-xl"
              variants={fadeInUp}
            >
              Join India's most trusted test series platform. Get exam-ready with high-quality mock tests, previous year papers, and detailed video solutions.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-wrap gap-4"
              variants={fadeInUp}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/dashboard" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-500/30">
                  Start Free Trial <ArrowRight className="h-5 w-5" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/exams" className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold backdrop-blur-sm transition-all border border-white/10">
                  Explore Exams
                </Link>
              </motion.div>
            </motion.div>
            
            {/* Stats */}
            <motion.div 
              className="mt-12 flex items-center gap-6 text-sm font-medium text-slate-400"
              variants={fadeInUp}
            >
              <motion.div 
                className="flex items-center gap-2"
                whileHover={{ x: 5, color: "#818cf8" }}
              >
                <CheckCircle className="h-5 w-5 text-indigo-400" /> 10M+ Users
              </motion.div>
              <motion.div 
                className="flex items-center gap-2"
                whileHover={{ x: 5, color: "#818cf8" }}
              >
                <CheckCircle className="h-5 w-5 text-indigo-400" /> 500+ Exams Covered
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Popular Exams */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Popular Exam Categories</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Select your target exam and start preparing with our specialized test batches.</p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {/* Competition Card - Special Prominent Card */}
            <motion.div
              variants={scaleIn}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="group relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-300 cursor-pointer block h-full"
            >
              <motion.div 
                className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-6 backdrop-blur-sm"
                whileHover={{ rotate: 10, scale: 1.1 }}
              >
                <Trophy className="h-6 w-6 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">Live Competition</h3>
              <p className="text-white/80 text-sm mb-6">Compete with others in real-time tests</p>
              <div className="flex items-center justify-between gap-2">
                <Link 
                  to="/dashboard"
                  className="flex items-center text-white font-medium text-sm hover:underline whitespace-nowrap"
                >
                  Join Now <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
                <Link 
                  to="/competition-help" 
                  className="text-white/60 hover:text-white text-xs underline whitespace-nowrap"
                >
                  How it works?
                </Link>
              </div>
              {/* Animated pulse effect */}
              <motion.div 
                className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>

            {popularExams.map((exam) => (
              <motion.div
                key={exam.title}
                variants={scaleIn}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Link to="/exams" className="group relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 cursor-pointer block">
                  <motion.div 
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${exam.color}`}
                    whileHover={{ rotate: 10, scale: 1.1 }}
                  >
                    <BookOpen className="h-6 w-6" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{exam.title}</h3>
                  <p className="text-slate-500 text-sm mb-6">{exam.count} available</p>
                  <motion.div 
                    className="flex items-center text-indigo-600 font-medium text-sm"
                    whileHover={{ x: 5 }}
                  >
                    View Batches <ArrowRight className="h-4 w-4 ml-1" />
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <motion.h2 
                className="text-3xl font-bold text-slate-900 mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                Why Choose <span className="text-indigo-600">CrackToday</span>?
              </motion.h2>
              <motion.p 
                className="text-slate-600 mb-8 text-lg"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                We provide an unparalleled testing environment that perfectly mimics the actual examination, giving you the edge you need to succeed.
              </motion.p>
              
              <motion.div 
                className="grid sm:grid-cols-2 gap-8"
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                {features.map((feature, idx) => (
                  <motion.div 
                    key={idx}
                    variants={fadeInUp}
                    whileHover={{ y: -5 }}
                  >
                    <motion.div 
                      className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4"
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <feature.icon className="h-5 w-5" />
                    </motion.div>
                    <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-cyan-50 rounded-[2.5rem] transform rotate-3 scale-105"
                animate={{ rotate: [3, 6, 3] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/50 bg-white p-2">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1758525861622-f4e7ac86a2d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleGFtJTIwcHJlcGFyYXRpb24lMjBib29rc3xlbnwxfHx8fDE3NzQ2ODA0NTJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Exam Prep"
                  className="w-full h-[400px] object-cover rounded-3xl"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <motion.section 
        className="py-24 bg-indigo-600 text-center px-4 relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        {/* Animated Background Circles */}
        <motion.div 
          className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full"
          animate={{ 
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full"
          animate={{ 
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Ready to clear your dream exam?
          </motion.h2>
          <motion.p 
            className="text-indigo-100 mb-10 max-w-2xl mx-auto text-lg"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Join the test batch today and start your journey towards success.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/dashboard" className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-indigo-600 font-bold hover:bg-slate-50 transition-colors shadow-xl">
              Get Started Now
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
