import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Trophy, 
  Users, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Calendar,
  Target,
  Medal,
  PlayCircle,
  ChevronLeft,
  Zap
} from "lucide-react";

const steps = [
  {
    icon: Trophy,
    title: "1. Schedule a Competition",
    desc: "Go to your batch and click 'Compete'. Schedule a test time (e.g., 30 minutes from now).",
    color: "bg-amber-100 text-amber-700"
  },
  {
    icon: Users,
    title: "2. Invite Others",
    desc: "Share the competition link with batchmates. They can register and join the live test.",
    color: "bg-blue-100 text-blue-700"
  },
  {
    icon: Clock,
    title: "3. Join the Lobby",
    desc: "Enter the waiting room before the scheduled time. Click 'I'm Ready' when prepared.",
    color: "bg-purple-100 text-purple-700"
  },
  {
    icon: PlayCircle,
    title: "4. Compete Live",
    desc: "All participants start simultaneously. Answer questions within the time limit.",
    color: "bg-emerald-100 text-emerald-700"
  },
  {
    icon: Medal,
    title: "5. See Results",
    desc: "Compare your score, accuracy, and speed with other participants on the leaderboard.",
    color: "bg-orange-100 text-orange-700"
  }
];

const rules = [
  "All participants start at the exact same time",
  "Same questions for everyone - fair competition",
  "Time matters - faster completion with accuracy wins",
  "No restarts or pauses once test begins",
  "Results show rank, score, and time comparison"
];

const faqs = [
  {
    q: "Who can join a live competition?",
    a: "Anyone who has purchased the batch can join. Just click 'Compete' on your batch card."
  },
  {
    q: "How many people can compete together?",
    a: "There's no limit! Invite your entire batch for a massive competition."
  },
  {
    q: "What happens if I'm late?",
    a: "You can still join within the first 5 minutes. After that, the competition is closed."
  },
  {
    q: "Can I see others' scores during the test?",
    a: "No, scores are hidden until everyone finishes or time runs out."
  },
  {
    q: "Is there a prize for winning?",
    a: "Currently, you earn bragging rights and a top spot on the leaderboard!"
  }
];

export function CompetitionHelp() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6">
            <ChevronLeft className="h-4 w-4" /> Back to Home
          </Link>
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Live Competition Guide
          </motion.h1>
          <motion.p 
            className="text-xl text-white/90"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Learn how to compete with other learners in real-time tests
          </motion.p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Quick Start Banner */}
        <motion.div 
          className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-12 flex items-start gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Zap className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-amber-900 mb-1">Quick Start</h3>
            <p className="text-amber-800">
              Go to Dashboard → Click "Compete" on any batch → Schedule time → Share with friends → Compete!
            </p>
          </div>
        </motion.div>

        {/* Steps */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-5 gap-4">
            {steps.map((step, idx) => (
              <motion.div
                key={step.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                whileHover={{ y: -5 }}
              >
                <div className={`w-14 h-14 rounded-xl ${step.color} flex items-center justify-center mx-auto mb-4`}>
                  <step.icon className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm mb-2">{step.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Rules */}
        <section className="mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <Target className="h-6 w-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-slate-900">Competition Rules</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {rules.map((rule, idx) => (
                <motion.div
                  key={idx}
                  className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                >
                  <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-700 text-sm">{rule}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Common Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
              >
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                    Q
                  </span>
                  {faq.q}
                </h3>
                <p className="text-slate-600 text-sm pl-8">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-indigo-200"
          >
            Start Competing Now <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="text-slate-500 mt-4 text-sm">
            Go to Dashboard and click "Compete" on any purchased batch
          </p>
        </motion.div>
      </div>
    </div>
  );
}
