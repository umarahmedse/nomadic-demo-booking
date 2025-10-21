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
  specialDatePricing: [],
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
      id: "mountain",
      name: "Mountain",
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

function getSpecialDatePricing(
  bookingDate: string,
  specialDatePricing: Array<{
    id: string
    name: string
    startDate: string
    endDate: string
    priceMultiplier: number
    description?: string
    isActive: boolean
  }> = [],
) {
  if (!bookingDate || !specialDatePricing.length) return null

  const date = new Date(bookingDate)
  const dateString = date.toISOString().split("T")[0]

  for (const pricing of specialDatePricing) {
    if (!pricing.isActive) continue
    if (dateString >= pricing.startDate && dateString <= pricing.endDate) {
      return pricing
    }
  }

  return null
}

function getLocationPricing(
  location: string,
  locations: Array<{
    id: string
    name: string
    weekdayPrice: number
    weekendPrice: number
    surcharge: number
    isActive: boolean
  }> = [],
) {
  const locationData = locations.find((loc) => loc.name === location || loc.id === location)
  return locationData || locations[0] // Default to first location if not found
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
    tentPrice: settings?.tentPrice ?? DEFAULT_SETTINGS.tentPrice,
    addOnPrices: {
      charcoal: settings?.addOnPrices?.charcoal ?? DEFAULT_SETTINGS.addOnPrices.charcoal,
      firewood: settings?.addOnPrices?.firewood ?? DEFAULT_SETTINGS.addOnPrices.firewood,
      portableToilet: settings?.addOnPrices?.portableToilet ?? DEFAULT_SETTINGS.addOnPrices.portableToilet,
    },
    wadiSurcharge: settings?.wadiSurcharge ?? DEFAULT_SETTINGS.wadiSurcharge,
    vatRate: settings?.vatRate ?? DEFAULT_SETTINGS.vatRate,
    maxTentsPerDay: settings?.maxTentsPerDay ?? DEFAULT_SETTINGS.maxTentsPerDay,
    specialDatePricing: settings?.specialDatePricing ?? DEFAULT_SETTINGS.specialDatePricing,
    locations: settings?.locations ?? DEFAULT_SETTINGS.locations,
  }

  let tentPrice = 0
  let locationSurcharge = 0
  let wadiSingleTentSurcharge = 0

  const specialPricing = getSpecialDatePricing(bookingDate, safeSettings.specialDatePricing)

  if (bookingDate) {
    const date = new Date(bookingDate)
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0

    const locationPricing = getLocationPricing(location, safeSettings.locations)

    if (numberOfTents >= 2) {
      tentPrice = (isWeekend ? locationPricing.weekendPrice : locationPricing.weekdayPrice) * numberOfTents
    } else {
      if (location === "Wadi") {
        tentPrice = locationPricing.weekendPrice
        wadiSingleTentSurcharge = 500
      } else if (isWeekend) {
        tentPrice = locationPricing.weekendPrice
      } else {
        tentPrice = locationPricing.weekdayPrice
      }
    }

    if (specialPricing) {
      tentPrice = tentPrice * specialPricing.priceMultiplier
    }

    locationSurcharge = locationPricing.surcharge
  } else {
    const locationPricing = getLocationPricing(location, safeSettings.locations)
    tentPrice = numberOfTents === 1 ? locationPricing.weekendPrice : locationPricing.weekdayPrice * numberOfTents
    locationSurcharge = locationPricing.surcharge
  }

  // Calculate standard add-ons
  let addOnsCost = 0
  if (addOns.charcoal) addOnsCost += safeSettings.addOnPrices.charcoal
  if (addOns.firewood) addOnsCost += safeSettings.addOnPrices.firewood
  if (addOns.portableToilet && !hasChildren) {
    addOnsCost += safeSettings.addOnPrices.portableToilet
  }

  // Calculate custom add-ons
  const customAddOnsCost = customAddOns.filter((addon) => addon.selected).reduce((sum, addon) => sum + addon.price, 0)

  const subtotal = tentPrice + locationSurcharge + addOnsCost + customAddOnsCost + wadiSingleTentSurcharge
  const vat = subtotal * safeSettings.vatRate
  const total = subtotal + vat

  return {
    tentPrice,
    locationSurcharge,
    addOnsCost,
    customAddOnsCost,
    wadiSingleTentSurcharge,
    subtotal,
    vat,
    total,
    specialDatePricing: specialPricing,
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
