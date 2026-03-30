import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Tag, CheckCircle, ArrowLeft, Crown, Zap } from "lucide-react";
import { useAuth } from "../../components/AuthProvider";
import { supabase } from "../../../utils/supabase/client";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const planDetails: Record<string, { name: string; price: number; features: string[]; icon: any; color: string }> = {
  pro: {
    name: "Pro Plan",
    price: 499,
    features: [
      "Unlimited Mock Tests",
      "Detailed Analytics",
      "Priority Support",
      "All Exam Categories",
      "Performance Tracking",
      "PDF Downloads"
    ],
    icon: Zap,
    color: "indigo"
  },
  elite: {
    name: "Elite Plan",
    price: 999,
    features: [
      "Everything in Pro",
      "1-on-1 Mentorship",
      "Custom Study Plans",
      "Live Doubt Sessions",
      "Interview Preparation",
      "Resume Building",
      "Job Alerts"
    ],
    icon: Crown,
    color: "amber"
  }
};

export function SubscriptionCheckout() {
  const { planId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<any>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const plan = planId ? planDetails[planId.toLowerCase()] : null;

  useEffect(() => {
    loadRazorpay();
    if (!plan) {
      toast.error("Invalid plan selected");
      navigate("/pricing");
    }
  }, [planId]);

  const loadRazorpay = () => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
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

  const saveSubscription = async (discountedPrice: number) => {
    const { error } = await supabase.from("subscriptions").insert({
      user_id: user?.id,
      plan_type: planId?.toLowerCase(),
      amount_paid: discountedPrice,
      status: "active",
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
    if (!plan) return;
    setPurchasing(true);

    const discountedPrice = coupon
      ? Math.round(plan.price - (plan.price * coupon.discount_percent) / 100)
      : plan.price;

    if (discountedPrice === 0) {
      try {
        await saveSubscription(0);
        toast.success(`Welcome to ${plan.name}! 🎉`);
        navigate("/dashboard");
      } catch (err) {
        toast.error("Subscription failed");
      } finally {
        setPurchasing(false);
      }
      return;
    }

    // Razorpay payment
    if (!window.Razorpay) {
      toast.error("Payment system is loading. Please try again.");
      setPurchasing(false);
      return;
    }

    const options = {
      key: "rzp_test_1234567890abcdef", // Replace with your actual Razorpay test key
      amount: discountedPrice * 100,
      currency: "INR",
      name: "CrackToday",
      description: `${plan.name} Subscription`,
      handler: async function (response: any) {
        try {
          await saveSubscription(discountedPrice);
          toast.success(`Payment successful! Welcome to ${plan.name}! 🎉`);
          navigate("/dashboard");
        } catch (err) {
          toast.error("Payment recorded but subscription failed. Contact support.");
        } finally {
          setPurchasing(false);
        }
      },
      prefill: {
        name: user?.user_metadata?.name || "",
        email: user?.email || "",
      },
      theme: {
        color: "#4f46e5",
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
      rzp.on("payment.failed", function (response: any) {
        toast.error("Payment failed. Please try again.");
        setPurchasing(false);
      });
    } catch (err) {
      toast.error("Could not initialize payment. Please try again.");
      setPurchasing(false);
    }
  };

  if (!plan) return null;

  const discountedPrice = coupon
    ? Math.round(plan.price - (plan.price * coupon.discount_percent) / 100)
    : plan.price;

  const Icon = plan.icon;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/pricing" className="inline-flex items-center text-slate-500 hover:text-indigo-600 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Pricing
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900">Complete Your Purchase</h1>
            <p className="text-slate-500 mt-1">Review your plan and proceed to payment</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Plan Details */}
            <div className={`bg-${plan.color}-50 rounded-xl p-5 border border-${plan.color}-100`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 bg-${plan.color}-100 rounded-xl`}>
                  <Icon className={`h-6 w-6 text-${plan.color}-600`} />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-slate-900">{plan.name}</h2>
                  <p className="text-slate-500">{plan.features.length} premium features included</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">₹{discountedPrice}</p>
                  {discountedPrice !== plan.price && (
                    <p className="text-sm text-slate-400 line-through">₹{plan.price}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200/60">
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-slate-600">
                      <CheckCircle className={`h-4 w-4 mr-2 text-${plan.color}-600`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Coupon */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
              <button
                onClick={handleApplyCoupon}
                disabled={applyingCoupon || !couponCode.trim()}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                {applyingCoupon ? "Applying..." : "Apply"}
              </button>
            </div>

            {coupon && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-emerald-700">
                    Coupon applied! {coupon.discount_percent}% off
                  </span>
                </div>
                <button
                  onClick={() => { setCoupon(null); setCouponCode(""); }}
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Summary */}
            <div className="bg-slate-50 rounded-xl p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium">₹{plan.price}</span>
              </div>
              {discountedPrice !== plan.price && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">Discount</span>
                  <span className="font-medium text-emerald-600">-₹{plan.price - discountedPrice}</span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-200 flex justify-between">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-slate-900 text-lg">₹{discountedPrice}</span>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={purchasing}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {purchasing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                `Pay ₹${discountedPrice}`
              )}
            </button>

            <p className="text-center text-xs text-slate-400">
              Secure payment powered by Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
