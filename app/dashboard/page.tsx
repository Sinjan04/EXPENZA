"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

function useCountUp(end: number, duration: number = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // easeOutExpo for that premium snap-and-slow-down feel
      const easeOut = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      
      setCount(end * easeOut);

      if (progress < duration) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState({
    balance: 0,
    totalIncome: 0,
    totalExpense: 0,
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
const [animateCharts, setAnimateCharts] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
const [showInsights, setShowInsights] = useState(false);
  const [showHealthDetails, setShowHealthDetails] = useState(false);
const [transactionError, setTransactionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
// Retention System State
  const [showReminder, setShowReminder] = useState(false);
  const [reminderConfig, setReminderConfig] = useState({ tag: "", title: "", text: "", accentColor: "#f0c040" });

  // Retention System Logic
  useEffect(() => {
    if (!transactions || transactions.length === 0) return;

    try {
      // Find the most recent transaction
      const latestTx = transactions.reduce((latest: any, current: any) => {
        return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest;
      });

      const latestDate = new Date(latestTx.createdAt);
      const now = new Date();
      
      const diffTime = now.getTime() - latestDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      const todayStr = now.toISOString().split('T')[0];
      const dismissedDate = localStorage.getItem("expenza_reminder_dismissed");

      if (dismissedDate === todayStr) {
        setShowReminder(false);
        return;
      }

      // Premium Intelligence Levels
      if (diffDays >= 7) {
        setReminderConfig({ 
          tag: "ACTION REQUIRED", 
          title: "Tracking Paused",
          text: "Your ledger hasn't been updated in over a week. Log recent activity to restore insight accuracy.", 
          accentColor: "#f87171" // Red
        });
        setShowReminder(true);
      } else if (diffDays >= 3) {
        setReminderConfig({ 
          tag: "CONSISTENCY", 
          title: "Mind the Gap",
          text: "A few days have slipped by. Quick-log your recent expenses to keep the momentum going.", 
          accentColor: "#f0c040" // Gold
        });
        setShowReminder(true);
      } else if (diffDays >= 1) {
        setReminderConfig({ 
          tag: "DAILY INSIGHT", 
          title: "End of Day Sync",
          text: "Don't forget to log today's cashflow. Small daily habits build immense financial clarity.", 
          accentColor: "#34d399" // Green
        });
        setShowReminder(true);
      } else {
        setShowReminder(false);
      }
    } catch (err) {
      console.error("Reminder calculation bypassed.");
    }
  }, [transactions]);

  const dismissReminder = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem("expenza_reminder_dismissed", todayStr);
    setShowReminder(false);
  };

  const fetchDashboard = async () => {
    const token = localStorage.getItem("token");

    const response = await fetch("/api/dashboard", {
      headers: {
        authorization: token || "",
      },
    });

const data = await response.json();

console.log("Dashboard API Response:", data);

if (!data.error) {
  setDashboardData(data);
} else {
  console.error("Dashboard Error:", data);
  setDashboardData({
    balance: 0,
    totalIncome: 0,
    totalExpense: 0,
  });
}
    const transactionResponse = await fetch("/api/transactions", {
      headers: {
        authorization: token || "",
      },
    });

    const transactionData = await transactionResponse.json();

console.log("Transactions API Response:", transactionData);

if (Array.isArray(transactionData)) {
  setTransactions(transactionData);
} else {
  console.error("Transactions is not an array:", transactionData);
  setTransactions([]);
}

// Trigger chart fill animations slightly after data binds
setTimeout(() => setAnimateCharts(true), 10);

// Add a tiny artificial delay to let the skeleton animation breathe,
setTimeout(() => setIsLoading(false), 300);
  };

useEffect(() => {
  const token = localStorage.getItem("token");

  if (token) {
    fetchDashboard();
    return;
  }

  // Google session check
  fetch("/api/auth/session")
    .then((res) => res.json())
    .then((session) => {
      if (session?.user) {
        fetchDashboard();
      } else {
        window.location.href = "/auth";
      }
    });
}, []);

  const handleDeleteTransaction = async (transactionId: string) => {
    const token = localStorage.getItem("token");

    await fetch(`/api/transactions?id=${transactionId}`, {
      method: "DELETE",
      headers: {
        authorization: token || "",
      },
    });

    await fetchDashboard();
  };

  const handleAddTransaction = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setTransactionError("");
    const numAmount = Number(amount);
    
    if (!amount || numAmount <= 0) {
      setTransactionError("Amount must be greater than ₹0.");
      setIsSubmitting(false);
      return;
    }
    if (!category) {
      setTransactionError("Please select a category.");
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || "",
        },
        body: JSON.stringify({
          amount: numAmount,
          type,
          category,
          note,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        setTransactionError(errData.error || "Failed to save transaction.");
        setIsSubmitting(false);
        return;
      }

      await fetchDashboard();

      setShowModal(false);
      setAmount("");
      setCategory("");
      setNote("");
      setType("expense");
    } catch (err) {
      setTransactionError("A network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const getCategoryEmoji = (cat: string) => {
    const map: Record<string, string> = {
      Food: "🍔",
      Transport: "🚗",
      Shopping: "🛍️",
      Entertainment: "🎬",
      Bills: "🧾",
      Health: "💊",
      Education: "📚",
      Salary: "💰",
      Freelance: "💻",
      Investment: "📈",
      Gift: "🎁",
      Other: "📦",
    };
    return map[cat] || "💳";
  };

  const savings = dashboardData.totalIncome - dashboardData.totalExpense;

  const animatedBalance = useCountUp(dashboardData.balance);
  const animatedIncome = useCountUp(dashboardData.totalIncome);
  const animatedExpense = useCountUp(dashboardData.totalExpense);
  const animatedSavings = useCountUp(savings);

  // Derive insights and chart data purely from existing state
  const expensesByCategory = useMemo(() => {
  if (!Array.isArray(transactions)) return [];

  const expenses = transactions.filter(
    (t) => t.type === "expense"
  );
    const grouped = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const highestExpense = expensesByCategory.length > 0 ? expensesByCategory[0] : null;
  const pieColors = ['#f87171', '#f0c040', '#34d399', '#3b82f6', '#a855f7', '#ec4899', '#8b5cf6', '#14b8a6'];

  // Daily Velocity & Runway Calculations
  const currentDay = new Date().getDate();
  const dailyVelocity = dashboardData.totalExpense / currentDay;
  const runwayDays = dailyVelocity > 0 ? Math.floor(dashboardData.balance / dailyVelocity) : 0;

  // Financial Health Score Calculation
  const healthScore = useMemo(() => {
    let savingsScore = 0;
    let runwayScore = 0;
    let cashflowScore = 0;

    const savingsRate = dashboardData.totalIncome > 0 
      ? ((dashboardData.totalIncome - dashboardData.totalExpense) / dashboardData.totalIncome) * 100 
      : 0;

    if (savingsRate > 30) savingsScore = 40;
    else if (savingsRate >= 20) savingsScore = 30;
    else if (savingsRate >= 10) savingsScore = 20;
    else if (savingsRate > 0) savingsScore = 10;
    else savingsScore = 0;

    if (runwayDays > 60) runwayScore = 30;
    else if (runwayDays >= 30) runwayScore = 20;
    else if (runwayDays >= 14) runwayScore = 10;
    else runwayScore = 0;

    if (dashboardData.totalIncome > dashboardData.totalExpense) cashflowScore = 30;
    else cashflowScore = 0;

    const total = savingsScore + runwayScore + cashflowScore;
    
    let status = "Needs Attention";
    let color = "text-[#f87171]"; // Red
    let bg = "bg-[#f87171]/10";
    let message = "Expenses are consuming most of your income. Consider reviewing spending patterns.";
    
    if (total >= 90) {
      status = "Excellent";
      color = "text-[#34d399]"; // Emerald
      bg = "bg-[#34d399]/10";
      message = "Your finances are in a strong position with healthy savings and spending habits.";
    } else if (total >= 75) {
      status = "Good";
      color = "text-[#10b981]"; // Green
      bg = "bg-[#10b981]/10";
      message = "You maintain positive cashflow and solid financial stability.";
    } else if (total >= 50) {
      status = "Fair";
      color = "text-[#f0c040]"; // Amber
      bg = "bg-[#f0c040]/10";
      message = "There is room to improve your savings rate and reduce spending.";
    }

    return { total, savingsScore, runwayScore, cashflowScore, status, color, bg, message };
  }, [dashboardData, runwayDays]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

 // Group transactions by time periods (Strictly limited to Top 3 for Dashboard)
  const groupedTransactions = useMemo(() => {
    const groups: { label: string; items: any[] }[] = [
      { label: "Today", items: [] },
      { label: "Yesterday", items: [] },
      { label: "This Week", items: [] },
      { label: "Earlier", items: [] },
    ];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const lastWeek = today - 86400000 * 7;

// Process all entries for the deep mobile ledger
    transactions.forEach((t) => {
      const txTime = new Date(t.createdAt || Date.now()).getTime();
      if (txTime >= today) groups[0].items.push(t);
      else if (txTime >= yesterday) groups[1].items.push(t);
      else if (txTime >= lastWeek) groups[2].items.push(t);
      else groups[3].items.push(t);
    });

    return groups.filter((g) => g.items.length > 0);
  }, [transactions]);

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@200;300;400;600&family=DM+Mono:wght@300;400;500&display=swap');

        .font-sora { font-family: 'Sora', sans-serif; }
        .font-mono { font-family: 'DM Mono', monospace; }

        .glass-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(12,13,16,0.6) 100%);
          border: 1px solid rgba(255,255,255,0.06);
          border-top: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }

        .gold-text-gradient {
          background: linear-gradient(100deg, #ffe082 0%, #f0c040 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .btn-gold {
          background: linear-gradient(135deg, #f0c040 0%, #e8a020 60%, #f0c040 100%);
          box-shadow: 0 4px 24px rgba(240,192,64,0.2), 0 1px 0 rgba(255,255,255,0.2) inset;
          transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s ease, filter 0.2s ease;
          color: #0c0d10;
        }
        .btn-gold:hover {
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 8px 32px rgba(240,192,64,0.35);
          filter: brightness(1.06);
        }

        .btn-glass {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          transition: all 0.2s ease;
        }
        .btn-glass:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
        }

        .fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(.23,1,.32,1) both;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
          /* Native Bottom Sheet Animations */
        .sheet-overlay {
          animation: fadeIn 0.3s ease both;
        }
        .sheet-slide-up {
          animation: sheetSlideUp 0.5s cubic-bezier(0.32, 0.72, 0, 1) both;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sheetSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .glow-pool-gold {
          background: radial-gradient(circle, rgba(240,192,64,0.12) 0%, transparent 65%);
        }
        .glow-pool-emerald {
          background: radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 65%);
        }

        .custom-input {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.25s ease;
        }
        .custom-input:focus {
          background: rgba(240,192,64,0.05);
          border-color: rgba(240,192,64,0.3);
          box-shadow: 0 0 0 3px rgba(240,192,64,0.07);
          outline: none;
        }

/* Custom Scrollbar for list */
        .hide-scroll::-webkit-scrollbar { width: 0px; background: transparent; }
        
/* Native App Carousel Physics */
        @media (max-width: 1024px) {
          .mobile-carousel {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: 24px;
            padding-bottom: 24px;
            margin: 0;
            padding: 0 0 20px 0;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .mobile-carousel::-webkit-scrollbar { display: none; }
          .mobile-carousel > * { 
            flex: 0 0 100%; 
            scroll-snap-align: center; 
            scroll-snap-stop: always; 
            height: 100%; 
          }
        }

        /* Premium Swipe Arrow Animation */
        @keyframes swipeHint {
          0%, 100% { transform: translateX(0); opacity: 0.4; color: #5a5670; }
          50% { transform: translateX(4px); opacity: 1; color: #f0c040; }
        }
        .animate-swipe-hint { 
          animation: swipeHint 2s cubic-bezier(0.4, 0, 0.2, 1) infinite; 
        }
      `}</style>

<main className="min-h-screen pb-24 md:pb-0 bg-[#121316] text-[#f4f0e8] font-sora relative overflow-hidden selection:bg-[#f6d46b]/30 selection:text-black">
        {/* Removed ambient orbs for clean, flat solid design */}
        {isLoading ? (
          <div className="relative z-10 mx-auto max-w-7xl px-6 py-12">
            <div className="animate-pulse flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.06] pb-8 mb-12">
              <div className="space-y-4">
                <div className="w-24 h-3 bg-white/[0.03] rounded-full" />
                <div className="w-64 h-10 bg-white/[0.04] rounded-lg" />
                <div className="w-40 h-3 bg-white/[0.02] rounded-full" />
              </div>
              <div className="flex gap-3">
                <div className="w-36 h-12 bg-white/[0.03] rounded-xl" />
                <div className="w-24 h-12 bg-white/[0.02] rounded-xl" />
              </div>
            </div>

            <div className="animate-pulse grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 flex flex-col gap-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="glass-card rounded-2xl p-6 h-[120px] flex flex-col justify-between">
                      <div className="w-20 h-2 bg-white/[0.04] rounded-full" />
                      <div className="w-32 h-8 bg-white/[0.05] rounded-lg" />
                    </div>
                  ))}
                </div>
                <div className="glass-card rounded-3xl p-8 min-h-[260px] flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-40 h-5 bg-white/[0.04] rounded-md" />
                    <div className="w-16 h-3 bg-white/[0.02] rounded-full" />
                  </div>
                  <div className="space-y-6">
                     <div className="w-full h-4 bg-white/[0.02] rounded-full" />
                     <div className="w-full h-4 bg-white/[0.02] rounded-full" />
                  </div>
                </div>
                <div className="glass-card rounded-3xl p-8 h-[104px]" />
              </div>
              <div className="lg:col-span-4 flex flex-col gap-8">
                <div className="glass-card rounded-3xl p-6 h-[480px] flex flex-col gap-4">
                  <div className="flex justify-between mb-4">
                    <div className="w-24 h-5 bg-white/[0.04] rounded-md" />
                    <div className="w-16 h-5 bg-white/[0.02] rounded-full" />
                  </div>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-full h-16 bg-white/[0.02] rounded-2xl" />
                  ))}
                </div>
                <div className="glass-card rounded-3xl p-6 min-h-[280px]" />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 fade-in-up">
          {/* Top Header */}
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.06] pb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#f0c040]">
                  EXPENZA
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#9e98b0]">
                  {greeting}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-light tracking-tight text-[#f4f0e8] mb-2">
                Financial <strong className="font-semibold gold-text-gradient">Command Center.</strong>
              </h1>
              <p className="text-sm font-light text-[#9e98b0] tracking-wide mb-6">
                Track <span className="mx-1 opacity-40">•</span> Save <span className="mx-1 opacity-40">•</span> Grow
              </p>

              {/* Scalable PWA Navigation */}
              <nav className="hidden md:flex items-center gap-2">
                <div className="px-5 py-2 rounded-lg bg-white/[0.08] text-[13px] font-medium text-[#f4f0e8] shadow-[0_2px_8px_rgba(0,0,0,0.2)] border border-white/[0.05]">
                  Dashboard
                </div>
                <Link href="/budgets" className="px-5 py-2 rounded-lg text-[13px] font-medium text-[#5a5670] hover:text-[#f4f0e8] hover:bg-white/[0.03] transition-all">
                  Budgets
                </Link>
              </nav>
            </div>

<div className="flex flex-col items-end justify-end gap-6 h-full">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setTransactionError(""); setShowModal(true); }}
                  className="btn-gold rounded-xl px-6 py-3 font-semibold text-[13px] tracking-wide flex items-center gap-2"
                >
                  <span className="text-lg leading-none">+</span> Add Transaction
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    window.location.href = "/auth";
                  }}
                  className="btn-glass rounded-xl px-5 py-3 text-[13px] font-medium text-[#9e98b0] hover:text-white"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

         {/* Premium Insight Widget */}
          {showReminder && (
            <div className="mb-8 relative rounded-2xl bg-[#13141a]/80 border border-white/[0.04] p-5 md:p-6 backdrop-blur-xl shadow-2xl fade-in-up flex flex-col md:flex-row md:items-center justify-between gap-5 overflow-hidden">
              {/* Subtle top glow based on severity tier */}
              <div 
                className="absolute top-0 inset-x-0 h-[1px] opacity-40" 
                style={{ background: `linear-gradient(90deg, transparent 0%, ${reminderConfig.accentColor} 50%, transparent 100%)` }} 
              />
              
              <div className="flex gap-4 items-start">
                {/* Minimalist Glowing Dot Indicator */}
                <div className="mt-1.5 flex-shrink-0">
                   <div className="relative flex items-center justify-center w-7 h-7 rounded-full border border-white/[0.08] bg-black/40 shadow-inner">
                     <div 
                       className="w-1.5 h-1.5 rounded-full" 
                       style={{ backgroundColor: reminderConfig.accentColor, boxShadow: `0 0 10px ${reminderConfig.accentColor}` }} 
                     />
                   </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span 
                    className="font-mono text-[9px] tracking-[0.2em] uppercase" 
                    style={{ color: reminderConfig.accentColor }}
                  >
                    // {reminderConfig.tag}
                  </span>
                  <h4 className="text-[15px] font-medium text-[#f4f0e8] tracking-tight mt-0.5">
                    {reminderConfig.title}
                  </h4>
                  <p className="text-[13px] font-light text-[#9e98b0] leading-relaxed max-w-xl mt-1">
                    {reminderConfig.text}
                  </p>
                </div>
              </div>
              
              {/* Integrated Actions */}
              <div className="flex items-center gap-2 pl-11 md:pl-0 flex-shrink-0">
                <button 
                  onClick={() => { setTransactionError(""); setShowModal(true); dismissReminder(); }}
                  className="text-[12px] font-medium px-4 py-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[#f4f0e8] transition-all border border-white/[0.05] shadow-sm"
                >
                  Log Activity
                </button>
                <button 
                  onClick={dismissReminder}
                  className="text-[12px] font-medium px-4 py-2.5 rounded-lg text-[#5a5670] hover:text-[#f4f0e8] transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-8 flex flex-col gap-8">
{/* 1. Mobile-Native Bento Hub */}
              <div className="flex flex-col gap-4">
                {/* Top Bento Row */}
                <div className="flex gap-4">
                  {/* Main Balance */}
                  <div className="flex-1 bg-[#f6d46b] rounded-[32px] p-6 relative overflow-hidden transition-all duration-300 shadow-[0_8px_32px_rgba(246,212,107,0.15)]">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#7a6330] mb-2">Total Balance</p>
                    <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#1c1c1e]">
                      <span className="opacity-50 font-light mr-1">₹</span>
                      {Math.round(animatedBalance).toLocaleString('en-IN')}
                    </h2>
                  </div>
                  {/* Quick Add Action */}
                  <button 
                    onClick={() => { setTransactionError(""); setShowModal(true); }}
                    className="w-24 bg-[#1c1c1e] rounded-[32px] border border-white/5 p-4 flex flex-col items-center justify-center gap-2 text-white shadow-lg active:scale-95 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/5">
                      <span className="text-xl leading-none font-light mb-[2px]">+</span>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#9e98b0]">Add</span>
                  </button>
                </div>

                {/* Bottom Bento Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#a1c8aa] rounded-3xl p-5 text-center shadow-sm">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[#1c1c1e]/60 mb-1">Income</p>
                    <p className="text-[13px] font-semibold text-[#1c1c1e] tracking-tight truncate">₹{dashboardData.totalIncome.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-[#f28b82] rounded-3xl p-5 text-center shadow-sm">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[#1c1c1e]/60 mb-1">Expense</p>
                    <p className="text-[13px] font-semibold text-[#1c1c1e] tracking-tight truncate">₹{dashboardData.totalExpense.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-[#9ea4f5] rounded-3xl p-5 text-center shadow-sm">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[#1c1c1e]/60 mb-1">Saved</p>
                    <p className="text-[13px] font-semibold text-[#1c1c1e] tracking-tight truncate">₹{savings.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>

{/* 1.5 Quick Action Pills (Mobile Only) */}
              <div className="block lg:hidden w-[calc(100%+48px)] -mx-6 px-6 mt-6 mb-2 relative z-10">
                <div className="flex overflow-x-auto hide-scroll gap-4 pb-4">
                  <button onClick={() => setShowInsights(true)} className="flex-shrink-0 bg-[#9ea4f5] text-[#1c1c1e] px-5 py-3.5 rounded-[20px] font-medium text-[14px] flex items-center gap-2.5 shadow-[0_4px_12px_rgba(158,164,245,0.25)] active:scale-95 transition-transform">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                    Deep Analytics
                  </button>
                  <button onClick={() => setShowHealthDetails(true)} className="flex-shrink-0 bg-[#a1c8aa] text-[#1c1c1e] px-5 py-3.5 rounded-[20px] font-medium text-[14px] flex items-center gap-2.5 shadow-[0_4px_12px_rgba(161,200,170,0.25)] active:scale-95 transition-transform">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    Financial Health
                  </button>
                </div>
              </div>

              {/* 2. Split-Screen Ledger (Cream Bottom Overlay) */}
              <div className="block lg:hidden w-[calc(100%+48px)] -mx-6 mt-4 bg-[#e2e5de] text-[#1c1c1e] rounded-t-[40px] p-8 shadow-[0_-12px_40px_rgba(0,0,0,0.2)] relative z-20" style={{ paddingBottom: '140px', marginBottom: '-120px' }}>
                
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-medium tracking-tight">Transactions</h3>
                  <span className="font-mono text-[10px] tracking-widest text-[#1c1c1e]/50 uppercase">Latest</span>
                </div>
                
                <div className="flex-1 overflow-visible space-y-5">
                  {groupedTransactions.length === 0 ? (
                    <p className="text-[13px] text-[#1c1c1e]/50 text-center py-4">No recent activity.</p>
                  ) : (
                    groupedTransactions.map((group) => (
                      <div key={group.label} className="space-y-4">
                        <p className="font-mono text-[9px] tracking-widest text-[#1c1c1e]/40 uppercase mb-2 ml-2">{group.label}</p>
                        {group.items.map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between bg-white rounded-[24px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-black/5">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-[#e2e5de]/50 flex items-center justify-center text-xl">{getCategoryEmoji(transaction.category)}</div>
                              <div>
                                <p className="text-[15px] font-medium text-[#1c1c1e] truncate max-w-[120px]">{transaction.note || transaction.category}</p>
                                <p className="font-mono text-[10px] text-[#1c1c1e]/40 mt-1 tracking-wider uppercase">{formatTime(transaction.createdAt)}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <p className={`font-semibold text-[15px] tracking-tight ${transaction.type === 'income' ? 'text-[#a1c8aa]' : 'text-[#f28b82]'}`}>
                                {transaction.type === 'income' ? '+' : '−'}₹{transaction.amount.toLocaleString('en-IN')}
                              </p>
                              <button onClick={() => handleDeleteTransaction(transaction.id)} className="text-[9px] font-mono tracking-widest uppercase text-[#f28b82] opacity-70 hover:opacity-100 py-1">Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>

{/* 3. Desktop Analytics Wrapper (Hidden on Mobile) */}
              <div className="hidden lg:flex lg:flex-col lg:gap-8 w-full">

              {/* Cashflow Visualization */}
              <div className="glass-card rounded-3xl p-8 min-h-[260px] flex flex-col relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                <div className="flex justify-between items-center mb-8 relative z-10">
                  <h3 className="text-lg font-light tracking-wide text-[#f4f0e8]">Cashflow Overview</h3>
                  <span className="font-mono text-[10px] tracking-widest text-[#5a5670] uppercase">This Month</span>
                </div>
                
                <div className="flex-1 flex flex-col justify-center gap-8 relative z-10 w-full max-w-3xl mx-auto">
                  {/* Income Bar */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <p className="font-mono text-[10px] tracking-widest text-[#5a5670] uppercase">Income</p>
                      <p className="text-[#34d399] font-medium tracking-tight">₹{dashboardData.totalIncome.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="h-4 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.05]">
                      <div
                        className="h-full bg-gradient-to-r from-[#10b981]/60 to-[#34d399] rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: animateCharts && dashboardData.totalIncome > 0 
                            ? `${(dashboardData.totalIncome / Math.max(dashboardData.totalIncome, dashboardData.totalExpense)) * 100}%` 
                            : "0%" 
                        }}
                      />
                    </div>
                  </div>

{/* Expense Bar */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <p className="font-mono text-[10px] tracking-widest text-[#5a5670] uppercase">Expense</p>
                      <p className="text-[#f87171] font-medium tracking-tight">₹{dashboardData.totalExpense.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="h-4 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.05]">
                      <div
                        className="h-full bg-gradient-to-r from-[#ef4444]/60 to-[#f87171] rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: animateCharts && dashboardData.totalExpense > 0 
                            ? `${(dashboardData.totalExpense / Math.max(dashboardData.totalIncome, dashboardData.totalExpense)) * 100}%` 
                            : "0%" 
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Abstract graphic */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#f0c040]/5 to-transparent pointer-events-none" />
              </div>

{/* Monthly Insights */}
              <div 
                onClick={() => setShowInsights(true)}
                className="glass-card rounded-3xl p-8 relative overflow-hidden group cursor-pointer hover:bg-white/[0.04] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex justify-between items-center mb-4 relative z-10">
                  <h3 className="text-lg font-light tracking-wide text-[#f4f0e8]">Monthly Insights</h3>
                  <span className="font-mono text-[10px] tracking-widest text-[#f0c040] uppercase opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-1.5">
                    View Full Report <span>→</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 relative z-10">
                      {/* Insight 1: Highest Expense */}
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#261012] border border-[#f87171]/20 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(248,113,113,0.15)]">
                        {highestExpense ? (
                          <>
                            <div className="w-10 h-10 rounded-full bg-[#f87171]/10 flex items-center justify-center text-[#f87171] flex-shrink-0">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-light text-[#f87171]">
                                Highest spend is <strong className="font-semibold text-[#f87171]">{highestExpense.name}</strong> at <strong className="font-semibold">₹{highestExpense.value.toLocaleString('en-IN')}</strong>.
                              </p>
                              <p className="font-mono text-[10px] text-[#f87171] opacity-70 mt-1 tracking-widest uppercase">
                                {((highestExpense.value / dashboardData.totalExpense) * 100).toFixed(1)}% of expenses
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-[#f87171]/10 flex items-center justify-center text-[#f87171] flex-shrink-0">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 3v18h18"/>
                                <path d="m19 9-5 5-4-4-3 3"/>
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-light text-[#f87171] opacity-70">Awaiting transaction data.</p>
                              <p className="font-mono text-[10px] text-[#f87171] opacity-50 mt-1 tracking-widest uppercase">Gathering insights</p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Insight 2: Daily Velocity */}
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#241d0b] border border-[#f0c040]/20 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(240,192,64,0.15)]">
                        <div className="w-10 h-10 rounded-full bg-[#f0c040]/10 flex items-center justify-center text-[#f0c040] flex-shrink-0 shadow-[inset_0_0_12px_rgba(240,192,64,0.2)]">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                          </svg>
                        </div>
                        <div>
                          {dailyVelocity > 0 ? (
                            <>
                              <p className="text-sm font-light text-[#f0c040]">
                                Burning <strong className="font-semibold text-[#f0c040]">₹{Math.round(dailyVelocity).toLocaleString('en-IN')}/day</strong>. Runway is <strong className="font-semibold">{runwayDays} days</strong>.
                              </p>
                              <p className="font-mono text-[10px] text-[#f0c040] opacity-70 mt-1 tracking-widest uppercase">
                                Month-to-date average
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-light text-[#f0c040] opacity-70">No spend velocity detected.</p>
                              <p className="font-mono text-[10px] text-[#f0c040] opacity-50 mt-1 tracking-widest uppercase">
                                Looking good
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                    </div>
              </div>

{/* Financial Health Score */}
              <div 
                onClick={() => setShowHealthDetails(true)}
                className="glass-card rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row gap-8 items-center md:items-start justify-between fade-in-up group cursor-pointer hover:bg-white/[0.04] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex-1 flex flex-col h-full justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-light tracking-wide text-[#f4f0e8]">Financial Health</h3>
                      <span className="font-mono text-[10px] tracking-widest text-[#f0c040] uppercase opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-1.5">
                        View Details <span>→</span>
                      </span>
                    </div>
                    <p className="text-sm font-light text-[#9e98b0] mb-8 max-w-sm leading-relaxed">
                      {healthScore.message}
                    </p>
                  </div>
                  
                  {/* Score Breakdown */}
                  <div className="space-y-3 w-full max-w-sm">
                    <div className="flex justify-between items-center text-sm font-light border-b border-white/[0.04] pb-2">
                      <span className="text-[#e0dceb]">Savings Rate</span>
                      <span className="font-mono text-xs text-[#34d399]">+{healthScore.savingsScore}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-light border-b border-white/[0.04] pb-2">
                      <span className="text-[#e0dceb]">Runway Score</span>
                      <span className="font-mono text-xs text-[#34d399]">+{healthScore.runwayScore}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-light border-b border-white/[0.04] pb-2">
                      <span className="text-[#e0dceb]">Cashflow</span>
                      <span className="font-mono text-xs text-[#34d399]">+{healthScore.cashflowScore}</span>
                    </div>
                  </div>
                </div>

                {/* Score Circle Display */}
                <div className="relative w-40 h-40 flex-shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 drop-shadow-2xl z-10">
                    <path
                      className="text-white/[0.03]"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className={`${healthScore.color} transition-all duration-1500 ease-out`}
                      strokeDasharray={animateCharts ? `${healthScore.total}, 100` : `0, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <span className="text-4xl font-semibold tracking-tighter text-[#f4f0e8] mb-0.5">
                      {healthScore.total}
                    </span>
                    <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#5a5670] mb-2">
                      Out of 100
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-mono text-[9px] uppercase tracking-wider font-semibold ${healthScore.color} ${healthScore.bg}`}>
                      {healthScore.status}
                    </span>
                  </div>
                  {/* Subtle ambient glow behind the score */}
                  <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 ${healthScore.bg} pointer-events-none`} />
                </div>
              </div>

              {/* 4. Spending Breakdown Donut (Mobile Only Clone inside Carousel) */}
              <div className="block lg:hidden w-full h-full">
                <div className="glass-card rounded-3xl p-6 flex flex-col min-h-[260px] h-full">
                  <h3 className="text-lg font-light tracking-wide text-[#f4f0e8] mb-6">Breakdown</h3>
                  <div className="flex items-center gap-6 mt-2 h-full">
                    <div className="relative w-28 h-28 flex-shrink-0">
                      <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90 drop-shadow-2xl">
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                        {(() => {
                          let cumulativePercent = 0;
                          return expensesByCategory.map((exp, i) => {
                            const percent = dashboardData.totalExpense > 0 ? (exp.value / dashboardData.totalExpense) * 100 : 0;
                            const offset = -cumulativePercent;
                            cumulativePercent += percent;
                            return <circle key={exp.name} cx="21" cy="21" r="15.915" fill="transparent" stroke={pieColors[i % pieColors.length]} strokeWidth="6" strokeDasharray={animateCharts ? `${percent} 100` : `0 100`} strokeDashoffset={animateCharts ? offset : 0} className="transition-all duration-1000 ease-out" style={{ transitionDelay: `${i * 100}ms` }} />;
                          });
                        })()}
                      </svg>
                    </div>
                    <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[120px] hide-scroll pr-2">
                      {expensesByCategory.slice(0, 4).map((exp, i) => (
                        <div key={exp.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                            <span className="text-[12px] font-light text-[#e0dceb] truncate max-w-[60px]">{exp.name}</span>
                          </div>
                          <span className="font-mono text-[9px] text-[#5a5670] w-6 text-right">{((exp.value / dashboardData.totalExpense) * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              </div> {/* <-- Closes mobile-carousel */}
            </div> {/* <-- Closes lg:col-span-8 left column */}

            {/* ─── RIGHT COLUMN / DESKTOP ONLY ─── */}
            <div className="hidden lg:flex lg:col-span-4 flex-col gap-8">
{/* Recent Transactions List */}
              <div className="glass-card rounded-3xl p-6 flex flex-col h-auto transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-light tracking-wide text-[#f4f0e8]">Recent Activity</h3>
                  <span className="font-mono text-[10px] tracking-widest text-[#f0c040] uppercase bg-[#f0c040]/10 px-3 py-1 rounded-full border border-[#f0c040]/20">
                    Latest 3
                  </span>
                </div>

                <div className="flex-1 overflow-visible pr-2 space-y-5 relative">
                  {groupedTransactions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center relative fade-in-up">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0c0d10]/60 pointer-events-none rounded-2xl z-0" />
                      <div className="relative z-10 w-16 h-16 rounded-full border border-dashed border-white/10 flex items-center justify-center mb-5 bg-white/[0.01] shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
                        <span className="text-2xl opacity-30 grayscale">💳</span>
                      </div>
                      <p className="relative z-10 font-mono text-[10px] uppercase tracking-[0.2em] text-[#5a5670] mb-2">
                        Ledger Empty
                      </p>
                      <p className="relative z-10 text-[13px] font-light text-[#9e98b0] text-center max-w-[180px] leading-relaxed">
                        Log an entry to start tracking your cashflow.
                      </p>
                    </div>
                  ) : (
                    groupedTransactions.map((group) => (
                      <div key={group.label} className="space-y-3">
                        <div className="sticky top-0 bg-[#0c0d10]/95 backdrop-blur-md z-10 py-1 border-b border-white/[0.02] text-center">
                          <span className="font-mono text-[9px] tracking-widest text-[#5a5670] uppercase">
                            {group.label}
                          </span>
                        </div>
                        {group.items.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="group relative flex items-center justify-between p-4 rounded-2xl bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.04] hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all duration-300 overflow-hidden cursor-default"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/[0.05] flex items-center justify-center text-lg shadow-inner">
                                {getCategoryEmoji(transaction.category)}
                              </div>
                              <div>
                                <p className="text-[14px] font-medium text-[#f4f0e8] truncate max-w-[140px]">
                                  {transaction.note || transaction.category}
                                </p>
                                <p className="font-mono text-[10px] text-[#9e98b0] mt-0.5 tracking-wider uppercase flex items-center gap-1.5">
                                  {transaction.category} 
                                  {transaction.createdAt && (
                                    <>
                                      <span className="w-0.5 h-0.5 rounded-full bg-[#5a5670]" />
                                      {formatTime(transaction.createdAt)}
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end">
                              <p className={`font-semibold tracking-tight ${transaction.type === 'income' ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
                                {transaction.type === 'income' ? '+' : '−'}₹{transaction.amount.toLocaleString('en-IN')}
                              </p>
                              <button
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="text-[10px] font-mono tracking-widest uppercase text-[#f87171] opacity-100 md:opacity-0 translate-x-0 md:translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 mt-1 py-2 md:py-0"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Spending Breakdown Donut */}
              <div className="glass-card rounded-3xl p-6 flex flex-col min-h-[280px] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                <h3 className="text-lg font-light tracking-wide text-[#f4f0e8] mb-6">Spending Breakdown</h3>
                
                <div className="flex items-center gap-6 mt-2 h-full">
                  {/* SVG Donut Chart */}
                  <div className="relative w-32 h-32 flex-shrink-0">
                    <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90 drop-shadow-2xl">
                      <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                      {(() => {
                        let cumulativePercent = 0;
                        return expensesByCategory.map((exp, i) => {
                          const percent = dashboardData.totalExpense > 0 ? (exp.value / dashboardData.totalExpense) * 100 : 0;
                          const offset = -cumulativePercent;
                          cumulativePercent += percent;
                          return (
                            <circle
                              key={exp.name}
                              cx="21" cy="21" r="15.91549430918954"
                              fill="transparent"
                              stroke={pieColors[i % pieColors.length]}
                              strokeWidth="6"
                              strokeDasharray={animateCharts ? `${percent} 100` : `0 100`}
                              strokeDashoffset={animateCharts ? offset : 0}
                              className="transition-all duration-1000 ease-out"
                              style={{ transitionDelay: `${i * 100}ms` }}
                            />
                          );
                        });
                      })()}
                    </svg>
                    {/* Center Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="font-mono text-[8px] tracking-widest text-[#5a5670] uppercase mb-0.5">Total</span>
                      <span className="text-[#f4f0e8] font-semibold text-xs tracking-tight">
                        ₹{dashboardData.totalExpense >= 10000 
                          ? (dashboardData.totalExpense / 1000).toFixed(1) + 'k' 
                          : dashboardData.totalExpense.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

{/* Legend List */}
                  <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[140px] hide-scroll pr-2">
                    {expensesByCategory.length === 0 ? (
                      <div className="flex flex-col gap-3 mt-1 fade-in-up">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center gap-3 opacity-[0.15]">
                            <span className="w-2 h-2 rounded-full border border-white/40" />
                            <div className="h-1.5 w-16 bg-white/40 rounded-full" />
                          </div>
                        ))}
                        <p className="font-mono text-[9px] tracking-widest text-[#5a5670] uppercase mt-2">
                          Awaiting expense data
                        </p>
                      </div>
                    ) : (
                      expensesByCategory.map((exp, i) => (
                        <div key={exp.name} className="flex items-center justify-between group">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                            <span className="text-[12px] font-light text-[#e0dceb] flex items-center gap-1.5 truncate max-w-[80px]">
                              {exp.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] text-[#5a5670] w-7 text-right">
                              {((exp.value / dashboardData.totalExpense) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        )}

{/* Financial Health Full Page Overlay */}
        {showHealthDetails && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#0c0d10]/95 backdrop-blur-xl p-0 md:p-8 fade-in-up">
            <div className="glass-card w-full max-w-4xl h-[90vh] flex flex-col rounded-t-[32px] md:rounded-[32px] p-6 pb-12 md:p-12 shadow-2xl relative border-t border-white/[0.12]">
              
              <button 
                onClick={() => setShowHealthDetails(false)}
                className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-[#9e98b0] hover:text-white transition-colors z-10"
              >
                ✕
              </button>

              <div className="mb-10 shrink-0">
                <span className="font-mono text-[10px] tracking-[0.2em] text-[#f0c040] uppercase mb-2 block">
                  // Health Diagnostic
                </span>
                <h2 className="text-3xl font-light tracking-tight text-[#f4f0e8]">
                  Financial <strong className="font-semibold gold-text-gradient">Vital Signs</strong>
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto hide-scroll pr-2 space-y-8">
                
                {/* Hero Health Banner */}
                <div className={`rounded-3xl border border-white/[0.05] p-8 relative overflow-hidden ${healthScore.bg}`}>
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                      <h3 className="text-2xl font-light tracking-wide text-[#f4f0e8] mb-2">Overall Status: <span className={`font-semibold ${healthScore.color}`}>{healthScore.status}</span></h3>
                      <p className="text-sm font-light text-[#e0dceb] max-w-md leading-relaxed">
                        {healthScore.message}
                      </p>
                    </div>
                    <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <path
                          className="text-white/[0.05]"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke="currentColor" strokeWidth="4"
                        />
                        <path
                          className={`${healthScore.color} transition-all duration-1500 ease-out`}
                          strokeDasharray={`${healthScore.total}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-semibold tracking-tighter text-[#f4f0e8]">{healthScore.total}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Breakdown Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Savings Rate Card */}
                  <div className="rounded-2xl bg-white/[0.015] border border-white/[0.04] p-6 relative overflow-hidden hover:bg-white/[0.03] transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <p className="font-mono text-[10px] text-[#5a5670] uppercase tracking-widest">Savings Rule</p>
                      <span className="px-2 py-1 rounded bg-[#34d399]/10 text-[#34d399] font-mono text-[9px] uppercase tracking-wider">+{healthScore.savingsScore} pts</span>
                    </div>
                    <div className="text-3xl font-light text-[#f4f0e8] mb-2">
                      {dashboardData.totalIncome > 0 ? ((savings / dashboardData.totalIncome) * 100).toFixed(1) : 0}%
                    </div>
                    <p className="text-xs font-light text-[#9e98b0]">Target is &gt; 30% for max points. Measures your ability to retain earned wealth.</p>
                  </div>

                  {/* Runway Card */}
                  <div className="rounded-2xl bg-white/[0.015] border border-white/[0.04] p-6 relative overflow-hidden hover:bg-white/[0.03] transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <p className="font-mono text-[10px] text-[#5a5670] uppercase tracking-widest">Runway</p>
                      <span className="px-2 py-1 rounded bg-[#34d399]/10 text-[#34d399] font-mono text-[9px] uppercase tracking-wider">+{healthScore.runwayScore} pts</span>
                    </div>
                    <div className="text-3xl font-light text-[#f4f0e8] mb-2">
                      {runwayDays} <span className="text-xl text-[#5a5670]">days</span>
                    </div>
                    <p className="text-xs font-light text-[#9e98b0]">Target is &gt; 60 days. Forecasts how long your balance lasts at current burn rate.</p>
                  </div>

                  {/* Cashflow Card */}
                  <div className="rounded-2xl bg-white/[0.015] border border-white/[0.04] p-6 relative overflow-hidden hover:bg-white/[0.03] transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <p className="font-mono text-[10px] text-[#5a5670] uppercase tracking-widest">Cashflow</p>
                      <span className="px-2 py-1 rounded bg-[#34d399]/10 text-[#34d399] font-mono text-[9px] uppercase tracking-wider">+{healthScore.cashflowScore} pts</span>
                    </div>
                    <div className={`text-3xl font-light mb-2 ${dashboardData.totalIncome > dashboardData.totalExpense ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
                      {dashboardData.totalIncome > dashboardData.totalExpense ? 'Positive' : 'Negative'}
                    </div>
                    <p className="text-xs font-light text-[#9e98b0]">Binary check. Ensures your incoming cash exceeds outgoing cash.</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

{/* Detailed Insights Full Page Overlay */}
        {showInsights && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#0c0d10]/95 backdrop-blur-xl p-0 md:p-8 fade-in-up">
            <div className="glass-card w-full max-w-4xl h-[90vh] flex flex-col rounded-t-[32px] md:rounded-[32px] p-6 pb-12 md:p-12 shadow-2xl relative border-t border-white/[0.12]">
              
              <button 
                onClick={() => setShowInsights(false)}
                className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-[#9e98b0] hover:text-white transition-colors z-10"
              >
                ✕
              </button>

              <div className="mb-10 shrink-0">
                <span className="font-mono text-[10px] tracking-[0.2em] text-[#f0c040] uppercase mb-2 block">
                  // Deep Dive
                </span>
                <h2 className="text-3xl font-light tracking-tight text-[#f4f0e8]">
                  Detailed <strong className="font-semibold gold-text-gradient">Insights</strong>
                </h2>
              </div>

<div className="flex-1 overflow-y-auto hide-scroll pr-2 space-y-8">
                
               {/* 3-Grid Top Metrics */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="rounded-2xl bg-[#0d2118] border border-[#34d399]/20 p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(52,211,153,0.15)]">
                    <p className="font-mono text-[10px] text-[#34d399] opacity-80 uppercase tracking-widest mb-4">Savings Rate</p>
                    <div className="text-4xl font-light text-[#34d399]">
                      {dashboardData.totalIncome > 0 ? ((savings / dashboardData.totalIncome) * 100).toFixed(1) : 0}%
                    </div>
                    <p className="text-xs font-light text-[#34d399] opacity-70 mt-2">Of total income retained</p>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#34d399]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
                  </div>

                  <div className="rounded-2xl bg-[#261012] border border-[#f87171]/20 p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(248,113,113,0.15)]">
                    <p className="font-mono text-[10px] text-[#f87171] opacity-80 uppercase tracking-widest mb-4">Daily Burn</p>
                    <div className="text-4xl font-light text-[#f87171]">
                      ₹{Math.round(dashboardData.totalExpense / new Date().getDate()).toLocaleString('en-IN')}
                    </div>
                    <p className="text-xs font-light text-[#f87171] opacity-70 mt-2">Average spent per day</p>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#f87171]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
                  </div>

                  <div className="rounded-2xl bg-[#241d0b] border border-[#f0c040]/20 p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(240,192,64,0.15)]">
                    <p className="font-mono text-[10px] text-[#f0c040] opacity-80 uppercase tracking-widest mb-4">Top Outflow</p>
                    <div className="text-4xl font-light text-[#f0c040] truncate">
                      {highestExpense ? highestExpense.name : '-'}
                    </div>
                    <p className="text-xs font-light text-[#f0c040] opacity-70 mt-2">Highest cash drain</p>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#f0c040]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
                  </div>
                </div>
                {/* NEW: Increased Information Depth (Cashflow & Donut) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cashflow Deep Dive */}
                  <div className="bg-[#1c1c1e] border border-white/5 rounded-3xl p-8">
                    <h3 className="text-lg font-light tracking-wide text-[#f4f0e8] mb-8">Cashflow Velocity</h3>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <p className="font-mono text-[10px] tracking-widest text-[#a1c8aa] uppercase">Income</p>
                          <p className="text-[#a1c8aa] font-medium tracking-tight">₹{dashboardData.totalIncome.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-[#a1c8aa] rounded-full transition-all duration-1000 ease-out" style={{ width: dashboardData.totalIncome > 0 ? `${(dashboardData.totalIncome / Math.max(dashboardData.totalIncome, dashboardData.totalExpense)) * 100}%` : "0%" }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <p className="font-mono text-[10px] tracking-widest text-[#f28b82] uppercase">Expense</p>
                          <p className="text-[#f28b82] font-medium tracking-tight">₹{dashboardData.totalExpense.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-[#f28b82] rounded-full transition-all duration-1000 ease-out" style={{ width: dashboardData.totalExpense > 0 ? `${(dashboardData.totalExpense / Math.max(dashboardData.totalIncome, dashboardData.totalExpense)) * 100}%` : "0%" }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Donut Chart Deep Dive */}
                  <div className="bg-[#1c1c1e] border border-white/5 rounded-3xl p-8 flex items-center justify-center relative">
                    <div className="relative w-40 h-40">
                      <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90 drop-shadow-xl">
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                        {(() => {
                          let cumulativePercent = 0;
                          return expensesByCategory.map((exp, i) => {
                            const percent = dashboardData.totalExpense > 0 ? (exp.value / dashboardData.totalExpense) * 100 : 0;
                            const offset = -cumulativePercent;
                            cumulativePercent += percent;
                            return <circle key={exp.name} cx="21" cy="21" r="15.915" fill="transparent" stroke={pieColors[i % pieColors.length]} strokeWidth="6" strokeDasharray={`${percent} 100`} strokeDashoffset={offset} />;
                          });
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="font-mono text-[9px] tracking-widest text-white/50 uppercase mb-0.5">Spent</span>
                        <span className="text-[#f4f0e8] font-semibold text-sm tracking-tight">
                          ₹{dashboardData.totalExpense >= 10000 ? (dashboardData.totalExpense / 1000).toFixed(1) + 'k' : dashboardData.totalExpense.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Top 5 Categories Breakdown */}
                <div className="rounded-3xl bg-white/[0.01] border border-white/[0.03] p-8">
                  <h3 className="text-lg font-light tracking-wide text-[#f4f0e8] mb-6">Top Outflows by Volume</h3>
                  <div className="space-y-5">
                    {expensesByCategory.slice(0, 5).map((exp, i) => (
                      <div key={exp.name} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-white/[0.03] flex items-center justify-center font-mono text-xs text-[#9e98b0] border border-white/[0.05]">
                            0{i + 1}
                          </div>
                          <span className="text-sm font-medium text-[#e0dceb]">{exp.name}</span>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="hidden sm:block w-32 h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#f87171] rounded-full opacity-60" 
                              style={{ width: `${(exp.value / dashboardData.totalExpense) * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-[#5a5670] w-12 text-right">
                            {((exp.value / dashboardData.totalExpense) * 100).toFixed(1)}%
                          </span>
                          <span className="text-sm font-semibold tracking-tight text-[#f4f0e8] w-20 text-right">
                            ₹{exp.value.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ))}
                    {expensesByCategory.length === 0 && (
                      <p className="text-sm text-[#5a5670] font-light">Not enough data to analyze outflows.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

{/* Add Transaction Bottom Sheet */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#0c0d10]/80 backdrop-blur-sm p-0 md:p-4 sheet-overlay">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setShowModal(false)} />
            
            <div className="glass-card w-full max-w-md rounded-t-[32px] md:rounded-[32px] p-6 md:p-8 pb-12 md:pb-8 shadow-2xl relative max-h-[90vh] overflow-y-auto hide-scroll sheet-slide-up">
              {/* Mobile Drag Pill */}
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 md:hidden" />
              
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#f0c040] to-transparent opacity-20 hidden md:block" />
              
              <div className="mb-8">
                <span className="font-mono text-[10px] tracking-[0.2em] text-[#f0c040] uppercase mb-2 block">
                  // New Entry
                </span>
                <h2 className="text-3xl font-light tracking-tight text-[#f4f0e8]">
                  Add <strong className="font-semibold">Transaction</strong>
                </h2>
              </div>

              {transactionError && (
                <div className="mb-6 p-4 rounded-xl bg-[#f87171]/10 border border-[#f87171]/20 flex items-center gap-3 fade-in-up">
                  <span className="text-[#f87171]">⚠️</span>
                  <p className="text-xs font-medium text-[#f87171]">{transactionError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <label className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#5a5670] mb-2 block">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9e98b0] font-light">₹</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="custom-input w-full rounded-xl bg-[#13141a] pl-8 pr-4 py-3.5 text-sm font-light text-[#f4f0e8] placeholder:text-[#5a5670]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#5a5670] mb-2 block">Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="custom-input w-full rounded-xl bg-[#13141a] px-4 py-3.5 text-sm font-light text-[#f4f0e8] appearance-none"
                    >
                      <option className="bg-[#13141a] text-[#f4f0e8]" value="expense">Expense</option>
                      <option className="bg-[#13141a] text-[#f4f0e8]" value="income">Income</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#5a5670] mb-2 block">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="custom-input w-full rounded-xl bg-[#13141a] px-4 py-3.5 text-sm font-light text-[#f4f0e8] appearance-none"
                    >
                      <option className="bg-[#13141a] text-[#f4f0e8]" value="">Select</option>
                      {type === "expense" ? (
                        <>
                          <option className="bg-[#13141a] text-[#f4f0e8]" value="Food">Food</option>
                          <option className="bg-[#13141a] text-[#f4f0e8]" value="Transport">Transport</option>
                          <option className="bg-[#13141a] text-[#f4f0e8]" value="Shopping">Shopping</option>
                          <option className="bg-[#13141a] text-[#f4f0e8]" value="Entertainment">Entertainment</option>
                          <option className="bg-[#13141a] text-[#f4f0e8]" value="Bills">Bills</option>
                          <option className="bg-[#13141a] text-[#f4f0e8]" value="Health">Health</option>
                          <option className="bg-[#13141a] text-[#f4f0e8]" value="Education">Education</option>
                          <option className="bg-[#13141a] text-[#f4f0e8]" value="Other">Other</option>
                        </>
                      ) : (
                        <>
                          <option className="bg-[#13141a] text-[#f4f0e8]" value="Salary">Salary</option>
                          <option className="bg-[#13141a] text-[#f4f0e8]" value="Freelance">Freelance</option>
                          <option className="bg-[#13141a] text-[#f4f0e8]" value="Investment">Investment</option>
                          <option className="bg-[#13141a] text-[#f4f0e8]" value="Gift">Gift</option>
                          <option className="bg-[#13141a] text-[#f4f0e8]" value="Other">Other</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#5a5670] mb-2 block">Note (Optional)</label>
                  <input
                    type="text"
                    placeholder="What was this for?"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="custom-input w-full rounded-xl bg-[#13141a] px-4 py-3.5 text-sm font-light text-[#f4f0e8] placeholder:text-[#5a5670]"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl btn-glass py-4 text-[13px] font-medium text-[#9e98b0]"
                >
                  Cancel
                </button>
<button
                  onClick={handleAddTransaction}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl btn-gold py-4 text-[13px] font-semibold text-black flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Entry"
                  )}
                </button>
              </div>
            </div>
          </div>
)}

{/* Mobile App Dock (Floating Capsule) */}
        <div className="md:hidden fixed bottom-6 left-6 right-6 z-40 bg-[#1c1c1e] rounded-[32px] p-2 px-6 shadow-[0_16px_40px_rgba(0,0,0,0.5)] border border-white/5">
          <div className="flex items-center justify-between py-2">
            
            <div className="flex items-center gap-3 text-[#f6d46b] bg-[#f6d46b]/10 px-5 py-2.5 rounded-full">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
              <span className="text-[11px] font-medium tracking-wide">Home</span>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/budgets" className="flex items-center justify-center w-12 h-12 rounded-full text-[#8e8e93] hover:text-white hover:bg-white/5 transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </Link>
              <button 
                onClick={() => { setTransactionError(""); setShowModal(true); }}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-[#f6d46b] text-[#1c1c1e] active:scale-95 transition-all shadow-[0_4px_12px_rgba(246,212,107,0.3)] ml-2"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}