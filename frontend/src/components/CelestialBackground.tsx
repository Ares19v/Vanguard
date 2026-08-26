export default function CelestialBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#f4eff5]">
      {/* ── Soft Dawn Horizon Gradient ──────────────────────────────────── */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: 'linear-gradient(180deg, #f7f2f7 0%, #eee4ef 35%, #e1d3e4 70%, #d8c7dc 100%)'
        }}
      />

      {/* ── Ambient Warm Morning Glows ───────────────────────────────────── */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[80vw] h-[400px] bg-gradient-to-b from-white/60 via-amber-100/30 to-transparent blur-3xl rounded-full" />
      <div className="absolute top-1/4 right-[20%] w-[500px] h-[300px] bg-rose-100/40 blur-[120px] rounded-full" />
      <div className="absolute top-1/3 left-[15%] w-[450px] h-[300px] bg-indigo-100/30 blur-[100px] rounded-full" />

      {/* ── Skyline Silhouette Layer (Emerging from Morning Fog) ─────────── */}
      <div className="absolute bottom-[8%] left-0 right-0 h-[480px] w-full flex items-end justify-center pointer-events-none opacity-85">
        <svg
          viewBox="0 0 1440 420"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover max-w-[1920px] mx-auto"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Skyline Building Gradients */}
            <linearGradient id="skylineGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#b4a3ba" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#9a86a1" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#7a6382" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="skylineGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#c5b6cb" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#a998b0" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#897390" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="towerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#dfd2e4" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#b8a6bf" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#9b85a3" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Background Highrises */}
          <rect x="80" y="240" width="60" height="180" rx="3" fill="url(#skylineGrad1)" />
          <rect x="160" y="210" width="75" height="210" rx="3" fill="url(#skylineGrad2)" />
          <rect x="250" y="230" width="55" height="190" rx="3" fill="url(#skylineGrad1)" />

          {/* Left Iconic Needle Tower (Transamerica Pyramid Style) */}
          <polygon points="280,70 260,380 300,380" fill="url(#towerGrad)" />
          <polygon points="280,70 270,380 290,380" fill="#ffffff" fillOpacity="0.4" />
          <line x1="280" y1="40" x2="280" y2="70" stroke="#9a86a1" strokeWidth="2" />

          <rect x="320" y="260" width="65" height="160" rx="3" fill="url(#skylineGrad2)" />
          <rect x="400" y="220" width="80" height="200" rx="3" fill="url(#skylineGrad1)" />
          <rect x="500" y="240" width="70" height="180" rx="3" fill="url(#skylineGrad2)" />
          <rect x="590" y="270" width="55" height="150" rx="3" fill="url(#skylineGrad1)" />

          {/* Center Dense City Cluster */}
          <rect x="660" y="200" width="65" height="220" rx="3" fill="url(#skylineGrad2)" />
          <rect x="740" y="180" width="75" height="240" rx="3" fill="url(#skylineGrad1)" />
          <rect x="830" y="210" width="60" height="210" rx="3" fill="url(#skylineGrad2)" />

          {/* Right Iconic Domed Tower (Salesforce Tower Style) */}
          <path
            d="M940 380 L940 140 C940 65 985 65 985 140 L985 380 Z"
            fill="url(#towerGrad)"
          />
          {/* Subtle vertical architectural highlight */}
          <path
            d="M955 380 L955 140 C955 90 970 90 970 140 L970 380 Z"
            fill="#ffffff"
            fillOpacity="0.35"
          />

          <rect x="1010" y="230" width="70" height="190" rx="3" fill="url(#skylineGrad1)" />
          <rect x="1100" y="260" width="60" height="160" rx="3" fill="url(#skylineGrad2)" />
          <rect x="1180" y="210" width="80" height="210" rx="3" fill="url(#skylineGrad1)" />
          <rect x="1280" y="250" width="70" height="170" rx="3" fill="url(#skylineGrad2)" />
        </svg>
      </div>

      {/* ── Billowing Sea Fog & Clouds (Covering the Skyline Base) ────────── */}
      <div className="absolute -bottom-10 left-0 right-0 h-[420px] w-full pointer-events-none">
        <svg
          viewBox="0 0 1440 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="mistGradBack" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fdfbfd" stopOpacity="0.75" />
              <stop offset="30%" stopColor="#f3ebf5" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#ece0ee" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#f4eff5" stopOpacity="1" />
            </linearGradient>

            <linearGradient id="mistGradFront" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#f8f4f9" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#f4eff5" stopOpacity="1" />
            </linearGradient>

            <filter id="mistBlur" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
          </defs>

          {/* Back Cloud Swell */}
          <path
            d="M-40 160 Q80 80 220 120 Q360 40 500 90 Q660 30 820 80 Q980 20 1140 70 Q1300 30 1480 110 L1480 400 L-40 400 Z"
            fill="url(#mistGradBack)"
            filter="url(#mistBlur)"
          />

          {/* Mid Cloud Swell */}
          <path
            d="M-20 210 Q140 140 300 170 Q460 110 640 150 Q820 90 980 140 Q1160 80 1320 150 Q1420 170 1480 200 L1480 400 L-20 400 Z"
            fill="url(#mistGradFront)"
            filter="url(#mistBlur)"
          />

          {/* Front Soft Horizon Bank */}
          <path
            d="M0 250 Q180 190 360 220 Q540 170 740 210 Q940 160 1120 200 Q1300 170 1440 230 L1440 400 L0 400 Z"
            fill="url(#mistGradFront)"
          />
        </svg>
      </div>
    </div>
  )
}
