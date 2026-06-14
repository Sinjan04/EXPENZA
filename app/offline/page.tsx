"use client";
export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[#0c0d10] flex flex-col items-center justify-center p-6 text-[#f4f0e8]" style={{ fontFamily: "'Sora', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@200;300;400;600&family=DM+Mono:wght@300;400;500&display=swap');
        
        .glass-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(12,13,16,0.6) 100%);
          border: 1px solid rgba(255,255,255,0.06);
          border-top: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
      `}</style>
      
      <div className="glass-card rounded-[32px] p-10 md:p-12 max-w-md w-full text-center relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#f0c040] to-transparent opacity-20" />
        
        <div className="w-20 h-20 mx-auto rounded-full bg-[#f0c040]/10 flex items-center justify-center text-3xl mb-8 border border-[#f0c040]/20 shadow-[inset_0_0_20px_rgba(240,192,64,0.05)]">
          📡
        </div>
        
        <span className="font-mono text-[10px] tracking-[0.2em] text-[#f0c040] uppercase mb-3 block">
          // Connection Lost
        </span>
        <h1 className="text-3xl font-light tracking-tight mb-3">
          Signal <strong className="font-semibold text-[#f0c040]">Dropped.</strong>
        </h1>
        <p className="text-[13px] font-light text-[#9e98b0] mb-10 leading-relaxed">
          EXPENZA requires an active connection to securely sync your financial data. Please check your network and try again.
        </p>
        
        <button 
          onClick={() => window.location.reload()} 
          className="w-full rounded-xl bg-gradient-to-r from-[#f0c040] to-[#e8a020] text-[#0c0d10] py-4 text-[13px] font-semibold hover:brightness-110 transition-all shadow-[0_4px_20px_rgba(240,192,64,0.3)]"
        >
          Try Reconnecting
        </button>
      </div>
    </main>
  );
}