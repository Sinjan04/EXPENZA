"use client";
import { useState, useEffect } from "react";
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
const [showLoginSheet, setShowLoginSheet] = useState(false);
const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
const [rememberMe, setRememberMe] = useState(false);
const [currentSlide, setCurrentSlide] = useState(0);

useEffect(() => {
  const timer = setInterval(() => {
    setCurrentSlide((prev) => (prev === 2 ? 0 : prev + 1));
  }, 6000); // Swipes every 6 seconds
  return () => clearInterval(timer);
}, []);

const validate = () => {
  const newErrors: typeof errors = {};
  if (!email.trim()) newErrors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email format";
  
  if (!password) newErrors.password = "Password is required";
  else if (password.length < 6) newErrors.password = "Min 6 characters";
  
  if (!isLogin && !name.trim()) newErrors.name = "Name is required";
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async () => {
  setLoading(true);
  setFadeOut(true);

  try {
    if (isLogin) {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
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

      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );

      window.location.href = "/dashboard";
    } else {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
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

      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );

      window.location.href = "/dashboard";
    }
  } finally {
    setLoading(false);
  }
};
  return (
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@200;300;400;600&family=DM+Mono:wght@300;400;500&family=Caveat:wght@500;600&display=swap');

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
          color: var(--gold);
          text-transform: uppercase;
          margin-bottom: 12px;
        }

