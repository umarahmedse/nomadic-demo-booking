//@ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Eye,
  TrendingUp,
  Tent,
  Star,
  Trash2,
  AlertCircle,
  Settings,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import type { Booking } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import InvoiceDownloadButton from "@/components/invoice-download-button"
import Link from "next/link"

let useSession: any = () => ({ data: { user: { username: "Admin" } } })
try {
  const auth = require("next-auth/react")
  useSession = auth.useSession
} catch (e) {
  // Fallback if next-auth not available
}

function formatDate(date: string | Date) {
  try {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return "-"
  }
}

function getStatusBadge(booking: Booking) {
  if (booking.isPaid) {
    return <Badge className="bg-green-100 text-green-800 border-green-200 font-medium">Paid</Badge>
  }
  return <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-medium">Pending</Badge>
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalBookings: 0,
    paidBookings: 0,
    totalRevenue: 0,
    pendingBookings: 0,
  })
  const [chartData, setChartData] = useState({
    monthlyBookings: [] as Array<{
      month: string
      bookings: number
      revenue: number
    }>,
    locationStats: [] as Array<{
      location: string
      bookings: number
      revenue: number
    }>,
  })
  const [blocks, setBlocks] = useState<
    Array<{ _id: string; date: string | Date; scope: "camping" | "barbecue"; reason?: string | null }>
  >([])
  const [blockForm, setBlockForm] = useState<{ scope: "camping" | "barbecue"; date: string; reason: string }>({
    scope: "camping",
    date: "",
    reason: "",
  })
  const [blockFormRange, setBlockFormRange] = useState<{
    scope: "camping" | "barbecue"
    startDate: string
    endDate: string
    reason: string
  }>({
    scope: "camping",
    startDate: "",
    endDate: "",
    reason: "",
  })
  const [blockLoading, setBlockLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isManagementMode, setIsManagementMode] = useState(false)
  const [localStartDate, setLocalStartDate] = useState("")
  const [localEndDate, setLocalEndDate] = useState("")
  const [blockingMode, setBlockingMode] = useState<"single" | "range">("single")

  useEffect(() => {
    fetchDashboardData()
    fetchBlocks()
  }, [])

  useEffect(() => {
    filterBookings()
  }, [bookings, searchTerm, startDate, endDate])

  const filterBookings = () => {
    let filtered = bookings

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (booking) =>
          booking.customerName.toLowerCase().includes(term) ||
          booking.customerEmail.toLowerCase().includes(term) ||
          booking.customerPhone?.toLowerCase().includes(term),
      )
    }

    if (startDate) {
      const start = new Date(startDate)
      filtered = filtered.filter((booking) => new Date(booking.bookingDate) >= start)
    }

    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filtered = filtered.filter((booking) => new Date(booking.bookingDate) <= end)
    }

    setFilteredBookings(filtered)
  }

  const calculateManagementStats = () => {
    const totalOrders = filteredBookings.length
    const totalRevenue = filteredBookings.reduce((sum, booking) => sum + booking.total, 0)
    const totalResources = filteredBookings.reduce((sum, booking) => sum + booking.numberOfTents, 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    return {
      totalOrders,
      totalRevenue,
      totalResources,
      averageOrderValue,
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const statsResponse = await fetch("/api/stats", {
        cache: "no-store",
      })
      if (!statsResponse.ok) throw new Error("Failed to fetch stats")
      const statsData = await statsResponse.json()
      setStats(statsData)

      const chartResponse = await fetch("/api/charts", {
        cache: "no-store",
      })
      if (!chartResponse.ok) throw new Error("Failed to fetch chart data")
      const chartDataResponse = await chartResponse.json()
      setChartData({
        monthlyBookings: chartDataResponse.monthlyBookings || [],
        locationStats: chartDataResponse.locationStats || [],
      })

      const bookingsResponse = await fetch("/api/bookings?isPaid=true&limit=10", {
        cache: "no-store",
      })
      if (!bookingsResponse.ok) throw new Error("Failed to fetch bookings")
      const bookingsData = await bookingsResponse.json()
      setBookings(bookingsData.bookings || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const fetchBlocks = async () => {
    try {
      const res = await fetch("/api/blocked-dates?scope=")
      const data = await res.json()
      setBlocks(data.items || [])
    } catch (e) {
      console.error("[blocks] fetch error", e)
    }
  }

  const addBlock = async () => {
    if (blockingMode === "single") {
      if (!blockForm.date) {
        toast.error("Please select a date to block")
        return
      }
    } else {
      if (!blockFormRange.startDate || !blockFormRange.endDate) {
        toast.error("Please select both start and end dates")
        return
      }
      const start = new Date(blockFormRange.startDate)
      const end = new Date(blockFormRange.endDate)
      if (end < start) {
        toast.error("End date must be after or equal to start date")
        return
      }
    }

    setBlockLoading(true)
    try {
      const payload =
        blockingMode === "single"
          ? blockForm
          : {
              startDate: blockFormRange.startDate,
              endDate: blockFormRange.endDate,
              scope: blockFormRange.scope,
              reason: blockFormRange.reason,
            }

      const res = await fetch("/api/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to add block")
      }
      toast.success(blockingMode === "single" ? "Date blocked successfully" : "Date range blocked successfully")
      setBlockForm((p) => ({ ...p, reason: "" }))
      setBlockFormRange((p) => ({ ...p, reason: "" }))
      await fetchBlocks()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to block date")
    } finally {
      setBlockLoading(false)
    }
  }

  const removeBlock = async (id: string) => {
    try {
      const res = await fetch(`/api/blocked-dates/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to remove block")
      toast.success("Date unblocked")
      await fetchBlocks()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove block")
    }
  }

  const handleDeleteBooking = async (bookingId: string) => {
    setDeleteLoading(bookingId)
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setBookings(bookings.filter((booking) => booking._id !== bookingId))
        await fetchDashboardData()
        toast.success("Booking deleted successfully")
      } else {
        toast.error("Failed to delete booking")
      }
    } catch (error) {
      console.error("Error deleting booking:", error)
      toast.error("Failed to delete booking")
    } finally {
      setDeleteLoading(null)
    }
  }

  const stats_data = calculateManagementStats()
  const username = session?.user?.username || "Admin"

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#3C2317] mb-2">Dashboard Overview</h1>
              <p className="text-[#3C2317]/80 text-base">
                Welcome back, {username}. Here's what's happening with your bookings.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#3C2317] to-[#5D4037] rounded-xl flex items-center justify-center shadow-lg">
                <Tent className="w-6 h-6 text-[#FBF9D9]" />
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-[#3C2317]">NOMADIC</div>
                <div className="text-sm text-[#3C2317]/60">Glamping Admin</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#FBF9D9]/80 backdrop-blur-sm border-[#D3B88C]/50 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#3C2317]">Total Bookings</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-br from-[#3C2317] to-[#5D4037] rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-[#FBF9D9]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#3C2317]">{stats.totalBookings}</div>
              <p className="text-xs text-[#3C2317]/60 mt-1">Confirmed paid bookings</p>
            </CardContent>
          </Card>

          <Card className="bg-[#FBF9D9]/80 backdrop-blur-sm border-[#D3B88C]/50 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#3C2317]">Confirmed Bookings</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-br from-[#84cc16] to-[#65a30d] rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#84cc16]">{stats.paidBookings}</div>
              <p className="text-xs text-[#3C2317]/60 mt-1">Paid and confirmed</p>
            </CardContent>
          </Card>

          <Card className="bg-[#FBF9D9]/80 backdrop-blur-sm border-[#D3B88C]/50 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#3C2317]">Total Revenue</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-br from-[#0891b2] to-[#0e7490] rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#0891b2]">AED {stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-[#3C2317]/60 mt-1">From confirmed bookings</p>
            </CardContent>
          </Card>

          <Card className="bg-[#FBF9D9]/80 backdrop-blur-sm border-[#D3B88C]/50 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#3C2317]">Monthly Average</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-br from-[#be123c] to-[#9f1239] rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#be123c]">
                {stats.totalBookings > 0
                  ? Math.round(stats.totalRevenue / Math.max(1, Math.ceil(stats.totalBookings / 12)))
                  : 0}
              </div>
              <p className="text-xs text-[#3C2317]/60 mt-1">AED per month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          <Card className="bg-gradient-to-br from-[#FBF9D9]/90 to-[#E6CFA9]/80 backdrop-blur-sm border-[#D3B88C]/50 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-4 border-b border-[#D3B88C]/50">
              <CardTitle className="flex items-center text-[#3C2317] text-lg font-semibold">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0891b2] to-[#0e7490] rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div>Monthly Bookings & Revenue</div>
                  <p className="text-sm text-[#3C2317]/60 font-normal mt-1">Track your monthly performance trends</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 !p-0">
              <ChartContainer
                config={{
                  bookings: {
                    label: "Bookings",
                    color: "#0891b2",
                  },
                  revenue: {
                    label: "Revenue (AED)",
                    color: "#84cc16",
                  },
                }}
                className="h-[320px] w-full"
              >
                <BarChart data={chartData.monthlyBookings} margin={{ top: 20, right: 0, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="bookingsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0891b2" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#0891b2" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D3B88C" strokeOpacity={0.3} />
                  <XAxis dataKey="month" stroke="#3C2317" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#3C2317" fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "#D3B88C", opacity: 0.1 }} />
                  <Bar dataKey="bookings" fill="url(#bookingsGradient)" radius={[6, 6, 0, 0]} strokeWidth={0} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#FBF9D9]/90 to-[#E6CFA9]/80 backdrop-blur-sm border-[#D3B88C]/50 shadow-xl hover:shadow-2xl transition-all duration-300 ">
            <CardHeader className="pb-4 border-b border-[#D3B88C]/50">
              <CardTitle className="flex items-center text-[#3C2317] text-lg font-semibold">
                <div className="w-12 h-12 bg-gradient-to-br from-[#84cc16] to-[#65a30d] rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div>Bookings by Location</div>
                  <p className="text-sm text-[#3C2317]/60 font-normal mt-1">Popular destinations breakdown</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ChartContainer
                config={{
                  bookings: {
                    label: "Bookings",
                    color: "#84cc16",
                  },
                }}
                className="h-[320px] w-full !p-0"
              >
                <BarChart
                  data={chartData.locationStats}
                  layout="horizontal"
                  margin={{ top: 10, right: 0, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="locationGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#84cc16" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#84cc16" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D3B88C" strokeOpacity={0.3} />
                  <XAxis type="number" stroke="#3C2317" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey="location"
                    type="category"
                    width={60}
                    stroke="#3C2317"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "#D3B88C", opacity: 0.1 }} />
                  <Bar dataKey="bookings" fill="url(#locationGradient)" radius={[0, 6, 6, 0]} strokeWidth={0} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm border-[#D3B88C]/30 shadow-xl mb-8">
          <CardHeader className="border-b border-[#D3B88C]/20 p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[#3C2317] text-xl font-semibold flex items-center">
                <Calendar className="w-5 h-5 mr-3 text-[#D3B88C]" />
                Blocked Dates (Per Product)
              </CardTitle>
              <Link href="/admin/settings">
                <Button className="bg-gradient-to-r from-[#3C2317] to-[#5D4037] hover:from-[#3C2317]/90 hover:to-[#5D4037]/90 text-[#FBF9D9] flex items-center gap-2 cursor-pointer">
                  <Settings className="w-4 h-4" />
                  Manage in Settings
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex gap-2 mb-4">
              <Button
                onClick={() => setBlockingMode("single")}
                variant={blockingMode === "single" ? "default" : "outline"}
                className={`cursor-pointer ${blockingMode === "single" ? "bg-[#3C2317] text-white" : "border-[#D3B88C]"}`}
              >
                Block Single Date
              </Button>
              <Button
                onClick={() => setBlockingMode("range")}
                variant={blockingMode === "range" ? "default" : "outline"}
                className={`cursor-pointer ${blockingMode === "range" ? "bg-[#3C2317] text-white" : "border-[#D3B88C]"}`}
              >
                Block Date Range
              </Button>
            </div>

            {blockingMode === "single" ? (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#3C2317]">Scope</Label>
                  <Select
                    value={blockForm.scope}
                    onValueChange={(v) => setBlockForm((p) => ({ ...p, scope: v as "camping" | "barbecue" }))}
                  >
                    <SelectTrigger className="border-[#D3B88C]">
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="camping">Camping</SelectItem>
                      <SelectItem value="barbecue">Barbecue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="block-date" className="text-[#3C2317]">
                    Date
                  </Label>
                  <Input
                    id="block-date"
                    type="date"
                    value={blockForm.date}
                    onChange={(e) => setBlockForm((p) => ({ ...p, date: e.target.value }))}
                    className="border-[#D3B88C] bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="block-reason" className="text-[#3C2317]">
                    Reason (optional)
                  </Label>
                  <Input
                    id="block-reason"
                    placeholder="e.g., Maintenance"
                    value={blockForm.reason}
                    onChange={(e) => setBlockForm((p) => ({ ...p, reason: e.target.value }))}
                    className="border-[#D3B88C] bg-white"
                  />
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#3C2317]">Scope</Label>
                  <Select
                    value={blockFormRange.scope}
                    onValueChange={(v) => setBlockFormRange((p) => ({ ...p, scope: v as "camping" | "barbecue" }))}
                  >
                    <SelectTrigger className="border-[#D3B88C]">
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="camping">Camping</SelectItem>
                      <SelectItem value="barbecue">Barbecue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="block-start-date" className="text-[#3C2317]">
                    Start Date
                  </Label>
                  <Input
                    id="block-start-date"
                    type="date"
                    value={blockFormRange.startDate}
                    onChange={(e) => setBlockFormRange((p) => ({ ...p, startDate: e.target.value }))}
                    className="border-[#D3B88C] bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="block-end-date" className="text-[#3C2317]">
                    End Date
                  </Label>
                  <Input
                    id="block-end-date"
                    type="date"
                    value={blockFormRange.endDate}
                    onChange={(e) => setBlockFormRange((p) => ({ ...p, endDate: e.target.value }))}
                    className="border-[#D3B88C] bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="block-range-reason" className="text-[#3C2317]">
                    Reason (optional)
                  </Label>
                  <Input
                    id="block-range-reason"
                    placeholder="e.g., Maintenance"
                    value={blockFormRange.reason}
                    onChange={(e) => setBlockFormRange((p) => ({ ...p, reason: e.target.value }))}
                    className="border-[#D3B88C] bg-white"
                  />
                </div>
              </div>
            )}

            <div>
              <Button onClick={addBlock} disabled={blockLoading} className="cursor-pointer">
                {blockLoading ? "Saving..." : blockingMode === "single" ? "Block Date" : "Block Date Range"}
              </Button>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#D3B88C]/30 bg-gradient-to-r from-[#3C2317]/90 to-[#5D4037]/90">
                    <TableHead className="text-[#FBF9D9] font-bold py-3 px-4">Start Date</TableHead>
                    <TableHead className="text-[#FBF9D9] font-bold py-3 px-4">End Date</TableHead>
                    <TableHead className="text-[#FBF9D9] font-bold py-3 px-4">Scope</TableHead>
                    <TableHead className="text-[#FBF9D9] font-bold py-3 px-4">Reason</TableHead>
                    <TableHead className="text-[#FBF9D9] font-bold py-3 px-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blocks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-[#3C2317]/60">
                        No blocked dates yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    blocks.map((b: any, i: number) => (
                      <TableRow
                        key={b._id}
                        className={`border-[#D3B88C]/20 ${i % 2 === 0 ? "bg-white" : "bg-[#FBF9D9]/30"}`}
                      >
                        <TableCell className="py-3 px-4">
                          {new Date(b.startDate || b.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          {new Date(b.endDate || b.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="py-3 px-4 capitalize">{b.scope}</TableCell>
                        <TableCell className="py-3 px-4">{b.reason || "-"}</TableCell>
                        <TableCell className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeBlock(b._id)}
                            className="border-red-200 text-red-600 hover:bg-red-600 hover:text-white cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-sm border-[#D3B88C]/30 shadow-lg mb-6">
          <div className="p-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-semibold text-[#3C2317] mb-2 block">Search Orders</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-[#D3B88C]" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-[#D3B88C]/30 focus:border-[#D3B88C] bg-white text-[#3C2317]"
                  />
                </div>
              </div>

              <Button
                onClick={() => setIsManagementMode(!isManagementMode)}
                variant={isManagementMode ? "default" : "outline"}
                className={`h-10 px-4 flex items-center gap-2 ${
                  isManagementMode
                    ? "bg-[#3C2317] text-white hover:bg-[#5D4037]"
                    : "border-[#D3B88C] text-[#3C2317] hover:bg-[#D3B88C]/10"
                }`}
              >
                <Settings className="w-4 h-4" />
                {isManagementMode ? "Management" : "View"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold text-[#3C2317] mb-2 block">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-[#D3B88C]" />
                  <input
                    type="date"
                    value={localStartDate}
                    onChange={(e) => setLocalStartDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-[#D3B88C]/30 rounded-md focus:outline-none focus:border-[#D3B88C] bg-white text-[#3C2317]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-[#3C2317] mb-2 block">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-[#D3B88C]" />
                  <input
                    type="date"
                    value={localEndDate}
                    onChange={(e) => setLocalEndDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-[#D3B88C]/30 rounded-md focus:outline-none focus:border-[#D3B88C] bg-white text-[#3C2317]"
                  />
                </div>
              </div>

              <div className="flex gap-2 items-end">
                <Button
                  onClick={() => {
                    setStartDate(localStartDate)
                    setEndDate(localEndDate)
                  }}
                  className="flex-1 bg-[#3C2317] text-white hover:bg-[#5D4037] h-10"
                >
                  Apply
                </Button>
                <Button
                  onClick={() => {
                    setLocalStartDate("")
                    setLocalEndDate("")
                    setStartDate("")
                    setEndDate("")
                  }}
                  variant="outline"
                  className="flex-1 border-[#D3B88C] text-[#3C2317] hover:bg-[#D3B88C]/10 h-10 bg-transparent"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {isManagementMode && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-[#FBF9D9] to-[#E6CFA9] border-[#D3B88C]/30 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-[#3C2317]">Total Orders</CardTitle>
                <div className="w-8 h-8 bg-gradient-to-br from-[#3C2317] to-[#5D4037] rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#FBF9D9]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#3C2317]">{stats_data.totalOrders}</div>
                <p className="text-xs text-[#3C2317]/60 mt-1">Filtered orders</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#FBF9D9] to-[#E6CFA9] border-[#D3B88C]/30 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-[#3C2317]">Total Revenue</CardTitle>
                <div className="w-8 h-8 bg-gradient-to-br from-[#0891b2] to-[#0e7490] rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#0891b2]">AED {stats_data.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-[#3C2317]/60 mt-1">From filtered orders</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#FBF9D9] to-[#E6CFA9] border-[#D3B88C]/30 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-[#3C2317]">Total Resources</CardTitle>
                <div className="w-8 h-8 bg-gradient-to-br from-[#84cc16] to-[#65a30d] rounded-lg flex items-center justify-center">
                  <Tent className="w-4 h-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#84cc16]">{stats_data.totalResources}</div>
                <p className="text-xs text-[#3C2317]/60 mt-1">Tents / Group size</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#FBF9D9] to-[#E6CFA9] border-[#D3B88C]/30 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-[#3C2317]">Avg Order Value</CardTitle>
                <div className="w-8 h-8 bg-gradient-to-br from-[#be123c] to-[#9f1239] rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#be123c]">AED {stats_data.averageOrderValue.toFixed(2)}</div>
                <p className="text-xs text-[#3C2317]/60 mt-1">Per order average</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="bg-white/95 backdrop-blur-sm border-[#D3B88C]/30 shadow-xl">
          <CardHeader className="border-b border-[#D3B88C]/20 p-6">
            <CardTitle className="text-[#3C2317] text-xl font-semibold flex items-center">
              <Star className="w-6 h-6 mr-3 text-[#D3B88C]" />
              Recent Paid Orders (Last 10)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="relative">
                  <div className="w-10 h-10 border-4 border-[#3C2317]/20 rounded-full animate-spin">
                    <div className="absolute inset-0 w-10 h-10 border-4 border-t-[#3C2317] rounded-full animate-spin"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#D3B88C]/30 bg-gradient-to-r from-[#3C2317]/90 to-[#5D4037]/90">
                      <TableHead className="text-[#FBF9D9] font-bold py-4 px-6">Customer</TableHead>
                      <TableHead className="text-[#FBF9D9] font-bold py-4 px-6">Date</TableHead>
                      <TableHead className="text-[#FBF9D9] font-bold py-4 px-6 hidden sm:table-cell">
                        Location
                      </TableHead>
                      <TableHead className="text-[#FBF9D9] font-bold py-4 px-6 hidden md:table-cell">Tents</TableHead>
                      <TableHead className="text-[#FBF9D9] font-bold py-4 px-6">Total</TableHead>
                      <TableHead className="text-[#FBF9D9] font-bold py-4 px-6">Status</TableHead>
                      <TableHead className="text-[#FBF9D9] font-bold py-4 px-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-6 text-center text-[#3C2317]/60">
                          {searchTerm || startDate || endDate
                            ? "No orders found matching your filters."
                            : "No orders available."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBookings.map((booking, index) => (
                        <TableRow
                          key={booking._id}
                          className={`border-[#D3B88C]/20 transition-colors duration-200 ${
                            index % 2 === 0 ? "bg-white" : "bg-[#FBF9D9]/30"
                          }`}
                        >
                          <TableCell className="py-4 px-6">
                            <div>
                              <div className="font-semibold text-[#3C2317]">{booking.customerName}</div>
                              <div className="text-sm text-[#3C2317]/60 hidden sm:block mt-1">
                                {booking.customerEmail}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-[#3C2317] py-4 px-6">{formatDate(booking.bookingDate)}</TableCell>
                          <TableCell className="text-[#3C2317] hidden sm:table-cell py-4 px-6">
                            {booking.location}
                          </TableCell>
                          <TableCell className="text-[#3C2317] hidden md:table-cell py-4 px-6">
                            {booking.numberOfTents}
                          </TableCell>
                          <TableCell className="font-bold text-[#0891b2] py-4 px-6">
                            AED {booking.total.toFixed(2)}
                          </TableCell>
                          <TableCell className="py-4 px-6">{getStatusBadge(booking)}</TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <InvoiceDownloadButton booking={booking} bookingType="camping" />
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedBooking(booking)}
                                    className="border-[#D3B88C] text-[#3C2317] bg-white h-9 px-3 hover:bg-[#D3B88C] cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-[#FBF9D9] to-[#E6CFA9] border-2 border-[#D3B88C]/50 shadow-2xl">
                                  <DialogHeader className="border-b border-[#D3B88C]/30 pb-6">
                                    <DialogTitle className="text-[#3C2317] text-2xl font-bold flex items-center">
                                      <Tent className="w-7 h-7 mr-3 text-[#D3B88C]" />
                                      Order Details - #{selectedBooking?._id.slice(-6).toUpperCase()}
                                    </DialogTitle>
                                  </DialogHeader>
                                  {selectedBooking && (
                                    <div className="space-y-6 pt-6">
                                      <div>
                                        <h3 className="text-lg font-semibold text-[#3C2317] mb-4">
                                          Customer Information
                                        </h3>
                                        <div className="space-y-3">
                                          <div>
                                            <Label className="text-sm font-medium text-[#3C2317]">Name</Label>
                                            <p className="text-[#3C2317]">{selectedBooking.customerName}</p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-medium text-[#3C2317]">Email</Label>
                                            <p className="text-[#3C2317]">{selectedBooking.customerEmail}</p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-medium text-[#3C2317]">Phone</Label>
                                            <p className="text-[#3C2317]">{selectedBooking.customerPhone}</p>
                                          </div>
                                        </div>
                                      </div>
                                      <div>
                                        <h3 className="text-lg font-semibold text-[#3C2317] mb-4">Booking Details</h3>
                                        <div className="space-y-3">
                                          <div>
                                            <Label className="text-sm font-medium text-[#3C2317]">Date</Label>
                                            <p className="text-[#3C2317]">{formatDate(selectedBooking.bookingDate)}</p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-medium text-[#3C2317]">Location</Label>
                                            <p className="text-[#3C2317]">{selectedBooking.location}</p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-medium text-[#3C2317]">Tents</Label>
                                            <p className="text-[#3C2317]">{selectedBooking.numberOfTents}</p>
                                          </div>
                                        </div>
                                      </div>
                                      <div>
                                        <h3 className="text-lg font-semibold text-[#3C2317] mb-4">
                                          Payment Information
                                        </h3>
                                        <div className="space-y-3">
                                          <div>
                                            <Label className="text-sm font-medium text-[#3C2317]">Total Amount</Label>
                                            <p className="text-[#0891b2] font-bold">
                                              AED {selectedBooking.total.toFixed(2)}
                                            </p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-medium text-[#3C2317]">Status</Label>
                                            <Badge
                                              className={`font-medium ${selectedBooking.isPaid ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                                            >
                                              {selectedBooking.isPaid ? "Paid" : "Pending"}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-200 text-red-600 bg-white h-9 px-3 hover:bg-red-600 hover:text-white cursor-pointer"
                                    disabled={deleteLoading === booking._id}
                                  >
                                    {deleteLoading === booking._id ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                    <span className="hidden sm:inline ml-1 text-xs">Delete</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-gradient-to-br from-[#FBF9D9] to-[#E6CFA9] border-2 border-red-200 shadow-2xl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-red-600 text-xl font-bold flex items-center">
                                      <AlertCircle className="w-6 h-6 mr-3" />
                                      Delete Order
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-[#3C2317] text-base leading-relaxed">
                                      Are you sure you want to delete this order? This action cannot be undone.
                                      <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                                        <div className="text-sm space-y-2">
                                          <div>
                                            <strong>Order:</strong> #{booking._id.slice(-6).toUpperCase()}
                                          </div>
                                          <div>
                                            <strong>Customer:</strong> {booking.customerName}
                                          </div>
                                          <div>
                                            <strong>Total:</strong> AED {booking.total.toFixed(2)}
                                          </div>
                                        </div>
                                      </div>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="border-[#D3B88C] text-[#3C2317]">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteBooking(booking._id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete Order
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
