"use client"

import type React from "react"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, AlertCircle, Shield } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
        callbackUrl: "/admin/dashboard",
      })

      if (result?.error) {
        setError("Invalid username or password. Please check your credentials.")
      } else if (result?.ok) {
        router.push("/admin/dashboard")
      } else {
        setError("Login failed. Please try again.")
      }
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FBF9D9] via-[#E6CFA9] to-[#D3B88C] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#3C2317]/20 via-[#5D4037]/10 to-[#3C2317]/20"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-[#3C2317]/10 to-transparent"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3">
            <Image src="/logo.png" alt="NOMADIC" width={200} height={65} className="h-12 w-auto" />
          </Link>
          <p className="text-[#3C2317] mt-3 font-medium text-lg">Admin Dashboard</p>
        </div>

        <Card className="shadow-2xl border-0 bg-[#FBF9D9]/95 backdrop-blur-sm border-[#D3B88C]/50">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-[#3C2317]">Welcome Back</CardTitle>
            <p className="text-[#3C2317]/80 mt-2">Sign in to access your dashboard</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[#3C2317] font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Enter your username"
                  className="border-[#D3B88C] focus:border-[#3C2317] focus:ring-[#3C2317]/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#3C2317] font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="Enter your password"
                    className="pr-12 border-[#D3B88C] focus:border-[#3C2317] focus:ring-[#3C2317]/20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-[#3C2317] hover:text-[#3C2317] hover:bg-[#3C2317]/10"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#3C2317] to-[#5D4037] hover:from-[#3C2317]/90 hover:to-[#5D4037]/90 text-[#FBF9D9] font-medium cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-[#FBF9D9]/30 border-t-[#FBF9D9] rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-[#E6CFA9] border border-[#D3B88C] rounded-lg">
              <div className="flex items-center mb-2">
                <Shield className="h-4 w-4 text-[#3C2317] mr-2" />
                <p className="text-sm font-medium text-[#3C2317]">Default Admin Credentials:</p>
              </div>
              <p className="text-xs text-[#3C2317]">Username: admin</p>
              <p className="text-xs text-[#3C2317]">Password: Admin@123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
