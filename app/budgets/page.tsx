"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

// Premium Count-Up Hook (reused from Dashboard)
function useCountUp(end: number, duration: number = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
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

export default function BudgetsPage() {
const [budgets, setBudgets] = useState<any[]>([]);
  const [animateBars, setAnimateBars] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Form State
  const [newCategory, setNewCategory] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [formError, setFormError] = useState("");

  // Action Modals State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<any>(null);

  const getCategoryEmoji = (cat: string) => {
    const map: Record<string, string> = {
      Food: "🍔", Transport: "🚗", Shopping: "🛍️", Entertainment: "🎬",
      Bills: "🧾", Health: "💊", Education: "📚", Salary: "💰",
      Freelance: "💻", Investment: "📈", Gift: "🎁", Other: "📦",
    };
    return map[cat] || "💳";
  };

const fetchBudgetData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    
    // Fetch both budgets and transactions simultaneously
    const [budgetRes, txRes] = await Promise.all([
      fetch("/api/budgets", { headers: { authorization: token || "" } }),
      fetch("/api/transactions", { headers: { authorization: token || "" } })
    ]);

    const budgetData = await budgetRes.json();
    const txData = await txRes.json();

    // Calculate real 'spent' amounts dynamically
    const realBudgets = budgetData.map((b: any) => {
      const spent = txData
        .filter((t: any) => t.type === 'expense' && t.category === b.category)
        .reduce((acc: number, curr: any) => acc + curr.amount, 0);
      
      return {
        id: b.id,
        category: b.category,
        limit: b.limit,
        spent: spent,
        icon: getCategoryEmoji(b.category),
      };
    });

setBudgets(realBudgets);
    
    // Trigger smooth fill animations after data binds
    setTimeout(() => setAnimateBars(true), 50);
    // Artificial delay for premium loading skeleton feel
    setTimeout(() => setIsLoading(false), 300);
  };

useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      fetchBudgetData();
      return;
    }

    // Google session check fallback
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((session) => {
        if (session?.user) {
          fetchBudgetData();
        } else {
          window.location.href = "/auth";
        }
      });
  }, []);

  // Derived Budget Metrics
  const metrics = useMemo(() => {
    const totalBudget = budgets.reduce((acc, curr) => acc + curr.limit, 0);
    const totalSpent = budgets.reduce((acc, curr) => acc + curr.spent, 0);
    const totalRemaining = Math.max(0, totalBudget - totalSpent);
    
    const overBudgetCategories = budgets.filter(b => b.spent > b.limit);
    const onTrackCategories = budgets.filter(b => b.spent <= b.limit);

    return { totalBudget, totalSpent, totalRemaining, overBudgetCategories, onTrackCategories };
  }, [budgets]);

  // Animated Numbers
  const animTotalBudget = useCountUp(metrics.totalBudget);
  const animTotalSpent = useCountUp(metrics.totalSpent);
  const animTotalRemaining = useCountUp(metrics.totalRemaining);

