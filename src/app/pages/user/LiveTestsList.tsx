import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../utils/supabase/client";
import { useAuth } from "../../components/AuthProvider";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  Users, 
  Trophy, 
  ArrowLeft, 
  PlayCircle,
  Loader2,
  CheckCircle
} from "lucide-react";

interface LiveTest {
  id: string;
  batch_id: string;
  test_number: number;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  created_by: string;
  participant_count?: number;
  is_registered?: boolean;
}

export function LiveTestsList() {
  const { batchId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liveTests, setLiveTests] = useState<LiveTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [batchName, setBatchName] = useState("");

  useEffect(() => {
    fetchLiveTests();
    fetchBatchDetails();
  }, [batchId]);

  const fetchBatchDetails = async () => {
    const { data } = await supabase
      .from("batches")
      .select("name")
      .eq("id", batchId)
      .single();
    if (data) setBatchName(data.name);
  };

  const fetchLiveTests = async () => {
    setLoading(true);
    try {
      // Get live tests with participant count and user registration status
      const { data: tests, error } = await supabase
        .from("live_tests")
        .select(`
          *,
          participants:live_test_participants(count),
          my_registration:live_test_participants!inner(user_id)
        `)
        .eq("batch_id", batchId)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true });

      if (error) throw error;

      // Format the data
      const formattedTests = tests?.map((test: any) => ({
        ...test,
        participant_count: test.participants?.[0]?.count || 0,
        is_registered: test.my_registration?.length > 0
      })) || [];

      setLiveTests(formattedTests);
    } catch (err) {
      toast.error("Failed to load live tests");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLiveTest = async () => {
    setCreating(true);
    try {
      // Schedule 30 minutes from now by default
      const scheduledTime = new Date(Date.now() + 30 * 60000);
      
      const { data, error } = await supabase
        .from("live_tests")
        .insert({
          batch_id: batchId,
          test_number: 1, // Default to test 1, could be selected
          scheduled_at: scheduledTime.toISOString(),
          duration_minutes: 60,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-register the creator
      await supabase.from("live_test_participants").insert({
        live_test_id: data.id,
        user_id: user?.id,
        status: 'registered'
      });

      toast.success("Live test scheduled! Starting in 30 minutes");
      fetchLiveTests();
    } catch (err) {
      toast.error("Failed to schedule live test");
    } finally {
      setCreating(false);
    }
  };

  const handleRegister = async (liveTestId: string) => {
    try {
      const { error } = await supabase.from("live_test_participants").insert({
        live_test_id: liveTestId,
        user_id: user?.id,
        status: 'registered'
      });

      if (error) throw error;

      toast.success("Registered for live test!");
      fetchLiveTests();
    } catch (err) {
      toast.error("Failed to register");
    }
  };

  const handleJoinLiveTest = (liveTestId: string) => {
    navigate(`/live-test/${liveTestId}/lobby`);
  };

  const formatTimeRemaining = (scheduledAt: string) => {
    const diff = new Date(scheduledAt).getTime() - Date.now();
    if (diff < 0) return "Starting now...";
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Live Test Competitions</h1>
          <p className="text-slate-500 mt-2">{batchName} - Compete with other learners in real-time</p>
        </motion.div>

        {/* Create New Live Test */}
        <motion.div 
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Start a Live Competition</h2>
              <p className="text-sm text-slate-500 mt-1">
                Schedule a test and compete with other learners in real-time
              </p>
            </div>
            <motion.button
              onClick={handleCreateLiveTest}
              disabled={creating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {creating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <PlayCircle className="h-5 w-5" />
                  Schedule Now
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Upcoming Live Tests */}
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Upcoming Competitions</h2>
        
        {liveTests.length === 0 ? (
          <motion.div 
            className="text-center py-12 bg-white rounded-2xl border border-slate-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Trophy className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No live competitions scheduled</h3>
            <p className="text-slate-500 mt-2">Be the first to schedule a live test!</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {liveTests.map((test, index) => (
              <motion.div
                key={test.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <Trophy className="h-7 w-7 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Live Test #{test.test_number}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(test.scheduled_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(test.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {test.participant_count} joined
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Countdown */}
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Starting in</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {formatTimeRemaining(test.scheduled_at)}
                      </p>
                    </div>

                    {/* Action Button */}
                    {test.is_registered ? (
                      test.status === 'live' ? (
                        <motion.button
                          onClick={() => handleJoinLiveTest(test.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Join Now
                        </motion.button>
                      ) : (
                        <div className="flex items-center gap-2 text-emerald-600 font-medium">
                          <CheckCircle className="h-5 w-5" />
                          Registered
                        </div>
                      )
                    ) : (
                      <motion.button
                        onClick={() => handleRegister(test.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Register
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
