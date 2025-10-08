//@ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Search, Eye, Trash2, Calendar, MapPin, Users, DollarSign, Tent, AlertCircle, Star } from "lucide-react"
import { toast } from "sonner"
import type { Booking } from "@/lib/types"

export default function OrdersPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("all")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalBookings, setTotalBookings] = useState(0)
  const itemsPerPage = 7

  useEffect(() => {
    fetchBookings()
  }, [searchTerm, locationFilter, currentPage])

  const fetchBookings = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (locationFilter !== "all") params.append("location", locationFilter)
      params.append("isPaid", "true")
      params.append("page", currentPage.toString())
      params.append("limit", itemsPerPage.toString())

      const response = await fetch(`/api/bookings?${params}`)
      const data = await response.json()
      setBookings(data.bookings || [])
      setTotalPages(data.pagination?.pages || 1)
      setTotalBookings(data.pagination?.total || 0)
    } catch (error) {
      console.error("Error fetching bookings:", error)
      toast.error("Failed to fetch bookings")
    } finally {
      setLoading(false)
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

  const handleStatusUpdate = async (bookingId: string, newStatus: boolean) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaid: newStatus }),
      })

      if (response.ok) {
        setBookings(
          bookings.map((booking) => (booking._id === bookingId ? { ...booking, isPaid: newStatus } : booking)),
        )
        toast.success(`Status updated to ${newStatus ? "Paid" : "Pending"}`)
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Failed to update status")
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusBadge = (booking: Booking) => {
    if (booking.isPaid) {
      return <Badge className="bg-green-100 text-green-800 border-green-200 font-medium">Paid</Badge>
    }
    return <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-medium">Pending</Badge>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FBF9D9] to-[#E6CFA9]">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#3C2317] to-[#5D4037] rounded-xl flex items-center justify-center mr-4 shadow-lg">
              <Tent className="w-6 h-6 text-[#FBF9D9]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#3C2317]">Orders Management</h1>
              <p className="text-[#3C2317]/70 text-lg mt-1">Manage all confirmed paid orders</p>
            </div>
          </div>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-[#D3B88C]/30 shadow-lg mb-8">
          <CardHeader className="border-b border-[#D3B88C]/20 pb-4">
            <CardTitle className="text-[#3C2317] text-xl font-semibold flex items-center">
              <Search className="w-5 h-5 mr-3 text-[#D3B88C]" />
              Search & Filter Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-4 h-5 w-5 text-[#3C2317]/50" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-10 border-[#D3B88C]/30 focus:border-[#3C2317] focus:ring-[#3C2317]/20 bg-white/70 text-base"
                  />
                </div>
              </div>

              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full md:w-56 h-12 border-[#D3B88C]/30 focus:border-[#3C2317] bg-white/70 text-base">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Desert">Desert</SelectItem>
                  <SelectItem value="Mountain">Mountain</SelectItem>
                  <SelectItem value="Wadi">Wadi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-sm border-[#D3B88C]/30 shadow-xl">
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
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#D3B88C]/30 bg-gradient-to-r from-[#3C2317] to-[#5D4037]">
                        <TableHead className="text-[#FBF9D9] font-bold text-sm py-4 px-6">Order ID</TableHead>
                        <TableHead className="text-[#FBF9D9] font-bold text-sm py-4 px-6">Customer</TableHead>
                        <TableHead className="text-[#FBF9D9] font-bold text-sm py-4 px-6 hidden sm:table-cell">
                          Date
                        </TableHead>
                        <TableHead className="text-[#FBF9D9] font-bold text-sm py-4 px-6 hidden md:table-cell">
                          Location
                        </TableHead>
                        <TableHead className="text-[#FBF9D9] font-bold text-sm py-4 px-6 hidden lg:table-cell">
                          Tents
                        </TableHead>
                        <TableHead className="text-[#FBF9D9] font-bold text-sm py-4 px-6">Total</TableHead>
                        <TableHead className="text-[#FBF9D9] font-bold text-sm py-4 px-6">Status</TableHead>
                        <TableHead className="text-[#FBF9D9] font-bold text-sm py-4 px-6">Actions</TableHead>
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
                          <TableCell className="font-mono text-sm text-[#3C2317] font-medium py-4 px-6">
                            #{booking._id.slice(-6).toUpperCase()}
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <div>
                              <div className="font-semibold text-[#3C2317] text-sm">{booking.customerName}</div>
                              <div className="text-xs text-[#3C2317]/60 hidden sm:block mt-1">
                                {booking.customerEmail}
                              </div>
                              <div className="text-xs text-[#3C2317]/60 sm:hidden mt-1">{booking.customerPhone}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-[#3C2317] hidden sm:table-cell text-sm py-4 px-6">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-[#D3B88C]" />
                              {formatDate(booking.bookingDate)}
                            </div>
                          </TableCell>
                          <TableCell className="text-[#3C2317] hidden md:table-cell text-sm py-4 px-6">
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2 text-[#D3B88C]" />
                              {booking.location}
                            </div>
                          </TableCell>
                          <TableCell className="text-[#3C2317] hidden lg:table-cell text-sm py-4 px-6">
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-2 text-[#D3B88C]" />
                              {booking.numberOfTents}
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-[#0891b2] text-sm py-4 px-6">
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              AED {booking.total.toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6">{getStatusBadge(booking)}</TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="flex items-center gap-2">
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

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-8 py-6 border-t border-[#D3B88C]/20 bg-[#FBF9D9]/20">
                    <div className="text-sm text-[#3C2317]/70 font-medium">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, totalBookings)} of {totalBookings} orders
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="border-[#D3B88C] text-[#3C2317] bg-white h-10 px-4"
                      >
                        Previous
                      </Button>

                      <div className="flex items-center space-x-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className={
                                currentPage === pageNum
                                  ? "bg-[#3C2317] text-white h-10 px-4"
                                  : "border-[#D3B88C] text-[#3C2317] bg-white h-10 px-4"
                              }
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="border-[#D3B88C] text-[#3C2317] bg-white h-10 px-4"
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
                <div className="text-[#3C2317]/50 mb-6">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-[#3C2317] mb-3">No orders found</h3>
                <p className="text-[#3C2317]/60">Try adjusting your search criteria or filters.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
