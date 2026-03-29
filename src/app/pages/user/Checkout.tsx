import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Tag, CheckCircle, ArrowLeft, ShoppingBag } from "lucide-react";
import { useAuth } from "../../components/AuthProvider";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";

interface Batch {
  id: string;
  name: string;
  description: string;
  price: number;
  total_tests: number;
  exam_type: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function Checkout() {
  const { batchId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<any>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [alreadyPurchased, setAlreadyPurchased] = useState(false);

  useEffect(() => {
    fetchBatch();
    checkAlreadyPurchased();
    loadRazorpay();
  }, [batchId]);

  const loadRazorpay = () => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  };

  const fetchBatch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("batches").select("*").eq("id", batchId).single();
      if (error) throw error;
      setBatch(data);
    } catch (err) {
      toast.error("Failed to load batch");
    } finally {
      setLoading(false);
    }
  };

  const checkAlreadyPurchased = async () => {
    const { data } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", user?.id)
      .eq("batch_id", batchId)
      .single();
    setAlreadyPurchased(!!data);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    setApplyingCoupon(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase().trim())
        .eq("is_active", true)
        .single();

      if (error || !data) {
        toast.error("Invalid coupon code!");
        setCoupon(null);
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast.error("This coupon has expired!");
        setCoupon(null);
        return;
      }

      if (data.used_count >= data.max_uses) {
        toast.error("This coupon has reached its usage limit!");
        setCoupon(null);
        return;
      }

      setCoupon(data);
      toast.success(`Coupon applied! ${data.discount_percent}% discount!`);
    } catch (err) {
      toast.error("Failed to apply coupon");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const savePurchase = async (discountedPrice: number) => {
    const { error } = await supabase.from("purchases").insert({
      user_id: user?.id,
      batch_id: batchId,
      amount_paid: discountedPrice,
    });

    if (error) throw error;

    if (coupon) {
      await supabase
        .from("coupons")
        .update({ used_count: coupon.used_count + 1 })
        .eq("id", coupon.id);
    }
  };

  const handlePayment = async () => {
    if (!batch) return;
    setPurchasing(true);

    const discountedPrice = coupon
      ? Math.round(batch.price - (batch.price * coupon.discount_percent) / 100)
      : batch.price;

    // If price is 0 after discount, purchase directly
    if (discountedPrice === 0) {
      try {
        await savePurchase(0);
        toast.success("Enrolled for free! 🎉");
        navigate("/dashboard");
      } catch (err) {
        toast.error("Purchase failed");
      } finally {
        setPurchasing(false);
      }
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: discountedPrice * 100, // Razorpay uses paise
      currency: "INR",
      name: "CrackToday",
      description: batch.name,
      image: "https://cracktoday.vercel.app/favicon.ico",
      handler: async function (response: any) {
        try {
          await savePurchase(discountedPrice);
          toast.success("Payment successful! 🎉");
          navigate("/dashboard");
        } catch (err) {
          toast.error("Payment done but enrollment failed. Contact support.");
        }
      },
      prefill: {
        email: user?.email,
        name: user?.user_metadata?.name || user?.email?.split("@")[0],
      },
      theme: {
        color: "#4F46E5",
      },
      modal: {
        ondismiss: function () {
          setPurchasing(false);
          toast.error("Payment cancelled");
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error("Payment gateway failed to load. Please try again.");
      setPurchasing(false);
    }
  };

  const discountedPrice = coupon && batch
    ? Math.round(batch.price - (batch.price * coupon.discount_percent) / 100)
    : batch?.price || 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Batch not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">Checkout</h1>

      {/* Batch Details */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-slate-900 text-lg">{batch.name}</h2>
            <p className="text-sm text-slate-500 mt-1">{batch.exam_type} • {batch.total_tests} tests</p>
            <p className="text-sm text-slate-600 mt-2">{batch.description}</p>
          </div>
        </div>
      </div>

      {/* Already Purchased */}
      {alreadyPurchased ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
          <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
          <h3 className="font-bold text-emerald-900 mb-1">Already Purchased!</h3>
          <p className="text-sm text-emerald-700 mb-4">You already have access to this batch.</p>
          <Link to={`/test/${batch.id}`} className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors">
            Start Test
          </Link>
        </div>
      ) : (
        <>
          {/* Coupon Code */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4 text-indigo-600" /> Apply Coupon
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCoupon(null); }}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={applyingCoupon}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {applyingCoupon ? "Checking..." : "Apply"}
              </button>
            </div>
            {coupon && (
              <div className="mt-3 flex items-center gap-2 text-emerald-600 text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                {coupon.discount_percent}% discount applied!
              </div>
            )}
          </div>

          {/* Price Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <h3 className="font-bold text-slate-900 mb-4">Price Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Original Price</span>
                <span className="font-medium text-slate-900">₹{batch.price}</span>
              </div>
              {coupon && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">Discount ({coupon.discount_percent}%)</span>
                  <span className="font-medium text-emerald-600">
                    - ✅{Math.round(batch.price * coupon.discount_percent / 100)}
                  </span>
                </div>
              )}
              <div className="border-t border-slate-100 pt-2 mt-2 flex justify-between">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-xl text-indigo-600">₹{discountedPrice}</span>
              </div>
            </div>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePayment}
            disabled={purchasing}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-200"
          >
            {purchasing ? "Opening Payment..." : discountedPrice === 0 ? "Enroll for Free!" : `Pay ₹${discountedPrice} with Razorpay`}
          </button>
          <p className="text-xs text-slate-400 text-center mt-3">
            Secured by Razorpay 🔒
          </p>
        </>
      )}
    </div>
  );
}
