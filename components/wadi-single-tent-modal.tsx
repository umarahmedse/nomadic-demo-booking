"use client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertCircle } from "lucide-react"

interface WadiSingleTentModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  extraCharge: number
}

export default function WadiSingleTentModal({ isOpen, onConfirm, onCancel, extraCharge }: WadiSingleTentModalProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="border-[#D3B88C]/50 bg-[#FBF9D9]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600" />
            <AlertDialogTitle className="text-[#3C2317]">Wadi Single Tent Booking</AlertDialogTitle>
          </div>
        </AlertDialogHeader>
        <AlertDialogDescription className="text-[#3C2317]/80 space-y-3">
          <p>
            You have selected <strong>1 tent</strong> for the <strong>Wadi location</strong>.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
            <p className="font-semibold text-amber-900">Special Pricing Applied:</p>
            <ul className="text-sm text-amber-800 space-y-1 ml-4 list-disc">
              <li>Additional surcharge of AED {extraCharge} will be applied</li>
              <li>Weekend pricing will be charged even on weekdays</li>
              <li>This ensures premium service for single tent bookings in Wadi</li>
            </ul>
          </div>
          <p className="text-sm">
            Your total booking cost will reflect these adjustments. Do you want to proceed with this booking?
          </p>
        </AlertDialogDescription>
        <div className="flex gap-3 justify-end pt-4">
          <AlertDialogCancel onClick={onCancel} className="border-[#D3B88C] text-[#3C2317] hover:bg-[#D3B88C]/10">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-[#3C2317] text-[#FBF9D9] hover:bg-[#3C2317]/90">
            Confirm Booking
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
