"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Download, Mail, Eye } from "lucide-react"
import InvoicePreview from "./invoice-preview"
import { generateInvoicePDF } from "@/lib/invoice-utils"
import type { Booking } from "@/lib/types"

interface InvoiceFormProps {
  booking: Booking | any
  bookingType: "camping" | "barbecue"
  onBack: () => void
}

export default function InvoiceForm({ booking, bookingType, onBack }: InvoiceFormProps) {
  const [formData, setFormData] = useState({
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(booking._id).slice(-6).toUpperCase()}`,
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone,
    bookingDate: new Date(booking.bookingDate).toISOString().split("T")[0],
    subtotal: booking.subtotal,
    vat: booking.vat,
    total: booking.total,
    notes: booking.notes || "",
    emailTo: booking.customerEmail,
    emailAdmin: true,
  })

  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "subtotal" || name === "vat" || name === "total" ? Number.parseFloat(value) || 0 : value,
    }))
  }

  const handleDownloadPDF = async () => {
    try {
      setLoading(true)
      await generateInvoicePDF(formData, booking, bookingType)
      toast.success("Invoice downloaded successfully")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to generate PDF")
    } finally {
      setLoading(false)
    }
  }

  const handleEmailInvoice = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/invoices/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceData: formData,
          booking,
          bookingType,
          emailTo: formData.emailTo,
          emailAdmin: formData.emailAdmin,
        }),
      })

      if (!response.ok) throw new Error("Failed to send email")
      toast.success("Invoice emailed successfully")
    } catch (error) {
      console.error("Error sending email:", error)
      toast.error("Failed to send email")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Invoice Form */}
      <Card className="bg-white/95 backdrop-blur-sm border-[#D3B88C]/30 shadow-xl">
        <CardHeader className="border-b border-[#D3B88C]/20 p-6">
          <CardTitle className="text-[#3C2317] text-xl font-semibold">Step 3: Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Invoice Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[#3C2317] mb-4">Invoice Information</h3>
              <div>
                <Label className="text-[#3C2317] text-sm">Invoice Number</Label>
                <Input
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleInputChange}
                  className="border-[#D3B88C] bg-white mt-1"
                />
              </div>
              <div>
                <Label className="text-[#3C2317] text-sm">Invoice Date</Label>
                <Input
                  type="date"
                  name="invoiceDate"
                  value={formData.invoiceDate}
                  onChange={handleInputChange}
                  className="border-[#D3B88C] bg-white mt-1"
                />
              </div>
              <div>
                <Label className="text-[#3C2317] text-sm">Due Date</Label>
                <Input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="border-[#D3B88C] bg-white mt-1"
                />
              </div>
            </div>

            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[#3C2317] mb-4">Customer Information</h3>
              <div>
                <Label className="text-[#3C2317] text-sm">Customer Name</Label>
                <Input
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className="border-[#D3B88C] bg-white mt-1"
                />
              </div>
              <div>
                <Label className="text-[#3C2317] text-sm">Email</Label>
                <Input
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  className="border-[#D3B88C] bg-white mt-1"
                />
              </div>
              <div>
                <Label className="text-[#3C2317] text-sm">Phone</Label>
                <Input
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  className="border-[#D3B88C] bg-white mt-1"
                />
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-[#FBF9D9]/50 p-6 rounded-lg mb-8 border border-[#D3B88C]/30">
            <h3 className="font-semibold text-[#3C2317] mb-4">Booking Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-[#3C2317] text-sm">Booking Date</Label>
                <Input
                  type="date"
                  name="bookingDate"
                  value={formData.bookingDate}
                  onChange={handleInputChange}
                  className="border-[#D3B88C] bg-white mt-1"
                />
              </div>
              <div>
                <Label className="text-[#3C2317] text-sm">Booking Type</Label>
                <Input
                  value={bookingType === "camping" ? "Desert Camping" : "Desert Barbecue"}
                  disabled
                  className="border-[#D3B88C] bg-[#E6CFA9]/30 mt-1"
                />
              </div>
            </div>
            {booking.specialPricingName && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="text-sm font-medium text-orange-900">🎉 Special Event Pricing Applied</div>
                <div className="text-sm text-orange-800 mt-1">{booking.specialPricingName}</div>
              </div>
            )}
          </div>

          {/* Pricing Details */}
          <div className="bg-white border border-[#D3B88C]/30 p-6 rounded-lg mb-8">
            <h3 className="font-semibold text-[#3C2317] mb-4">Pricing Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-[#3C2317]">Subtotal</Label>
                <Input
                  type="number"
                  name="subtotal"
                  value={formData.subtotal}
                  onChange={handleInputChange}
                  className="border-[#D3B88C] bg-white w-32 text-right"
                  step="0.01"
                />
              </div>
              <div className="flex justify-between items-center">
                <Label className="text-[#3C2317]">VAT (5%)</Label>
                <Input
                  type="number"
                  name="vat"
                  value={formData.vat}
                  onChange={handleInputChange}
                  className="border-[#D3B88C] bg-white w-32 text-right"
                  step="0.01"
                />
              </div>
              <div className="flex justify-between items-center border-t border-[#D3B88C]/30 pt-3">
                <Label className="text-[#3C2317] font-bold">Total</Label>
                <Input
                  type="number"
                  name="total"
                  value={formData.total}
                  onChange={handleInputChange}
                  className="border-[#D3B88C] bg-white w-32 text-right font-bold"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="mb-8">
            <Label className="text-[#3C2317] text-sm">Additional Notes</Label>
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Add any additional notes or terms..."
              className="border-[#D3B88C] bg-white mt-2 min-h-24"
            />
          </div>

          {/* Email Options */}
          <div className="bg-[#FBF9D9]/50 p-6 rounded-lg border border-[#D3B88C]/30 mb-8">
            <h3 className="font-semibold text-[#3C2317] mb-4">Email Options</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-[#3C2317] text-sm">Send Invoice To</Label>
                <Input
                  name="emailTo"
                  value={formData.emailTo}
                  onChange={handleInputChange}
                  className="border-[#D3B88C] bg-white mt-1"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="emailAdmin"
                  checked={formData.emailAdmin}
                  onChange={(e) => setFormData((prev) => ({ ...prev, emailAdmin: e.target.checked }))}
                  className="w-4 h-4 rounded border-[#D3B88C]"
                />
                <Label htmlFor="emailAdmin" className="text-[#3C2317] text-sm cursor-pointer">
                  Also send to admin team
                </Label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant="outline"
              className="border-[#D3B88C] text-[#3C2317] hover:bg-[#D3B88C]/20"
              disabled={loading}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? "Hide" : "Preview"} Invoice
            </Button>
            <Button
              onClick={handleDownloadPDF}
              className="bg-gradient-to-r from-[#0891b2] to-[#0e7490] hover:from-[#0891b2]/90 hover:to-[#0e7490]/90 text-white"
              disabled={loading}
            >
              <Download className="w-4 h-4 mr-2" />
              {loading ? "Generating..." : "Download PDF"}
            </Button>
            <Button
              onClick={handleEmailInvoice}
              className="bg-gradient-to-r from-[#84cc16] to-[#65a30d] hover:from-[#84cc16]/90 hover:to-[#65a30d]/90 text-white"
              disabled={loading}
            >
              <Mail className="w-4 h-4 mr-2" />
              {loading ? "Sending..." : "Email Invoice"}
            </Button>
            <Button
              onClick={onBack}
              variant="outline"
              className="border-[#D3B88C] text-[#3C2317] ml-auto bg-transparent"
            >
              Back
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Preview */}
      {showPreview && <InvoicePreview invoiceData={formData} booking={booking} bookingType={bookingType} />}
    </div>
  )
}
