import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../../utils/supabase/client";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { BookOpen, Asterisk } from "lucide-react";
import { toast } from "sonner";

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">

        <div>
          <Link to="/" className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-indigo-600" />
            <span className="font-bold text-3xl text-slate-900">
              crack<span className="text-indigo-600">today</span>
            </span>
          </Link>

          <h2 className="text-center text-3xl font-bold">
            Create an account
          </h2>
        </div>

        <form className="space-y-4" onSubmit={handleSignup}>

          <div>
            <Label className="flex items-center gap-1">
              Full Name <Asterisk className="h-3 w-3 text-red-500" />
            </Label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({...errors, name: undefined});
              }}
              placeholder="Your name"
              className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label className="flex items-center gap-1">
              Email <Asterisk className="h-3 w-3 text-red-500" />
            </Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({...errors, email: undefined});
              }}
              placeholder="you@gmail.com"
              className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <Label className="flex items-center gap-1">
              Password <Asterisk className="h-3 w-3 text-red-500" />
            </Label>
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
              className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Sign up"}
          </Button>

        </form>

        <p className="text-center text-sm">
          Already have account?{" "}
          <Link to="/login" className="text-indigo-600">
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}
