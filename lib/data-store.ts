import type { Booking } from "@/lib/types"

export const bookings: Booking[] = []
export let nextId = 1

export const dateLocationLocks: { [date: string]: { lockedLocation: string; totalTents: number } } = {}

export function getNextId() {
  return nextId++
}

export const dataStore = {
  bookings,
  dateLocationLocks,
  getNextId,
}
