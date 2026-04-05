'use client'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const dimensions = {
    sm: { icon: 28, text: 'text-xl', gap: 'gap-2' },
    md: { icon: 34, text: 'text-2xl', gap: 'gap-2.5' },
    lg: { icon: 44, text: 'text-3xl', gap: 'gap-3' },
  }

  const { icon, text, gap } = dimensions[size]

  return (
    <span className={`inline-flex items-center ${gap}`}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Outer warm glow circle */}
        <circle cx="24" cy="24" r="23" fill="#FFF8F0" stroke="#8B6F47" strokeWidth="1.5" />
        {/* Inner gradient orb — memory glow */}
        <circle cx="24" cy="24" r="17" fill="url(#memoriaGrad)" opacity="0.85" />
        {/* Stylised open-book / speech-bubble shape */}
        <path
          d="M16 30 C16 22, 20 18, 24 16 C28 18, 32 22, 32 30"
          stroke="#8B6F47"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Centre spine of the book */}
        <line x1="24" y1="16" x2="24" y2="30" stroke="#8B6F47" strokeWidth="1.5" strokeLinecap="round" />
        {/* Small decorative dots — like floating memories */}
        <circle cx="20" cy="14" r="1.5" fill="#E8A87C" />
        <circle cx="28" cy="13" r="1" fill="#E8A87C" opacity="0.7" />
        <circle cx="24" cy="11" r="1.2" fill="#E8A87C" opacity="0.5" />
        <defs>
          <radialGradient id="memoriaGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#E8A87C" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#D4A5A5" stopOpacity="0.2" />
          </radialGradient>
        </defs>
      </svg>
      {showText && (
        <span className={`font-heading ${text} font-bold text-brown-dark`}>
          Memoria
        </span>
      )}
    </span>
  )
}
