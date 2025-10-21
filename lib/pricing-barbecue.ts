export type BarbecueGroupSize = 10 | 15 | 20

const VAT_RATE = 0.05
const ADDON_PRICES = {
  charcoal: 60,
  firewood: 75,
  portableToilet: 200,
}

export function calculateBarbecuePrice(
  groupSize: BarbecueGroupSize,
  addOns: { charcoal: boolean; firewood: boolean; portableToilet: boolean },
  customAddOns: Array<{ id: string; name: string; price: number; selected?: boolean }> = [],
  settings?: any,
  bookingDate?: string,
) {
  const base = groupSize === 10 ? 1497 : groupSize === 15 ? 1697 : 1897 // 20

  let finalBase = base
  if (bookingDate && settings?.specialDatePricing) {
    const date = new Date(bookingDate)
    const dateString = date.toISOString().split("T")[0]

    for (const pricing of settings.specialDatePricing) {
      if (pricing.isActive && dateString >= pricing.startDate && dateString <= pricing.endDate) {
        finalBase = base * pricing.priceMultiplier
        break
      }
    }
  }

  const addOnsCost =
    (addOns.charcoal ? ADDON_PRICES.charcoal : 0) +
    (addOns.firewood ? ADDON_PRICES.firewood : 0) +
    (addOns.portableToilet ? ADDON_PRICES.portableToilet : 0)

  const customAddOnsCost = customAddOns.filter((addon) => addon.selected).reduce((sum, addon) => sum + addon.price, 0)

  const subtotal = finalBase + addOnsCost + customAddOnsCost
  const vat = subtotal * VAT_RATE
  const total = subtotal + vat

  return { base: finalBase, addOnsCost, customAddOnsCost, subtotal, vat, total }
}
