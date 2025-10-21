//@ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  Save,
  ArrowLeft,
  SettingsIcon,
  DollarSign,
  Tent,
  Plus,
  Trash2,
  AlertCircle,
  CheckIcon as Checkbox,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import type { Settings } from "@/lib/types"

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newAddOn, setNewAddOn] = useState({ name: "", price: 0, description: "" })
  const [newSpecialPricing, setNewSpecialPricing] = useState({
    name: "",
    startDate: "",
    endDate: "",
    priceMultiplier: 1,
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings")
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      const responseData = await response.json()

      if (response.ok) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("settingsUpdated"))
        }
        toast.success("Settings updated successfully")
        await fetchSettings()
      } else {
        throw new Error(responseData.error || "Failed to update settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error(`Failed to update settings: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setSaving(false)
    }
  }

  const updateSettings = (path: string, value: any) => {
    if (!settings) return

    const keys = path.split(".")
    const newSettings = { ...settings }
    let current: any = newSettings

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }
    current[keys[keys.length - 1]] = value

    setSettings(newSettings)
  }

  const addCustomAddOn = () => {
    if (!newAddOn.name || newAddOn.price <= 0) {
      toast.error("Please provide valid add-on name and price")
      return
    }

    const customAddOns = settings?.customAddOns || []
    const updatedAddOns = [...customAddOns, { ...newAddOn, id: Date.now().toString() }]

    updateSettings("customAddOns", updatedAddOns)
    setNewAddOn({ name: "", price: 0, description: "" })
    toast.success("Custom add-on added successfully")
  }

  const removeCustomAddOn = async (id: string) => {
    try {
      const customAddOns = settings?.customAddOns || []
      const updatedAddOns = customAddOns.filter((addon: any) => addon.id !== id)

      // Update settings in database immediately
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customAddOns: updatedAddOns }),
      })

      if (response.ok) {
        updateSettings("customAddOns", updatedAddOns)
        toast.success("Custom add-on deleted successfully")
        // Refresh settings to ensure consistency
        await fetchSettings()
      } else {
        toast.error("Failed to delete custom add-on")
      }
    } catch (error) {
      console.error("Error deleting custom add-on:", error)
      toast.error("Failed to delete custom add-on")
    }
  }

  const addSpecialPricing = () => {
    if (
      !newSpecialPricing.name ||
      !newSpecialPricing.startDate ||
      !newSpecialPricing.endDate ||
      newSpecialPricing.priceMultiplier <= 0
    ) {
      toast.error("Please provide valid event name, dates, and multiplier")
      return
    }

    const specialPricing = settings?.specialPricing || []
    const updatedPricing = [
      ...specialPricing,
      {
        ...newSpecialPricing,
        id: Date.now().toString(),
        isActive: true,
      },
    ]

    updateSettings("specialPricing", updatedPricing)
    setNewSpecialPricing({ name: "", startDate: "", endDate: "", priceMultiplier: 1 })
    toast.success("Special pricing added successfully")
  }

  const removeSpecialPricing = async (id: string) => {
    try {
      const specialPricing = settings?.specialPricing || []
      const updatedPricing = specialPricing.filter((pricing: any) => pricing.id !== id)

      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialPricing: updatedPricing }),
      })

      if (response.ok) {
        updateSettings("specialPricing", updatedPricing)
        toast.success("Special pricing deleted successfully")
        await fetchSettings()
      } else {
        toast.error("Failed to delete special pricing")
      }
    } catch (error) {
      console.error("Error deleting special pricing:", error)
      toast.error("Failed to delete special pricing")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-4">Failed to load settings</p>
          <Button onClick={fetchSettings}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className="flex items-center space-x-2 text-[#3C2317]/60 hover:text-[#3C2317] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              <Image src="/logo.png" alt="NOMADIC" width={120} height={40} className="h-8 w-auto" />
            </div>
          </div>

          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#3C2317] to-[#5D4037] rounded-xl flex items-center justify-center mr-4 shadow-lg">
              <SettingsIcon className="w-6 h-6 text-[#FBF9D9]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#3C2317]">System Settings</h1>
              <p className="text-base text-[#3C2317]/80 mt-2">
                Manage pricing, add-ons, and business rules for your glamping service
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Tent Pricing */}
          <Card className="bg-[#FBF9D9]/80 backdrop-blur-sm border-[#D3B88C]/50 shadow-xl">
            <CardHeader className="border-b border-[#D3B88C]/50">
              <CardTitle className="text-[#3C2317] text-lg font-semibold flex items-center">
                <Tent className="w-5 h-5 mr-2 text-[#D3B88C]" />
                Tent Pricing Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="weekdayPrice" className="text-[#3C2317] font-medium flex items-center">
                    Weekday Price (AED)
                    <Badge variant="outline" className="ml-2 text-xs border-[#D3B88C] text-[#3C2317]">
                      Mon-Thu
                    </Badge>
                  </Label>
                  <Input
                    id="weekdayPrice"
                    type="number"
                    step="0.1"
                    value={settings?.tentPrices?.weekday || 1297.8}
                    onChange={(e) => updateSettings("tentPrices.weekday", Number(e.target.value))}
                    className="border-[#D3B88C] focus:border-[#3C2317] focus:ring-[#3C2317]/20 bg-white/50"
                  />
                  <p className="text-sm text-[#3C2317]/60">Single tent price for Monday to Thursday</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="weekendPrice" className="text-[#3C2317] font-medium flex items-center">
                    Weekend Price (AED)
                    <Badge variant="outline" className="ml-2 text-xs border-[#D3B88C] text-[#3C2317]">
                      Fri-Sun
                    </Badge>
                  </Label>
                  <Input
                    id="weekendPrice"
                    type="number"
                    step="0.1"
                    value={settings?.tentPrices?.weekend || 1497.8}
                    onChange={(e) => updateSettings("tentPrices.weekend", Number(e.target.value))}
                    className="border-[#D3B88C] focus:border-[#3C2317] focus:ring-[#3C2317]/20 bg-white/50"
                  />
                  <p className="text-sm text-[#3C2317]/60">Single tent price for Friday to Sunday</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="multipleTents" className="text-[#3C2317] font-medium flex items-center">
                    Multiple Tents Price (AED each)
                    <Badge variant="outline" className="ml-2 text-xs border-[#D3B88C] text-[#3C2317]">
                      Bulk Discount
                    </Badge>
                  </Label>
                  <Input
                    id="multipleTents"
                    type="number"
                    step="0.1"
                    value={settings?.tentPrices?.multipleTents || 1297.8}
                    onChange={(e) => updateSettings("tentPrices.multipleTents", Number(e.target.value))}
                    className="border-[#D3B88C] focus:border-[#3C2317] focus:ring-[#3C2317]/20 bg-white/50"
                  />
                  <p className="text-sm text-[#3C2317]/60">Discounted price per tent when booking 2 or more tents</p>
                </div>
              </div>

              <div className="bg-[#E6CFA9]/30 p-4 rounded-lg">
                <h4 className="font-medium text-[#3C2317] mb-2">Pricing Rules</h4>
                <ul className="text-sm text-[#3C2317]/60 space-y-1">
                  <li>• Weekdays (Mon-Thu): {settings?.tentPrices?.weekday || 1297.8} AED + VAT per tent</li>
                  <li>• Weekends (Fri-Sun): {settings?.tentPrices?.weekend || 1497.8} AED + VAT per tent</li>
                  <li>• Multiple tents (2+): {settings?.tentPrices?.multipleTents || 1297.8} AED each + VAT</li>
                  <li>• Maximum 10 tents per day (split across bookings)</li>
                  <li>• Each tent accommodates up to 4 people</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Standard Add-ons */}
          <Card className="bg-[#FBF9D9]/80 backdrop-blur-sm border-[#D3B88C]/50 shadow-xl">
            <CardHeader className="border-b border-[#D3B88C]/50">
              <CardTitle className="text-[#3C2317] text-lg font-semibold flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-[#D3B88C]" />
                Standard Add-on Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="charcoal" className="text-[#3C2317] font-medium">
                    Charcoal (AED)
                  </Label>
                  <Input
                    id="charcoal"
                    type="number"
                    value={settings?.addOnPrices?.charcoal || 60}
                    onChange={(e) => updateSettings("addOnPrices.charcoal", Number(e.target.value))}
                    className="border-[#D3B88C] focus:border-[#3C2317] focus:ring-[#3C2317]/20 bg-white/50"
                  />
                  <p className="text-sm text-[#3C2317]/60">Premium charcoal for BBQ</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="firewood" className="text-[#3C2317] font-medium">
                    Firewood (AED)
                  </Label>
                  <Input
                    id="firewood"
                    type="number"
                    value={settings?.addOnPrices?.firewood || 75}
                    onChange={(e) => updateSettings("addOnPrices.firewood", Number(e.target.value))}
                    className="border-[#D3B88C] focus:border-[#3C2317] focus:ring-[#3C2317]/20 bg-white/50"
                  />
                  <p className="text-sm text-[#3C2317]/60">Dry firewood for campfire</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="portableToilet" className="text-[#3C2317] font-medium">
                    Portable Toilet (AED)
                  </Label>
                  <Input
                    id="portableToilet"
                    type="number"
                    value={settings?.addOnPrices?.portableToilet || 200}
                    onChange={(e) => updateSettings("addOnPrices.portableToilet", Number(e.target.value))}
                    className="border-[#D3B88C] focus:border-[#3C2317] focus:ring-[#3C2317]/20 bg-white/50"
                  />
                  <p className="text-sm text-[#3C2317]/60">Clean portable toilet facility (FREE with children)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Add-ons */}
          <Card className="bg-[#FBF9D9]/80 backdrop-blur-sm border-[#D3B88C]/50 shadow-xl">
            <CardHeader className="border-b border-[#D3B88C]/50">
              <CardTitle className="text-[#3C2317] text-lg font-semibold flex items-center">
                <Plus className="w-5 h-5 mr-2 text-[#D3B88C]" />
                Custom Add-ons Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Add New Custom Add-on */}
              <div className="border border-[#D3B88C]/50 rounded-lg p-4 bg-[#E6CFA9]/20">
                <h4 className="font-medium text-[#3C2317] mb-4">Add New Custom Add-on</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newAddOnName" className="text-[#3C2317]">
                      Name
                    </Label>
                    <Input
                      id="newAddOnName"
                      placeholder="e.g., Extra Blankets"
                      value={newAddOn.name}
                      onChange={(e) => setNewAddOn({ ...newAddOn, name: e.target.value })}
                      className="border-[#D3B88C] focus:border-[#3C2317] bg-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newAddOnPrice" className="text-[#3C2317]">
                      Price (AED)
                    </Label>
                    <Input
                      id="newAddOnPrice"
                      type="number"
                      placeholder="0"
                      value={newAddOn.price}
                      onChange={(e) => setNewAddOn({ ...newAddOn, price: Number(e.target.value) })}
                      className="border-[#D3B88C] focus:border-[#3C2317] bg-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newAddOnDescription" className="text-[#3C2317]">
                      Description
                    </Label>
                    <Input
                      id="newAddOnDescription"
                      placeholder="Brief description"
                      value={newAddOn.description}
                      onChange={(e) => setNewAddOn({ ...newAddOn, description: e.target.value })}
                      className="border-[#D3B88C] focus:border-[#3C2317] bg-white/50"
                    />
                  </div>
                </div>
                <Button
                  onClick={addCustomAddOn}
                  className="mt-4 bg-gradient-to-r from-[#84cc16] to-[#65a30d] hover:from-[#84cc16]/90 hover:to-[#65a30d]/90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Add-on
                </Button>
              </div>

              {/* Existing Custom Add-ons */}
              {settings?.customAddOns && settings.customAddOns.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-[#3C2317] text-sm">Existing Custom Add-ons</h4>
                  <div className="grid gap-3">
                    {settings.customAddOns.map((addon: any, index: number) => (
                      <div
                        key={addon.id}
                        className={`flex items-center justify-between p-3 border border-[#D3B88C]/50 rounded-lg transition-colors hover:bg-[#E6CFA9]/20 ${
                          index % 2 === 0 ? "bg-white/30" : "bg-[#FBF9D9]/30"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h5 className="font-medium text-[#3C2317] text-sm">{addon.name}</h5>
                            <Badge variant="outline" className="border-[#D3B88C] text-[#3C2317] text-xs">
                              AED {addon.price}
                            </Badge>
                          </div>
                          {addon.description && <p className="text-xs text-[#3C2317]/60 mt-1">{addon.description}</p>}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeCustomAddOn(addon.id)}
                          className="border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 cursor-pointer transition-all duration-200 h-8 px-2"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Special Pricing for Holidays/Events */}
          <Card className="bg-[#FBF9D9]/80 backdrop-blur-sm border-[#D3B88C]/50 shadow-xl">
            <CardHeader className="border-b border-[#D3B88C]/50">
              <CardTitle className="text-[#3C2317] text-lg font-semibold flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-[#D3B88C]" />
                Special Pricing (Holidays & Events)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="bg-[#E6CFA9]/30 p-4 rounded-lg mb-4">
                <p className="text-sm text-[#3C2317]/70">
                  Set custom pricing multipliers for specific dates or date ranges (e.g., holidays, special events).
                  Prices will be multiplied by the factor you set.
                </p>
              </div>

              {/* Add New Special Pricing */}
              <div className="border border-[#D3B88C]/50 rounded-lg p-4 bg-[#E6CFA9]/20">
                <h4 className="font-medium text-[#3C2317] mb-4">Add New Special Pricing Period</h4>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialPricingName" className="text-[#3C2317]">
                      Event Name
                    </Label>
                    <Input
                      id="specialPricingName"
                      placeholder="e.g., New Year"
                      value={newSpecialPricing?.name || ""}
                      onChange={(e) => setNewSpecialPricing({ ...newSpecialPricing, name: e.target.value })}
                      className="border-[#D3B88C] focus:border-[#3C2317] bg-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialPricingStart" className="text-[#3C2317]">
                      Start Date
                    </Label>
                    <Input
                      id="specialPricingStart"
                      type="date"
                      value={newSpecialPricing?.startDate || ""}
                      onChange={(e) => setNewSpecialPricing({ ...newSpecialPricing, startDate: e.target.value })}
                      className="border-[#D3B88C] focus:border-[#3C2317] bg-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialPricingEnd" className="text-[#3C2317]">
                      End Date
                    </Label>
                    <Input
                      id="specialPricingEnd"
                      type="date"
                      value={newSpecialPricing?.endDate || ""}
                      onChange={(e) => setNewSpecialPricing({ ...newSpecialPricing, endDate: e.target.value })}
                      className="border-[#D3B88C] focus:border-[#3C2317] bg-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialPricingMultiplier" className="text-[#3C2317]">
                      Price Multiplier
                    </Label>
                    <Input
                      id="specialPricingMultiplier"
                      type="number"
                      step="0.1"
                      placeholder="1.5"
                      value={newSpecialPricing?.priceMultiplier || ""}
                      onChange={(e) =>
                        setNewSpecialPricing({ ...newSpecialPricing, priceMultiplier: Number(e.target.value) })
                      }
                      className="border-[#D3B88C] focus:border-[#3C2317] bg-white/50"
                    />
                  </div>
                </div>
                <Button
                  onClick={addSpecialPricing}
                  className="mt-4 bg-gradient-to-r from-[#84cc16] to-[#65a30d] hover:from-[#84cc16]/90 hover:to-[#65a30d]/90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Special Pricing
                </Button>
              </div>

              {/* Existing Special Pricing */}
              {settings?.specialPricing && settings.specialPricing.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-[#3C2317] text-sm">Active Special Pricing Periods</h4>
                  <div className="grid gap-3">
                    {settings.specialPricing.map((pricing: any, index: number) => (
                      <div
                        key={pricing.id}
                        className={`flex items-center justify-between p-4 border border-[#D3B88C]/50 rounded-lg transition-colors hover:bg-[#E6CFA9]/20 ${
                          index % 2 === 0 ? "bg-white/30" : "bg-[#FBF9D9]/30"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h5 className="font-medium text-[#3C2317]">{pricing.name}</h5>
                            <Badge variant="outline" className="border-[#D3B88C] text-[#3C2317] text-xs">
                              {pricing.priceMultiplier}x
                            </Badge>
                            {!pricing.isActive && (
                              <Badge variant="outline" className="border-red-200 text-red-600 text-xs">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-[#3C2317]/60 mt-1">
                            {new Date(pricing.startDate).toLocaleDateString()} -{" "}
                            {new Date(pricing.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={pricing.isActive}
                            onCheckedChange={(checked) => {
                              const updated = settings.specialPricing.map((p: any) =>
                                p.id === pricing.id ? { ...p, isActive: checked } : p,
                              )
                              updateSettings("specialPricing", updated)
                            }}
                            className="border-[#D3B88C]"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeSpecialPricing(pricing.id)}
                            className="border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 cursor-pointer transition-all duration-200 h-8 px-2"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Multi-Location Management */}
          <Card className="bg-[#FBF9D9]/80 backdrop-blur-sm border-[#D3B88C]/50 shadow-xl">
            <CardHeader className="border-b border-[#D3B88C]/50">
              <CardTitle className="text-[#3C2317] text-lg font-semibold flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-[#D3B88C]" />
                Location Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="bg-[#E6CFA9]/30 p-4 rounded-lg mb-4">
                <p className="text-sm text-[#3C2317]/70">
                  Manage different camping locations with their own weekday and weekend pricing.
                </p>
              </div>

              {settings?.locations && settings.locations.length > 0 && (
                <div className="space-y-4">
                  {settings.locations.map((location: any, index: number) => (
                    <div key={location.id} className="border border-[#D3B88C]/50 rounded-lg p-4 bg-white/30">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="font-medium text-[#3C2317]">{location.name}</h5>
                        <Checkbox
                          checked={location.isActive}
                          onCheckedChange={(checked) => {
                            const updated = settings.locations.map((l: any) =>
                              l.id === location.id ? { ...l, isActive: checked } : l,
                            )
                            updateSettings("locations", updated)
                          }}
                          className="border-[#D3B88C]"
                        />
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[#3C2317] text-sm">Weekday Price (AED)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={location.weekdayPrice}
                            onChange={(e) => {
                              const updated = settings.locations.map((l: any) =>
                                l.id === location.id ? { ...l, weekdayPrice: Number(e.target.value) } : l,
                              )
                              updateSettings("locations", updated)
                            }}
                            className="border-[#D3B88C] focus:border-[#3C2317] bg-white/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#3C2317] text-sm">Weekend Price (AED)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={location.weekendPrice}
                            onChange={(e) => {
                              const updated = settings.locations.map((l: any) =>
                                l.id === location.id ? { ...l, weekendPrice: Number(e.target.value) } : l,
                              )
                              updateSettings("locations", updated)
                            }}
                            className="border-[#D3B88C] focus:border-[#3C2317] bg-white/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#3C2317] text-sm">Surcharge (AED)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={location.surcharge}
                            onChange={(e) => {
                              const updated = settings.locations.map((l: any) =>
                                l.id === location.id ? { ...l, surcharge: Number(e.target.value) } : l,
                              )
                              updateSettings("locations", updated)
                            }}
                            className="border-[#D3B88C] focus:border-[#3C2317] bg-white/50"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location & Business Rules */}
          <Card className="bg-[#FBF9D9]/80 backdrop-blur-sm border-[#D3B88C]/50 shadow-xl">
            <CardHeader className="border-b border-[#D3B88C]/50">
              <CardTitle className="text-[#3C2317] text-lg font-semibold flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-[#D3B88C]" />
                Location & Business Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="maxTentsPerDay" className="text-[#3C2317] font-medium flex items-center">
                    Maximum Tents Per Day
                    <Badge variant="outline" className="ml-2 text-xs border-[#D3B88C] text-[#3C2317]">
                      Daily Limit
                    </Badge>
                  </Label>
                  <Input
                    id="maxTentsPerDay"
                    type="number"
                    min="1"
                    max="50"
                    value={settings?.maxTentsPerDay || 15}
                    onChange={(e) => updateSettings("maxTentsPerDay", Number(e.target.value))}
                    className="border-[#D3B88C] focus:border-[#3C2317] focus:ring-[#3C2317]/20 bg-white/50"
                  />
                  <p className="text-sm text-[#3C2317]/60">Total tent capacity per day across all bookings</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="wadiSurcharge" className="text-[#3C2317] font-medium flex items-center">
                    Wadi Location Surcharge (AED)
                    <Badge variant="outline" className="ml-2 text-xs border-[#D3B88C] text-[#3C2317]">
                      Distance Fee
                    </Badge>
                  </Label>
                  <Input
                    id="wadiSurcharge"
                    type="number"
                    value={settings?.wadiSurcharge || 250}
                    onChange={(e) => updateSettings("wadiSurcharge", Number(e.target.value))}
                    className="border-[#D3B88C] focus:border-[#3C2317] focus:ring-[#3C2317]/20 bg-white/50"
                  />
                  <p className="text-sm text-[#3C2317]/60">
                    Additional charge for Wadi locations due to distance and logistics
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="vatRate" className="text-[#3C2317] font-medium">
                    VAT Rate (%)
                  </Label>
                  <Input
                    id="vatRate"
                    type="number"
                    step="0.01"
                    value={settings ? settings.vatRate * 100 : 5}
                    onChange={(e) => updateSettings("vatRate", Number(e.target.value) / 100)}
                    className="border-[#D3B88C] focus:border-[#3C2317] focus:ring-[#3C2317]/20 bg-white/50"
                  />
                  <p className="text-sm text-[#3C2317]/60">UAE VAT rate applied to all bookings</p>
                </div>
              </div>

              <Separator className="bg-[#D3B88C]/50" />

              <div className="space-y-4">
                <h4 className="font-medium text-[#3C2317]">Business Rules Summary</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-[#3C2317]">Booking Constraints</h5>
                    <ul className="text-sm text-[#3C2317]/60 space-y-1">
                      <li>• Maximum {settings?.maxTentsPerDay || 15} tents per day (split across bookings)</li>
                      <li>• Minimum 2 days advance booking</li>
                      <li>• Wadi requires minimum 2 tents</li>
                      <li>• Same location constraint per date</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-[#3C2317]">Special Offers</h5>
                    <ul className="text-sm text-[#3C2317]/60 space-y-1">
                      <li>• Portable toilet FREE with children</li>
                      <li>• Bulk discount for 2+ tents</li>
                      <li>• Desert location is standard (no surcharge)</li>
                      <li>• Mountain location available</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={fetchSettings}
              className="border-[#D3B88C] text-[#3C2317] hover:bg-[#D3B88C]/20 bg-transparent"
            >
              Reset Changes
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="bg-gradient-to-r from-[#3C2317] to-[#5D4037] hover:from-[#3C2317]/90 hover:to-[#5D4037]/90 text-[#FBF9D9] px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FBF9D9] mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
