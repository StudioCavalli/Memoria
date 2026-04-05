'use client'

/**
 * Memoria Brain — Animated brain illustration with warm Memoria palette.
 * Represents the cognitive/memory aspect of the product.
 * Pure CSS + SVG, zero dependencies, 60fps.
 */
export default function Scene3D() {
  return (
    <div className="w-full h-full min-h-[220px] flex items-center justify-center relative">
      {/* Outer glow */}
      <div className="absolute w-[65%] h-[65%] rounded-full bg-orange-soft/15 blur-3xl animate-pulse-slow" />

      {/* Rotating neural connection rings */}
      <div
        className="absolute w-[88%] h-[88%] rounded-full border border-brown-light/8 animate-[spin_30s_linear_infinite]"
      />
      <div
        className="absolute w-[82%] h-[82%] rounded-full border border-orange-soft/10 animate-[spin_22s_linear_infinite_reverse]"
      />

      {/* Main brain container */}
      <div className="relative w-[65%] h-[65%] max-w-[300px] max-h-[300px] animate-float">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-2xl"
          style={{ filter: 'drop-shadow(0 0 40px rgba(232,168,124,0.3))' }}
        >
          <defs>
            {/* Brain gradient */}
            <radialGradient id="brainGrad" cx="45%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#f0c9a0" />
              <stop offset="40%" stopColor="#E8A87C" />
              <stop offset="75%" stopColor="#c8956a" />
              <stop offset="100%" stopColor="#8B6F47" />
            </radialGradient>
            {/* Highlight gradient */}
            <radialGradient id="brainHighlight" cx="35%" cy="30%" r="40%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            {/* Inner shadow */}
            <radialGradient id="brainShadow" cx="60%" cy="65%" r="50%">
              <stop offset="0%" stopColor="rgba(107,82,53,0)" />
              <stop offset="100%" stopColor="rgba(107,82,53,0.3)" />
            </radialGradient>
          </defs>

          {/* Brain base shape — two hemispheres */}
          <g transform="translate(100, 105)">
            {/* Left hemisphere */}
            <path
              d="M-5,-65 C-45,-65 -70,-45 -72,-10 C-74,15 -65,35 -50,48 C-38,58 -20,62 -5,60"
              fill="url(#brainGrad)"
              stroke="#8B6F47"
              strokeWidth="1.5"
            />
            {/* Right hemisphere */}
            <path
              d="M5,-65 C45,-65 70,-45 72,-10 C74,15 65,35 50,48 C38,58 20,62 5,60"
              fill="url(#brainGrad)"
              stroke="#8B6F47"
              strokeWidth="1.5"
            />

            {/* Central fissure */}
            <path
              d="M0,-65 C-2,-30 2,10 0,60"
              fill="none"
              stroke="#7D6340"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />

            {/* Left hemisphere folds (sulci) */}
            <path d="M-15,-50 C-35,-45 -50,-30 -55,-10" fill="none" stroke="#9A6429" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
            <path d="M-10,-30 C-30,-25 -55,-15 -60,5" fill="none" stroke="#9A6429" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
            <path d="M-8,-10 C-25,-5 -50,5 -55,25" fill="none" stroke="#9A6429" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
            <path d="M-10,15 C-28,20 -45,30 -42,45" fill="none" stroke="#9A6429" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />

            {/* Right hemisphere folds */}
            <path d="M15,-50 C35,-45 50,-30 55,-10" fill="none" stroke="#9A6429" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
            <path d="M10,-30 C30,-25 55,-15 60,5" fill="none" stroke="#9A6429" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
            <path d="M8,-10 C25,-5 50,5 55,25" fill="none" stroke="#9A6429" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
            <path d="M10,15 C28,20 45,30 42,45" fill="none" stroke="#9A6429" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />

            {/* Highlight overlay */}
            <ellipse cx="-15" cy="-30" rx="30" ry="25" fill="url(#brainHighlight)" />

            {/* Depth shadow */}
            <ellipse cx="10" cy="20" rx="45" ry="35" fill="url(#brainShadow)" />
          </g>

          {/* Neural activity sparkles */}
          <circle cx="55" cy="55" r="3" fill="#E8A87C" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="140" cy="65" r="2.5" fill="#D4A5A5" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="70" cy="140" r="2" fill="#E8A87C" opacity="0.6">
            <animate attributeName="opacity" values="0.6;0.15;0.6" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="135" cy="130" r="2.5" fill="#7FB069" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="100" cy="45" r="2" fill="#D4A5A5" opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2.2s" repeatCount="indefinite" />
          </circle>

          {/* Neural connection lines (subtle) */}
          <line x1="55" y1="55" x2="100" y2="45" stroke="#E8A87C" strokeWidth="0.5" opacity="0.2">
            <animate attributeName="opacity" values="0.2;0.05;0.2" dur="3s" repeatCount="indefinite" />
          </line>
          <line x1="140" y1="65" x2="135" y2="130" stroke="#D4A5A5" strokeWidth="0.5" opacity="0.15">
            <animate attributeName="opacity" values="0.15;0.03;0.15" dur="2.5s" repeatCount="indefinite" />
          </line>
          <line x1="70" y1="140" x2="100" y2="45" stroke="#E8A87C" strokeWidth="0.5" opacity="0.1">
            <animate attributeName="opacity" values="0.1;0.02;0.1" dur="4s" repeatCount="indefinite" />
          </line>
        </svg>
      </div>

      {/* Floating memory particles */}
      <div className="absolute w-2.5 h-2.5 rounded-full bg-orange-soft/50 top-[12%] left-[20%] animate-float"
        style={{ animationDelay: '-1s', animationDuration: '4.5s' }} />
      <div className="absolute w-2 h-2 rounded-full bg-rose-dusty/40 top-[18%] right-[18%] animate-float"
        style={{ animationDelay: '-2.5s', animationDuration: '5s' }} />
      <div className="absolute w-3 h-3 rounded-full bg-orange-soft/30 bottom-[20%] left-[15%] animate-float"
        style={{ animationDelay: '-0.5s', animationDuration: '6s' }} />
      <div className="absolute w-1.5 h-1.5 rounded-full bg-green-light/40 top-[40%] right-[12%] animate-float"
        style={{ animationDelay: '-3s', animationDuration: '4s' }} />
      <div className="absolute w-2 h-2 rounded-full bg-cream/40 bottom-[15%] right-[22%] animate-float"
        style={{ animationDelay: '-1.8s', animationDuration: '5.5s' }} />
    </div>
  )
}