// Helper for Progress Bar logic
  const getProgressDetails = (spent: number, limit: number) => {
    const percent = (spent / limit) * 100;
    const cappedPercent = Math.min(percent, 100);
    
    if (percent > 100) {
      return { 
        gradient: "from-[#ef4444]/60 to-[#f87171]", text: "text-[#f87171]", bg: "bg-[#f87171]/10",
        status: "Over Budget", percent: cappedPercent
      };
    }
    if (percent >= 90) {
      return { 
        gradient: "from-[#f97316]/60 to-[#fb923c]", text: "text-[#fb923c]", bg: "bg-[#fb923c]/10",
        status: "Near Limit", percent: cappedPercent
      };
    }
    if (percent >= 70) {
      return { 
        gradient: "from-[#e8a020]/60 to-[#f0c040]", text: "text-[#f0c040]", bg: "bg-[#f0c040]/10",
        status: "Monitor", percent: cappedPercent
      };
    }
    return { 
      gradient: "from-[#10b981]/60 to-[#34d399]", text: "text-[#34d399]", bg: "bg-[#34d399]/10",
      status: "On Track", percent: cappedPercent
    };
  };

  // Smart Recommendations & Health Score
  const insights = useMemo(() => {
    if (budgets.length === 0) return ["No budgets active right now."];
    const msgs = [];
    const safe = metrics.onTrackCategories.length;
    const over = metrics.overBudgetCategories.length;
    
    if (over === 0) msgs.push("All categories are comfortably within budget.");
    else msgs.push(`${over} categor${over > 1 ? 'ies' : 'y'} exceeded the planned limit.`);
    
    if (safe > 0) msgs.push(`${safe} categor${safe > 1 ? 'ies are' : 'y is'} on track.`);
    
    const nearLimit = budgets.filter(b => (b.spent / b.limit) >= 0.9 && (b.spent / b.limit) <= 1);
    if (nearLimit.length > 0) msgs.push(`Consider monitoring ${nearLimit.map(b => b.category).join(', ')} closely.`);
    
    return msgs;
  }, [budgets, metrics]);

  const healthScore = useMemo(() => {
    if (budgets.length === 0) return { status: "No Data", color: "text-[#5a5670]", bg: "bg-white/[0.05]" };
    const percentSafe = (metrics.onTrackCategories.length / budgets.length) * 100;
    if (percentSafe === 100) return { status: "Excellent", color: "text-[#34d399]", bg: "bg-[#34d399]/10" };
    if (percentSafe >= 60) return { status: "Good", color: "text-[#f0c040]", bg: "bg-[#f0c040]/10" };
    return { status: "Needs Attention", color: "text-[#f87171]", bg: "bg-[#f87171]/10" };
  }, [budgets, metrics]);

