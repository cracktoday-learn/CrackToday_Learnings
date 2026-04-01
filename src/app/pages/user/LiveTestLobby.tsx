import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../utils/supabase/client";
import { useAuth } from "../../components/AuthProvider";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Clock, 
  PlayCircle, 
  ArrowRight,
  Loader2,
  Trophy,
  User
} from "lucide-react";

interface Participant {
  id: string;
  user_id: string;
  status: string;
  joined_at: string;
  profile?: {
    name: string;
    email: string;
  };
}

interface LiveTest {
  id: string;
  batch_id: string;
  test_number: number;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
}

export function LiveTestLobby() {
  const { liveTestId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liveTest, setLiveTest] = useState<LiveTest | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    fetchLiveTestDetails();
    const interval = setInterval(fetchLiveTestDetails, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [liveTestId]);

  useEffect(() => {
    if (liveTest) {
      const updateCountdown = () => {
        const diff = new Date(liveTest.scheduled_at).getTime() - Date.now();
        setCountdown(Math.max(0, Math.floor(diff / 1000)));
        
        // Auto-start when countdown reaches 0
        if (diff <= 0 && liveTest.status === 'scheduled') {
          startLiveTest();
        }
      };
      
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [liveTest]);

  const fetchLiveTestDetails = async () => {
    try {
      // Get live test details
      const { data: test, error: testError } = await supabase
        .from("live_tests")
        .select("*")
        .eq("id", liveTestId)
        .single();

      if (testError) throw testError;
      setLiveTest(test);

      // Get participants with profiles
      const { data: parts, error: partsError } = await supabase
        .from("live_test_participants")
        .select(`
          *,
          profile:profiles(name, email)
        `)
        .eq("live_test_id", liveTestId);

      if (partsError) throw partsError;
      setParticipants(parts || []);

      // Check if already ready
      const myParticipation = parts?.find((p: any) => p.user_id === user?.id);
      setIsReady(myParticipation?.status === 'joined');

      // If test is live and user is ready, auto-redirect to test
      if (test.status === 'live' && myParticipation?.status === 'joined') {
        navigate(`/live-test/${liveTestId}/take`);
      }
    } catch (err) {
      toast.error("Failed to load live test details");
    } finally {
      setLoading(false);
    }
  };

  const startLiveTest = async () => {
    try {
      await supabase
        .from("live_tests")
        .update({ status: 'live', started_at: new Date().toISOString() })
        .eq("id", liveTestId);
    } catch (err) {
      console.error("Failed to start live test", err);
    }
  };

  const handleReady = async () => {
    try {
      const { error } = await supabase
        .from("live_test_participants")
        .update({ status: 'joined', joined_at: new Date().toISOString() })
        .eq("live_test_id", liveTestId)
        .eq("user_id", user?.id);

      if (error) throw error;

      setIsReady(true);
      toast.success("You're ready! Waiting for the test to start...");
      fetchLiveTestDetails();
    } catch (err) {
      toast.error("Failed to join");
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const readyCount = participants.filter(p => p.status === 'joined').length;
  const totalCount = participants.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!liveTest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Live test not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl"
          animate={{ 
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{ 
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 text-indigo-300 mb-6">
            <Trophy className="h-5 w-5" />
            <span className="font-medium">Live Competition</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Test #{liveTest.test_number} Lobby
          </h1>
          <p className="text-slate-400 text-lg">
            Get ready to compete with {totalCount} other learners
          </p>
        </motion.div>

        {/* Countdown Timer */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-slate-400 mb-4">Test starts in</p>
          <div className="text-7xl md:text-8xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            {formatCountdown(countdown)}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="grid grid-cols-3 gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10">
            <Users className="h-8 w-8 mx-auto mb-2 text-indigo-400" />
            <p className="text-3xl font-bold">{totalCount}</p>
            <p className="text-slate-400 text-sm">Total Joined</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10">
            <PlayCircle className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
            <p className="text-3xl font-bold">{readyCount}</p>
            <p className="text-slate-400 text-sm">Ready to Start</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10">
            <Clock className="h-8 w-8 mx-auto mb-2 text-amber-400" />
            <p className="text-3xl font-bold">{liveTest.duration_minutes}</p>
            <p className="text-slate-400 text-sm">Minutes</p>
          </div>
        </motion.div>

        {/* Ready Button */}
        {!isReady && countdown > 0 && (
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <motion.button
              onClick={handleReady}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-12 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-500/30"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              I'm Ready! <ArrowRight className="h-5 w-5 inline ml-2" />
            </motion.button>
            <p className="text-slate-400 mt-3">Click when you're ready to start</p>
          </motion.div>
        )}

        {isReady && (
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500/20 text-emerald-300">
              <PlayCircle className="h-5 w-5" />
              <span className="font-semibold">You're ready! Waiting for others...</span>
            </div>
          </motion.div>
        )}

        {/* Participants List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participants ({totalCount})
          </h2>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <AnimatePresence>
                {participants.map((participant, index) => (
                  <motion.div
                    key={participant.id}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      participant.status === 'joined' 
                        ? 'bg-emerald-500/20 border border-emerald-500/30' 
                        : 'bg-white/5 border border-white/10'
                    }`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-500/30 flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {participant.profile?.name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {participant.status === 'joined' ? 'Ready' : 'Registered'}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
