import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Clock, ArrowRight, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";

interface ChallengeQuestion {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  topic: string;
  difficulty: string;
  date: string;
}

interface UserAttempt {
  id: string;
  user_id: string;
  date: string;
  score: number;
  correct_answers: number;
  wrong_answers: number;
  skipped: number;
  time_taken: number;
  completed: boolean;
}

export function DailyChallenge() {
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0, skipped: 0 });
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes
  const [timerActive, setTimerActive] = useState(false);
  const [showingExplanation, setShowingExplanation] = useState<string | null>(null);
  const [previousAttempt, setPreviousAttempt] = useState<UserAttempt | null>(null);

  const currentDate = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchQuestionsAndAttempt();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0 && !submitted) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !submitted) {
      handleSubmit();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, submitted]);

  const fetchQuestionsAndAttempt = async () => {
    setLoading(true);
    try {
      // Fetch today's questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("daily_challenge_questions")
        .select("*")
        .eq("date", currentDate)
        .order("id");

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      // Check if user already attempted today
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const { data: attemptData } = await supabase
          .from("daily_challenge_attempts")
          .select("*")
          .eq("user_id", user.user.id)
          .eq("date", currentDate)
          .single();

        if (attemptData) {
          setPreviousAttempt(attemptData);
          setSubmitted(true);
          // Fix: Set score state from previous attempt so metrics display correctly
          setScore({
            correct: attemptData.correct_answers || 0,
            wrong: attemptData.wrong_answers || 0,
            skipped: attemptData.skipped || 0
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch daily challenge:", err);
      toast.error("Failed to load daily challenge");
    } finally {
      setLoading(false);
    }
  };

  const startChallenge = () => {
    if (previousAttempt) {
      toast.error("You have already completed today's challenge!");
      return;
    }
    setTimerActive(true);
  };

  const handleAnswer = (questionId: string, answer: string) => {
    if (submitted || !timerActive) return;
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (submitted) return;

    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    questions.forEach((q) => {
      const userAnswer = answers[q.id];
      if (!userAnswer) {
        skipped++;
      } else if (userAnswer === q.correct_answer) {
        correct++;
      } else {
        wrong++;
      }
    });

    setScore({ correct, wrong, skipped });
    setSubmitted(true);
    setTimerActive(false);

    // Save attempt
    try {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const timeTaken = 1200 - timeLeft;
        await supabase.from("daily_challenge_attempts").insert({
          user_id: user.user.id,
          date: currentDate,
          score: correct * 4 - wrong, // +4 for correct, -1 for wrong
          correct_answers: correct,
          wrong_answers: wrong,
          skipped: skipped,
          time_taken: timeTaken,
          completed: true,
          answers: answers,
        });
      }
    } catch (err) {
      console.error("Failed to save attempt:", err);
    }

    toast.success(`Challenge completed! Score: ${correct * 4 - wrong}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getOptionStyle = (question: ChallengeQuestion, option: string) => {
    if (!submitted) {
      return answers[question.id] === option
        ? "bg-indigo-600 text-white border-indigo-600"
        : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300";
    }

    if (option === question.correct_answer) {
      return "bg-green-100 text-green-700 border-green-500";
    }
    if (answers[question.id] === option && option !== question.correct_answer) {
      return "bg-red-100 text-red-700 border-red-500";
    }
    return "bg-slate-50 text-slate-500 border-slate-200";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Trophy className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Daily Challenge</h1>
          <p className="text-slate-600 mb-6">No questions available for today. Check back at 6 AM!</p>
          <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Daily Challenge</h1>
            <p className="text-slate-600">{currentDate} • 20 Hard Questions • +4/-1 Marking</p>
          </div>
          {timerActive && !submitted && (
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200">
              <Clock className="h-5 w-5 text-indigo-600" />
              <span className={`font-mono font-bold ${timeLeft < 300 ? "text-red-600" : "text-slate-900"}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
        </div>

        {/* Previous Attempt Warning */}
        {previousAttempt && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">You have already completed today's challenge!</span>
            </div>
            <p className="text-amber-700 mt-1">
              Score: {previousAttempt.score} • Correct: {previousAttempt.correct_answers} • 
              Wrong: {previousAttempt.wrong_answers}
            </p>
          </div>
        )}

        {/* Start Button */}
        {!timerActive && !submitted && !previousAttempt && (
          <div className="mb-6 text-center">
            <button
              onClick={startChallenge}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Start Challenge (20 min)
            </button>
            <p className="text-slate-500 mt-2 text-sm">Once started, timer cannot be paused</p>
          </div>
        )}

        {/* Results Summary */}
        {submitted && (
          <div className="mb-6 bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Challenge Results</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-700">{score.correct}</div>
                <div className="text-sm text-green-600">Correct</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-700">{score.wrong}</div>
                <div className="text-sm text-red-600">Wrong</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="h-8 w-8 mx-auto mb-2 flex items-center justify-center">
                  <span className="text-2xl">⏭️</span>
                </div>
                <div className="text-2xl font-bold text-slate-700">{score.skipped}</div>
                <div className="text-sm text-slate-600">Skipped</div>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <Trophy className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-indigo-700">{score.correct * 4 - score.wrong}</div>
                <div className="text-sm text-indigo-600">Total Score</div>
              </div>
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((q, index) => (
            <div key={q.id} className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-start gap-4">
                <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 mb-1">{q.topic}</p>
                  <h3 className="text-lg text-slate-800 mb-4">{q.question}</h3>

                  {/* Options */}
                  <div className="space-y-2 mb-4">
                    {["A", "B", "C", "D"].map((opt) => {
                      const optionText = q[`option_${opt.toLowerCase()}` as keyof ChallengeQuestion] as string;
                      return (
                        <button
                          key={opt}
                          disabled={submitted || !timerActive}
                          onClick={() => handleAnswer(q.id, opt)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${getOptionStyle(q, opt)}`}
                        >
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            answers[q.id] === opt ? "bg-white/20" : "bg-slate-100 text-slate-600"
                          }`}>
                            {opt}
                          </span>
                          <span>{optionText}</span>
                          {submitted && opt === q.correct_answer && <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />}
                          {submitted && answers[q.id] === opt && opt !== q.correct_answer && <XCircle className="h-5 w-5 text-red-600 ml-auto" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {submitted && (
                    <div className="mt-4">
                      <button
                        onClick={() => setShowingExplanation(showingExplanation === q.id ? null : q.id)}
                        className="text-indigo-600 text-sm font-medium hover:text-indigo-700"
                      >
                        {showingExplanation === q.id ? "Hide Explanation" : "View Explanation"}
                      </button>
                      {showingExplanation === q.id && (
                        <div className="mt-2 p-4 bg-indigo-50 rounded-lg text-slate-700 text-sm">
                          <strong>Correct Answer: {q.correct_answer}</strong>
                          <p className="mt-1">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        {timerActive && !submitted && (
          <div className="mt-6 text-center">
            <button
              onClick={handleSubmit}
              className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              Submit Challenge
            </button>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600">
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
