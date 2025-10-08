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
) {
  const base = groupSize === 10 ? 1497 : groupSize === 15 ? 1697 : 1897 // 20

  const addOnsCost =
    (addOns.charcoal ? ADDON_PRICES.charcoal : 0) +
    (addOns.firewood ? ADDON_PRICES.firewood : 0) +
    (addOns.portableToilet ? ADDON_PRICES.portableToilet : 0)

  const subtotal = base + addOnsCost
  const vat = subtotal * VAT_RATE
  const total = subtotal + vat

  return { base, addOnsCost, subtotal, vat, total }
}
