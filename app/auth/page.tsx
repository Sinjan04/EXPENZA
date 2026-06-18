"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showMobileSheet, setShowMobileSheet] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setFadeOut(true);

    try {
      if (isLogin) {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.error || "Login failed");
          setLoading(false);
          setFadeOut(false);
          return;
        }

        localStorage.setItem("token", data.token);
        alert("Logged in successfully");
        await new Promise((resolve) => setTimeout(resolve, 500));
        window.location.href = "/dashboard";
      } else {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.error || "Registration failed");
          setLoading(false);
          setFadeOut(false);
          return;
        }

        alert("Account created successfully");
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
        window.location.href = "/dashboard";
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@200;300;400;600&family=DM+Mono:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg-cream: #e2e5de;
          --card-dark: #1c1c1e;
          --card-light: #ffffff;
          --accent-mustard: #f6d46b;
          --accent-periwinkle: #9ea4f5;
          --accent-sage: #a1c8aa;
          --accent-coral: #f28b82;
          --text-main: #1c1c1e;
          --text-muted: #8e8e93;
          --border-soft: rgba(0,0,0,0.06);
        }

        .auth-root {
          min-height: 100vh;
          background: var(--bg-cream);
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'Sora', sans-serif;
          overflow: hidden;
          position: relative;
        }

        /* ── MOBILE NATIVE UX (PROGRESSIVE DISCLOSURE) ── */
        .mobile-brand {
          display: none;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.25em;
          color: var(--accent-mustard);
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        @media (max-width: 1024px) {
          .auth-root { 
            grid-template-columns: 1fr; 
            overflow-y: auto; 
            overflow-x: hidden; 
            padding-bottom: 180px; 
          }
          
          /* Show Hero Hub */
          .left-panel { 
            display: flex !important; 
            padding: 8vh 24px;
            align-items: center;
            text-align: center;
          }
          .hero-sub { margin: 20px auto 0 auto; color: var(--text-muted) !important; }
          .stat-row { justify-content: center; border-top-color: var(--border-soft) !important; }
          .stat-item { border-right-color: var(--border-soft) !important; }
          .mobile-brand { display: block; margin-bottom: 24px; }

          /* Convert Desktop form to Mobile Bottom Sheet */
          .right-panel { 
            position: fixed;
            inset: 0;
            background: rgba(28, 28, 30, 0.4);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            z-index: 50;
            padding: 0;
            align-items: flex-end;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
          }
          .right-panel.sheet-open {
            opacity: 1;
            pointer-events: auto;
          }

          .form-shell { 
            width: 100%;
            max-width: 100%;
            margin: 0;
            background: var(--card-light);
            border-radius: 32px 32px 0 0;
            border: 1px solid var(--border-soft);
            border-bottom: none;
            padding: 32px 24px max(40px, env(safe-area-inset-bottom)) 24px;
            box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.1);
            transform: translateY(100%);
            transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
            position: relative;
          }
          .right-panel.sheet-open .form-shell {
            transform: translateY(0);
          }
          
          /* Push background blocks out of reading zone */
          .pastel-block-1 { top: 2%; left: -20%; transform: scale(0.6); opacity: 0.4; }
          .pastel-block-3 { top: auto; bottom: 20%; right: -25%; transform: scale(0.6); opacity: 0.4; }
          .pastel-block-4 { display: none; }

          .hide-on-mobile { display: none; }
          .terminal-header { align-items: center; justify-content: center; text-align: center; }
          
          .field-input { padding: 15px 16px; }
          .submit-btn { padding: 18px; font-size: 14px; margin-top: 14px; }
          .form-title { font-size: clamp(28px, 8vw, 36px); margin-bottom: 8px; }
        }

        /* ── SOLID PASTEL BACKGROUND BLOCKS ── */
        .bg-stage {
          position: fixed;
          inset: 0;
          background: var(--bg-cream);
          pointer-events: none;
          z-index: 1;
        }

        .pastel-block {
          position: absolute;
          border-radius: 24px;
          padding: 20px 24px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.06);
          animation: cardDrift ease-in-out infinite alternate;
          color: var(--text-main);
          border: 1px solid rgba(0,0,0,0.03);
        }
        
        .block-label {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          opacity: 0.7;
        }
        .block-amount {
          font-family: 'Sora', sans-serif;
          font-weight: 600;
          font-size: 24px;
          letter-spacing: -0.03em;
        }
        .block-sub {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          margin-top: 6px;
          opacity: 0.6;
        }

        .pastel-block-1 {
          background: var(--accent-sage);
          top: 10%;
          left: 15%;
          width: 200px;
          animation-duration: 9s;
          animation-delay: 0s;
        }
        .pastel-block-3 {
          background: var(--accent-coral);
          top: 25%;
          right: 52%;
          width: 200px;
          animation-duration: 11s;
          animation-delay: -2s;
        }
        .pastel-block-4 {
          background: var(--accent-mustard);
          top: 45%;
          right: 55%;
          width: 180px;
          animation-duration: 13s;
          animation-delay: -5s;
        }

        @keyframes cardDrift {
          0%   { transform: translateY(0px)  rotate(-1deg) scale(1); }
          100% { transform: translateY(-20px) rotate(1deg)  scale(1.02); }
        }

        /* ── LEFT PANEL (MARKETING) ── */
        .left-panel {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 72px;
        }

        .brand-tag {
          font-family: 'Sora', sans-serif;
          font-size: 34px;
          font-weight: 400;
          letter-spacing: 0.15em;
          color: var(--text-main);
          margin-bottom: 28px;
        }

        .hero-headline {
          font-family: 'Sora', sans-serif;
          font-size: clamp(42px, 4.8vw, 68px);
          font-weight: 300;
          line-height: 1.1;
          color: var(--text-main);
          letter-spacing: -0.04em;
        }
        .hero-headline strong {
          font-weight: 600;
          color: var(--card-dark);
        }
        .hero-headline .accent-line {
          display: block;
          color: var(--accent-mustard);
          font-weight: 600;
        }

        .hero-sub {
          margin-top: 24px;
          font-family: 'Sora', sans-serif;
          font-size: 15px;
          line-height: 1.75;
          color: var(--text-muted);
          max-width: 380px;
          font-weight: 400;
        }

        .stat-row {
          display: flex;
          gap: 0;
          margin-top: 48px;
          padding-top: 36px;
          border-top: 1px solid var(--border-soft);
        }
        .stat-item {
          flex: 1;
          padding-right: 24px;
          border-right: 1px solid var(--border-soft);
          margin-right: 24px;
        }
        .stat-item:last-child { border-right: none; margin-right: 0; }
        .stat-num {
          font-family: 'Sora', sans-serif;
          font-size: 26px;
          font-weight: 600;
          color: var(--text-main);
          letter-spacing: -0.04em;
        }
        .stat-num span { color: var(--accent-mustard); font-weight: 400; }
        .stat-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.18em;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-top: 4px;
        }

        /* ── RIGHT PANEL (FORM CONTAINER) ── */
        .right-panel {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 48px;
        }
        .form-shell {
          width: 100%;
          max-width: 420px;
          background: var(--card-light);
          padding: 48px;
          border-radius: 32px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.04);
          border: 1px solid var(--border-soft);
        }

        .terminal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
        .form-tagline { font-family: 'Sora', sans-serif; font-size: 12px; font-weight: 400; color: var(--text-muted); }

        /* Tabs */
        .tab-rail {
          position: relative;
          display: flex;
          background: var(--bg-cream);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 32px;
          gap: 2px;
        }
        .tab-pill {
          position: absolute;
          top: 4px; bottom: 4px;
          width: calc(50% - 4px);
          border-radius: 8px;
          background: var(--card-light);
          transition: transform 0.38s cubic-bezier(.34,1.56,.64,1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .tab-pill.right { transform: translateX(100%); }

        .tab-btn {
          position: relative;
          flex: 1;
          background: none; border: none; cursor: pointer;
          padding: 10px 0; font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600;
          transition: color 0.3s ease; z-index: 1;
        }
        .tab-btn.active { color: var(--text-main); }
        .tab-btn.inactive { color: var(--text-muted); font-weight: 400; }

        /* Form Text */
        .form-title { font-family: 'Sora', sans-serif; font-size: clamp(28px, 8vw, 32px); font-weight: 300; color: var(--text-main); line-height: 1.15; margin-bottom: 8px; }
        .form-title strong { font-weight: 600; color: var(--accent-periwinkle); }
        .form-subtitle { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--text-muted); letter-spacing: 0.12em; margin-bottom: 32px; text-transform: uppercase; }

        /* Inputs */
        .field-wrap { margin-bottom: 16px; }
        .field-label { display: block; font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; }
        .field-input {
          width: 100%; background: var(--bg-cream); border: 1px solid transparent; border-radius: 12px;
          padding: 14px 16px; color: var(--text-main); font-family: 'Sora', sans-serif; font-size: 14px; outline: none; transition: all 0.25s ease;
        }
        .field-input:focus { border-color: var(--accent-mustard); background: var(--card-light); box-shadow: 0 0 0 3px rgba(246, 212, 107, 0.15); }

        /* Buttons */
        .submit-btn {
          width: 100%; margin-top: 12px; padding: 16px; background: var(--card-dark); border: none; border-radius: 12px;
          cursor: pointer; font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 600; color: var(--card-light); transition: all 0.2s ease;
        }
        .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
        .submit-btn:active { transform: translateY(0); }

        @media (max-width: 1024px) { .desktop-only { display: none !important; } }
        .google-btn {
          display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%;
          background: var(--bg-cream); border: 1px solid var(--border-soft); border-radius: 12px;
          padding: 14px; color: var(--text-main); font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.25s ease; margin-bottom: 24px;
        }
        .google-btn:hover { background: #d8dbd5; }
        
        .auth-divider { display: flex; align-items: center; margin-bottom: 24px; }
        .auth-divider::before, .auth-divider::after { content: ''; flex: 1; border-bottom: 1px solid var(--border-soft); }
        .auth-divider span { padding: 0 16px; font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; color: var(--text-muted); }

        .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.2); border-top: 2px solid #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .auth-fade-out { animation: authFadeOut 0.6s ease forwards; }
        @keyframes authFadeOut { to { opacity: 0; transform: translateY(-8px); } }
      `}</style>

      {/* ── BACKGROUND STAGE ── */}
      <div className={`bg-stage ${fadeOut ? "auth-fade-out" : ""}`}>
        {/* Solid Pastel Floating Blocks (Replaces glass cards) */}
        <div className="pastel-block pastel-block-1">
          <div className="block-label">Salary In</div>
          <div className="block-amount">+₹84k</div>
          <div className="block-sub">HDFC Bank</div>
        </div>
        <div className="pastel-block pastel-block-3">
          <div className="block-label">Expense</div>
          <div className="block-amount">−₹12k</div>
          <div className="block-sub">Flight Ticket</div>
        </div>
        <div className="pastel-block pastel-block-4">
          <div className="block-label">Insight</div>
          <div className="block-amount">45 Days</div>
          <div className="block-sub">Current Runway</div>
        </div>
      </div>

      <main className={`auth-root ${fadeOut ? "auth-fade-out" : ""}`}>
        {/* ── LEFT PANEL (DESKTOP MARKETING) ── */}
        <div className="left-panel">
          <div>
            <div className="brand-tag">EXPENZA</div>
            <h1 className="hero-headline">
              Your money,<br />
              <span className="accent-line">fully alive.</span>
            </h1>
            <p className="hero-sub">
              One place for every rupee. Track spending, grow savings, and finally understand where it all goes with our minimalist command center.
            </p>

            <div className="stat-row">
              <div className="stat-item">
                <div className="stat-num"><span>₹</span>2.4Cr</div>
                <div className="stat-label">Tracked daily</div>
              </div>
              <div className="stat-item">
                <div className="stat-num">98<span>%</span></div>
                <div className="stat-label">Accuracy</div>
              </div>
              <div className="stat-item">
                <div className="stat-num">24<span>/7</span></div>
                <div className="stat-label">Live sync</div>
              </div>
            </div>
          </div>
        </div>
        {/* ── RIGHT PANEL (Desktop Form / Mobile Sheet) ── */}
        <div className={`right-panel ${showMobileSheet ? 'sheet-open' : ''}`}>
          {/* Mobile Overlay Click to Close */}
          <div className="absolute inset-0 block lg:hidden bg-black/10" onClick={() => setShowMobileSheet(false)} />
          
          <div className="form-shell">
            {/* Mobile Drag Pill */}
            <div className="w-12 h-1.5 bg-[#1c1c1e]/10 rounded-full mx-auto mb-6 block lg:hidden" />

            {/* Form badge */}
            <div className="terminal-header">
              <div className="form-tagline">
                <div className="mobile-brand">EXPENZA</div>
                <span className="hidden lg:inline">Know where every rupee goes.</span>
              </div>

              <div className="form-tagline hide-on-mobile">
                Track • Save • Grow
              </div>
            </div>

            {/* Tab switcher */}
            <div className="tab-rail">
              <div className={`tab-pill ${isLogin ? '' : 'right'}`} />
              <button
                className={`tab-btn ${isLogin ? 'active' : 'inactive'}`}
                onClick={() => setIsLogin(true)}
              >
                Login
              </button>
              <button
                className={`tab-btn ${!isLogin ? 'active' : 'inactive'}`}
                onClick={() => setIsLogin(false)}
              >
                Register
              </button>
            </div>
            
            {/* Heading */}
            <div className="form-title">
              {isLogin
                ? (<>Good to see<br />you <strong>again.</strong></>)
                : (<>Let's get you<br /><strong>started.</strong></>)}
            </div>
            <div className="form-subtitle">
              {isLogin ? '// enter your details below' : '// takes less than a minute'}
            </div>

            {/* Premium Google Button (Hidden on Mobile to prevent duplicates) */}
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="google-btn desktop-only"
            >
              <svg className="google-icon" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <div className="auth-divider desktop-only">
              <span>Or continue with email</span>
            </div>

            {/* Fields */}
            <div>
              {!isLogin && (
                <div className="field-wrap field-slide">
                  <label className="field-label">Full Name</label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="field-input"
                  />
                </div>
              )}

              <div className="field-wrap">
                <label className="field-label">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field-input"
                />
              </div>

              <div className="field-wrap">
                <label className="field-label">Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="field-input"
                    style={{ paddingRight: "48px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "#8e8e93",
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                className="submit-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div className="spinner" />
                    Entering...
                  </div>
                ) : isLogin ? (
                  "→ Sign In"
                ) : (
                  "→ Create Account"
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── MOBILE PINNED ACTION BAR ── */}
      <div 
        className="block lg:hidden fixed bottom-0 left-0 right-0 px-6 pt-12 bg-gradient-to-t from-[var(--bg-cream)] via-[var(--bg-cream)] to-transparent z-40"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="flex items-center justify-center gap-3 w-full bg-white text-[#1c1c1e] font-semibold rounded-2xl py-4 text-[14px] shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-black/5 active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>
        
        <button
          onClick={() => setShowMobileSheet(true)}
          className="w-full mt-4 text-[#8e8e93] text-[13px] font-medium tracking-wide pb-2 active:text-[#1c1c1e] transition-colors"
        >
          Or sign in with email
        </button>
      </div>
    </>
  );
}