import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="24" cy="24" r="23" fill="#FFF8F0" stroke="#8B6F47" strokeWidth="1.5" />
          <circle cx="24" cy="24" r="17" fill="#E8A87C" opacity="0.4" />
          <path
            d="M16 30 C16 22, 20 18, 24 16 C28 18, 32 22, 32 30"
            stroke="#8B6F47"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <line x1="24" y1="16" x2="24" y2="30" stroke="#8B6F47" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
