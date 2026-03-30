import { Link, Outlet, useNavigate } from "react-router-dom";
import { BookOpen, User, LogOut, Trophy } from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { AdminLink } from "../components/AdminLink";
import { supabase } from "../../utils/supabase/client";
import { toast } from "sonner";

export function MainLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Logged out successfully");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-indigo-600" />
              <span className="font-bold text-xl text-slate-900 tracking-tight">crack<span className="text-indigo-600">today</span></span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Home</Link>
              <Link to="/exams" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Exams</Link>
              <Link to="/rankings" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Rankings</Link>
              <Link to="/pricing" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Pricing</Link>
            </nav>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <AdminLink />
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition-colors text-sm font-medium">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                    Login
                  </Link>
                  <Link to="/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <BookOpen className="h-6 w-6 text-indigo-600" />
                <span className="font-bold text-xl text-slate-900 tracking-tight">crack<span className="text-indigo-600">today</span></span>
              </Link>
              <p className="text-slate-500 text-sm max-w-sm">
                Your ultimate destination for government exam preparation. High-quality test batches, detailed analytics, and expert guidance.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-slate-500 hover:text-indigo-600">About Us</a></li>
                <li><a href="#" className="text-sm text-slate-500 hover:text-indigo-600">Contact</a></li>
                <li><a href="#" className="text-sm text-slate-500 hover:text-indigo-600">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-slate-500 hover:text-indigo-600">Privacy Policy</a></li>
                <li><a href="#" className="text-sm text-slate-500 hover:text-indigo-600">Terms of Service</a></li>
                <li><a href="#" className="text-sm text-slate-500 hover:text-indigo-600">Refund Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-400">© 2026 CrackToday. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
