"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, SettingsIcon, ArrowLeft, DollarSign, Badge } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"

type BBQSettings = {
  groupPrices: { 10: number; 15: number; 20: number }
  vatRate: number
  addOnPrices: { charcoal: number; firewood: number; portableToilet: number }
  customAddOns: Array<{ id: string; name: string; price: number; description?: string }>
  specialPricing?: Array<{
    id: string
    name: string
    startDate: string
    endDate: string
    amount: number
    type: "total" | "per-tent"
    isActive: boolean
  }>
}

const DEFAULTS: BBQSettings = {
  groupPrices: { 10: 1497, 15: 1697, 20: 1897 },
  vatRate: 0.05,
  addOnPrices: { charcoal: 60, firewood: 75, portableToilet: 200 },
  customAddOns: [],
}

export default function AdminBBQSettingsPage() {
  const [settings, setSettings] = useState<BBQSettings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newAddOn, setNewAddOn] = useState({ name: "", price: 0, description: "" })
  const [newSpecialPricing, setNewSpecialPricing] = useState({
    name: "",
    startDate: "",
    endDate: "",
    amount: 0,
    type: "total" as "total" | "per-tent",
  })
  const [editingSpecialPricing, setEditingSpecialPricing] = useState<any>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch("/api/barbecue/settings")
      const data = await res.json()
      setSettings(data)
    } catch (e) {
      console.error(e)
      toast.error("Failed to load BBQ settings")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      const res = await fetch("/api/barbecue/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error("Save failed")
      await fetchSettings()
      toast.success("BBQ settings updated")
    } catch (e) {
      toast.error("Failed to update BBQ settings")
    } finally {
      setSaving(false)
    }
  }

  function update(path: string, value: any) {
    const keys = path.split(".")
    const clone: any = { ...settings }
    let cur = clone
    for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]]
    cur[keys[keys.length - 1]] = value
    setSettings(clone)
  }

  function addCustom() {
    if (!newAddOn.name || newAddOn.price <= 0) return toast.error("Provide valid name and price")
    const id = Date.now().toString()
    update("customAddOns", [...(settings.customAddOns || []), { ...newAddOn, id }])
    setNewAddOn({ name: "", price: 0, description: "" })
  }

  function removeCustom(id: string) {
    update(
      "customAddOns",
      settings.customAddOns.filter((a) => a.id !== id),
    )
  }

  function addSpecialPricing() {
    if (
      !newSpecialPricing.name ||
      !newSpecialPricing.startDate ||
      !newSpecialPricing.endDate ||
      newSpecialPricing.amount < 0
    ) {
      return toast.error("Provide valid event name, dates, and amount")
    }
    const specialPricing = settings?.specialPricing || []
    update("specialPricing", [
      ...specialPricing,
      {
        ...newSpecialPricing,
        id: Date.now().toString(),
        isActive: true,
      },
    ])
    setNewSpecialPricing({ name: "", startDate: "", endDate: "", amount: 0, type: "total" })
    toast.success("Special pricing added")
  }

  function removeSpecialPricing(id: string) {
    const specialPricing = settings?.specialPricing || []
    update(
      "specialPricing",
      specialPricing.filter((p) => p.id !== id),
    )
    toast.success("Special pricing removed")
  }

  function updateSpecialPricing(id: string, updates: any) {
    const specialPricing = settings?.specialPricing || []
    const updated = specialPricing.map((p: any) => (p.id === id ? { ...p, ...updates } : p))
    update("specialPricing", updated)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3C2317]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <Link href="/admin/barbecue" className="flex items-center space-x-2 text-[#3C2317]/60 hover:text-[#3C2317]">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to BBQ</span>
          </Link>
          <Image src="/logo.png" alt="NOMADIC" width={120} height={40} className="h-8 w-auto" />
        </div>

        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-[#3C2317] to-[#5D4037] rounded-xl flex items-center justify-center mr-4 shadow-lg">
            <SettingsIcon className="w-6 h-6 text-[#FBF9D9]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#3C2317]">BBQ Settings</h1>
            <p className="text-base text-[#3C2317]/80 mt-1">Manage BBQ pricing, add-ons, and VAT</p>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="bg-[#FBF9D9]/80 backdrop-blur-sm border-[#D3B88C]/50 shadow-xl">
            <CardHeader className="border-b border-[#D3B88C]/50">
              <CardTitle className="text-[#3C2317] text-lg font-semibold flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-[#D3B88C]" />
                Group Pricing (AED + VAT)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid md:grid-cols-3 gap-6">
              {([10, 15, 20] as const).map((size) => (
                <div key={size} className="space-y-2">
                  <Label className="text-[#3C2317]">Up to {size} people</Label>
                  <Input
                    type="number"
                    value={settings.groupPrices[size]}
                    onChange={(e) => update(`groupPrices.${size}`, Number(e.target.value))}
                    className="border-[#D3B88C] focus:border-[#3C2317]"
                  />
                </div>
              ))}
              <div className="space-y-2 md:col-span-3">
                <Label className="text-[#3C2317]">VAT Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={(settings.vatRate * 100).toString()}
                  onChange={(e) => update("vatRate", Number(e.target.value) / 100)}
                  className="border-[#D3B88C] focus:border-[#3C2317] max-w-xs"
                />
              </div>
            </CardContent>
          </Card>

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
                </p>
              </div>

              {/* Add New Special Pricing */}
              <div className="border border-[#D3B88C]/50 rounded-lg p-4 bg-[#E6CFA9]/20">
                <h4 className="font-medium text-[#3C2317] mb-4">Add New Special Pricing Period</h4>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bbqSpecialPricingName" className="text-[#3C2317]">
                      Event Name
                    </Label>
                    <Input
                      id="bbqSpecialPricingName"
                      placeholder="e.g., New Year"
                      value={newSpecialPricing?.name || ""}
                      onChange={(e) => setNewSpecialPricing({ ...newSpecialPricing, name: e.target.value })}
                      className="border-[#D3B88C] focus:border-[#3C2317] bg-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bbqSpecialPricingStart" className="text-[#3C2317]">
                      Start Date
                    </Label>
                    <Input
                      id="bbqSpecialPricingStart"
                      type="date"
                      value={newSpecialPricing?.startDate || ""}
                      onChange={(e) => setNewSpecialPricing({ ...newSpecialPricing, startDate: e.target.value })}
                      className="border-[#D3B88C] focus:border-[#3C2317] bg-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bbqSpecialPricingEnd" className="text-[#3C2317]">
                      End Date
                    </Label>
                    <Input
                      id="bbqSpecialPricingEnd"
                      type="date"
                      value={newSpecialPricing?.endDate || ""}
                      onChange={(e) => setNewSpecialPricing({ ...newSpecialPricing, endDate: e.target.value })}
                      className="border-[#D3B88C] focus:border-[#3C2317] bg-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bbqSpecialPricingAmount" className="text-[#3C2317]">
                      Additional Amount (AED)
                    </Label>
                    <Input
                      id="bbqSpecialPricingAmount"
                      type="number"
                      step="0.1"
                      placeholder="1000"
                      value={newSpecialPricing?.amount || ""}
                      onChange={(e) => setNewSpecialPricing({ ...newSpecialPricing, amount: Number(e.target.value) })}
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
                      <div key={pricing.id}>
                        {editingSpecialPricing?.id === pricing.id ? (
                          <div className="border border-[#D3B88C]/50 rounded-lg p-4 bg-[#E6CFA9]/20 space-y-4">
                            <h5 className="font-medium text-[#3C2317]">Edit Special Pricing</h5>
                            <div className="grid md:grid-cols-4 gap-4">
                              <div className="space-y-2">
                                <Label className="text-[#3C2317]">Event Name</Label>
                                <Input
                                  value={editingSpecialPricing.name}
                                  onChange={(e) =>
                                    setEditingSpecialPricing({ ...editingSpecialPricing, name: e.target.value })
                                  }
                                  className="border-[#D3B88C] focus:border-[#3C2317] bg-white/50"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[#3C2317]">Start Date</Label>
                                <Input
                                  type="date"
                                  value={editingSpecialPricing.startDate}
                                  onChange={(e) =>
                                    setEditingSpecialPricing({ ...editingSpecialPricing, startDate: e.target.value })
                                  }
                                  className="border-[#D3B88C] focus:border-[#3C2317] bg-white/50"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[#3C2317]">End Date</Label>
                                <Input
                                  type="date"
                                  value={editingSpecialPricing.endDate}
                                  onChange={(e) =>
                                    setEditingSpecialPricing({ ...editingSpecialPricing, endDate: e.target.value })
                                  }
                                  className="border-[#D3B88C] focus:border-[#3C2317] bg-white/50"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[#3C2317]">Amount (AED)</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={editingSpecialPricing.amount}
                                  onChange={(e) =>
                                    setEditingSpecialPricing({
                                      ...editingSpecialPricing,
                                      amount: Number(e.target.value),
                                    })
                                  }
                                  className="border-[#D3B88C] focus:border-[#3C2317] bg-white/50"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => {
                                  updateSpecialPricing(pricing.id, editingSpecialPricing)
                                  setEditingSpecialPricing(null)
                                  toast.success("Special pricing updated")
                                }}
                                className="bg-gradient-to-r from-[#84cc16] to-[#65a30d] hover:from-[#84cc16]/90 hover:to-[#65a30d]/90 text-white"
                              >
                                Save Changes
                              </Button>
                              <Button
                                onClick={() => setEditingSpecialPricing(null)}
                                variant="outline"
                                className="border-[#D3B88C] text-[#3C2317]"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`flex items-center justify-between p-4 border border-[#D3B88C]/50 rounded-lg transition-colors hover:bg-[#E6CFA9]/20 ${
                              index % 2 === 0 ? "bg-white/30" : "bg-[#FBF9D9]/30"
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h5 className="font-medium text-[#3C2317]">{pricing.name}</h5>
                                <Badge variant="outline" className="border-[#D3B88C] text-[#3C2317] text-xs">
                                  +AED {pricing.amount}
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
                                  updateSpecialPricing(pricing.id, { isActive: checked })
                                }}
                                className="border-[#D3B88C]"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingSpecialPricing(pricing)}
                                className="border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 cursor-pointer transition-all duration-200 h-8 px-2"
                              >
                                Edit
                              </Button>
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
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#FBF9D9]/80 backdrop-blur-sm border-[#D3B88C]/50 shadow-xl">
            <CardHeader className="border-b border-[#D3B88C]/50">
              <CardTitle className="text-[#3C2317] text-lg font-semibold">Standard Add-ons</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-[#3C2317]">Charcoal (AED)</Label>
                <Input
                  type="number"
                  value={settings.addOnPrices.charcoal}
                  onChange={(e) => update("addOnPrices.charcoal", Number(e.target.value))}
                  className="border-[#D3B88C] focus:border-[#3C2317]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#3C2317]">Firewood (AED)</Label>
                <Input
                  type="number"
                  value={settings.addOnPrices.firewood}
                  onChange={(e) => update("addOnPrices.firewood", Number(e.target.value))}
                  className="border-[#D3B88C] focus:border-[#3C2317]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#3C2317]">Portable Toilet (AED)</Label>
                <Input
                  type="number"
                  value={settings.addOnPrices.portableToilet}
                  onChange={(e) => update("addOnPrices.portableToilet", Number(e.target.value))}
                  className="border-[#D3B88C] focus:border-[#3C2317]"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#FBF9D9]/80 backdrop-blur-sm border-[#D3B88C]/50 shadow-xl">
            <CardHeader className="border-b border-[#D3B88C]/50">
              <CardTitle className="text-[#3C2317] text-lg font-semibold">Custom Add-ons</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#3C2317]">Name</Label>
                  <Input value={newAddOn.name} onChange={(e) => setNewAddOn({ ...newAddOn, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#3C2317]">Price (AED)</Label>
                  <Input
                    type="number"
                    value={newAddOn.price}
                    onChange={(e) => setNewAddOn({ ...newAddOn, price: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#3C2317]">Description</Label>
                  <Input
                    value={newAddOn.description}
                    onChange={(e) => setNewAddOn({ ...newAddOn, description: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={addCustom} className="bg-[#3C2317] text-[#FBF9D9] hover:bg-[#3C2317]/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Add-on
              </Button>

              {settings.customAddOns.length > 0 && (
                <div className="grid gap-3">
                  {settings.customAddOns.map((addon) => (
                    <div
                      key={addon.id}
                      className="flex items-center justify-between p-3 border border-[#D3B88C]/50 rounded-lg bg-white/50"
                    >
                      <div>
                        <div className="font-medium text-[#3C2317]">{addon.name}</div>
                        <div className="text-xs text-[#3C2317]/70">
                          AED {addon.price} {addon.description ? `• ${addon.description}` : ""}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeCustom(addon.id)}
                        className="border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={fetchSettings}
              className="border-[#D3B88C] text-[#3C2317] bg-transparent"
            >
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#3C2317] text-[#FBF9D9]">
              {saving ? "Saving..." : "Save BBQ Settings"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
