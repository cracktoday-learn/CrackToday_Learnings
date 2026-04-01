import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "../../../utils/supabase/client";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { BookOpen, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const inputFocus = {
  scale: 1.02,
  transition: { duration: 0.2 }
};

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      const params = new URLSearchParams(location.search);
      const redirectTo = params.get("redirect") || "/dashboard";

      toast.success("Login successful");

      // Admin check (change admin email here)
      const adminEmail = "admin@gmail.com";

      if (email === adminEmail) {
        navigate("/admin");
      } else {
        navigate(redirectTo);
      }

    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 relative overflow-hidden">
      {/* Animated Background */}
      <motion.div 
        className="absolute inset-0 z-0"
        animate={{
          background: [
            "radial-gradient(ellipse at 20% 30%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)",
            "radial-gradient(ellipse at 80% 70%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)",
            "radial-gradient(ellipse at 20% 30%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)"
          ]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div 
        className="max-w-md w-full space-y-8 relative z-10"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        
        <motion.div variants={fadeInUp}>
          <Link to="/" className="flex items-center justify-center gap-2 mb-4">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <BookOpen className="h-8 w-8 text-indigo-600" />
            </motion.div>
            <span className="font-bold text-3xl text-slate-900">
              crack<span className="text-indigo-600">today</span>
            </span>
          </Link>

          <motion.h2 
            className="text-center text-3xl font-bold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            Welcome Back
          </motion.h2>
          <motion.p 
            className="text-center text-slate-500 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Sign in to continue your preparation
          </motion.p>
        </motion.div>

        <motion.form 
          className="space-y-5 bg-white p-8 rounded-2xl shadow-lg border border-slate-100" 
          onSubmit={handleLogin}
          variants={fadeInUp}
        >
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Label className="text-slate-700">Email</Label>
            <motion.div whileFocus={inputFocus}>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-indigo-200"
              />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Label className="text-slate-700">Password</Label>
            <motion.div whileFocus={inputFocus}>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-indigo-200"
              />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-200"
                disabled={loading}
              >
                {loading ? (
                  <motion.span 
                    className="flex items-center justify-center gap-2"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Signing in...
                  </motion.span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </motion.div>
          </motion.div>

          <motion.div 
            className="text-center pt-4 border-t border-slate-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-sm text-slate-500">
              Don't have an account?{" "}
              <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline transition-colors">
                Sign up
              </Link>
              {new URLSearchParams(location.search).get("redirect") && (
                <span className="text-slate-400">·</span>
              )}
              {new URLSearchParams(location.search).get("redirect") && (
                <Link 
                  to={`/signup?redirect=${new URLSearchParams(location.search).get("redirect")}`}
                  className="text-slate-500 hover:text-slate-600 text-xs"
                >
                  New user? Create account to continue
                </Link>
              )}
            </p>
          </motion.div>

        </motion.form>

      </motion.div>
    </div>
  );
}