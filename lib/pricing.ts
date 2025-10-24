export const DEFAULT_SETTINGS = {
  tentPrice: 1297,
  addOnPrices: {
    charcoal: 60,
    firewood: 75,
    portableToilet: 200,
  },
  wadiSurcharge: 250,
  vatRate: 0.05,
  maxTentsPerDay: 15,
  specialPricing: [],
  locations: [
    {
      id: "desert",
      name: "Desert",
      weekdayPrice: 1297,
      weekendPrice: 1497,
      surcharge: 0,
      isActive: true,
    },
    {
      id: "wadi",
      name: "Wadi",
      weekdayPrice: 1297,
      weekendPrice: 1497,
      surcharge: 250,
      isActive: true,
    },
  ],
}

export function calculateBookingPrice(
  numberOfTents: number,
  location: "Desert" | "Mountain" | "Wadi",
  addOns: { charcoal: boolean; firewood: boolean; portableToilet: boolean },
  hasChildren: boolean,
  customAddOns: Array<{ id: string; name: string; price: number; selected?: boolean }> = [],
  settings = DEFAULT_SETTINGS,
  bookingDate?: string,
  wadiSingleTentSurcharge = 0,
) {
  const safeSettings = {
    tentPrice: settings?.tentPrice ?? DEFAULT_SETTINGS.tentPrice,
    addOnPrices: {
      charcoal: settings?.addOnPrices?.charcoal ?? DEFAULT_SETTINGS.addOnPrices.charcoal,
      firewood: settings?.addOnPrices?.firewood ?? DEFAULT_SETTINGS.addOnPrices.firewood,
      portableToilet: settings?.addOnPrices?.portableToilet ?? DEFAULT_SETTINGS.addOnPrices.portableToilet,
    },
    wadiSurcharge: settings?.wadiSurcharge ?? DEFAULT_SETTINGS.wadiSurcharge,
    vatRate: settings?.vatRate ?? DEFAULT_SETTINGS.vatRate,
    maxTentsPerDay: settings?.maxTentsPerDay ?? DEFAULT_SETTINGS.maxTentsPerDay,
    specialPricing: settings?.specialPricing ?? DEFAULT_SETTINGS.specialPricing,
    locations: settings?.locations ?? DEFAULT_SETTINGS.locations,
  }

  let tentPrice = 0
  let specialPricingAmount = 0

  if (bookingDate) {
    const date = new Date(bookingDate)
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0

    // Check for special pricing (holidays/events)
    const specialPrice = safeSettings.specialPricing.find((sp) => {
      if (!sp.isActive) return false
      const startDate = new Date(sp.startDate)
      const endDate = new Date(sp.endDate)
      return date >= startDate && date <= endDate
    })

    // Get location-specific pricing
    const locationConfig = safeSettings.locations.find(
      (loc) => loc.name.toLowerCase() === location.toLowerCase() && loc.isActive,
    )

    const basePrice = locationConfig
      ? isWeekend
        ? locationConfig.weekendPrice
        : locationConfig.weekdayPrice
      : safeSettings.tentPrice

    if (numberOfTents >= 2) {
      tentPrice = basePrice * numberOfTents
    } else {
      tentPrice = basePrice + wadiSingleTentSurcharge
    }

    if (specialPrice) {
      if (specialPrice.type === "per-tent") {
        specialPricingAmount = specialPrice.amount * numberOfTents
        tentPrice += specialPricingAmount
      } else {
        specialPricingAmount = specialPrice.amount
        tentPrice += specialPricingAmount
      }
    }
  } else {
    tentPrice = numberOfTents === 1 ? safeSettings.tentPrice + 200 : safeSettings.tentPrice * numberOfTents
  }

  let locationSurcharge = 0
  const locationConfig = safeSettings.locations.find(
    (loc) => loc.name.toLowerCase() === location.toLowerCase() && loc.isActive,
  )
  if (locationConfig) {
    locationSurcharge = locationConfig.surcharge
  }

  let addOnsCost = 0
  if (addOns.charcoal) addOnsCost += safeSettings.addOnPrices.charcoal
  if (addOns.firewood) addOnsCost += safeSettings.addOnPrices.firewood
  if (addOns.portableToilet && !hasChildren) {
    addOnsCost += safeSettings.addOnPrices.portableToilet
  }

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
    specialPricingAmount,
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
      if (!settings.customAddOns) {
        settings.customAddOns = []
      }
      if (!settings.specialPricing) {
        settings.specialPricing = []
      }
      if (!settings.locations) {
        settings.locations = DEFAULT_SETTINGS.locations
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
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("settingsUpdated"))
  }
}
