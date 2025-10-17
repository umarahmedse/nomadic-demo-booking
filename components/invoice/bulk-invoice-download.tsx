"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { toast } from "sonner"
import { Download, Calendar } from "lucide-react"

export default function BulkInvoiceDownload() {
  const [bookingType, setBookingType] = useState<"camping" | "barbecue" | "">("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(false)

  const handleDownloadBulk = async () => {
    if (!bookingType || !startDate || !endDate) {
      toast.error("Please select booking type and date range")
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date must be before end date")
      return
    }

    try {
      setLoading(true)
      const response = await fetch("/api/invoices/bulk-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingType,
          startDate,
          endDate,
        }),
      })

      if (!response.ok) throw new Error("Failed to download invoices")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `invoices-${bookingType}-${startDate}-to-${endDate}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Invoices downloaded successfully")
    } catch (error) {
      console.error("Error downloading invoices:", error)
      toast.error("Failed to download invoices")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-[#D3B88C]/30 shadow-xl mb-8">
      <CardHeader className="border-b border-[#D3B88C]/20 p-6">
        <CardTitle className="text-[#3C2317] text-xl font-semibold flex items-center">
          <Calendar className="w-5 h-5 mr-3 text-[#D3B88C]" />
          Download All Invoices by Date Range
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <Label className="text-[#3C2317] text-sm">Booking Type</Label>
            <Select value={bookingType} onValueChange={(value: any) => setBookingType(value)}>
              <SelectTrigger className="border-[#D3B88C] bg-white mt-1">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="camping">Desert Camping</SelectItem>
                <SelectItem value="barbecue">Desert Barbecue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[#3C2317] text-sm">Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border-[#D3B88C] bg-white mt-1"
            />
          </div>
          <div>
            <Label className="text-[#3C2317] text-sm">End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-[#D3B88C] bg-white mt-1"
            />
          </div>
          <Button
            onClick={handleDownloadBulk}
            disabled={loading}
            className="bg-gradient-to-r from-[#0891b2] to-[#0e7490] hover:from-[#0891b2]/90 hover:to-[#0e7490]/90 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            {loading ? "Downloading..." : "Download"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
