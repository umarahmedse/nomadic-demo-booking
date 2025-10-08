export const DEFAULT_SETTINGS = {
  tentPrice: 1297, // Reverted to single tentPrice field
  addOnPrices: {
    charcoal: 60,
    firewood: 75,
    portableToilet: 200,
  },
  wadiSurcharge: 250,
  vatRate: 0.05,
  maxTentsPerDay: 15, // Added default tent capacity
}

export function calculateBookingPrice(
  numberOfTents: number,
  location: "Desert" | "Mountain" | "Wadi",
  addOns: { charcoal: boolean; firewood: boolean; portableToilet: boolean },
  hasChildren: boolean,
  customAddOns: Array<{ id: string; name: string; price: number; selected?: boolean }> = [],
  settings = DEFAULT_SETTINGS,
  bookingDate?: string,
) {
  const safeSettings = {
    tentPrice: settings?.tentPrice ?? DEFAULT_SETTINGS.tentPrice, // Simplified to single tentPrice
    addOnPrices: {
      charcoal: settings?.addOnPrices?.charcoal ?? DEFAULT_SETTINGS.addOnPrices.charcoal,
      firewood: settings?.addOnPrices?.firewood ?? DEFAULT_SETTINGS.addOnPrices.firewood,
      portableToilet: settings?.addOnPrices?.portableToilet ?? DEFAULT_SETTINGS.addOnPrices.portableToilet,
    },
    wadiSurcharge: settings?.wadiSurcharge ?? DEFAULT_SETTINGS.wadiSurcharge,
    vatRate: settings?.vatRate ?? DEFAULT_SETTINGS.vatRate,
    maxTentsPerDay: settings?.maxTentsPerDay ?? DEFAULT_SETTINGS.maxTentsPerDay,
  }

  let tentPrice = 0

  if (bookingDate) {
    const date = new Date(bookingDate)
    const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, etc.
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0 // Fri, Sat, Sun

    if (numberOfTents >= 2) {
      tentPrice = safeSettings.tentPrice * numberOfTents
    } else {
      // Single tent pricing with weekend surcharge
      if (isWeekend) {
        tentPrice = safeSettings.tentPrice + 200 // Weekend surcharge
      } else {
        tentPrice = safeSettings.tentPrice // Weekday price
      }
    }
  } else {
    // Fallback to weekend pricing if no date provided
    tentPrice = numberOfTents === 1 ? safeSettings.tentPrice + 200 : safeSettings.tentPrice * numberOfTents
  }

  // Add location surcharge for Wadi
  const locationSurcharge = location === "Wadi" ? safeSettings.wadiSurcharge : 0

  // Calculate standard add-ons
  let addOnsCost = 0
  if (addOns.charcoal) addOnsCost += safeSettings.addOnPrices.charcoal
  if (addOns.firewood) addOnsCost += safeSettings.addOnPrices.firewood
  if (addOns.portableToilet && !hasChildren) {
    addOnsCost += safeSettings.addOnPrices.portableToilet
  }

  // Calculate custom add-ons
  const customAddOnsCost = customAddOns.filter((addon) => addon.selected).reduce((sum, addon) => sum + addon.price, 0)

  const subtotal = tentPrice + locationSurcharge + addOnsCost + customAddOnsCost
  const vat = subtotal * safeSettings.vatRate
  const total = subtotal + vat

  return {
    tentPrice,
    locationSurcharge,
    addOnsCost,
    customAddOnsCost,
    subtotal,
    vat,
    total,
  }
}

export async function fetchPricingSettings(bustCache = false) {
  try {
    const url = bustCache ? `/api/settings?t=${Date.now()}` : "/api/settings"
    const response = await fetch(url, {
      cache: bustCache ? "no-cache" : "default",
      headers: {
        "Cache-Control": bustCache ? "no-cache" : "default",
      },
    })

    if (response.ok) {
      const settings = await response.json()
      // Ensure customAddOns array exists
      if (!settings.customAddOns) {
        settings.customAddOns = []
      }
      return settings
    }

    console.warn("Failed to fetch settings, using defaults")
    return { ...DEFAULT_SETTINGS, customAddOns: [] }
  } catch (error) {
    console.error("Failed to fetch pricing settings:", error)
    return { ...DEFAULT_SETTINGS, customAddOns: [] }
  }
}

export function invalidateSettingsCache() {
  // This can be used to trigger a refresh of settings
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("settingsUpdated"))
  }
}
