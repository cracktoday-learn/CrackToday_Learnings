import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserCircle, Mail, Calendar, ShoppingBag, Lock, Edit2, Save, X, LogOut, ArrowLeft, Camera, Loader2 } from "lucide-react";
import { useAuth } from "../../components/AuthProvider";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";

export function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.user_metadata?.name || "");
  const [savingName, setSavingName] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPurchases();
    fetchProfile();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("purchases")
        .select("*, batches(name, exam_type, total_tests, price)")
        .eq("user_id", user?.id);
      setPurchases(data || []);
    } catch (err) {
      toast.error("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
          // Max dimensions for low MP (0.5MP = ~500KB)
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.8 quality for high quality but small size
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Compression failed"));
            },
            "image/jpeg",
            0.8
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    
    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Max 5MB before compression");
      return;
    }
    
    setUploading(true);
    try {
      // Compress image
      toast.info("Compressing image...");
      const compressedBlob = await compressImage(file);
      
      // Create file from blob
      const compressedFile = new File([compressedBlob], `${user.id}.jpg`, {
        type: "image/jpeg",
      });
      
      // Upload to Supabase Storage
      const filePath = `avatars/${user.id}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, compressedFile, {
          upsert: true,
          contentType: "image/jpeg",
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("profiles")
        .getPublicUrl(filePath);
      
      // Update profiles table
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        });
      
      if (updateError) throw updateError;
      
      setAvatarUrl(publicUrl);
      toast.success("Profile picture updated!");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSaveName = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSavingName(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: name.trim() }
      });
      if (error) throw error;
      toast.success("Name updated successfully!");
      setEditingName(false);
    } catch (err) {
      toast.error("Failed to update name");
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("Please fill both password fields");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });
      if (error) throw error;
      toast.success("Password changed successfully!");
      setChangingPassword(false);
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error("Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Back button */}
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Profile</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl border-2 border-indigo-200 relative">
            {avatarUrl ? <img src={avatarUrl} className="w-full h-full rounded-full object-cover" /> : (user?.user_metadata?.name || user?.email)?.charAt(0).toUpperCase()}
            <button onClick={triggerFileInput} disabled={uploading} className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 text-white rounded-full text-xs">
              {uploading ? <Loader2 className="animate-spin" /> : <Camera />}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {user?.user_metadata?.name || user?.email?.split("@")[0]}
            </h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">

          {/* Name */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <UserCircle className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Full Name</p>
                {editingName ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 px-3 py-1.5 border border-indigo-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="Enter your name"
                    autoFocus
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-900">
                    {user?.user_metadata?.name || "Not set"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {editingName ? (
                <>
                  <button
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {savingName ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => { setEditingName(false); setName(user?.user_metadata?.name || ""); }}
                    className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <Mail className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 font-medium">Email Address</p>
              <p className="text-sm font-semibold text-slate-900">{user?.email}</p>
            </div>
          </div>

          {/* Joined Date */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <Calendar className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 font-medium">Member Since</p>
              <p className="text-sm font-semibold text-slate-900">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-IN", {
                  day: "numeric", month: "long", year: "numeric"
                }) : "—"}
              </p>
            </div>
          </div>

        </div>

        {/* Save Changes Button - Only show when editing */}
        {editingName && (
          <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              onClick={() => { setEditingName(false); setName(user?.user_metadata?.name || ""); }}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveName}
              disabled={savingName}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {savingName ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-slate-400" />
            <h3 className="text-lg font-bold text-slate-900">Password</h3>
          </div>
          {!changingPassword && (
            <button
              onClick={() => setChangingPassword(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" /> Change Password
            </button>
          )}
        </div>

        {changingPassword ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">New Password</label>
              <input
                type="password"
                placeholder="Min. 6 characters"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Confirm New Password</label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleChangePassword}
                disabled={savingPassword}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {savingPassword ? "Saving..." : "Update Password"}
              </button>
              <button
                onClick={() => { setChangingPassword(false); setPasswordForm({ newPassword: "", confirmPassword: "" }); }}
                className="bg-white border border-slate-200 text-slate-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">••••••••••••</p>
        )}
      </div>

      {/* Purchased Batches */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="h-5 w-5 text-slate-400" />
          <h3 className="text-lg font-bold text-slate-900">My Purchased Batches</h3>
          <span className="ml-auto text-sm text-slate-500">{purchases.length} total</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No purchases yet.</p>
            <Link to="/pricing" className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Browse Plans →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.map((purchase) => (
              <div key={purchase.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{purchase.batches?.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {purchase.batches?.exam_type} • {purchase.batches?.total_tests} tests
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-600">₹{purchase.batches?.price}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(purchase.purchased_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric"
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors border border-red-200"
      >
        <LogOut className="h-4 w-4" />
        Logout from Account
      </button>

    </div>
  );
}
