"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react"

interface OrderSummaryStatsProps {
  totalOrders: number
  totalRevenue: number
  totalResources: number
  averageOrderValue: number
  isManagementMode: boolean
}

export function OrderSummaryStats({
  totalOrders,
  totalRevenue,
  totalResources,
  averageOrderValue,
  isManagementMode,
}: OrderSummaryStatsProps) {
  if (!isManagementMode) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Orders */}
      <Card className="bg-gradient-to-br from-[#FBF9D9] to-[#E6CFA9] border-[#D3B88C]/30 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-[#3C2317]">Total Orders</CardTitle>
          <div className="w-8 h-8 bg-gradient-to-br from-[#3C2317] to-[#5D4037] rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-[#FBF9D9]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-[#3C2317]">{totalOrders}</div>
          <p className="text-xs text-[#3C2317]/60 mt-1">Filtered orders</p>
        </CardContent>
      </Card>

      {/* Total Revenue */}
      <Card className="bg-gradient-to-br from-[#FBF9D9] to-[#E6CFA9] border-[#D3B88C]/30 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-[#3C2317]">Total Revenue</CardTitle>
          <div className="w-8 h-8 bg-gradient-to-br from-[#0891b2] to-[#0e7490] rounded-lg flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-[#0891b2]">AED {totalRevenue.toFixed(2)}</div>
          <p className="text-xs text-[#3C2317]/60 mt-1">From filtered orders</p>
        </CardContent>
      </Card>

      {/* Total Resources */}
      <Card className="bg-gradient-to-br from-[#FBF9D9] to-[#E6CFA9] border-[#D3B88C]/30 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-[#3C2317]">Total Resources</CardTitle>
          <div className="w-8 h-8 bg-gradient-to-br from-[#84cc16] to-[#65a30d] rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-[#84cc16]">{totalResources}</div>
          <p className="text-xs text-[#3C2317]/60 mt-1">Tents / Group size</p>
        </CardContent>
      </Card>

      {/* Average Order Value */}
      <Card className="bg-gradient-to-br from-[#FBF9D9] to-[#E6CFA9] border-[#D3B88C]/30 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-[#3C2317]">Avg Order Value</CardTitle>
          <div className="w-8 h-8 bg-gradient-to-br from-[#be123c] to-[#9f1239] rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-[#be123c]">AED {averageOrderValue.toFixed(2)}</div>
          <p className="text-xs text-[#3C2317]/60 mt-1">Per order average</p>
        </CardContent>
      </Card>
    </div>
  )
}
