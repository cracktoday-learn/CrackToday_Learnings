import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../../utils/supabase/client";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { BookOpen, Asterisk, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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

const shakeAnimation = {
  x: [0, -10, 10, -10, 10, 0],
  transition: { duration: 0.4 }
};

export function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{name?: string; email?: string; password?: string}>({});

  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: {name?: string; email?: string; password?: string} = {};
    
    if (!name.trim()) {
      newErrors.name = "Full name is required";
    }
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Account created successfully");
        navigate("/login");
      }

    } catch (error) {
      console.error(error);
      toast.error("Signup failed");
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
            Join CrackToday
          </motion.h2>
          <motion.p 
            className="text-center text-slate-500 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Start your exam preparation journey
          </motion.p>
        </motion.div>

        <motion.form 
          className="space-y-5 bg-white p-8 rounded-2xl shadow-lg border border-slate-100" 
          onSubmit={handleSignup}
          variants={fadeInUp}
        >

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Label className="flex items-center gap-1 text-slate-700">
              Full Name <Asterisk className="h-3 w-3 text-red-500" />
            </Label>
            <motion.div whileFocus={{ scale: 1.02 }}>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({...errors, name: undefined});
                }}
                placeholder="Your name"
                className={`mt-1 transition-all duration-200 ${errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
            </motion.div>
            <AnimatePresence>
              {errors.name && (
                <motion.p 
                  className="text-xs text-red-500 mt-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {errors.name}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Label className="flex items-center gap-1 text-slate-700">
              Email <Asterisk className="h-3 w-3 text-red-500" />
            </Label>
            <motion.div whileFocus={{ scale: 1.02 }}>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({...errors, email: undefined});
                }}
                placeholder="you@gmail.com"
                className={`mt-1 transition-all duration-200 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
            </motion.div>
            <AnimatePresence>
              {errors.email && (
                <motion.p 
                  className="text-xs text-red-500 mt-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {errors.email}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Label className="flex items-center gap-1 text-slate-700">
              Password <Asterisk className="h-3 w-3 text-red-500" />
            </Label>
            <motion.div whileFocus={{ scale: 1.02 }}>
              <Input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({...errors, password: undefined});
                }}
                placeholder="******"
                className={`mt-1 transition-all duration-200 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
            </motion.div>
            <AnimatePresence>
              {errors.password && (
                <motion.p 
                  className="text-xs text-red-500 mt-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {errors.password}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <motion.div 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
              animate={Object.keys(errors).length > 0 && (errors.name || errors.email || errors.password) ? shakeAnimation : {}}
            >
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
                    Creating account...
                  </motion.span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4" /> Create Account <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </motion.div>
          </motion.div>

          <motion.div 
            className="text-center pt-4 border-t border-slate-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline transition-colors">
                Sign in
              </Link>
            </p>
          </motion.div>

        </motion.form>

      </motion.div>
    </div>
  );
}