@media (max-width: 1024px) {
          .auth-root {
            grid-template-columns: 1fr;
            overflow-y: auto;
            overflow-x: hidden;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            padding: 0;
            background: #fdf5f0; /* Soft Peach background for narrative zone */
          }
          .bg-stage { display: none; }

          /* ── MOBILE CAROUSEL STYLES ── */
          .mobile-carousel-wrapper {
            display: block;
            position: relative;
            height: 55vh;
            width: 100%;
            overflow: hidden;
            background: #f6efe8; /* Warm cream matching your asset */
          }
          .carousel-track {
            display: flex;
            height: 100%;
            transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
          }
          .carousel-slide {
            min-width: 100%;
            height: 100%;
            position: relative;
          }
          .slide-bg {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center 20%;
          }
          .placeholder-bg { background: rgba(0,0,0,0.03); }
          
/* Clean Expenza Text Overlay */
          .slide-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: flex-end;
            justify-content: flex-start;
            pointer-events: none;
            padding: 0 24px 6vh 24px; /* Shifted further down towards the wave */
          }
          .slide-pill {
            background: rgba(255, 255, 255, 0.25); /* Extremely slight light wash */
            backdrop-filter: blur(4px); /* Just enough to soften the image details behind the text */
            -webkit-backdrop-filter: blur(4px);
            color: var(--card-dark); 
            padding: 12px 20px; /* Restored slight padding for the backdrop shape */
            border-radius: 16px;
            font-family: 'Sora', sans-serif;
            font-size: 22px; 
            font-weight: 700; 
            line-height: 1.3;
            text-align: left;
            max-width: 85%;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04); /* Whisper-thin shadow */
            border: 1px solid rgba(255, 255, 255, 0.2); /* Ultra-soft edge */
          }

          /* SVG Wave */
          .wave-divider {
            position: absolute;
            bottom: -2px; /* Pulls it down slightly to prevent hairline gaps */
            left: 0;
            width: 100%;
            line-height: 0;
            z-index: 5;
          }
          .wave-divider svg { display: block; width: calc(100% + 1.3px); height: 40px; }

          /* Carousel Pagination Dots */
          .carousel-dots {
            position: absolute;
            bottom: 24px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: center;
            gap: 8px;
            z-index: 10;
          }
          .carousel-dots .dot {
            width: 6px; height: 6px; border-radius: 50%;
            background: rgba(28,28,30,0.15); transition: all 0.3s ease;
          }
          .carousel-dots .dot.active {
            width: 20px; border-radius: 4px; background: var(--accent-mustard);
          }

          /* ── NARRATIVE ZONE (Below Wave) ── */
          .left-panel {
            display: flex !important;
            position: relative;
            padding: 0px 24px 250px; /* Reduced top padding, increased bottom padding to avoid buttons */
            margin-top: -10px; /* Pulls it up snugly against the wave */
            flex: 1 1 auto;
            text-align: center;
            justify-content: flex-start;
            background: transparent;
          }
          .left-panel > div { width: 100%; }
          .brand-tag { 
            font-size: 12px !important; 
            margin-bottom: 12px !important; 
            color: var(--accent-coral) !important;
            letter-spacing: 0.25em !important;
            font-weight: 600;
          }
          .hero-headline { 
            font-size: 32px !important; 
            font-weight: 300 !important; 
            color: var(--card-dark) !important; 
          }
          .hero-headline .accent-line { 
            display: block !important; 
            margin-top: 4px;
            color: var(--accent-mustard) !important;
          }
          .hero-sub {
            display: block !important; /* Forces the paragraph to show */
            margin-top: 16px;
            margin-left: auto;
            margin-right: auto;
            font-size: 14px;
            line-height: 1.6;
            color: var(--text-muted);
            max-width: 90%;
          }
          .stat-row, .center-divider { display: none !important; }

          /* ── BOTTOM SHEET MOBILE FORM (Preserved) ── */
          .right-panel {
            position: fixed !important;
            top: 10vh !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            display: flex !important;
            flex-direction: column;
            align-items: center;
            background: var(--bg-cream) !important;
            border-radius: 36px 36px 0 0 !important;
            padding: 0 !important;
            box-shadow: 0 -16px 48px rgba(0, 0, 0, 0.4) !important;
            transform: translateY(100vh) !important;
            opacity: 0;
            pointer-events: none;
            transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.4s ease !important;
            z-index: 100 !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .right-panel.sheet-active {
            transform: translateY(0) !important;
            opacity: 1;
            pointer-events: auto;
          }
          .right-panel::before {
            content: ''; position: absolute; top: 16px; left: 50%; transform: translateX(-50%);
            width: 48px; height: 5px; background: rgba(0,0,0,0.1); border-radius: 10px; z-index: 101;
          }
          .form-shell {
            width: 100%; height: 100%; max-width: 100%; margin: 0;
            background: transparent !important; border-radius: 0 !important; border: none !important;
            padding: 56px 24px max(40px, env(safe-area-inset-bottom)) !important;
            box-shadow: none !important; overflow-y: auto; -webkit-overflow-scrolling: touch;
          }
          .mobile-brand { display: block; margin-bottom: 24px; }
          .hide-on-mobile { display: none; }
          .terminal-header { align-items: center; justify-content: center; text-align: center; }

          /* Mobile Bottom CTA Pinned Bar */
          .mobile-cta-bar {
            position: fixed; bottom: 0; left: 0; right: 0; z-index: 40;
            padding: 20px 20px max(24px, env(safe-area-inset-bottom));
            display: flex; flex-direction: column; gap: 12px;
            background: linear-gradient(to top, #fdf5f0 50%, rgba(253,245,240,0.85) 75%, transparent 100%);
            pointer-events: none; transition: opacity 0.3s ease, visibility 0.3s ease;
          }
          .mobile-cta-bar > * { pointer-events: auto; }
          .mobile-cta-bar.hidden { opacity: 0; pointer-events: none; visibility: hidden; }

          .mobile-cta-btn {
            width: 100%; padding: 16px; border-radius: 16px; font-family: 'Sora', sans-serif;
            font-size: 14px; font-weight: 600; letter-spacing: 0.04em;
            display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer;
            border: none; transition: transform 0.2s ease;
          }
          .mobile-cta-btn:active { transform: scale(0.98); }
          .mobile-cta-btn.primary { background: var(--accent-mustard); color: var(--card-dark); box-shadow: 0 4px 16px rgba(246, 212, 107, 0.2); }
          .mobile-cta-btn.secondary { background: var(--card-light); color: var(--card-dark); border: 1px solid var(--border-soft); }

          /* Mobile Google Logic */
          .google-btn { display: none !important; }
          .auth-divider.desktop-only { display: none !important; }
          .auth-divider.mobile-only-divider { display: flex !important; margin-top: 24px; }
          .mobile-google-row { display: flex !important; }
        }

       @media (min-width: 1025px) {
          /* STRICTLY HIDES ALL MOBILE ELEMENTS FROM DESKTOP */
          .mobile-only-divider, .mobile-google-row, .mobile-cta-bar, .mobile-features, .mobile-trust-badge, 
          .mobile-carousel-wrapper { 
            display: none !important; 
          }
          .bg-stage { display: block !important; }
        }
        }

        /* 5. Circular Google Button (Updated for Light Theme) */
        .mobile-google-row {
          display: none;
          justify-content: center;
          margin-bottom: 8px;
        }
        .mobile-google-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--card-light);
          border: 1px solid var(--border-soft);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .mobile-google-circle:active { transform: scale(0.95); background: #f4f4f4; }
        .mobile-google-circle svg { width: 22px; height: 22px; }

/* ── ANIMATED BACKGROUND LAYER ── */
        .bg-stage {
  position: fixed;
  inset: 0;
  background: var(--ink);
  pointer-events: none;
  z-index: 1;
}



        /* Radial glow pools */
        .glow-pool {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
        }
        .glow-pool-1 {
          width: 700px; height: 700px;
          background: radial-gradient(circle, rgba(240,192,64,0.22) 0%, transparent 65%);
          top: -250px; left: -150px;
          animation: poolDrift1 16s ease-in-out infinite alternate;
        }
        .glow-pool-2 {
          width: 580px; height: 580px;
          background: radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 65%);
          bottom: -180px; right: -120px;
          animation: poolDrift2 20s ease-in-out infinite alternate;
        }
        .glow-pool-3 {
          width: 360px; height: 360px;
          background: radial-gradient(circle, rgba(240,192,64,0.1) 0%, transparent 70%);
          top: 40%; left: 35%;
          animation: poolDrift1 26s ease-in-out infinite alternate;
          filter: blur(80px);
        }
        @keyframes poolDrift1 {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(70px, 50px) scale(1.18); }
        }
        @keyframes poolDrift2 {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(-55px, -70px) scale(1.12); }
        }

        
