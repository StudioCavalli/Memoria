'use client'

import dynamic from 'next/dynamic'

const BrainScene = dynamic(() => import('./BrainScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[220px] flex items-center justify-center">
      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-soft to-rose-dusty animate-pulse-slow opacity-40" />
    </div>
  ),
})

export default function Scene3D() {
  return <BrainScene />
}
