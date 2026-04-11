import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Clock, ChevronLeft, ChevronRight, Flag, CheckCircle, AlertCircle, Target } from "lucide-react";
import { useAuth } from "../../components/AuthProvider";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Question {
  id: string;
  question: string;
  type: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  marks: number;
  negative_marks: number;
  test_number?: number;
}

export function TakeTest() {
  const { batchId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [batchName, setBatchName] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTestNumber, setCurrentTestNumber] = useState(() => {
    const testNum = parseInt(searchParams.get("testNumber") || "1", 10);
    return isNaN(testNum) || testNum < 1 ? 1 : testNum;
  });
  const [totalTests, setTotalTests] = useState(1);
  const [completedTests, setCompletedTests] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testFinished, setTestFinished] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [testDuration, setTestDuration] = useState(60); // Store test duration in minutes

  useEffect(() => {
    fetchData();
  }, [batchId]);

  useEffect(() => {
    if (!testStarted || testFinished) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [testStarted, timeLeft, testFinished]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: batch } = await supabase.from("batches").select("name,total_tests").eq("id", batchId).single();
      setBatchName(batch?.name || "");
      setTotalTests(batch?.total_tests || 1);
      
      // Fetch the current test to get time_duration
      const { data: testData } = await supabase
        .from("tests")
        .select("time_duration")
        .eq("batch_id", batchId)
        .eq("test_number", currentTestNumber)
        .single();
      
      const { data: qs, error } = await supabase.from("questions").select("*").eq("batch_id", batchId).order("test_number,order_number");
      if (error) throw error;
      
      if (qs && qs.length > 0) {
        setAllQuestions(qs);
        
        // Group questions by test_number if available, otherwise split into chunks
        const questionsByTest: { [key: number]: Question[] } = {};
        
        if (qs[0].test_number) {
          // Questions already have test numbers
          qs.forEach(q => {
            const testNum = q.test_number || 1;
            if (!questionsByTest[testNum]) questionsByTest[testNum] = [];
            questionsByTest[testNum].push(q);
          });
        } else {
          // Split questions into equal chunks based on total_tests
          const questionsPerTest = Math.ceil(qs.length / (batch?.total_tests || 1));
          qs.forEach((q, index) => {
            const testNum = Math.floor(index / questionsPerTest) + 1;
            if (!questionsByTest[testNum]) questionsByTest[testNum] = [];
            questionsByTest[testNum].push(q);
          });
        }
        
        // Set current test questions
        const currentTestQuestions = questionsByTest[currentTestNumber] || questionsByTest[1] || [];
        setQuestions(currentTestQuestions);
        
        // Use test's time_duration from database, or fallback to calculated time
        const duration = testData?.time_duration || Math.round(currentTestQuestions.length * 1.5);
        setTestDuration(duration);
        setTimeLeft(duration * 60); // Convert minutes to seconds
      }
    } catch (err) {
      toast.error("Failed to load test");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      let score = 0;
      let correct = 0;
      let wrong = 0;
      let skipped = 0;
      let totalMarks = 0;

      questions.forEach((q) => {
        totalMarks += q.marks;
        const userAnswer = answers[q.id];
        if (!userAnswer) {
          skipped++;
        } else if (userAnswer === q.correct_answer) {
          score += q.marks;
          correct++;
        } else {
          score -= q.negative_marks;
          wrong++;
        }
      });

      const timeTaken = testDuration * 60 - timeLeft;

      // Save test attempt for current test
      console.log('Submitting test with answers:', JSON.stringify(answers, null, 2));
      console.log('Full submission data:', {
        user_id: user?.id,
        batch_id: batchId,
        test_number: currentTestNumber,
        score,
        correct_answers: correct,
        wrong_answers: wrong,
        skipped,
        answers
      });
      const { data, error } = await supabase.from("test_attempts").insert({
        user_id: user?.id,
        batch_id: batchId,
        test_number: currentTestNumber,
        score: Math.max(0, score),
        total_marks: totalMarks,
        correct_answers: correct,
        wrong_answers: wrong,
        skipped,
        time_taken: timeTaken,
        answers,
      }).select();

      console.log('Insert response data:', JSON.stringify(data, null, 2));
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      console.log('Test submitted successfully, returned data:', data);

      // Add current test to completed tests
      const newCompletedTests = [...completedTests, currentTestNumber];
      setCompletedTests(newCompletedTests);

      setResult({
        score: Math.max(0, score),
        totalMarks,
        correct,
        wrong,
        skipped,
        timeTaken,
        percentage: Math.round((Math.max(0, score) / totalMarks) * 100),
        testNumber: currentTestNumber,
        totalTests,
        isLastTest: currentTestNumber === totalTests,
      });
      setTestFinished(true);
    } catch (err) {
      toast.error("Failed to submit test");
    } finally {
      setSubmitting(false);
    }
  }, [answers, questions, timeLeft, submitting, currentTestNumber, totalTests, completedTests]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const toggleFlag = (id: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const startNextTest = async () => {
    const nextTestNumber = currentTestNumber + 1;
    if (nextTestNumber <= totalTests) {
      // Reset state for next test
      setCurrentTestNumber(nextTestNumber);
      setCurrentIndex(0);
      setAnswers({});
      setFlagged(new Set());
      setTestStarted(false);
      setTestFinished(false);
      setResult(null);
      
      // Load next test questions
      const questionsByTest: { [key: number]: Question[] } = {};
      
      if (allQuestions[0]?.test_number) {
        // Questions already have test numbers
        allQuestions.forEach(q => {
          const testNum = q.test_number || 1;
          if (!questionsByTest[testNum]) questionsByTest[testNum] = [];
          questionsByTest[testNum].push(q);
        });
      } else {
        // Split questions into equal chunks based on total_tests
        const questionsPerTest = Math.ceil(allQuestions.length / totalTests);
        allQuestions.forEach((q, index) => {
          const testNum = Math.floor(index / questionsPerTest) + 1;
          if (!questionsByTest[testNum]) questionsByTest[testNum] = [];
          questionsByTest[testNum].push(q);
        });
      }
      
      const nextTestQuestions = questionsByTest[nextTestNumber] || [];
      setQuestions(nextTestQuestions);
      
      // Fetch duration for next test
      try {
        const { data: nextTestData } = await supabase
          .from("tests")
          .select("time_duration")
          .eq("batch_id", batchId)
          .eq("test_number", nextTestNumber)
          .single();
        
        const nextDuration = nextTestData?.time_duration || Math.round(nextTestQuestions.length * 1.5);
        setTestDuration(nextDuration);
        setTimeLeft(nextDuration * 60);
      } catch (err) {
        // Fallback if test data not found
        const fallbackDuration = Math.round(nextTestQuestions.length * 1.5);
        setTestDuration(fallbackDuration);
        setTimeLeft(fallbackDuration * 60);
      }
    }
  };

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Questions Yet</h2>
          <p className="text-slate-500 mb-4">This batch has no questions added yet.</p>
          <button onClick={() => navigate("/dashboard")} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Instructions screen
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-lg w-full"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{batchName}</h1>
            <p className="text-slate-500">Test {currentTestNumber} of {totalTests}</p>
          </div>

          {/* Test Info Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-indigo-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-indigo-600">{questions.length}</p>
              <p className="text-xs text-slate-600">Questions</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{testDuration}</p>
              <p className="text-xs text-slate-600">Minutes</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">+1</p>
              <p className="text-xs text-slate-600">Marks</p>
            </div>
          </div>

          {/* Difficulty & Cutoff */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-6 border border-purple-100">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-slate-900">Difficulty</span>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">Medium</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-pink-600" />
                <span className="font-semibold text-slate-900">Expected Cutoff</span>
              </div>
              <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">65%</span>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">+1</div>
              <p className="text-sm text-slate-700">Marks for correct answer</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">-¼</div>
              <p className="text-sm text-slate-700">Negative marks for wrong answer</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <Clock className="h-4 w-4" />
              </div>
              <p className="text-sm text-slate-700">Timer will auto-submit when time ends</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate("/dashboard")} className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={() => setTestStarted(true)} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
              Start Test
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Result screen
  if (testFinished && result) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-6 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.percentage >= 60 ? "bg-emerald-100" : "bg-red-100"}`}>
              {result.percentage >= 60
                ? <CheckCircle className="h-10 w-10 text-emerald-600" />
                : <AlertCircle className="h-10 w-10 text-red-600" />}
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Test {result.testNumber} Complete!</h1>
            <p className="text-slate-500 mb-2">{result.percentage >= 60 ? "🎉 Great job! You passed!" : "Keep practicing! You can do better!"}</p>
            <p className="text-2xl font-bold text-indigo-600">{result.score} / {result.totalMarks} marks</p>
            <p className="text-sm text-slate-500 mt-2">Test {result.testNumber} of {result.totalTests}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">{result.correct}</p>
              <p className="text-xs text-slate-500 mt-1">Correct</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-red-600">{result.wrong}</p>
              <p className="text-xs text-slate-500 mt-1">Wrong</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-slate-600">{result.skipped}</p>
              <p className="text-xs text-slate-500 mt-1">Skipped</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-indigo-600">{Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</p>
              <p className="text-xs text-slate-500 mt-1">Time Taken</p>
            </div>
          </div>

          {/* Answer Review */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Answer Review</h2>
            <div className="space-y-4">
              {questions.map((q, i) => {
                const userAnswer = answers[q.id];
                const isCorrect = userAnswer === q.correct_answer;
                const isSkipped = !userAnswer;
                return (
                  <div key={q.id} className={`p-4 rounded-xl border ${isSkipped ? "border-slate-200 bg-slate-50" : isCorrect ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-400">Q{i + 1}</span>
                      <p className="text-sm font-medium text-slate-900 flex-1">{q.question}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs mt-2">
                      <span className={`font-medium ${isSkipped ? "text-slate-500" : isCorrect ? "text-emerald-700" : "text-red-700"}`}>
                        Your answer: {isSkipped ? "Skipped" : `${userAnswer}. ${q[`option_${userAnswer?.toLowerCase()}` as keyof Question]}`}
                      </span>
                      {!isCorrect && (
                        <span className="font-medium text-emerald-700">
                          Correct: {q.correct_answer}. {q[`option_${q.correct_answer.toLowerCase()}` as keyof Question]}
                        </span>
                      )}
                    </div>
                    {q.explanation && (
                      <p className="text-xs text-slate-500 mt-2 italic">💡 {q.explanation}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            {!result.isLastTest ? (
              <>
                <button 
                  onClick={() => navigate(`/test/${batchId}/evaluation/${result.testNumber}`)}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
                >
                  View Evaluation & Ranking
                </button>
                <button 
                  onClick={() => navigate("/dashboard")}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Back to Dashboard
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => navigate(`/test/${batchId}/evaluation/${result.testNumber}`)}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
                >
                  View Final Evaluation
                </button>
                <button 
                  onClick={() => navigate("/dashboard")}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Complete Batch
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Test screen
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with Timer and Progress */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 truncate max-w-xs">{batchName}</h1>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">Test {currentTestNumber}/{totalTests}</span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-sm ${timeLeft <= 60 ? "bg-red-100 text-red-600 animate-pulse" : timeLeft <= 300 ? "bg-orange-100 text-orange-600" : "bg-indigo-100 text-indigo-600"}`}>
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={() => { if (confirm("Are you sure you want to submit the test?")) handleSubmit(); }}
              disabled={submitting}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Test"}
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Question Panel */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Q{currentIndex + 1} of {questions.length}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${currentQuestion.type === "mcq" ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"}`}>
                  {currentQuestion.type === "mcq" ? "MCQ" : "True/False"}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  {currentQuestion.marks} mark
                </span>
              </div>
              <button
                onClick={() => toggleFlag(currentQuestion.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${flagged.has(currentQuestion.id) ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-600"}`}
              >
                <Flag className="h-3.5 w-3.5" />
                {flagged.has(currentQuestion.id) ? "Flagged" : "Flag"}
              </button>
            </div>

            <p className="text-base font-medium text-slate-900 mb-6">{currentQuestion.question}</p>

            <div className="space-y-3">
              {(currentQuestion.type === "mcq"
                ? [["A", currentQuestion.option_a], ["B", currentQuestion.option_b], ["C", currentQuestion.option_c], ["D", currentQuestion.option_d]]
                : [["A", "True"], ["B", "False"]]
              ).map(([opt, val]) => (
                <button
                  key={opt}
                  onClick={() => setAnswers({ ...answers, [currentQuestion.id]: opt })}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                    answers[currentQuestion.id] === opt
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${answers[currentQuestion.id] === opt ? "bg-white text-indigo-600" : "bg-slate-100 text-slate-600"}`}>
                    {opt}
                  </span>
                  {val}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                onClick={() => setAnswers({ ...answers, [currentQuestion.id]: "" })}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                disabled={currentIndex === questions.length - 1}
                className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Question Navigator */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-20">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Questions</h3>
            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                    i === currentIndex
                      ? "bg-indigo-600 text-white"
                      : flagged.has(q.id)
                      ? "bg-orange-100 text-orange-600 border border-orange-300"
                      : answers[q.id]
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-emerald-100"></div><span className="text-slate-600">Answered ({answeredCount})</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-slate-100"></div><span className="text-slate-600">Not answered ({questions.length - answeredCount})</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-orange-100"></div><span className="text-slate-600">Flagged ({flagged.size})</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