const handleAddBudget = async () => {
    if (!newCategory || !newAmount) {
      setFormError("Category and limit are required.");
      return;
    }
    
    const numAmount = Number(newAmount);
    if (numAmount <= 0) {
      setFormError("Budget limit must be greater than ₹0.");
      return;
    }
    setFormError("");

    // Prevent Duplicates
    const isDuplicate = budgets.some(b => b.category.toLowerCase() === newCategory.toLowerCase());
    if (isDuplicate) {
      setFormError(`A budget for ${newCategory} already exists.`);
      return;
    }
    
    const token = localStorage.getItem("token");
    const response = await fetch("/api/budgets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: token || "",
      },
      body: JSON.stringify({
        category: newCategory,
        limit: numAmount,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      setFormError(errData.error || "Failed to create budget.");
      return;
    }

    // Refresh UI with real backend data
    await fetchBudgetData();

    setShowModal(false);
    setNewCategory("");
    setNewAmount("");
  };

  const handleDeleteConfirm = async () => {
    if (!budgetToDelete) return;
    const token = localStorage.getItem("token");
    await fetch(`/api/budgets?id=${budgetToDelete}`, {
      method: "DELETE",
      headers: { authorization: token || "" },
    });
    setShowDeleteModal(false);
    setBudgetToDelete(null);
    await fetchBudgetData();
  };

 const handleEditSubmit = async () => {
    if (!newAmount) {
      setFormError("Limit is required.");
      return;
    }
    
    const numAmount = Number(newAmount);
    if (numAmount <= 0) {
      setFormError("Budget limit must be greater than ₹0.");
      return;
    }
    setFormError("");

    const token = localStorage.getItem("token");
    
    // Send the permanent update to the backend
    const response = await fetch("/api/budgets", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        authorization: token || "",
      },
      body: JSON.stringify({
        id: budgetToEdit.id,
        limit: numAmount,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      setFormError(errData.error || "Failed to update budget.");
      return;
    }

    // Refresh the UI with fresh backend data
    await fetchBudgetData();

    setShowEditModal(false);
    setBudgetToEdit(null);
    setNewCategory("");
    setNewAmount("");
  };

  const openEditModal = (budget: any) => {
    setBudgetToEdit(budget);
    setNewCategory(budget.category);
    setNewAmount(budget.limit.toString());
    setFormError("");
    setShowEditModal(true);
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

        .glow-pool-gold { background: radial-gradient(circle, rgba(240,192,64,0.1) 0%, transparent 65%); }
        .glow-pool-red { background: radial-gradient(circle, rgba(248,113,113,0.08) 0%, transparent 65%); }

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

        .hide-scroll::-webkit-scrollbar { width: 0px; background: transparent; }
      `}</style>

      <main className="min-h-screen pb-24 md:pb-0 bg-[#0c0d10] text-[#f4f0e8] font-sora relative overflow-hidden selection:bg-[#f0c040]/30 selection:text-white">
        {/* Ambient Glows */}
        <div className="absolute top-[-300px] left-[-200px] w-[800px] h-[800px] rounded-full glow-pool-gold blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-200px] right-[-100px] w-[600px] h-[600px] rounded-full glow-pool-red blur-[100px] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 fade-in-up">
          
          {/* Navigation & Header */}
          <header className="mb-12 border-b border-white/[0.06] pb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#f0c040]">
                    EXPENZA
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#9e98b0]">
                    Control Module
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-light tracking-tight text-[#f4f0e8] mb-2">
                  Budget <strong className="font-semibold gold-text-gradient">Center.</strong>
                </h1>
                <p className="text-sm font-light text-[#9e98b0] tracking-wide mb-6">
                  Plan spending <span className="mx-1 opacity-40">•</span> Stay in control
                </p>

{/* Scalable PWA Navigation */}
                <nav className="hidden md:flex items-center gap-2">
                  <Link href="/dashboard" className="px-5 py-2 rounded-lg text-[13px] font-medium text-[#5a5670] hover:text-[#f4f0e8] hover:bg-white/[0.03] transition-all">
                    Dashboard
                  </Link>
                  <div className="px-5 py-2 rounded-lg bg-white/[0.08] text-[13px] font-medium text-[#f4f0e8] shadow-[0_2px_8px_rgba(0,0,0,0.2)] border border-white/[0.05]">
                    Budgets
                  </div>
                </nav>
              </div>

              <div className="flex flex-col items-end justify-end gap-6 h-full">
<div className="flex items-center gap-3">
                  <button
                    onClick={() => { setFormError(""); setShowModal(true); }}
                    className="btn-gold rounded-xl px-6 py-3 font-semibold text-[13px] tracking-wide flex items-center gap-2"
                  >
                    <span className="text-lg leading-none">+</span> Create Budget
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Budget Health Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#5a5670] mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f0c040]" /> Total Budgeted
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                <span className="text-[#9e98b0] font-light mr-1">₹</span>
                {Math.round(animTotalBudget).toLocaleString('en-IN')}
              </h2>
            </div>

            <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#5a5670] mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" /> Total Spent
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                <span className="text-[#9e98b0] font-light mr-1">₹</span>
                {Math.round(animTotalSpent).toLocaleString('en-IN')}
              </h2>
            </div>

            <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#5a5670] mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" /> Remaining Safe
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                <span className="text-[#9e98b0] font-light mr-1">₹</span>
                {Math.round(animTotalRemaining).toLocaleString('en-IN')}
              </h2>
            </div>

            <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-transparent to-white/[0.01]">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#5a5670] mb-3 flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${healthScore.color.replace('text-', 'bg-')}`} /> Health
              </p>
              <div className="flex flex-col justify-center h-full pb-2">
                <h2 className={`text-2xl md:text-3xl font-semibold tracking-tight ${healthScore.color}`}>
                  {healthScore.status}
                </h2>
                <span className="text-sm text-[#9e98b0] mt-1">{metrics.overBudgetCategories.length} over limit</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Categories Grid */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-4">
                <h3 className="text-lg font-light tracking-wide text-[#f4f0e8]">Category Limits</h3>
                <span className="font-mono text-[10px] tracking-widest text-[#5a5670] uppercase bg-white/[0.03] px-3 py-1 rounded-full border border-white/[0.05]">
                  {isLoading ? 'Loading...' : `${budgets.length} Active`}
                </span>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="glass-card rounded-3xl p-6 h-[160px] flex flex-col justify-between">
                      <div className="flex justify-between">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 bg-white/[0.03] rounded-xl" />
                          <div className="space-y-2 py-1">
                            <div className="w-20 h-3 bg-white/[0.05] rounded-full" />
                            <div className="w-12 h-2 bg-white/[0.03] rounded-full" />
                          </div>
                        </div>
                        <div className="space-y-2 py-1 text-right">
                          <div className="w-16 h-3 bg-white/[0.05] rounded-full ml-auto" />
                          <div className="w-24 h-2 bg-white/[0.03] rounded-full ml-auto" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <div className="w-16 h-2 bg-white/[0.03] rounded-full" />
                          <div className="w-12 h-2 bg-white/[0.03] rounded-full" />
                        </div>
                        <div className="w-full h-2.5 bg-white/[0.03] rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : budgets.length === 0 ? (
                <div className="glass-card rounded-3xl p-12 flex flex-col items-center justify-center text-center fade-in-up border-dashed border-white/[0.08]">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#f0c040]/10 to-transparent border border-[#f0c040]/20 flex items-center justify-center mb-6 shadow-[inset_0_0_20px_rgba(240,192,64,0.05)]">
                    <span className="text-3xl">🎯</span>
                  </div>
                  <h3 className="text-xl font-light text-[#f4f0e8] mb-2">No Active Budgets</h3>
                  <p className="text-[13px] font-light text-[#9e98b0] max-w-[280px] mb-8 leading-relaxed">
                    Budgets help you proactively assign your money. Create your first budget to stop wondering where your money went.
                  </p>
                  <button
                    onClick={() => { setFormError(""); setShowModal(true); }}
                    className="btn-gold rounded-xl px-8 py-3.5 font-semibold text-[13px] tracking-wide"
                  >
                    Create First Budget
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {budgets.map((budget, idx) => {
                    const progress = getProgressDetails(budget.spent, budget.limit);
                    const remaining = budget.limit - budget.spent;
                    
                    return (
                      <div 
                        key={budget.id} 
                        className="glass-card rounded-3xl p-6 transition-all duration-300 hover:bg-white/[0.04] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] group relative overflow-hidden"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/[0.05] flex items-center justify-center text-lg shadow-inner group-hover:scale-105 transition-transform">
                              {budget.icon}
                            </div>
                            <div>
                              <h4 className="text-[14px] font-medium text-[#f4f0e8]">{budget.category}</h4>
                              <p className={`font-mono text-[9px] uppercase tracking-wider mt-0.5 ${progress.text}`}>
                                {progress.status}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <p className="text-[14px] font-semibold text-[#f4f0e8]">₹{budget.spent.toLocaleString('en-IN')}</p>
                            <p className="font-mono text-[9px] text-[#5a5670] uppercase tracking-wider mt-0.5">of ₹{budget.limit.toLocaleString('en-IN')}</p>
                            
{/* Hover/Mobile Actions */}
                            <div className="absolute top-4 right-4 flex gap-1 opacity-100 md:opacity-0 md:-translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 bg-[#0c0d10]/90 backdrop-blur-md px-2 py-1 rounded-lg border border-white/[0.05] shadow-xl">
                              <button onClick={() => openEditModal(budget)} className="text-[#9e98b0] hover:text-[#f0c040] p-2.5 md:p-1.5 transition-colors" title="Edit">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                              <div className="w-px h-4 bg-white/[0.1] my-auto" />
                              <button onClick={() => { setBudgetToDelete(budget.id); setShowDeleteModal(true); }} className="text-[#9e98b0] hover:text-[#f87171] p-2.5 md:p-1.5 transition-colors" title="Delete">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar Component */}
                        <div>
                          <div className="flex justify-between items-end mb-2">
                            <p className="font-mono text-[10px] tracking-widest text-[#5a5670] uppercase">
                              {remaining < 0 ? 'Overspent by' : 'Remaining'}
                            </p>
                            <p className={`font-medium tracking-tight text-sm ${progress.text}`}>
                              ₹{Math.abs(remaining).toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div className="h-2.5 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.05]">
                            <div
                              className={`h-full bg-gradient-to-r ${progress.gradient} rounded-full transition-all duration-1000 ease-out`}
                              style={{ width: animateBars ? `${progress.percent}%` : "0%" }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Alerts & Performance */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Over Budget Alerts (Conditionally rendered to look premium) */}
              {metrics.overBudgetCategories.length > 0 && (
                <div className="fade-in-up">
                  <h3 className="text-lg font-light tracking-wide text-[#f4f0e8] mb-4">Critical Alerts</h3>
                  <div className="glass-card rounded-3xl p-6 border-red-500/20 bg-gradient-to-b from-[#f87171]/5 to-transparent relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#f87171]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="space-y-4 relative z-10">
                      {metrics.overBudgetCategories.map(budget => {
                        const excess = budget.spent - budget.limit;
                        return (
                          <div key={budget.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#0c0d10]/60 border border-[#f87171]/20">
                            <div className="flex items-center gap-3">
                              <span className="w-2 h-2 rounded-full bg-[#f87171] animate-pulse" />
                              <span className="text-[13px] font-medium text-[#e0dceb]">{budget.category}</span>
                            </div>
                            <span className="font-mono text-[11px] text-[#f87171] tracking-wider">
                              +₹{excess.toLocaleString('en-IN')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

{/* Smart Recommendations / Insights */}
              <div className="fade-in-up mb-6">
                <h3 className="text-lg font-light tracking-wide text-[#f4f0e8] mb-4">Budget Insights</h3>
                <div className="glass-card rounded-3xl p-6 relative overflow-hidden group hover:bg-white/[0.04] transition-all">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#f0c040] to-transparent opacity-50" />
                  <div className="space-y-4">
                    {insights.map((msg, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-[#f0c040] mt-0.5">✦</span>
                        <p className="text-[13px] font-light text-[#e0dceb] leading-relaxed">{msg}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Performance Section */}
              <div>
                <h3 className="text-lg font-light tracking-wide text-[#f4f0e8] mb-4">Performance Overview</h3>
                <div className="glass-card rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-[220px]">
                  <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center mb-4">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 drop-shadow-2xl z-10">
                      <path
                        className="text-white/[0.03]"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="currentColor" strokeWidth="4"
                      />
                      <path
                        className={`${metrics.totalSpent > metrics.totalBudget ? 'text-[#f87171]' : 'text-[#f0c040]'} transition-all duration-1500 ease-out`}
                        strokeDasharray={animateBars ? `${Math.min((metrics.totalSpent / Math.max(metrics.totalBudget, 1)) * 100, 100)}, 100` : `0, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                      <span className="text-2xl font-semibold tracking-tighter text-[#f4f0e8]">
                        {metrics.totalBudget > 0 ? Math.round((metrics.totalSpent / metrics.totalBudget) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#5a5670]">
                    Total Budget Utilized
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Create Budget Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#0c0d10]/80 backdrop-blur-md p-0 md:p-4 fade-in-up">
            <div className="glass-card w-full max-w-md rounded-t-[32px] md:rounded-[32px] p-6 md:p-8 pb-10 md:pb-8 shadow-2xl relative max-h-[90vh] overflow-y-auto hide-scroll">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#f0c040] to-transparent opacity-20" />
              
              <div className="mb-8">
                <span className="font-mono text-[10px] tracking-[0.2em] text-[#f0c040] uppercase mb-2 block">
                  // New Allocation
                </span>
                <h2 className="text-3xl font-light tracking-tight text-[#f4f0e8]">
                  Set <strong className="font-semibold">Budget</strong>
                </h2>
              </div>

              {formError && (
                <div className="mb-6 p-4 rounded-xl bg-[#f87171]/10 border border-[#f87171]/20 flex items-center gap-3 fade-in-up">
                  <span className="text-[#f87171]">⚠️</span>
                  <p className="text-xs font-medium text-[#f87171]">{formError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#5a5670] mb-2 block">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="custom-input w-full rounded-xl bg-[#13141a] px-4 py-3.5 text-sm font-light text-[#f4f0e8] appearance-none"
                  >
                    <option className="bg-[#13141a] text-[#f4f0e8]" value="">Select Category</option>
                    <option className="bg-[#13141a] text-[#f4f0e8]" value="Food">Food</option>
                    <option className="bg-[#13141a] text-[#f4f0e8]" value="Transport">Transport</option>
                    <option className="bg-[#13141a] text-[#f4f0e8]" value="Shopping">Shopping</option>
                    <option className="bg-[#13141a] text-[#f4f0e8]" value="Entertainment">Entertainment</option>
                    <option className="bg-[#13141a] text-[#f4f0e8]" value="Bills">Bills</option>
                    <option className="bg-[#13141a] text-[#f4f0e8]" value="Health">Health</option>
                    <option className="bg-[#13141a] text-[#f4f0e8]" value="Other">Other</option>
                  </select>
                </div>

                <div className="relative">
                  <label className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#5a5670] mb-2 block">Monthly Limit</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9e98b0] font-light">₹</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="custom-input w-full rounded-xl bg-[#13141a] pl-8 pr-4 py-3.5 text-sm font-light text-[#f4f0e8] placeholder:text-[#5a5670]"
                    />
                  </div>
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
                  onClick={handleAddBudget}
                  className="flex-1 rounded-xl btn-gold py-4 text-[13px] font-semibold text-black"
                >
                  Save Budget
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Budget Modal */}
        {showEditModal && budgetToEdit && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#0c0d10]/80 backdrop-blur-md p-0 md:p-4 fade-in-up">
            <div className="glass-card w-full max-w-md rounded-t-[32px] md:rounded-[32px] p-6 md:p-8 pb-10 md:pb-8 shadow-2xl relative max-h-[90vh] overflow-y-auto hide-scroll">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent opacity-20" />
              
              <div className="mb-8">
                <span className="font-mono text-[10px] tracking-[0.2em] text-[#3b82f6] uppercase mb-2 block">
                  // Edit Allocation
                </span>
<h2 className="text-3xl font-light tracking-tight text-[#f4f0e8]">
                  Update <strong className="font-semibold">Budget</strong>
                </h2>
              </div>

              {formError && (
                <div className="mb-6 p-4 rounded-xl bg-[#f87171]/10 border border-[#f87171]/20 flex items-center gap-3 fade-in-up">
                  <span className="text-[#f87171]">⚠️</span>
                  <p className="text-xs font-medium text-[#f87171]">{formError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#5a5670] mb-2 block">Category</label>
                  <select
                    value={newCategory}
                    disabled
                    className="custom-input w-full rounded-xl bg-[#13141a] px-4 py-3.5 text-sm font-light text-[#f4f0e8] appearance-none opacity-50 cursor-not-allowed"
                  >
                    <option className="bg-[#13141a] text-[#f4f0e8]" value={newCategory}>{newCategory}</option>
                  </select>
                </div>

                <div className="relative">
                  <label className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#5a5670] mb-2 block">Monthly Limit</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9e98b0] font-light">₹</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="custom-input w-full rounded-xl bg-[#13141a] pl-8 pr-4 py-3.5 text-sm font-light text-[#f4f0e8] placeholder:text-[#5a5670]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 rounded-xl btn-glass py-4 text-[13px] font-medium text-[#9e98b0]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white py-4 text-[13px] font-semibold hover:brightness-110 transition-all shadow-[0_4px_20px_rgba(59,130,246,0.3)]"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

{/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#0c0d10]/90 backdrop-blur-md p-0 md:p-4 fade-in-up">
            <div className="glass-card w-full max-w-sm rounded-t-[32px] md:rounded-[32px] p-6 md:p-8 pb-10 md:pb-8 shadow-2xl relative border-t border-[#f87171]/20"> 
              <div className="w-16 h-16 rounded-full bg-[#f87171]/10 flex items-center justify-center text-2xl mb-6 text-[#f87171] border border-[#f87171]/20 mx-auto">
                🗑️
              </div>
              <h3 className="text-xl font-medium text-[#f4f0e8] text-center mb-2">Delete Budget?</h3>
              <p className="text-[13px] font-light text-[#9e98b0] text-center mb-8">
                This action cannot be undone. Transactions tied to this category will not be deleted.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 rounded-xl btn-glass py-3.5 text-[13px] font-medium text-[#9e98b0]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 rounded-xl bg-[#f87171]/20 text-[#f87171] py-3.5 text-[13px] font-semibold hover:bg-[#f87171] hover:text-white transition-all border border-[#f87171]/30"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
)}

        {/* Mobile Bottom Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0d10]/90 backdrop-blur-xl border-t border-white/[0.05] pb-6 pt-2 px-6">
          <div className="flex items-center justify-around">
            <Link href="/dashboard" className="flex flex-col items-center gap-1 text-[#5a5670] hover:text-[#e0dceb] transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
              <span className="text-[10px] font-medium tracking-wide">Dashboard</span>
            </Link>
            <div className="flex flex-col items-center gap-1 text-[#f0c040]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              <span className="text-[10px] font-medium tracking-wide">Budgets</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}