'use client'

/**
 * Memoria Orb — Pure CSS animated orb replacing Three.js Scene3D.
 * Renders a warm, organic floating sphere with glow and particle effects.
 * Zero dependencies, 60fps, React 19 compatible.
 */
export default function Scene3D() {
  return (
    <div className="w-full h-full min-h-[220px] flex items-center justify-center relative">
      {/* Outer glow */}
      <div className="absolute w-[70%] h-[70%] rounded-full bg-orange-soft/20 blur-3xl animate-pulse-slow" />

      {/* Wireframe ring */}
      <div
        className="absolute w-[85%] h-[85%] rounded-full border border-brown-light/10 animate-[spin_25s_linear_infinite]"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(232,168,124,0.05), transparent 70%)',
        }}
      />
      <div
        className="absolute w-[90%] h-[90%] rounded-full border border-orange-soft/8 animate-[spin_35s_linear_infinite_reverse]"
      />

      {/* Main orb */}
      <div
        className="relative w-[60%] h-[60%] max-w-[280px] max-h-[280px] rounded-full animate-float"
        style={{
          background: 'radial-gradient(circle at 35% 30%, #f0c9a0, #E8A87C 40%, #c8956a 70%, #8B6F47 100%)',
          boxShadow: '0 0 60px rgba(232,168,124,0.4), 0 0 120px rgba(232,168,124,0.15), inset 0 -20px 40px rgba(107,82,53,0.3), inset 0 10px 30px rgba(255,248,240,0.3)',
        }}
      >
        {/* Highlight / light reflection */}
        <div
          className="absolute top-[15%] left-[20%] w-[35%] h-[30%] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.6), transparent 70%)',
          }}
        />

        {/* Inner depth ring */}
        <div
          className="absolute inset-[15%] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle at 60% 60%, transparent 30%, rgba(212,165,165,0.4) 70%, transparent 100%)',
          }}
        />
      </div>

      {/* Floating memory dots */}
      <div className="absolute w-3 h-3 rounded-full bg-orange-soft/60 top-[15%] left-[25%] animate-float"
        style={{ animationDelay: '-1s', animationDuration: '4s' }} />
      <div className="absolute w-2 h-2 rounded-full bg-rose-dusty/50 top-[20%] right-[22%] animate-float"
        style={{ animationDelay: '-2.5s', animationDuration: '5s' }} />
      <div className="absolute w-2.5 h-2.5 rounded-full bg-orange-soft/40 bottom-[25%] left-[18%] animate-float"
        style={{ animationDelay: '-0.5s', animationDuration: '6s' }} />
      <div className="absolute w-1.5 h-1.5 rounded-full bg-brown-light/40 top-[35%] right-[15%] animate-float"
        style={{ animationDelay: '-3s', animationDuration: '4.5s' }} />
      <div className="absolute w-2 h-2 rounded-full bg-cream/50 bottom-[18%] right-[28%] animate-float"
        style={{ animationDelay: '-1.8s', animationDuration: '5.5s' }} />
    </div>
  )
}
