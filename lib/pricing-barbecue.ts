import { type BarbecueGroupSize, VAT_RATE, ADDON_PRICES } from "./constants"

export function calculateBarbecuePrice(
  groupSize: BarbecueGroupSize,
  addOns: { charcoal: boolean; firewood: boolean; portableToilet: boolean },
  settings?: {
    groupPrices?: { 10: number; 15: number; 20: number }
    vatRate?: number
    addOnPrices?: { charcoal: number; firewood: number; portableToilet: number }
    specialPricing?: Array<{
      id: string
      name: string
      startDate: string
      endDate: string
      priceMultiplier: number
      isActive: boolean
    }>
  },
  bookingDate?: string,
) {
  const groupPrices = settings?.groupPrices || { 10: 1497, 15: 1697, 20: 1897 }
  const vatRate = settings?.vatRate || VAT_RATE
  const addOnPrices = settings?.addOnPrices || ADDON_PRICES

  let base = groupPrices[groupSize]

  if (bookingDate && settings?.specialPricing) {
    const date = new Date(bookingDate)
    const specialPrice = settings.specialPricing.find((sp) => {
      if (!sp.isActive) return false
      const startDate = new Date(sp.startDate)
      const endDate = new Date(sp.endDate)
      return date >= startDate && date <= endDate
    })
    if (specialPrice) {
      base = base * specialPrice.priceMultiplier
    }
  }

  const addOnsCost =
    (addOns.charcoal ? addOnPrices.charcoal : 0) +
    (addOns.firewood ? addOnPrices.firewood : 0) +
    (addOns.portableToilet ? addOnPrices.portableToilet : 0)

  const subtotal = base + addOnsCost
  const vat = subtotal * vatRate
  const total = subtotal + vat

  return { base, addOnsCost, subtotal, vat, total }
}
