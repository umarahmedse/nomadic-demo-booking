export interface Booking {
  _id?: string
  customerName: string
  customerEmail: string
  customerPhone: string
  bookingDate: Date
  location: "Desert" | "Mountain" | "Wadi"
  numberOfTents: number
  adults: number
  children: number
  sleepingArrangements: Array<{
    tentNumber: number
    arrangement: "all-singles" | "two-doubles" | "mix" | "double-bed" | "custom"
    customArrangement?: string
  }>
  addOns: {
    charcoal: boolean
    firewood: boolean
    portableToilet: boolean
  }
  hasChildren: boolean
  notes?: string
  arrivalTime: "4:30 PM" | "5:00 PM" | "5:30 PM" | "6:00 PM"
  subtotal: number
  vat: number
  total: number
  stripeSessionId?: string
  stripePaymentIntentId?: string
  isPaid: boolean
  selectedCustomAddOns?: string[]
  customAddOnsWithDetails?: Array<{
    id: string
    name: string
    description?: string
    price: number
  }>
  specialPricingName?: string
  createdAt: Date
  updatedAt: Date
}

export interface DateLocationLock {
  _id?: string
  date: Date
  lockedLocation: "Desert" | "Mountain" | "Wadi"
  createdAt: Date
}

export interface Settings {
  _id?: string
  tentPrice: number
  addOnPrices: {
    charcoal: number
    firewood: number
    portableToilet: number
  }
  customAddOns?: Array<{
    id: string
    name: string
    price: number
    description?: string
    isActive?: boolean
  }>
  wadiSurcharge: number
  vatRate: number
  maxTentsPerDay: number
  specialPricing: Array<{
    id: string
    name: string
    startDate: string
    endDate: string
    amount: number
    type: "total" | "per-tent"
    isActive: boolean
  }>
  locations: Array<{
    id: string
    name: string
    weekdayPrice: number
    weekendPrice: number
    surcharge: number
    isActive: boolean
  }>
  discounts: {
    code: string
    percentage: number
    isActive: boolean
  }[]
  businessRules?: {
    maxTentsPerBooking: number
    minAdvanceBookingDays: number
    wadiMinTents: number
    portableToiletFreeWithChildren: boolean
  }
  updatedAt: Date
}

export interface BookingFormData {
  customerName: string
  customerEmail: string
  customerPhone: string
  bookingDate: string
  location: "Desert" | "Mountain" | "Wadi"
  numberOfTents: number
  adults: number
  children: number
  sleepingArrangements: Array<{
    tentNumber: number
    arrangement: "all-singles" | "two-doubles" | "mix" | "double-bed" | "custom"
    customArrangement?: string
  }>
  addOns: {
    charcoal: boolean
    firewood: boolean
    portableToilet: boolean
  }
  hasChildren: boolean
  notes?: string
  arrivalTime: "4:30 PM" | "5:00 PM" | "5:30 PM" | "6:00 PM"
}

export interface User {
  _id?: string
  username: string
  email: string
  password: string
  role: "admin"
  createdAt: Date
}
