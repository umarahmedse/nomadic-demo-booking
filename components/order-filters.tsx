"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Calendar, Search, Settings } from "lucide-react"

interface OrderFiltersProps {
  onSearchChange: (search: string) => void
  onDateRangeChange: (startDate: string, endDate: string) => void
  onManagementToggle: (isManagement: boolean) => void
  isManagementMode: boolean
  searchTerm: string
  startDate: string
  endDate: string
}

export function OrderFilters({
  onSearchChange,
  onDateRangeChange,
  onManagementToggle,
  isManagementMode,
  searchTerm,
  startDate,
  endDate,
}: OrderFiltersProps) {
  const [localStartDate, setLocalStartDate] = useState(startDate)
  const [localEndDate, setLocalEndDate] = useState(endDate)

  const handleDateChange = () => {
    onDateRangeChange(localStartDate, localEndDate)
  }

  const handleClearDates = () => {
    setLocalStartDate("")
    setLocalEndDate("")
    onDateRangeChange("", "")
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-[#D3B88C]/30 shadow-lg mb-6">
      <div className="p-6 space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-semibold text-[#3C2317] mb-2 block">Search Orders</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-[#D3B88C]" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 border-[#D3B88C]/30 focus:border-[#D3B88C] bg-white text-[#3C2317]"
              />
            </div>
          </div>

          {/* Management Toggle */}
          <Button
            onClick={() => onManagementToggle(!isManagementMode)}
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

        {/* Date Range Filter */}
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
            <Button onClick={handleDateChange} className="flex-1 bg-[#3C2317] text-white hover:bg-[#5D4037] h-10">
              Apply
            </Button>
            <Button
              onClick={handleClearDates}
              variant="outline"
              className="flex-1 border-[#D3B88C] text-[#3C2317] hover:bg-[#D3B88C]/10 h-10 bg-transparent"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