/* Solid Pastel Floating Blocks */
        .txn-card {
          position: absolute;
          border-radius: 20px;
          padding: 16px 20px;
          animation: cardDrift ease-in-out infinite alternate;
          pointer-events: none;
          box-shadow: 0 12px 24px rgba(0,0,0,0.06);
          color: var(--text-main);
          border: 1px solid rgba(0,0,0,0.04);
        }
        .txn-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 6px;
          opacity: 0.7;
        }
        .txn-amount {
          font-family: 'Sora', sans-serif;
          font-weight: 600;
          font-size: 20px;
          letter-spacing: -0.03em;
        }
        .txn-sub {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          margin-top: 5px;
          opacity: 0.6;
        }
        .txn-dot { display: none; }
        .txn-bar { display: none; }
        .txn-bar-fill { display: none; }

        .txn-card-1 { background: var(--accent-sage); top: 10%; left: 15%; width: 172px; animation-duration: 9s; animation-delay: 0s; }
        .txn-card-3 { background: var(--accent-coral); top: 25%; right: 52%; width: 175px; animation-duration: 11s; animation-delay: -2s; }
        .txn-card-4 { background: var(--accent-mustard); top: 45%; right: 55%; width: 166px; animation-duration: 13s; animation-delay: -5s; }



        @keyframes cardDrift {
          0%   { transform: translateY(0px)  rotate(-0.4deg) scale(1); }
          30%  { transform: translateY(-16px) rotate(0.5deg)  scale(1.01); }
          65%  { transform: translateY(-8px)  rotate(-0.7deg) scale(0.99); }
          100% { transform: translateY(-20px) rotate(0.4deg)  scale(1.01); }
        }

       
        @keyframes scanMove {
          0%   { top: -2px; opacity: 0; }
          3%   { opacity: 0.5; }
          97%  { opacity: 0.3; }
          100% { top: 100%; opacity: 0; }
        }
          /* ── DIVIDER LINE ── */
        .center-divider { display: none; }

        /* ── LEFT PANEL ── */
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
          font-weight: 300;
          letter-spacing: 0.22em;
          color: var(--text-main);
          margin-bottom: 28px;
        }

        .hero-headline {
          font-family: 'Sora', sans-serif;
          font-size: clamp(42px, 4.8vw, 68px);
          font-weight: 200;
          line-height: 1.1;
          color: var(--text-main);
          letter-spacing: -0.04em;
        }
        .hero-headline strong {
          font-weight: 600;
          color: var(--card-dark);
        }
        .hero-headline .accent-line {
          display: inline;
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

        /* ── RIGHT PANEL ── */
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
          border-radius: 32px;
          border: 1px solid var(--border-soft);
          padding: 40px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.04);
        }

        /* Form top badge */
        .terminal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }
        .form-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(161,200,170,0.2);
          border: 1px solid rgba(161,200,170,0.4);
          border-radius: 100px;
          padding: 5px 12px 5px 8px;
        }
        .badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--accent-sage);
          box-shadow: 0 0 8px var(--accent-sage);
          animation: dotPulse 2s ease-in-out infinite;
        }
        .badge-text {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.18em;
          color: var(--accent-sage);
          text-transform: uppercase;
        }
        .form-tagline {
          font-family: 'Sora', sans-serif;
          font-size: 12px;
          font-weight: 400;
          color: var(--text-muted);
        }

        /* Tab switcher */
        .tab-rail {
          position: relative;
          display: flex;
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 28px;
          background: var(--bg-cream);
          gap: 2px;
        }
        .tab-pill {
          position: absolute;
          top: 4px; bottom: 4px;
          width: calc(50% - 4px);
          border-radius: 8px;
          background: var(--card-light);
          transition: transform 0.38s cubic-bezier(.34,1.56,.64,1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .tab-pill.right { transform: translateX(100%); }

        .tab-btn {
          position: relative;
          flex: 1;
          background: none;
          border: none;
          cursor: pointer;
          padding: 10px 0;
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          font-weight: 600;
          transition: color 0.3s ease;
          z-index: 1;
          border-radius: 6px;
        }
        .tab-btn.active { color: var(--text-main); }
        .tab-btn.inactive { color: var(--text-muted); font-weight: 400; }

        /* Form heading */
        .form-title {
          font-family: 'Sora', sans-serif;
          font-size: clamp(28px, 8vw, 32px);
          font-weight: 300;
          color: var(--text-main);
          letter-spacing: -0.04em;
          line-height: 1.15;
          margin-bottom: 6px;
        }
        .form-title strong {
          font-weight: 600;
          color: var(--accent-periwinkle);
        }
        .form-subtitle {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 0.12em;
          margin-bottom: 32px;
          text-transform: uppercase;
        }

        /* Inputs */
        .field-wrap {
          position: relative;
          margin-bottom: 16px;
        }
        .field-wrap::after { display: none; }

        .field-label {
          display: block;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 8px;
          transition: color 0.25s ease;
        }
        .field-wrap:focus-within .field-label { color: var(--text-main); }

        .field-input {
          width: 100%;
          background: rgba(0,0,0,0.02);
          border: 1px solid var(--border-soft);
          border-radius: 12px;
          padding: 14px 16px;
          color: var(--text-main);
          font-family: 'Sora', sans-serif;
          font-size: 16px;
          font-weight: 400;
          letter-spacing: -0.01em;
          outline: none;
          transition: all 0.25s ease;
        }
        @media (min-width: 1025px) { .field-input { font-size: 14px; } }
        .field-input::placeholder { color: var(--text-muted); opacity: 0.5; }
        .field-input:focus {
          background: var(--card-light);
          border-color: var(--accent-mustard);
          box-shadow: 0 0 0 3px rgba(246, 212, 107, 0.15);
        }

        /* Submit button */
        .submit-btn {
          position: relative;
          width: 100%;
          margin-top: 12px;
          padding: 16px;
          background: var(--card-dark);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          letter-spacing: 0.04em;
          font-weight: 600;
          color: var(--card-light);
          transition: all 0.2s ease;
        }
        .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
        .submit-btn:active { transform: translateY(0); }

        /* Google Button & Divider */
        @media (max-width: 1024px) {
          .desktop-only { display: none !important; }
        }
        .google-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          background: var(--bg-cream);
          border: 1px solid var(--border-soft);
          border-radius: 12px;
          padding: 14px;
          color: var(--text-main);
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s ease;
          margin-bottom: 24px;
        }
        .google-btn:hover { background: #d8dbd5; }
        .google-icon { width: 18px; height: 18px; }
        
        .auth-divider { display: flex; align-items: center; text-align: center; margin-bottom: 24px; }
        .auth-divider::before, .auth-divider::after { content: ''; flex: 1; border-bottom: 1px solid var(--border-soft); }
        .auth-divider span { padding: 0 16px; font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; color: var(--text-muted); }

        /* Field reveal animation */
        .field-slide { animation: slideIn 0.38s cubic-bezier(.34,1.56,.64,1) both; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }

        /* Form shell entrance */
        .form-shell { animation: shellIn 0.7s cubic-bezier(.23,1,.32,1) both; }
        @keyframes shellIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Left panel entrance */
        .left-panel > div { animation: panelIn 0.9s cubic-bezier(.23,1,.32,1) both; animation-delay: 0.1s; }
        @keyframes panelIn {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.2); border-top: 2px solid #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .auth-fade-out { animation: authFadeOut 0.6s ease forwards; }
        @keyframes authFadeOut { to { opacity: 0; transform: translateY(-8px); } }
      `}</style>

      {/* ── BACKGROUND STAGE ── */}
      <div
  className={`bg-stage ${
    fadeOut ? "auth-fade-out" : ""
  }`}
>
        <div className="bg-grid" />
        <div className="glow-pool glow-pool-1" />
        <div className="glow-pool glow-pool-2" />
        <div className="glow-pool glow-pool-3" />
        <div className="scan-line" />

        

        {/* Floating transaction cards */}
<div className="txn-card txn-card-1">
          <div className="txn-label"><span className="txn-dot" style={{background:'#34d399'}} />Salary received</div>
          <div className="txn-amount positive">+₹84,500</div>
          <div className="txn-sub">HDFC · Oct 01 · 09:14 AM</div>
          <div className="txn-bar"><div className="txn-bar-fill" style={{width:'78%', background:'#34d399'}} /></div>
        </div>
        
        <div className="txn-card txn-card-3">
          <div className="txn-label"><span className="txn-dot" style={{background:'#f87171'}} />Paris travel</div>
          <div className="txn-amount negative">−€420</div>
          <div className="txn-sub">Amex · Hotel + Flight</div>
          <div className="txn-bar"><div className="txn-bar-fill" style={{width:'44%', background:'#f87171'}} /></div>
        </div>
        <div className="txn-card txn-card-4">
          <div className="txn-label"><span className="txn-dot" style={{background:'#34d399'}} />Nikkei dividend</div>
          <div className="txn-amount positive">¥18,000</div>
          <div className="txn-sub">Quarterly payout</div>
          <div className="txn-bar"><div className="txn-bar-fill" style={{width:'55%', background:'#34d399'}} /></div>
        </div>
        
      </div>

      {/* Center divider */}
      <div className="center-divider" />

      <main
  className={`auth-root ${
    fadeOut ? "auth-fade-out" : ""
  }`}
>
       {/* ── MOBILE HERO CAROUSEL ── */}
        <div className="mobile-carousel-wrapper">
          <div className="carousel-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
            {/* Slide 1 */}
            <div className="carousel-slide">
              <img src="/onboarding/slide-1.png" alt="Track transactions" className="slide-bg" />
              <div className="slide-overlay">
                <div className="slide-pill">
                  Track your transactions hassle free and on the go
                </div>
              </div>
            </div>
{/* Slide 2 */}
            <div className="carousel-slide">
              <img src="/onboarding/slide-2.png" alt="Smart Budgets" className="slide-bg" />
              <div className="slide-overlay">
                <div className="slide-pill">
                  Set smart budgets and see exactly where your money goes
                </div>
              </div>
            </div>
            {/* Slide 3 */}
            <div className="carousel-slide">
              <img src="/onboarding/slide-3.png" alt="Grow Wealth" className="slide-bg" />
              <div className="slide-overlay">
                <div className="slide-pill">
                  Build your savings and watch your wealth grow effortlessly
                </div>
              </div>
            </div>
          
          {/* SVG Curvy Wave matching the text zone's peach background */}
          <div className="wave-divider">
            <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path fill="#fdf5f0" fillOpacity="1" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,197.3C960,213,1056,203,1152,176C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>

          {/* Dots */}
          <div className="carousel-dots">
            <div className={`dot ${currentSlide === 0 ? 'active' : ''}`} onClick={() => setCurrentSlide(0)} />
            <div className={`dot ${currentSlide === 1 ? 'active' : ''}`} onClick={() => setCurrentSlide(1)} />
            <div className={`dot ${currentSlide === 2 ? 'active' : ''}`} onClick={() => setCurrentSlide(2)} />
          </div>
        </div>

        {/* ── LEFT PANEL (Desktop) / NARRATIVE ZONE (Mobile) ── */}
        <div className="left-panel">
          <div>
            <div className="brand-tag">EXPENZA</div>
            <h1 className="hero-headline">
              Your money,<br />
              <span className="accent-line">fully alive.</span>
            </h1>

            <p className="hero-sub">
              One place for every rupee, dollar, and euro. Track spending, grow savings, and finally understand where it all goes.
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
<div className={`right-panel ${showLoginSheet ? 'sheet-active' : ''}`}>

            {/* Mobile sheet close button */}
            <button
              onClick={() => setShowLoginSheet(false)}
              className="absolute top-5 left-5 z-10 md:hidden w-9 h-9 rounded-full bg-black/[0.03] border border-black/[0.06] flex items-center justify-center text-[var(--text-muted)] active:bg-black/[0.06] transition-colors"
              aria-label="Close login sheet"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>

          <div className="form-shell">

            {/* Form badge */}
            <div className="terminal-header">
              <div className="form-tagline">
                <div className="mobile-brand">EXPENZA</div>
                Know where every rupee goes.
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

            {/* Premium Google Button (Hidden on Mobile) */}
<button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="google-btn"
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
    onChange={(e) => {
      setEmail(e.target.value);
      if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
    }}
    onBlur={() => {
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setErrors(prev => ({ ...prev, email: "Invalid email format" }));
      }
    }}
    className="field-input"
    style={{ borderColor: errors.email ? "var(--accent-coral)" : undefined }}
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? "email-error" : undefined}
  />
  {errors.email && (
    <p id="email-error" className="font-mono text-[9px] tracking-wider uppercase mt-2" style={{ color: "var(--accent-coral)" }}>
      {errors.email}
    </p>
  )}
</div>

              <div className="field-wrap">
  <label className="field-label">Password</label>

  <div style={{ position: "relative" }}>
    <input
      type={showPassword ? "text" : "password"}
      placeholder="••••••••••••"
      value={password}
      onChange={(e) => {
        setPassword(e.target.value);
        if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
      }}
      onBlur={() => {
        if (password && password.length < 6) setErrors(prev => ({ ...prev, password: "Min 6 characters" }));
      }}
      className="field-input"
      style={{ paddingRight: "48px", borderColor: errors.password ? "var(--accent-coral)" : undefined }}
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
        color: "#9e98b0",
      }}
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  </div>
  {errors.password && (
    <p className="font-mono text-[9px] tracking-wider uppercase mt-2" style={{ color: "var(--accent-coral)" }}>
      {errors.password}
    </p>
  )}
</div>

              {/* Remember Me + Forgot Password row */}
              <div className="flex items-center justify-between mb-2" style={{ marginTop: "-4px" }}>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border border-black/10 accent-[var(--accent-mustard)] cursor-pointer"
                  />
                  <span className="font-mono text-[10px] tracking-wider uppercase text-[var(--text-muted)]">Remember me</span>
                </label>
                <a
                  href="/forgot-password"
                  className="font-mono text-[10px] tracking-wider uppercase text-[var(--accent-periwinkle)] hover:text-[var(--accent-mustard)] transition-colors"
                >
                  Forgot Password?
                </a>
              </div>

              <button
  className="submit-btn"
  onClick={() => {
    if (validate()) handleSubmit();
  }}
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
) : (
    isLogin
      ? "→ Sign In"
      : "→ Create Account"
  )}
</button>
            </div>

            <div className="auth-divider mobile-only-divider">
              <span>Or continue with</span>
            </div>

            {/* Mobile-only circular Google button */}
            <div className="mobile-google-row">
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="mobile-google-circle"
                aria-label="Continue with Google"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </button>
            </div>

            {/* Footer links */}
            <div className="mt-8 pt-6 border-t border-[var(--border-soft)] flex flex-col items-center gap-3">
              <div className="flex items-center gap-4">
                <a href="/privacy" className="font-mono text-[9px] tracking-wider uppercase text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">Privacy</a>
                <span className="w-1 h-1 rounded-full bg-[var(--text-muted)] opacity-30" />
                <a href="/terms" className="font-mono text-[9px] tracking-wider uppercase text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">Terms</a>
                <span className="w-1 h-1 rounded-full bg-[var(--text-muted)] opacity-30" />
                <a href="mailto:support@expenza.app" className="font-mono text-[9px] tracking-wider uppercase text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">Contact</a>
              </div>
              <p className="font-mono text-[8px] tracking-widest uppercase text-[var(--text-muted)] opacity-50">
                © 2026 Expenza. All rights reserved.
              </p>
            </div>

          </div>
        </div>

        {/* Mobile Bottom CTA Bar */}
        <div className={`mobile-cta-bar ${showLoginSheet ? 'hidden' : ''}`}>
          <button
            onClick={() => setShowLoginSheet(true)}
            className="mobile-cta-btn primary"
          >
            Log In / Sign Up
          </button>
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="mobile-cta-btn secondary"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
        </div>

</main>
    </>
  );
}