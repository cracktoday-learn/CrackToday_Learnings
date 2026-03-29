import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";
import { PlayCircle } from "lucide-react";

interface Question {
  id: string;
  batch_id: string;
  question_text: string;
  options: string[];
  correct_option: string;
}

export function TestPage() {
  const { batch_id } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => { fetchQuestions(); }, [batch_id]);

  useEffect(() => {
    if (timeLeft <= 0) return handleSubmit();
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from<Question>("questions").select("*").eq("batch_id", batch_id);
      if (error) throw error;
      setQuestions(data || []);
    } catch (err) { console.error(err); toast.error("Failed to load questions"); }
    finally { setLoading(false); }
  };

  const handleSelect = (qId: string, option: string) => setAnswers({ ...answers, [qId]: option });

  const handleSubmit = () => {
    let score = 0;
    questions.forEach(q => { if (answers[q.id] === q.correct_option) score += 1; });
    localStorage.setItem("lastScore", JSON.stringify({ score, total: questions.length }));
    navigate("/result");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Test</h1>
        <div className="text-sm font-medium text-indigo-600">
          Time Left: {Math.floor(timeLeft/60).toString().padStart(2,'0')}:{(timeLeft%60).toString().padStart(2,'0')}
        </div>
      </div>
      <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
        {questions.map((q, index) => (
          <div key={q.id} className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold mb-3">Q{index+1}: {q.question_text}</h3>
            <div className="space-y-2">
              {q.options.map((opt, idx) => {
                const optionKey = String.fromCharCode(65+idx);
                return (
                  <label key={optionKey} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={q.id}
                      value={optionKey}
                      checked={answers[q.id] === optionKey}
                      onChange={() => handleSelect(q.id, optionKey)}
                      className="h-4 w-4 text-indigo-600"
                      required
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg flex items-center justify-center gap-2">
          <PlayCircle className="h-4 w-4" /> Submit Test
        </button>
      </form>
    </div>
  );
}
