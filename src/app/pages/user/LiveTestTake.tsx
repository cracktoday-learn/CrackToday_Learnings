import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../utils/supabase/client";
import { useAuth } from "../../components/AuthProvider";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  Clock, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  Flag,
  AlertCircle
} from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
}

interface LiveTest {
  id: string;
  batch_id: string;
  test_number: number;
  duration_minutes: number;
}

export function LiveTestTake() {
  const { liveTestId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liveTest, setLiveTest] = useState<LiveTest | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [participantCount, setParticipantCount] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    initializeTest();
  }, [liveTestId]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  // Refresh participant count periodically
  useEffect(() => {
    const interval = setInterval(fetchParticipantCount, 10000);
    return () => clearInterval(interval);
  }, [liveTestId]);

  const initializeTest = async () => {
    try {
      // Get live test details
      const { data: test, error: testError } = await supabase
        .from("live_tests")
        .select("*")
        .eq("id", liveTestId)
        .single();

      if (testError) throw testError;
      setLiveTest(test);
      setTimeLeft(test.duration_minutes * 60);
      setStartTime(new Date());

      // Get test questions
      const { data: testData, error: questionsError } = await supabase
        .from("tests")
        .select("questions")
        .eq("batch_id", test.batch_id)
        .eq("test_number", test.test_number)
        .single();

      if (questionsError) throw questionsError;
      
      // Shuffle questions for variety
      const shuffled = [...(testData?.questions || [])].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);

      // Update participant status to in_progress
      await supabase
        .from("live_test_participants")
        .update({ 
          status: 'in_progress', 
          started_at: new Date().toISOString() 
        })
        .eq("live_test_id", liveTestId)
        .eq("user_id", user?.id);

      fetchParticipantCount();
    } catch (err) {
      toast.error("Failed to load test");
      navigate(`/live-test/${liveTestId}/lobby`);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipantCount = async () => {
    const { count } = await supabase
      .from("live_test_participants")
      .select("*", { count: 'exact', head: true })
      .eq("live_test_id", liveTestId)
      .eq("status", 'in_progress');
    
    setParticipantCount(count || 0);
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    try {
      // Calculate score
      let correct = 0;
      let wrong = 0;
      
      questions.forEach((q) => {
        if (answers[q.id] === q.correct_answer) {
          correct++;
        } else if (answers[q.id]) {
          wrong++;
        }
      });

      const score = Math.round((correct / questions.length) * 100);
      const timeTaken = startTime 
        ? Math.floor((Date.now() - startTime.getTime()) / 1000)
        : 0;

      // Save attempt to test_attempts
      await supabase.from("test_attempts").insert({
        user_id: user?.id,
        batch_id: liveTest?.batch_id,
        test_number: liveTest?.test_number,
        score,
        answers: Object.entries(answers).map(([question_id, selected_answer]) => ({
          question_id,
          selected_answer,
          is_correct: questions.find(q => q.id === question_id)?.correct_answer === selected_answer
        })),
        time_taken_seconds: timeTaken,
        completed_at: new Date().toISOString()
      });

      // Update live test participant record
      await supabase
        .from("live_test_participants")
        .update({
          status: 'completed',
          submitted_at: new Date().toISOString(),
          score,
          correct_answers: correct,
          wrong_answers: wrong,
          time_taken_seconds: timeTaken
        })
        .eq("live_test_id", liveTestId)
        .eq("user_id", user?.id);

      toast.success("Test submitted successfully!");
      navigate(`/live-test/${liveTestId}/results`);
    } catch (err) {
      toast.error("Failed to submit test");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <motion.div 
          className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Live Test #{liveTest?.test_number}</h1>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm">
                <Users className="h-4 w-4" />
                {participantCount} competing
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Timer */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${
                timeLeft < 300 ? 'bg-red-500/20 text-red-400' : 'bg-slate-700'
              }`}>
                <Clock className="h-5 w-5" />
                {formatTime(timeLeft)}
              </div>
              
              {/* Submit Button */}
              <motion.button
                onClick={handleSubmit}
                className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Flag className="h-4 w-4" />
                Submit
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Progress
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestion(idx)}
                    className={`aspect-square rounded-lg text-sm font-semibold transition-colors ${
                      idx === currentQuestion
                        ? 'bg-indigo-600 text-white'
                        : answers[q.id]
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-400">
                  {answeredCount} of {questions.length} answered
                </p>
                <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(answeredCount / questions.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Question Area */}
          <div className="lg:col-span-3">
            <motion.div 
              key={currentQuestion}
              className="bg-slate-800 rounded-2xl p-8 border border-slate-700"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <span className="text-indigo-400 font-medium">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <h2 className="text-xl font-semibold mt-2 leading-relaxed">
                  {currentQ?.question_text}
                </h2>
              </div>

              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((option) => {
                  const optionKey = `option_${option.toLowerCase()}` as keyof Question;
                  const isSelected = answers[currentQ?.id] === option;
                  
                  return (
                    <motion.button
                      key={option}
                      onClick={() => handleAnswer(currentQ?.id, option)}
                      className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/20'
                          : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
                      }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                          isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-600'
                        }`}>
                          {option}
                        </span>
                        <span className="text-lg">{currentQ?.[optionKey] as string}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <motion.button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ChevronLeft className="h-5 w-5" />
                  Previous
                </motion.button>
                
                <motion.button
                  onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                  disabled={currentQuestion === questions.length - 1}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Next
                  <ChevronRight className="h-5 w-5" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
