import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFF8F0',
          borderRadius: 36,
        }}
      >
        <svg
          width="140"
          height="140"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="24" cy="24" r="23" fill="#FFF8F0" stroke="#8B6F47" strokeWidth="1.5" />
          <circle cx="24" cy="24" r="17" fill="#E8A87C" opacity="0.4" />
          <path
            d="M16 30 C16 22, 20 18, 24 16 C28 18, 32 22, 32 30"
            stroke="#8B6F47"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <line x1="24" y1="16" x2="24" y2="30" stroke="#8B6F47" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="20" cy="14" r="1.5" fill="#E8A87C" />
          <circle cx="28" cy="13" r="1" fill="#E8A87C" opacity="0.7" />
          <circle cx="24" cy="11" r="1.2" fill="#E8A87C" opacity="0.5" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
