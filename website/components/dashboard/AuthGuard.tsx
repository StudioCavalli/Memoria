'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  children: React.ReactNode
}

export default function AuthGuard({ children }: Props) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('memoria_token')
    if (!token) {
      router.replace('/login')
    } else {
      setAuthorized(true)
    }
  }, [router])

  if (!authorized) {
    return null
  }

  return <>{children}</>
}
