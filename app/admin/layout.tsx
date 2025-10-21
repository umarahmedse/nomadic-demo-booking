//@ts-nocheck
"use client"

import type React from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { LogOut, LayoutDashboard, ShoppingCart, Settings, Tent, Menu, X, FileText } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import Image from "next/image"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isLoginPage = pathname === "/admin/login"

  useEffect(() => {
    if (isLoginPage) return // Don't redirect if already on login page
    if (status === "loading") return // Still loading

    if (!session) {
      router.push("/admin/login")
      return
    }

    if (session.user?.role !== "admin") {
      router.push("/")
      return
    }
  }, [session, status, router, isLoginPage])

  if (isLoginPage) {
    return <>{children}</>
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FBF9D9] via-[#E6CFA9] to-[#D3B88C] flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-[#3C2317]/20 rounded-full animate-spin mx-auto mb-6">
              <div className="absolute inset-0 w-12 h-12 border-4 border-t-[#3C2317] rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="text-[#3C2317] text-base font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FBF9D9] via-[#E6CFA9] to-[#D3B88C] flex items-center justify-center">
        <div className="text-center bg-[#FBF9D9]/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-[#D3B88C]/50">
          <div className="w-16 h-16 bg-gradient-to-br from-[#3C2317] to-[#5D4037] rounded-full flex items-center justify-center mx-auto mb-6">
            <Tent className="w-8 h-8 text-[#FBF9D9]" />
          </div>
          <p className="text-base font-medium mb-4 text-[#3C2317]">Access Denied</p>
          <p className="text-[#3C2317]/80 mb-6">Please login as Admin to continue</p>
          <Button
            asChild
            className="bg-gradient-to-r from-[#3C2317] to-[#5D4037] hover:from-[#3C2317]/90 hover:to-[#5D4037]/90 text-[#FBF9D9]"
          >
            <Link href="/admin/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  const campingNav = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Overview & Analytics",
    },
    {
      href: "/admin/orders",
      label: "Orders",
      icon: ShoppingCart,
      description: "Manage Bookings",
    },
    {
      href: "/admin/invoices",
      label: "Invoice Generator",
      icon: FileText,
      description: "Generate & Email Invoices",
    },
    {
      href: "/admin/settings",
      label: "Settings",
      icon: Settings,
      description: "System Configuration",
    },
  ]

  const bbqNav = [
    {
      href: "/admin/barbecue",
      label: "Barbecue Bookings",
      icon: ShoppingCart,
      description: "Manage Desert BBQ",
    },
    {
      href: "/admin/barbecue/settings",
      label: "BBQ Settings",
      icon: Settings,
      description: "BBQ Pricing & Add-ons",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FBF9D9] via-[#E6CFA9] to-[#D3B88C]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[#3C2317]/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-80 bg-[#FBF9D9]/95 backdrop-blur-md border-r border-[#D3B88C]/50 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-[#D3B88C]/50">
            <div className="flex items-center justify-between">
              <Link href="/admin/dashboard" className="flex flex-col items-center space-x-3 group">
                <div className="relative">
                  <Image
                    src="/logo.png"
                    alt="NOMADIC"
                    width={140}
                    height={45}
                    className="h-10 w-auto group-hover:scale-105 transition-all duration-300"
                  />
                </div>
                {/* <div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="border-[#D3B88C] text-[#3C2317] bg-[#D3B88C]/20 text-xs">
                      Admin Panel
                    </Badge>
                  </div>
                </div> */}
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-[#3C2317] hover:bg-[#3C2317]/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-6 space-y-4">
            <div>
              <div className="px-4 pb-2 text-xs uppercase tracking-widest text-[#3C2317]/60">Camping</div>
              <div className="space-y-2">
                {campingNav.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center space-x-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group",
                        isActive
                          ? "bg-gradient-to-r from-[#3C2317] to-[#5D4037] text-[#FBF9D9] shadow-lg"
                          : "text-[#3C2317] hover:bg-[#D3B88C]/30 hover:shadow-md",
                      )}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
                          isActive ? "bg-[#FBF9D9]/20" : "bg-[#D3B88C]/20 group-hover:bg-[#D3B88C]/40",
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{item.label}</div>
                        <div className={cn("text-xs opacity-80", isActive ? "text-[#FBF9D9]/80" : "text-[#3C2317]/60")}>
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="pt-2">
              <div className="px-4 pb-2 text-xs uppercase tracking-widest text-[#3C2317]/60">Barbecue</div>
              <div className="space-y-2">
                {bbqNav.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center space-x-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group",
                        isActive
                          ? "bg-gradient-to-r from-[#3C2317] to-[#5D4037] text-[#FBF9D9] shadow-lg"
                          : "text-[#3C2317] hover:bg-[#D3B88C]/30 hover:shadow-md",
                      )}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
                          isActive ? "bg-[#FBF9D9]/20" : "bg-[#D3B88C]/20 group-hover:bg-[#D3B88C]/40",
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{item.label}</div>
                        <div className={cn("text-xs opacity-80", isActive ? "text-[#FBF9D9]/80" : "text-[#3C2317]/60")}>
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </nav>

          {/* User Info & Logout */}
          <div className="p-6 border-t border-[#D3B88C]/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#D3B88C] to-[#E6CFA9] rounded-full flex items-center justify-center">
                <span className="text-[#3C2317] font-bold text-sm">
                  {session?.user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[#3C2317]">{session?.user?.username}</div>
                <div className="text-xs text-[#3C2317]/60">Administrator</div>
              </div>
            </div>

            <Button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="w-full bg-gradient-to-r from-[#3C2317]/10 to-[#5D4037]/10 hover:from-[#3C2317]/20 hover:to-[#5D4037]/20 text-[#3C2317] border border-[#D3B88C]/50 hover:border-[#3C2317]/30 cursor-pointer"
              variant="outline"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-80">
        {/* Mobile Header */}
        <div className="lg:hidden bg-[#FBF9D9]/95 backdrop-blur-md border-b border-[#D3B88C]/50 p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="text-[#3C2317] hover:bg-[#3C2317]/10"
            >
              <Menu className="w-5 h-5" />
            </Button>

            <div className="flex items-center space-x-2">
              <Image src="/logo.png" alt="NOMADIC" width={100} height={32} className="h-6 w-auto" />
            </div>
          </div>
        </div>

        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  )
}
