//@ts-nocheck
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin/dashboard")
  }, [router])

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
    </div>
  )
}
