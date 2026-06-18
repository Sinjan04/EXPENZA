"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

// Premium Count-Up Hook
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
  const [newStartDate, setNewStartDate] = useState("");
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [isEssential, setIsEssential] = useState(true);
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
    
    const [budgetRes, txRes] = await Promise.all([
      fetch("/api/budgets", { headers: { authorization: token || "" } }),
      fetch("/api/transactions", { headers: { authorization: token || "" } })
    ]);

    const budgetData = await budgetRes.json();
    const txData = await txRes.json();

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
    setTimeout(() => setAnimateBars(true), 50);
    setTimeout(() => setIsLoading(false), 300);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      fetchBudgetData();
      return;
    }

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

  const metrics = useMemo(() => {
    const totalBudget = budgets.reduce((acc, curr) => acc + curr.limit, 0);
    const totalSpent = budgets.reduce((acc, curr) => acc + curr.spent, 0);
    const totalRemaining = Math.max(0, totalBudget - totalSpent);
    
    const overBudgetCategories = budgets.filter(b => b.spent > b.limit);
    const onTrackCategories = budgets.filter(b => b.spent <= b.limit);

    return { totalBudget, totalSpent, totalRemaining, overBudgetCategories, onTrackCategories };
  }, [budgets]);

  const animTotalBudget = useCountUp(metrics.totalBudget);
  const animTotalSpent = useCountUp(metrics.totalSpent);
  const animTotalRemaining = useCountUp(metrics.totalRemaining);

  const getProgressDetails = (spent: number, limit: number) => {
    const percent = (spent / limit) * 100;
    const cappedPercent = Math.min(percent, 100);
    
    if (percent > 100) return { gradient: "from-[#f28b82] to-[#e0665d]", text: "text-[#d9534f]", bg: "bg-[#f28b82]/20", status: "Over Budget", percent: cappedPercent };
    if (percent >= 90) return { gradient: "from-[#f6d46b] to-[#eabf43]", text: "text-[#d49a1c]", bg: "bg-[#f6d46b]/20", status: "Near Limit", percent: cappedPercent };
    if (percent >= 70) return { gradient: "from-[#9ea4f5] to-[#828bf0]", text: "text-[#6b75e6]", bg: "bg-[#9ea4f5]/20", status: "Monitor", percent: cappedPercent };
    return { gradient: "from-[#a1c8aa] to-[#88b593]", text: "text-[#5e8f6b]", bg: "bg-[#a1c8aa]/20", status: "On Track", percent: cappedPercent };
  };

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
    if (budgets.length === 0) return { status: "No Data", color: "text-[#1c1c1e]/50", bg: "bg-black/5" };
    const percentSafe = (metrics.onTrackCategories.length / budgets.length) * 100;
    if (percentSafe === 100) return { status: "Excellent", color: "text-[#5e8f6b]", bg: "bg-[#a1c8aa]/20" };
    if (percentSafe >= 60) return { status: "Good", color: "text-[#d49a1c]", bg: "bg-[#f6d46b]/20" };
    return { status: "Needs Attention", color: "text-[#d9534f]", bg: "bg-[#f28b82]/20" };
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

    const isDuplicate = budgets.some(b => b.category.toLowerCase() === newCategory.toLowerCase());
    if (isDuplicate) {
      setFormError(`A budget for ${newCategory} already exists.`);
      return;
    }
    
    const token = localStorage.getItem("token");
    const response = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json", authorization: token || "" },
      body: JSON.stringify({ category: newCategory, limit: numAmount }),
    });

    if (!response.ok) {
      const errData = await response.json();
      setFormError(errData.error || "Failed to create budget.");
      return;
    }

    await fetchBudgetData();
    setShowModal(false);
    setNewCategory("");
    setNewAmount("");
    setNewStartDate("");
    setAlertThreshold(80);
    setIsEssential(true);
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
    const response = await fetch("/api/budgets", {
      method: "PUT",
      headers: { "Content-Type": "application/json", authorization: token || "" },
      body: JSON.stringify({ id: budgetToEdit.id, limit: numAmount }),
    });

    if (!response.ok) {
      const errData = await response.json();
      setFormError(errData.error || "Failed to update budget.");
      return;
    }

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

        :root {
          --bg-cream: #e2e5de;
          --card-dark: #1c1c1e;
          --accent-mustard: #f6d46b;
          --accent-periwinkle: #9ea4f5;
          --accent-sage: #a1c8aa;
          --accent-coral: #f28b82;
        }

        .font-sora { font-family: 'Sora', sans-serif; }
        .font-mono { font-family: 'DM Mono', monospace; }

        .fade-in-up { animation: fadeInUp 0.8s cubic-bezier(.23,1,.32,1) both; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .sheet-overlay { animation: fadeIn 0.3s ease both; }
        .sheet-slide-up { animation: sheetSlideUp 0.5s cubic-bezier(0.32, 0.72, 0, 1) both; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sheetSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

        .custom-input {
          background: rgba(0,0,0,0.03);
          border: 1px solid rgba(0,0,0,0.08);
          transition: all 0.25s ease;
          color: #1c1c1e;
        }
        .custom-input-dark {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #ffffff;
        }
        .custom-input:focus, .custom-input-dark:focus {
          border-color: var(--accent-mustard);
          box-shadow: 0 0 0 3px rgba(246, 212, 107, 0.2);
          outline: none;
        }

        .hide-scroll::-webkit-scrollbar { width: 0px; background: transparent; }
      `}</style>

      <main className="min-h-screen pb-24 md:pb-0 bg-[var(--bg-cream)] text-[#1c1c1e] font-sora relative overflow-hidden selection:bg-[var(--accent-mustard)] selection:text-black">
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 fade-in-up">
          
          {/* Navigation & Header */}
          <header className="mb-12 border-b border-black/5 pb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#d49a1c]">
                    EXPENZA
                  </span>
                  <span className="w-1 h-1 rounded-full bg-black/20" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#1c1c1e]/60">
                    Control Module
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-light tracking-tight text-[#1c1c1e] mb-2">
                  Budget <strong className="font-semibold text-[#d49a1c]">Center.</strong>
                </h1>
                <p className="text-sm font-light text-[#1c1c1e]/60 tracking-wide mb-6">
                  Plan spending <span className="mx-1 opacity-40">•</span> Stay in control
                </p>

                <nav className="hidden md:flex items-center gap-2">
                  <Link href="/dashboard" className="px-5 py-2 rounded-lg text-[13px] font-medium text-[#1c1c1e]/60 hover:text-[#1c1c1e] hover:bg-black/5 transition-all">
                    Dashboard
                  </Link>
                  <div className="px-5 py-2 rounded-lg bg-black/5 text-[13px] font-medium text-[#1c1c1e] shadow-sm border border-black/5">
                    Budgets
                  </div>
                </nav>
              </div>

              <div className="flex flex-col items-end justify-end gap-6 h-full">
                <div className="hidden md:flex items-center gap-3">
                  <button
                    onClick={() => { setFormError(""); setShowModal(true); }}
                    className="bg-[#1c1c1e] text-white rounded-xl px-6 py-3 font-semibold text-[13px] tracking-wide flex items-center gap-2 active:scale-95 transition-all shadow-lg"
                  >
                    <span className="text-lg leading-none font-light">+</span> Create Budget
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Budget Health Overview Bento Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-[#f6d46b] rounded-[24px] p-6 transition-all duration-300 shadow-[0_4px_20px_rgba(246,212,107,0.2)]">
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#7a6330] mb-2">Total Budgeted</p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#1c1c1e]">
                <span className="opacity-50 font-light mr-1">₹</span>{Math.round(animTotalBudget).toLocaleString('en-IN')}
              </h2>
            </div>

            <div className="bg-[#f28b82] rounded-[24px] p-6 transition-all duration-300 shadow-[0_4px_20px_rgba(242,139,130,0.2)]">
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#7a3b36] mb-2">Total Spent</p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#1c1c1e]">
                <span className="opacity-50 font-light mr-1">₹</span>{Math.round(animTotalSpent).toLocaleString('en-IN')}
              </h2>
            </div>

            <div className="bg-[#a1c8aa] rounded-[24px] p-6 transition-all duration-300 shadow-[0_4px_20px_rgba(161,200,170,0.2)]">
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#4a6350] mb-2">Remaining Safe</p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#1c1c1e]">
                <span className="opacity-50 font-light mr-1">₹</span>{Math.round(animTotalRemaining).toLocaleString('en-IN')}
              </h2>
            </div>

            <div className="bg-[#9ea4f5] rounded-[24px] p-6 transition-all duration-300 shadow-[0_4px_20px_rgba(158,164,245,0.2)] flex flex-col justify-center">
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#42478a] mb-1">Health</p>
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-[#1c1c1e]">
                {healthScore.status}
              </h2>
              <span className="text-xs text-[#1c1c1e]/60 font-medium mt-1">{metrics.overBudgetCategories.length} over limit</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Categories Grid */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-4">
                <h3 className="text-lg font-medium tracking-tight text-[#1c1c1e]">Category Limits</h3>
                <span className="font-mono text-[10px] tracking-widest text-[#1c1c1e]/60 uppercase bg-black/5 px-3 py-1 rounded-full border border-black/5">
                  {isLoading ? 'Loading...' : `${budgets.length} Active`}
                </span>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-[24px] p-6 h-[160px] flex flex-col justify-between border border-black/5 shadow-sm">
                      <div className="flex justify-between">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 bg-black/5 rounded-xl" />
                          <div className="space-y-2 py-1">
                            <div className="w-20 h-3 bg-black/5 rounded-full" />
                            <div className="w-12 h-2 bg-black/5 rounded-full" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="w-full h-2.5 bg-black/5 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : budgets.length === 0 ? (
                <div className="bg-white rounded-[32px] p-12 flex flex-col items-center justify-center text-center fade-in-up border-dashed border-black/10">
                  <div className="w-20 h-20 rounded-full bg-[#f6d46b]/20 flex items-center justify-center mb-6">
                    <span className="text-3xl">🎯</span>
                  </div>
                  <h3 className="text-xl font-medium text-[#1c1c1e] mb-2">No Active Budgets</h3>
                  <p className="text-[13px] font-light text-[#1c1c1e]/60 max-w-[280px] mb-8 leading-relaxed">
                    Budgets help you proactively assign your money. Create your first budget to stop wondering where your money went.
                  </p>
                  <button
                    onClick={() => { setFormError(""); setShowModal(true); }}
                    className="bg-[#1c1c1e] text-white rounded-xl px-8 py-3.5 font-semibold text-[13px] tracking-wide active:scale-95 transition-transform"
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
                        className="bg-white rounded-[24px] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border border-black/5 group relative overflow-hidden"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-[var(--bg-cream)] flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                              {budget.icon}
                            </div>
                            <div>
                              <h4 className="text-[15px] font-semibold text-[#1c1c1e]">{budget.category}</h4>
                              <p className={`font-mono text-[9px] uppercase tracking-wider mt-1 ${progress.text}`}>
                                {progress.status}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <p className="text-[15px] font-bold text-[#1c1c1e]">₹{budget.spent.toLocaleString('en-IN')}</p>
                            <p className="font-mono text-[9px] text-[#1c1c1e]/50 uppercase tracking-wider mt-1">of ₹{budget.limit.toLocaleString('en-IN')}</p>
                            
                            {/* Hover/Mobile Actions */}
                            <div className="absolute top-4 right-4 flex gap-1 opacity-100 md:opacity-0 md:-translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 bg-white/95 backdrop-blur-md px-2 py-1 rounded-full border border-black/5 shadow-md">
                              <button onClick={() => openEditModal(budget)} className="text-[#1c1c1e]/50 hover:text-[#d49a1c] p-2.5 md:p-1.5 transition-colors" aria-label={`Edit ${budget.category} budget`}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                              <div className="w-px h-4 bg-black/10 my-auto" />
                              <button onClick={() => { setBudgetToDelete(budget.id); setShowDeleteModal(true); }} className="text-[#1c1c1e]/50 hover:text-[#d9534f] p-2.5 md:p-1.5 transition-colors" aria-label={`Delete ${budget.category} budget`}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar Component */}
                                                <div>
                          <div className="flex justify-between items-end mb-2">
                            <p className="font-mono text-[9px] tracking-widest text-[#1c1c1e]/50 uppercase">
                              {remaining < 0 ? 'Overspent by' : 'Remaining'}
                            </p>
                            <p className={`font-semibold tracking-tight text-sm ${progress.text}`}>
                              ₹{Math.abs(remaining).toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div className="h-3 w-full bg-[var(--bg-cream)] rounded-full overflow-hidden relative">
                            <div
                              className={`h-full bg-gradient-to-r ${progress.gradient} rounded-full transition-all duration-1000 ease-out`}
                              style={{ width: animateBars ? `${progress.percent}%` : "0%" }}
                            />
                            {/* Alert threshold marker (example at 80%) */}
                            <div className="absolute top-0 bottom-0 w-0.5 bg-[#1c1c1e]/10" style={{ left: "80%" }} />
                          </div>
                          <p className="font-mono text-[8px] tracking-wider text-[#1c1c1e]/30 mt-1.5 uppercase">
                            {budget.spent >= budget.limit * 0.8 && budget.spent < budget.limit ? "⚠️ Approaching limit" : ""}
                            {budget.spent > budget.limit ? "🔴 Over budget" : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Alerts & Performance */}
            <div className="lg:col-span-4 flex flex-col gap-6 mt-6 lg:mt-0">
              
              {/* Over Budget Alerts */}
              {metrics.overBudgetCategories.length > 0 && (
                <div className="fade-in-up">
                  <h3 className="text-lg font-medium tracking-tight text-[#1c1c1e] mb-4">Critical Alerts</h3>
                  <div className="bg-white rounded-3xl p-6 border border-[#f28b82]/30 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#f28b82]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="space-y-3 relative z-10">
                      {metrics.overBudgetCategories.map(budget => {
                        const excess = budget.spent - budget.limit;
                        return (
                          <div key={budget.id} className="flex items-center justify-between p-3 rounded-[16px] bg-[#f28b82]/10 border border-[#f28b82]/20">
                            <div className="flex items-center gap-3">
                              <span className="w-2 h-2 rounded-full bg-[#d9534f] animate-pulse" />
                              <span className="text-[13px] font-semibold text-[#d9534f]">{budget.category}</span>
                            </div>
                            <span className="font-mono text-[11px] font-medium text-[#d9534f] tracking-wider">
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
                <h3 className="text-lg font-medium tracking-tight text-[#1c1c1e] mb-4">Budget Insights</h3>
                <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#f6d46b]" />
                  <div className="space-y-4">
                    {insights.map((msg, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-[#d49a1c] mt-0.5">✦</span>
                        <p className="text-[13px] font-medium text-[#1c1c1e]/70 leading-relaxed">{msg}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Performance Section (Dark Bento Card for contrast) */}
              <div>
                <h3 className="text-lg font-medium tracking-tight text-[#1c1c1e] mb-4">Performance Overview</h3>
                <div className="bg-[#1c1c1e] rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-lg">
                  <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center mb-4">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <path className="text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                      <path
                        className={`${metrics.totalSpent > metrics.totalBudget ? 'text-[#f28b82]' : 'text-[#a1c8aa]'} transition-all duration-1500 ease-out`}
                        strokeDasharray={animateBars ? `${Math.min((metrics.totalSpent / Math.max(metrics.totalBudget, 1)) * 100, 100)}, 100` : `0, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                      <span className="text-2xl font-bold tracking-tighter text-white">
                        {metrics.totalBudget > 0 ? Math.round((metrics.totalSpent / metrics.totalBudget) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/50">
                    Total Utilized
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Create Budget Modal (Dark Bento Style) */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#e2e5de]/80 backdrop-blur-sm p-0 md:p-4 sheet-overlay">
            <div className="bg-[#1c1c1e] text-white w-full max-w-md rounded-t-[32px] md:rounded-[32px] p-8 pb-12 md:pb-8 shadow-2xl relative max-h-[90vh] overflow-y-auto hide-scroll sheet-slide-up border border-white/5">
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 md:hidden" />
              
              <div className="mb-8 mt-2 md:mt-0">
                <span className="font-mono text-[10px] tracking-[0.2em] text-[#a1c8aa] uppercase mb-2 block">
                  // New Allocation
                </span>
                <h2 className="text-3xl font-light tracking-tight">
                  Set <strong className="font-semibold">Budget</strong>
                </h2>
              </div>

              {formError && (
                <div className="mb-6 p-4 rounded-xl bg-[#f28b82]/10 border border-[#f28b82]/20 flex items-center gap-3 fade-in-up">
                  <span className="text-[#f28b82]">⚠️</span>
                  <p className="text-xs font-medium text-[#f28b82]">{formError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/50 mb-2 block">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="custom-input-dark w-full rounded-xl px-4 py-3.5 text-sm font-light appearance-none"
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
                  <label className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/50 mb-2 block">Monthly Limit</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-light">₹</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="custom-input-dark w-full rounded-xl pl-8 pr-4 py-3.5 text-sm font-light placeholder:text-white/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/50 mb-2 block">Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="custom-input-dark w-full rounded-xl px-4 py-3.5 text-sm font-light text-[#f4f0e8] [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/50 mb-2 block">Alert at {alertThreshold}%</label>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(Number(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#a1c8aa]"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="font-mono text-[8px] text-white/30">50%</span>
                    <span className="font-mono text-[8px] text-white/30">95%</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                    <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${isEssential ? 'bg-[#a1c8aa]' : 'bg-white/10'}`} onClick={() => setIsEssential(!isEssential)}>
                      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isEssential ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-sm font-light text-white/80">{isEssential ? "Essential (Need)" : "Discretionary (Want)"}</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setShowModal(false)} className="flex-1 rounded-xl bg-white/5 py-4 text-[13px] font-medium text-white/70 hover:text-white transition-colors">
                  Cancel
                </button>
                <button onClick={handleAddBudget} className="flex-1 rounded-xl bg-[#a1c8aa] py-4 text-[13px] font-semibold text-[#1c1c1e] active:scale-95 transition-transform">
                  Save Budget
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Budget Modal */}
        {showEditModal && budgetToEdit && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#e2e5de]/80 backdrop-blur-sm p-0 md:p-4 sheet-overlay">
            <div className="bg-[#1c1c1e] text-white w-full max-w-md rounded-t-[32px] md:rounded-[32px] p-8 pb-12 md:pb-8 shadow-2xl relative max-h-[90vh] overflow-y-auto hide-scroll sheet-slide-up border border-white/5">
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 md:hidden" />
              
              <div className="mb-8 mt-2 md:mt-0">
                <span className="font-mono text-[10px] tracking-[0.2em] text-[#9ea4f5] uppercase mb-2 block">
                  // Edit Allocation
                </span>
                <h2 className="text-3xl font-light tracking-tight">
                  Update <strong className="font-semibold">Budget</strong>
                </h2>
              </div>

              {formError && (
                <div className="mb-6 p-4 rounded-xl bg-[#f28b82]/10 border border-[#f28b82]/20 flex items-center gap-3 fade-in-up">
                  <span className="text-[#f28b82]">⚠️</span>
                  <p className="text-xs font-medium text-[#f28b82]">{formError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/50 mb-2 block">Category</label>
                  <select disabled className="custom-input-dark w-full rounded-xl px-4 py-3.5 text-sm font-light appearance-none opacity-50 cursor-not-allowed">
                    <option value={newCategory}>{newCategory}</option>
                  </select>
                </div>

                <div className="relative">
                  <label className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/50 mb-2 block">Monthly Limit</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-light">₹</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="custom-input-dark w-full rounded-xl pl-8 pr-4 py-3.5 text-sm font-light placeholder:text-white/30"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setShowEditModal(false)} className="flex-1 rounded-xl bg-white/5 py-4 text-[13px] font-medium text-white/70 hover:text-white transition-colors">
                  Cancel
                </button>
                <button onClick={handleEditSubmit} className="flex-1 rounded-xl bg-[#9ea4f5] py-4 text-[13px] font-semibold text-[#1c1c1e] active:scale-95 transition-transform">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e2e5de]/80 backdrop-blur-sm p-6 fade-in-up">
            <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative border border-black/5 text-center"> 
              <div className="w-16 h-16 rounded-full bg-[#f28b82]/20 flex items-center justify-center text-2xl mb-6 text-[#d9534f] mx-auto">
                🗑️
              </div>
              <h3 className="text-xl font-bold text-[#1c1c1e] mb-2">Delete Budget?</h3>
              <p className="text-[13px] font-medium text-[#1c1c1e]/60 mb-8 leading-relaxed">
                This action cannot be undone. Transactions tied to this category will not be deleted.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 rounded-xl bg-black/5 py-3.5 text-[13px] font-bold text-[#1c1c1e]/60 hover:text-[#1c1c1e] transition-colors">
                  Cancel
                </button>
                <button onClick={handleDeleteConfirm} className="flex-1 rounded-xl bg-[#f28b82] text-[#1c1c1e] py-3.5 text-[13px] font-bold active:scale-95 transition-transform shadow-md">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile App Dock (Floating Capsule) */}
        <div className="md:hidden fixed bottom-6 left-6 right-6 z-40 bg-[#1c1c1e] rounded-[32px] p-2 px-6 shadow-[0_16px_40px_rgba(0,0,0,0.5)] border border-white/5">
          <div className="flex items-center justify-between py-2">
            
            <Link href="/dashboard" className="flex items-center justify-center w-12 h-12 rounded-full text-[#8e8e93] hover:text-white hover:bg-white/5 transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            </Link>

            <button 
              onClick={() => { setFormError(""); setShowModal(true); }}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-[#1c1c1e] text-white active:scale-95 transition-all border border-white/10"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>

            <div className="flex items-center gap-3 text-[#f6d46b] bg-[#f6d46b]/10 px-5 py-2.5 rounded-full ml-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              <span className="text-[11px] font-medium tracking-wide">Budgets</span>
            </div>

          </div>
        </div>

      </main>
    </>
  );
}