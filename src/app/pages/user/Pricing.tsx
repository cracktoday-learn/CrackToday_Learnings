import React from 'react';
import { CheckCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Pricing() {
  const plans = [
    {
      name: "Basic",
      price: "Free",
      description: "Perfect for getting started with your preparation",
      features: [
        "1 Free Mock Test per week",
        "Basic Performance Analytics",
        "Access to Previous Year Papers",
        "Daily Current Affairs updates"
      ],
      notIncluded: [
        "Detailed Solution Explanations",
        "All India Ranking",
        "1-on-1 Mentorship",
        "Ad-free Experience"
      ],
      buttonText: "Start for Free",
      popular: false
    },
    {
      name: "Pro",
      price: "₹499",
      period: "/month",
      description: "Everything you need to crack your target exam",
      features: [
        "Unlimited Mock Tests",
        "Advanced Performance Analytics",
        "Access to Previous Year Papers",
        "Daily Current Affairs updates",
        "Detailed Solution Explanations",
        "All India Ranking",
        "Ad-free Experience"
      ],
      notIncluded: [
        "1-on-1 Mentorship"
      ],
      buttonText: "Get Pro",
      popular: true
    },
    {
      name: "Elite",
      price: "₹999",
      period: "/month",
      description: "Personalized guidance for guaranteed success",
      features: [
        "Everything in Pro",
        "1-on-1 Mentorship sessions",
        "Personalized Study Plan",
        "Priority Support",
        "Physical Study Materials",
        "Interview Preparation"
      ],
      notIncluded: [],
      buttonText: "Join Elite",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Simple, transparent pricing</h1>
          <p className="text-xl text-slate-500">
            Choose the perfect plan to accelerate your government exam preparation journey. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div 
              key={plan.name} 
              className={`bg-white rounded-3xl p-8 border-2 flex flex-col ${
                plan.popular 
                  ? "border-indigo-600 shadow-2xl relative scale-105 z-10" 
                  : "border-slate-200 shadow-lg"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold tracking-wide shadow-md">
                  MOST POPULAR
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-slate-500 h-12">{plan.description}</p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-5xl font-extrabold text-slate-900">{plan.price}</span>
                  {plan.period && <span className="text-lg text-slate-500 ml-1">{plan.period}</span>}
                </div>
              </div>

              <div className="flex-1">
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={`feature-${i}`} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                  {plan.notIncluded && plan.notIncluded.map((feature, i) => (
                    <li key={`not-${i}`} className="flex items-start opacity-50">
                      <X className="h-5 w-5 text-slate-400 mr-3 shrink-0 mt-0.5" />
                      <span className="text-slate-500 line-through">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link 
                to={plan.name === "Basic" ? "/dashboard" : `/checkout/subscription/${plan.name.toLowerCase()}`} 
                className={`w-full py-4 px-6 rounded-xl font-bold text-center transition-all ${
                  plan.popular
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-xl"
                    : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                }`}
              >
                {plan.buttonText}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Still have questions?</h3>
          <p className="text-slate-500 mb-6">Can't find the answer you're looking for? Please chat to our friendly team.</p>
          <button className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}