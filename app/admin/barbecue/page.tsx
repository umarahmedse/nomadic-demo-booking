"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Calendar, DollarSign, Eye, AlertCircle, Trash2, Users, TrendingUp } from "lucide-react"
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
import InvoiceDownloadButton from "@/components/invoice-download-button"
import { OrderFilters } from "@/components/order-filters"
import { OrderSummaryStats } from "@/components/order-summary-stats"

type BarbecueBooking = {
  _id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  bookingDate: string | Date
  arrivalTime: "6:00 PM"
  groupSize: 10 | 15 | 20
  subtotal: number
  vat: number
  total: number
  isPaid: boolean
  notes?: string
  createdAt: string | Date
  updatedAt: string | Date
}

export default function BarbecueOrdersPage() {
  const [bookings, setBookings] = useState<BarbecueBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedBooking, setSelectedBooking] = useState<BarbecueBooking | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalBookings, setTotalBookings] = useState(0)
  const [isManagementMode, setIsManagementMode] = useState(false)
  const itemsPerPage = 7

  const [managementStats, setManagementStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalResources: 0,
    averageOrderValue: 0,
  })

  const [stats, setStats] = useState({
    totalBookings: 0,
    paidBookings: 0,
    totalRevenue: 0,
    pendingBookings: 0,
  })

  useEffect(() => {
    fetchBookings()
    fetchStats()
  }, [searchTerm, currentPage, startDate, endDate])

  const calculateManagementStats = (filteredBookings: BarbecueBooking[]) => {
    const totalOrders = filteredBookings.length
    const totalRevenue = filteredBookings.reduce((sum, b) => sum + b.total, 0)
    const totalResources = filteredBookings.reduce((sum, b) => sum + b.groupSize, 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    setManagementStats({
      totalOrders,
      totalRevenue,
      totalResources,
      averageOrderValue,
    })
  }

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

  const getStatusBadge = (isPaid: boolean) =>
    isPaid ? (
      <Badge className="bg-green-100 text-green-800 border-green-200 font-medium">Paid</Badge>
    ) : (
      <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-medium">Pending</Badge>
    )

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/barbecue/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (e) {
      console.error("Failed to fetch BBQ stats:", e)
    }
  }

  const fetchBookings = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      params.append("page", currentPage.toString())
      params.append("limit", itemsPerPage.toString())
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const response = await fetch(`/api/barbecue/bookings?${params}`)
      const data = await response.json()
      setBookings(data.bookings || [])
      setTotalPages(data.pagination?.pages || 1)
      setTotalBookings(data.pagination?.total || 0)
      calculateManagementStats(data.bookings || [])
    } catch (e) {
      toast.error("Failed to fetch barbecue bookings")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBooking = async (bookingId: string) => {
    setDeleteLoading(bookingId)
    try {
      const res = await fetch(`/api/barbecue/bookings/${bookingId}`, { method: "DELETE" })
      if (res.ok) {
        setBookings((prev) => prev.filter((b) => b._id !== bookingId))
        toast.success("Booking deleted")
      } else toast.error("Failed to delete booking")
    } catch {
      toast.error("Failed to delete booking")
    } finally {
      setDeleteLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-card)] to-[var(--color-card)]/60">
      <div className="max-w-7xl mx-auto p-8">
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
              <p className="text-xs text-[#3C2317]/60 mt-1">Total BBQ bookings</p>
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
              <CardTitle className="text-sm font-medium text-[#3C2317]">Pending Bookings</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-br from-[#be123c] to-[#9f1239] rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#be123c]">{stats.pendingBookings}</div>
              <p className="text-xs text-[#3C2317]/60 mt-1">Awaiting payment</p>
            </CardContent>
          </Card>
        </div>

        <OrderFilters
          onSearchChange={setSearchTerm}
          onDateRangeChange={(start, end) => {
            setStartDate(start)
            setEndDate(end)
            setCurrentPage(1)
          }}
          onManagementToggle={setIsManagementMode}
          isManagementMode={isManagementMode}
          searchTerm={searchTerm}
          startDate={startDate}
          endDate={endDate}
        />

        <OrderSummaryStats
          totalOrders={managementStats.totalOrders}
          totalRevenue={managementStats.totalRevenue}
          totalResources={managementStats.totalResources}
          averageOrderValue={managementStats.averageOrderValue}
          isManagementMode={isManagementMode}
        />

        <Card className="bg-white/95 border-[var(--color-border)]/60 shadow-xl">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-12">Loading…</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[var(--color-border)] bg-[var(--color-primary)]/90">
                        <TableHead className="text-[var(--color-primary-foreground)] font-bold text-sm py-4 px-6">
                          Order ID
                        </TableHead>
                        <TableHead className="text-[var(--color-primary-foreground)] font-bold text-sm py-4 px-6">
                          Customer
                        </TableHead>
                        <TableHead className="text-[var(--color-primary-foreground)] font-bold text-sm py-4 px-6 hidden sm:table-cell">
                          Date
                        </TableHead>
                        <TableHead className="text-[var(--color-primary-foreground)] font-bold text-sm py-4 px-6">
                          Group
                        </TableHead>
                        <TableHead className="text-[var(--color-primary-foreground)] font-bold text-sm py-4 px-6">
                          Total
                        </TableHead>
                        <TableHead className="text-[var(--color-primary-foreground)] font-bold text-sm py-4 px-6">
                          Status
                        </TableHead>
                        <TableHead className="text-[var(--color-primary-foreground)] font-bold text-sm py-4 px-6">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((b) => (
                        <TableRow key={b._id}>
                          <TableCell className="font-mono text-sm py-4 px-6">
                            #{b._id.slice(-6).toUpperCase()}
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="font-semibold text-sm">{b.customerName}</div>
                            <div className="text-xs text-foreground/60">{b.customerEmail}</div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm py-4 px-6">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              {formatDate(b.bookingDate)}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm py-4 px-6">{b.groupSize} people</TableCell>
                          <TableCell className="font-bold text-[var(--color-accent)] text-sm py-4 px-6">
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              AED {b.total.toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6">{getStatusBadge(b.isPaid)}</TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <InvoiceDownloadButton booking={b} bookingType="barbecue" />
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedBooking(b)}
                                    className="h-9 px-3"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                  <DialogHeader>
                                    <DialogTitle>Order Details - #{b._id.slice(-6).toUpperCase()}</DialogTitle>
                                  </DialogHeader>
                                  {selectedBooking && (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <div className="text-sm text-foreground/60">Name</div>
                                          <div className="font-medium">{selectedBooking.customerName}</div>
                                        </div>
                                        <div>
                                          <div className="text-sm text-foreground/60">Email</div>
                                          <div className="font-medium">{selectedBooking.customerEmail}</div>
                                        </div>
                                        <div>
                                          <div className="text-sm text-foreground/60">Phone</div>
                                          <div className="font-medium">{selectedBooking.customerPhone}</div>
                                        </div>
                                        <div>
                                          <div className="text-sm text-foreground/60">Date</div>
                                          <div className="font-medium">{formatDate(selectedBooking.bookingDate)}</div>
                                        </div>
                                        <div>
                                          <div className="text-sm text-foreground/60">Arrival</div>
                                          <div className="font-medium">{selectedBooking.arrivalTime}</div>
                                        </div>
                                        <div>
                                          <div className="text-sm text-foreground/60">Group Size</div>
                                          <div className="font-medium">{selectedBooking.groupSize}</div>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                        <div>
                                          <div className="text-sm text-foreground/60">Subtotal</div>
                                          <div className="font-medium">AED {selectedBooking.subtotal.toFixed(2)}</div>
                                        </div>
                                        <div>
                                          <div className="text-sm text-foreground/60">VAT</div>
                                          <div className="font-medium">AED {selectedBooking.vat.toFixed(2)}</div>
                                        </div>
                                        <div className="col-span-2">
                                          <div className="text-sm text-foreground/60">Total</div>
                                          <div className="font-bold text-[var(--color-accent)] text-lg">
                                            AED {selectedBooking.total.toFixed(2)}
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
                                    className="border-red-200 text-red-600 h-9 px-3 hover:bg-red-600 hover:text-white bg-transparent"
                                    disabled={deleteLoading === b._id}
                                  >
                                    {deleteLoading === b._id ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                                      <AlertCircle className="w-5 h-5" />
                                      Delete Booking
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this booking?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteBooking(b._id)}>
                                      Delete
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

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-8 py-6 border-t">
                    <div className="text-sm text-foreground/70">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, totalBookings)} of {totalBookings} bookings
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => p + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {!loading && bookings.length === 0 && (
              <div className="text-center py-16">
                <h3 className="text-xl font-semibold mb-1">No barbecue bookings found</h3>
                <p className="text-foreground/60">Try adjusting your search.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
