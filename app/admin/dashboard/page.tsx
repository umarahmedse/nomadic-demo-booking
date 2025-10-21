//@ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
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
import { MapPin, Calendar, Users, DollarSign, Eye, TrendingUp, Tent, Star, Trash2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import type { Booking } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import QuickInvoiceDownload from "@/components/invoice/quick-invoice-download"

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
  const [blockLoading, setBlockLoading] = useState(false)

  const [locations, setLocations] = useState<
    Array<{ _id: string; name: string; capacity: number; description?: string }>
  >([])
  const [locationForm, setLocationForm] = useState<{ name: string; capacity: string; description: string }>({
    name: "",
    capacity: "",
    description: "",
  })
  const [locationLoading, setLocationLoading] = useState(false)

  useEffect(() => {
    fetchDashboardData()
    fetchBlocks()
    fetchLocations()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      console.log("Fetching dashboard data...")

      // Fetch stats
      const statsResponse = await fetch("/api/stats", {
        cache: "no-store",
      })
      console.log("Stats response status:", statsResponse.status)
      if (!statsResponse.ok) throw new Error("Failed to fetch stats")
      const statsData = await statsResponse.json()
      console.log("Stats data:", statsData)
      setStats(statsData)

      // Fetch chart data
      const chartResponse = await fetch("/api/charts", {
        cache: "no-store",
      })
      console.log("Chart response status:", chartResponse.status)
      if (!chartResponse.ok) throw new Error("Failed to fetch chart data")
      const chartDataResponse = await chartResponse.json()
      console.log("Chart data:", chartDataResponse)
      setChartData({
        monthlyBookings: chartDataResponse.monthlyBookings || [],
        locationStats: chartDataResponse.locationStats || [],
      })

      // Fetch recent bookings
      const bookingsResponse = await fetch("/api/bookings?isPaid=true&limit=10", {
        cache: "no-store",
      })
      console.log("Bookings response status:", bookingsResponse.status)
      if (!bookingsResponse.ok) throw new Error("Failed to fetch bookings")
      const bookingsData = await bookingsResponse.json()
      console.log("Bookings data:", bookingsData)
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
      const res = await fetch("/api/blocked-dates?scope=") // empty scope -> all
      const data = await res.json()
      setBlocks(data.items || [])
    } catch (e) {
      console.error("[blocks] fetch error", e)
    }
  }

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/locations")
      const data = await res.json()
      setLocations(data.locations || [])
    } catch (e) {
      console.error("[locations] fetch error", e)
    }
  }

  const addBlock = async () => {
    if (!blockForm.date) {
      toast.error("Please select a date to block")
      return
    }
    setBlockLoading(true)
    try {
      const res = await fetch("/api/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blockForm),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to add block")
      }
      toast.success("Date blocked successfully")
      setBlockForm((p) => ({ ...p, reason: "" }))
      await fetchBlocks()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to block date")
    } finally {
      setBlockLoading(false)
    }
  }

  const addLocation = async () => {
    if (!locationForm.name || !locationForm.capacity) {
      toast.error("Please fill in all required fields")
      return
    }
    setLocationLoading(true)
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: locationForm.name,
          capacity: Number.parseInt(locationForm.capacity),
          description: locationForm.description,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to add location")
      }
      toast.success("Location added successfully")
      setLocationForm({ name: "", capacity: "", description: "" })
      await fetchLocations()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add location")
    } finally {
      setLocationLoading(false)
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

  const removeLocation = async (id: string) => {
    try {
      const res = await fetch(`/api/locations/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to remove location")
      toast.success("Location deleted")
      await fetchLocations()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove location")
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

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#3C2317] mb-2">Dashboard Overview</h1>
              <p className="text-[#3C2317]/80 text-base">
                Welcome back, {session?.user?.username}. Here's what's happening with your bookings.
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
            <CardTitle className="text-[#3C2317] text-xl font-semibold flex items-center">
              <Calendar className="w-5 h-5 mr-3 text-[#D3B88C]" />
              Blocked Dates (Per Product)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
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
            <div>
              <Button onClick={addBlock} disabled={blockLoading} className="cursor-pointer">
                {blockLoading ? "Saving..." : "Block Date"}
              </Button>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#D3B88C]/30 bg-gradient-to-r from-[#3C2317]/90 to-[#5D4037]/90">
                    <TableHead className="text-[#FBF9D9] font-bold py-3 px-4">Date</TableHead>
                    <TableHead className="text-[#FBF9D9] font-bold py-3 px-4">Scope</TableHead>
                    <TableHead className="text-[#FBF9D9] font-bold py-3 px-4">Reason</TableHead>
                    <TableHead className="text-[#FBF9D9] font-bold py-3 px-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blocks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-6 text-center text-[#3C2317]/60">
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
                          {new Date(b.date).toLocaleDateString("en-GB", {
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

        <Card className="bg-white/95 backdrop-blur-sm border-[#D3B88C]/30 shadow-xl mb-8">
          <CardHeader className="border-b border-[#D3B88C]/20 p-6">
            <CardTitle className="text-[#3C2317] text-xl font-semibold flex items-center">
              <MapPin className="w-5 h-5 mr-3 text-[#D3B88C]" />
              Manage Locations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location-name" className="text-[#3C2317]">
                  Location Name
                </Label>
                <Input
                  id="location-name"
                  placeholder="e.g., Desert Camp A"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm((p) => ({ ...p, name: e.target.value }))}
                  className="border-[#D3B88C] bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location-capacity" className="text-[#3C2317]">
                  Capacity (tents)
                </Label>
                <Input
                  id="location-capacity"
                  type="number"
                  placeholder="e.g., 10"
                  value={locationForm.capacity}
                  onChange={(e) => setLocationForm((p) => ({ ...p, capacity: e.target.value }))}
                  className="border-[#D3B88C] bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location-desc" className="text-[#3C2317]">
                  Description (optional)
                </Label>
                <Input
                  id="location-desc"
                  placeholder="e.g., Near water source"
                  value={locationForm.description}
                  onChange={(e) => setLocationForm((p) => ({ ...p, description: e.target.value }))}
                  className="border-[#D3B88C] bg-white"
                />
              </div>
            </div>
            <div>
              <Button onClick={addLocation} disabled={locationLoading} className="cursor-pointer">
                {locationLoading ? "Saving..." : "Add Location"}
              </Button>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#D3B88C]/30 bg-gradient-to-r from-[#3C2317]/90 to-[#5D4037]/90">
                    <TableHead className="text-[#FBF9D9] font-bold py-3 px-4">Name</TableHead>
                    <TableHead className="text-[#FBF9D9] font-bold py-3 px-4">Capacity</TableHead>
                    <TableHead className="text-[#FBF9D9] font-bold py-3 px-4">Description</TableHead>
                    <TableHead className="text-[#FBF9D9] font-bold py-3 px-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-6 text-center text-[#3C2317]/60">
                        No locations added yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    locations.map((loc: any, i: number) => (
                      <TableRow
                        key={loc._id}
                        className={`border-[#D3B88C]/20 ${i % 2 === 0 ? "bg-white" : "bg-[#FBF9D9]/30"}`}
                      >
                        <TableCell className="py-3 px-4 font-semibold text-[#3C2317]">{loc.name}</TableCell>
                        <TableCell className="py-3 px-4 text-[#3C2317]">{loc.capacity} tents</TableCell>
                        <TableCell className="py-3 px-4 text-[#3C2317]/70">{loc.description || "-"}</TableCell>
                        <TableCell className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeLocation(loc._id)}
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
                    {bookings.map((booking, index) => (
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
                            <QuickInvoiceDownload booking={booking} bookingType="camping" />
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
                              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-[#FBF9D9] to-[#E6CFA9] border-2 border-[#D3B88C]/50 shadow-2xl">
                                <DialogHeader className="border-b border-[#D3B88C]/30 pb-6">
                                  <DialogTitle className="text-[#3C2317] text-2xl font-bold flex items-center">
                                    <Tent className="w-7 h-7 mr-3 text-[#D3B88C]" />
                                    Order Details - #{selectedBooking?._id.slice(-6).toUpperCase()}
                                  </DialogTitle>
                                </DialogHeader>
                                {selectedBooking && (
                                  <div className="space-y-8 pt-6">
                                    {/* Customer Information */}
                                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-[#D3B88C]/30 shadow-sm">
                                      <h4 className="font-bold mb-4 text-[#3C2317] border-b border-[#D3B88C]/30 pb-3 flex items-center text-lg">
                                        <Users className="w-5 h-5 mr-3 text-[#D3B88C]" />
                                        Customer Information
                                      </h4>
                                      <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                          <span className="text-[#3C2317]/70 font-medium">Name:</span>
                                          <span className="font-semibold text-[#3C2317] text-right max-w-[200px] break-words">
                                            {selectedBooking.customerName}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-start">
                                          <span className="text-[#3C2317]/70 font-medium">Email:</span>
                                          <span className="font-semibold text-[#3C2317] text-right max-w-[200px] break-words text-sm">
                                            {selectedBooking.customerEmail}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-start">
                                          <span className="text-[#3C2317]/70 font-medium">Phone:</span>
                                          <span className="font-semibold text-[#3C2317] text-right">
                                            {selectedBooking.customerPhone}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Booking Details */}
                                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-[#D3B88C]/30 shadow-sm">
                                      <h4 className="font-bold mb-4 text-[#3C2317] border-b border-[#D3B88C]/30 pb-3 flex items-center text-lg">
                                        <Calendar className="w-5 h-5 mr-3 text-[#D3B88C]" />
                                        Booking Details
                                      </h4>
                                      <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                          <span className="text-[#3C2317]/70 font-medium">Date:</span>
                                          <span className="font-semibold text-[#3C2317]">
                                            {formatDate(selectedBooking.bookingDate)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-[#3C2317]/70 font-medium">Location:</span>
                                          <span className="font-semibold text-[#3C2317]">
                                            {selectedBooking.location}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-[#3C2317]/70 font-medium">Arrival Time:</span>
                                          <span className="font-semibold text-[#3C2317]">
                                            {selectedBooking.arrivalTime || "Not specified"}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-[#3C2317]/70 font-medium">Tents:</span>
                                          <span className="font-semibold text-[#3C2317]">
                                            {selectedBooking.numberOfTents}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-[#3C2317]/70 font-medium">Adults:</span>
                                          <span className="font-semibold text-[#3C2317]">
                                            {selectedBooking.adults || "Not specified"}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-[#3C2317]/70 font-medium">Children:</span>
                                          <span className="font-semibold text-[#3C2317]">
                                            {selectedBooking.children || 0}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-[#3C2317]/70 font-medium">Has Children:</span>
                                          <span className="font-semibold text-[#3C2317]">
                                            {selectedBooking.hasChildren ? "Yes" : "No"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Sleeping Arrangements */}
                                    {selectedBooking.sleepingArrangements &&
                                      selectedBooking.sleepingArrangements.length > 0 && (
                                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-[#D3B88C]/30 shadow-sm">
                                          <h4 className="font-bold mb-4 text-[#3C2317] border-b border-[#D3B88C]/30 pb-3 flex items-center text-lg">
                                            <Tent className="w-5 h-5 mr-3 text-[#D3B88C]" />
                                            Sleeping Arrangements
                                          </h4>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedBooking.sleepingArrangements.map((arrangement, index) => (
                                              <div
                                                key={index}
                                                className="bg-[#E6CFA9]/30 p-4 rounded-lg border border-[#D3B88C]/20"
                                              >
                                                <div className="flex items-center justify-between mb-2">
                                                  <span className="font-semibold text-[#3C2317] text-sm">
                                                    Tent #{arrangement.tentNumber}
                                                  </span>
                                                  <div className="w-3 h-3 bg-[#D3B88C] rounded-full"></div>
                                                </div>
                                                <div className="text-[#3C2317]/80 text-sm">
                                                  {arrangement.arrangement === "all-singles" &&
                                                    "All Single Beds (4 singles)"}
                                                  {arrangement.arrangement === "two-doubles" &&
                                                    "Two Double Beds (2 doubles)"}
                                                  {arrangement.arrangement === "mix" &&
                                                    "Mixed Arrangement (1 double + 2 singles)"}
                                                  {arrangement.arrangement === "double-bed" && "Double Bed (1 double)"}
                                                  {arrangement.arrangement === "custom" &&
                                                    (arrangement.customArrangement ||
                                                      "Custom arrangement (not specified)")}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                    {/* Standard Add-ons */}
                                    {(selectedBooking.addOns.charcoal ||
                                      selectedBooking.addOns.firewood ||
                                      selectedBooking.addOns.portableToilet) && (
                                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-[#D3B88C]/30 shadow-sm">
                                        <h4 className="font-bold mb-4 text-[#3C2317] border-b border-[#D3B88C]/30 pb-3 flex items-center text-lg">
                                          <Star className="w-5 h-5 mr-3 text-[#D3B88C]" />
                                          Standard Add-ons
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          {selectedBooking.addOns.charcoal && (
                                            <div className="bg-[#E6CFA9]/30 p-4 rounded-lg border border-[#D3B88C]/20">
                                              <div className="flex items-center text-[#3C2317] mb-2">
                                                <span className="font-semibold">Premium Charcoal</span>
                                              </div>
                                              {/* <p className="text-[#3C2317]/70 text-sm">High-quality charcoal for BBQ</p> */}
                                            </div>
                                          )}
                                          {selectedBooking.addOns.firewood && (
                                            <div className="bg-[#E6CFA9]/30 p-4 rounded-lg border border-[#D3B88C]/20">
                                              <div className="flex items-center text-[#3C2317] mb-2">
                                                <span className="font-semibold">Premium Firewood</span>
                                              </div>
                                              {/* <p className="text-[#3C2317]/70 text-sm">Seasoned wood for campfire</p> */}
                                            </div>
                                          )}
                                          {selectedBooking.addOns.portableToilet && (
                                            <div className="bg-[#E6CFA9]/30 p-4 rounded-lg border border-[#D3B88C]/20">
                                              <div className="flex items-center text-[#3C2317] mb-2">
                                                <span className="font-semibold">Portable Toilet</span>
                                              </div>
                                              {/* <p className="text-[#3C2317]/70 text-sm">Luxury portable facilities</p> */}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {selectedBooking.customAddOnsWithDetails &&
                                      selectedBooking.customAddOnsWithDetails.length > 0 && (
                                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-[#D3B88C]/30 shadow-sm">
                                          <h4 className="font-bold mb-4 text-[#3C2317] border-b border-[#D3B88C]/30 pb-3 flex items-center text-lg">
                                            <Star className="w-5 h-5 mr-3 text-[#84cc16]" />
                                            Additional Services
                                          </h4>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedBooking.customAddOnsWithDetails.map(
                                              (addOn: any, index: number) => (
                                                <div
                                                  key={index}
                                                  className="bg-[#84cc16]/10 p-4 rounded-lg border border-[#84cc16]/20"
                                                >
                                                  <div className="flex items-center text-[#3C2317] mb-2">
                                                    <span className="font-semibold">{addOn.name}</span>
                                                  </div>
                                                  <p className="text-[#3C2317]/70 text-sm">
                                                    {addOn.description || "Additional custom service"}
                                                  </p>
                                                  {addOn.price && (
                                                    <p className="text-[#0891b2] font-semibold text-sm mt-1">
                                                      AED {addOn.price.toFixed(2)}
                                                    </p>
                                                  )}
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      )}

                                    {/* Special Notes */}
                                    {selectedBooking.notes && (
                                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-[#D3B88C]/30 shadow-sm">
                                        <h4 className="font-bold mb-4 text-[#3C2317] border-b border-[#D3B88C]/30 pb-3 text-lg">
                                          Special Notes
                                        </h4>
                                        <p className="text-[#3C2317] bg-[#E6CFA9]/40 p-4 rounded-lg leading-relaxed break-words">
                                          {selectedBooking.notes}
                                        </p>
                                      </div>
                                    )}

                                    {/* Payment Summary */}
                                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-[#D3B88C]/30 shadow-sm">
                                      <h4 className="font-bold mb-4 text-[#3C2317] border-b border-[#D3B88C]/30 pb-3 flex items-center text-lg">
                                        <DollarSign className="w-5 h-5 mr-3 text-[#D3B88C]" />
                                        Payment Summary
                                      </h4>
                                      <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                          <span className="text-[#3C2317]/70 font-medium">Subtotal:</span>
                                          <span className="font-semibold text-[#3C2317]">
                                            AED {selectedBooking.subtotal.toFixed(2)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-[#3C2317]/70 font-medium">VAT (5%):</span>
                                          <span className="font-semibold text-[#3C2317]">
                                            AED {selectedBooking.vat.toFixed(2)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-[#D3B88C]/30 pt-4">
                                          <span className="font-bold text-[#3C2317] text-xl">Total:</span>
                                          <span className="font-bold text-[#0891b2] text-2xl">
                                            AED {selectedBooking.total.toFixed(2)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-[#3C2317]/70 font-medium">Status:</span>
                                          <span>{getStatusBadge(selectedBooking)}</span>
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
                    ))}
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
