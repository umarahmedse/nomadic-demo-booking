//@ts-nocheck
"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin, Users, Plus, Minus, Check, X, Loader2, Calendar, Shield, Compass, Loader2Icon } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { fetchPricingSettings } from "@/lib/pricing"
import type { BookingFormData, Settings } from "@/lib/types"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Stepper from "@/components/ui/stepper"
import WadiSingleTentModal from "@/components/wadi-single-tent-modal"

const DEFAULT_SETTINGS = {
  tentPrice: 1297, // Base price for weekdays and multiple tents
  wadiSurcharge: 250,
  vatRate: 0.05,
  addOnPrices: {
    charcoal: 60,
    firewood: 75,
    portableToilet: 200,
  },
  customAddOns: [],
  locations: [
    { id: "desert-1", name: "Desert", weekdayPrice: 1297, weekendPrice: 1497 },
    { id: "wadi-1", name: "Wadi", weekdayPrice: 1297, weekendPrice: 1497 },
    {
      id: "mountain-1",
      name: "Mountain",
      weekdayPrice: 1297,
      weekendPrice: 1497,
    },
  ],
}

const calculatePrice = (
  numberOfTents: number,
  location: string,
  addOns: any,
  selectedCustomAddOns: string[],
  settings: Settings,
  bookingDate?: string,
  children?: number,
) => {
  let tentPrice = 0
  let addOnsCost = 0
  let customAddOnsCost = 0
  let wadiSurcharge = 0
  let subtotal = 0
  let vat = 0
  let total = 0

  // --- Special Pricing Calculation ---
  let specialPricingAmount = 0
  let specialPricingName = "" // track special pricing name

  if (bookingDate && settings.specialPricing) {
    const date = new Date(bookingDate)
    const specialPrice = settings.specialPricing.find((sp) => {
      if (!sp.isActive) return false
      const startDate = new Date(sp.startDate)
      const endDate = new Date(sp.endDate)
      return date >= startDate && date <= endDate
    })
    if (specialPrice) {
      specialPricingAmount = specialPrice.amount
      specialPricingName = specialPrice.name // store the name
      if (specialPrice.type === "per-tent") {
        specialPricingAmount = specialPrice.amount * numberOfTents
      }
    }
  }
  // --- End Special Pricing Calculation ---

  // Tent price logic (simplified to use settings.tentPrice directly for base)
  tentPrice = settings.tentPrice || DEFAULT_SETTINGS.tentPrice

  // Base price per tent (adjusting for weekday/weekend if not using special pricing)
  // This part might need adjustment if you want weekday/weekend prices from settings.locations to be used by default
  // For now, assuming settings.tentPrice is the base, and specialPricing overrides it.
  const baseTentCost = tentPrice * numberOfTents

  // Add Wadi surcharge
  if (location === "Wadi" && numberOfTents === 1) {
    wadiSurcharge = 500 // Specific surcharge for single tent at Wadi
  } else if (location === "Wadi") {
    wadiSurcharge = settings.wadiSurcharge || DEFAULT_SETTINGS.wadiSurcharge // General Wadi surcharge for multiple tents
  }

  // Calculate add-ons cost
  if (addOns.charcoal) addOnsCost += settings.addOnPrices.charcoal || 60
  if (addOns.firewood) addOnsCost += settings.addOnPrices.firewood || 75
  if (addOns.portableToilet && !(children > 0)) {
    // Only add cost if children are not present, as it's free with children
    addOnsCost += settings.addOnPrices.portableToilet || 200
  }

  // Calculate custom add-ons cost
  const selectedCustomAddOnsDetails = (settings.customAddOns || []).filter((addon) =>
    selectedCustomAddOns.includes(addon.id),
  )
  customAddOnsCost = selectedCustomAddOnsDetails.reduce((sum, addon) => sum + addon.price, 0)

  // Calculate subtotal before VAT
  subtotal = baseTentCost + addOnsCost + customAddOnsCost + wadiSurcharge + specialPricingAmount

  // Calculate VAT
  const vatRate = settings.vatRate || DEFAULT_SETTINGS.vatRate
  vat = subtotal * vatRate

  // Calculate total
  total = subtotal + vat

  return {
    tentPrice: baseTentCost, // This is the total base tent price
    addOnsCost,
    customAddOnsCost,
    wadiSurcharge,
    subtotal,
    vat,
    total,
    specialPricingAmount, // Include special pricing amount
    specialPricingName, // return name
  }
}

export default function BookingPage() {
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)

  const [wadiSingleTentSurcharge, setWadiSingleTentSurcharge] = useState(0)

  interface DateConstraints {
    hasBookings: boolean
    lockedLocation: "Desert" | "Mountain" | "Wadi" | null
    remainingCapacity: number
    bookedArrivalTimes: string[]
    maxBookingsReached: boolean
    blocked: boolean
    blockedReason: string | null
  }

  const [dateConstraints, setDateConstraints] = useState<DateConstraints>({
    hasBookings: false,
    lockedLocation: null,
    remainingCapacity: 15, // Updated from 10 to 15
    bookedArrivalTimes: [],
    maxBookingsReached: false,
    blocked: false,
    blockedReason: null,
  })
  const [checkingConstraints, setCheckingConstraints] = useState(false)
  const isUserInteracting = useRef(false)
  const interactionTimeoutRef = useRef<NodeJS.Timeout>()
  const isRefreshing = useRef(false)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Declare refreshTimeoutRef here

  const [uiStep, setUiStep] = useState(1)
  const [showBookingFlow, setShowBookingFlow] = useState(false)

  const [formData, setFormData] = useState<BookingFormData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "+971",
    bookingDate: "",
    location: "Desert",
    numberOfTents: 1,
    adults: 2,
    children: 0,
    sleepingArrangements: [{ tentNumber: 1, arrangement: "all-singles" }],
    addOns: {
      charcoal: false,
      firewood: false,
      portableToilet: false,
    },
    hasChildren: false,
    notes: "",
    arrivalTime: "4:30 PM",
  })

  const [selectedCustomAddOns, setSelectedCustomAddOns] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [pricing, setPricing] = useState(
    calculatePrice(
      // Changed to calculatePrice
      1,
      "Desert",
      formData.addOns,
      [], // selectedCustomAddOns is empty initially
      DEFAULT_SETTINGS, // Use default settings initially
      formData.bookingDate,
      0, // children is 0 initially
    ),
  )
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const [locationMessage, setLocationMessage] = useState("")
  const stepperSectionRef = useRef<HTMLDivElement>(null)

  // Add modal state and handlers
  const [showWadiModal, setShowWadiModal] = useState(false)
  const [wadiModalConfirmed, setWadiModalConfirmed] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)

  const scrollToStepperTop = () => {
    stepperSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  const validateCurrentStep = () => {
    switch (uiStep) {
      case 1:
        // Validate Step 1: Date, Location, Number of Tents
        const step1Errors = []
        if (!formData.bookingDate) step1Errors.push("bookingDate")
        if (!formData.location) step1Errors.push("location")
        if (formData.location === "Wadi" && formData.numberOfTents < 2) {
          // This condition now triggers the modal and doesn't directly add an error.
          // The error handling for Wadi single tent is now managed by the modal confirmation.
          // setShowWadiModal(true);
        }

        // Add proper date validation for step 1
        if (formData.bookingDate) {
          const selectedDate = new Date(formData.bookingDate)
          const today = new Date()

          const selectedMidnight = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
          const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())

          const diffTime = selectedMidnight.getTime() - todayMidnight.getTime()
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

          if (diffDays < 2) step1Errors.push("bookingDate")
        }

        return step1Errors.length === 0

      case 2:
        // Validate Step 2: Personal Details & Add-Ons
        const step2Errors = []
        if (!formData.customerName.trim()) step2Errors.push("customerName")
        if (!formData.customerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail))
          step2Errors.push("customerEmail")
        if (!formData.customerPhone.startsWith("+971") || formData.customerPhone.length < 12)
          step2Errors.push("customerPhone")
        return step2Errors.length === 0

      case 3:
        // Step 3 has no required fields, always valid
        return true

      default:
        return true
    }
  }

  const handleStepChange = (newStep: number) => {
    // If moving forward, validate current step
    if (newStep > uiStep && !validateCurrentStep()) {
      // Trigger validation for all fields in current step
      if (uiStep === 1) {
        setTouched((prev) => ({
          ...prev,
          bookingDate: true,
          location: true,
          numberOfTents: true,
        }))
        validateField("bookingDate", formData.bookingDate)
        validateField("numberOfTents", formData.numberOfTents.toString())
      } else if (uiStep === 2) {
        setTouched((prev) => ({
          ...prev,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
        }))
        validateField("customerName", formData.customerName)
        validateField("customerEmail", formData.customerEmail)
        validateField("customerPhone", formData.customerPhone)
      }
      toast.error("Please complete all required fields before proceeding")
      return
    }

    setUiStep(newStep)
    setTimeout(() => {
      scrollToStepperTop()
    }, 100)
  }

  const campingImages = [
    {
      src: "/image1.png",
      alt: "Desert camping with tents under starry sky",
    },
    {
      src: "/image2.png",
      alt: "Desert landscape with sand dunes",
    },
    {
      src: "/image3.png",
      alt: "Wadi valley camping with water pools",
    },
    {
      src: "/image4.png",
      alt: "Mountain camping with rocky peaks",
    },
    {
      src: "/image5.png",
      alt: "Private event camping setup",
    },
  ]

  useEffect(() => {
    const loadSettings = async () => {
      if (isRefreshing.current) return

      try {
        setLoadingSettings(true)
        isRefreshing.current = true
        const settingsData = await fetchPricingSettings()
        setSettings(settingsData)
      } catch (error) {
        console.error("Failed to load settings:", error)
      } finally {
        setLoadingSettings(false)
        isRefreshing.current = false
      }
    }
    loadSettings()
  }, [])

  const refreshSettings = useCallback(async () => {
    if (!isUserInteracting.current && !isRefreshing.current) {
      try {
        isRefreshing.current = true
        const settingsData = await fetchPricingSettings()
        setSettings(settingsData)
      } catch (error) {
        console.error("Failed to refresh settings:", error)
      } finally {
        isRefreshing.current = false
      }
    } else {
      // console.log(
      //   "[v0] Skipping refresh - user is interacting or already refreshing"
      // );
    }
  }, [])

  useEffect(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    const scheduleRefresh = () => {
      refreshTimeoutRef.current = setTimeout(() => {
        refreshSettings()
        scheduleRefresh()
      }, 30000)
    }

    scheduleRefresh()

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [refreshSettings])

  const today = new Date()
  const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2)
  const minDateString = minDate.toISOString().split("T")[0]

  useEffect(() => {
    if (!settings) return

    const customAddOnsWithSelection = (settings.customAddOns || []).map((addon) => ({
      ...addon,
      selected: selectedCustomAddOns.includes(addon.id),
    }))

    let wadiSurcharge = 0
    if (formData.location === "Wadi" && formData.numberOfTents === 1) {
      wadiSurcharge = 500 // 500 AED surcharge for single tent at Wadi
    }
    setWadiSingleTentSurcharge(wadiSurcharge)

    const newPricing = calculatePrice(
      // Changed to calculatePrice
      formData.numberOfTents,
      formData.location,
      formData.addOns,
      customAddOnsWithSelection, // Pass selected custom add-ons
      settings,
      formData.bookingDate,
      formData.children, // Pass children count
    )
    setPricing(newPricing)
  }, [
    formData.numberOfTents,
    formData.location,
    formData.addOns,
    formData.hasChildren,
    formData.bookingDate,
    selectedCustomAddOns,
    settings,
    formData.children, // Added to dependency array
  ])

  const setUserInteracting = useCallback((interacting: boolean, duration = 5000) => {
    isUserInteracting.current = interacting

    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current)
    }

    if (interacting) {
      interactionTimeoutRef.current = setTimeout(() => {
        isUserInteracting.current = false
      }, duration)
    }
  }, [])

  const checkDateConstraints = async (dateString: string) => {
    setCheckingConstraints(true)
    try {
      const response = await fetch(`/api/date-constraints?date=${dateString}`)
      const data = await response.json()

      if (data.lockedLocation) {
        setDateConstraints({
          hasBookings: data.hasBookings || false,
          lockedLocation: data.lockedLocation,
          totalTents: data.totalTents,
          remainingCapacity: data.remainingCapacity || 0,
          availableLocations: [data.lockedLocation], // Only locked location
          bookedArrivalTimes: data.bookedArrivalTimes || [],
          maxBookingsReached: data.maxBookingsReached || false,
          blocked: data.blocked || false,
          blockedReason: data.blockedReason || null,
        })

        setFormData((prev) => ({
          ...prev,
          location: data.lockedLocation as "Desert" | "Mountain" | "Wadi",
        }))

        if (data.maxBookingsReached) {
          setLocationMessage("choose another Date this date filled")
        } else if (data.remainingCapacity <= 0) {
          setLocationMessage(`This date is fully booked (15 tents maximum per day)`) // Updated from 10 to 15
        } else if (data.remainingCapacity < 5) {
          setLocationMessage(
            `Limited availability (${data.remainingCapacity} tent${data.remainingCapacity === 1 ? "" : "s"} remaining)`,
          )
        } else if (data.blocked) {
          setLocationMessage(data.blockedReason || "This date is unavailable (blocked by admin).")
        }
      } else {
        setDateConstraints({
          hasBookings: false,
          lockedLocation: null,
          remainingCapacity: 15, // Updated from 10 to 15
          bookedArrivalTimes: [],
          maxBookingsReached: false,
          blocked: data.blocked || false,
          blockedReason: data.blockedReason || null,
        })
        setLocationMessage("")
      }
    } catch (error) {
      setDateConstraints({
        hasBookings: false,
        lockedLocation: null,
        remainingCapacity: 15, // Updated from 10 to 15
        bookedArrivalTimes: [],
        maxBookingsReached: false,
        blocked: false,
        blockedReason: null,
      })
      setLocationMessage("")
    } finally {
      setCheckingConstraints(false)
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    setUserInteracting(true)
    setSelectedDate(date)
    const dateString = date ? date.toISOString().split("T")[0] : ""
    setFormData((prev) => ({
      ...prev,
      bookingDate: dateString,
    }))
    setTouched((prev) => ({ ...prev, bookingDate: true }))

    if (date) {
      const newErrors = { ...errors }
      delete newErrors.bookingDate
      setErrors(newErrors)
      checkDateConstraints(dateString)
    } else {
      setDateConstraints({
        hasBookings: false,
        lockedLocation: null,
        remainingCapacity: 15, // Updated from 10 to 15
        bookedArrivalTimes: [],
        maxBookingsReached: false,
        blocked: false,
        blockedReason: null,
      })
    }
  }

  const handleTentChange = (increment: boolean) => {
    setUserInteracting(true, 3000)
    const newCount = increment ? formData.numberOfTents + 1 : formData.numberOfTents - 1

    const maxTentsPerBooking = 5
    const maxAllowed = Math.min(maxTentsPerBooking, dateConstraints.remainingCapacity || 15)

    if (increment && newCount > maxAllowed) {
      if (dateConstraints.remainingCapacity && dateConstraints.remainingCapacity < maxTentsPerBooking) {
        toast.error(
          `Only ${dateConstraints.remainingCapacity} tent${
            dateConstraints.remainingCapacity === 1 ? "" : "s"
          } are available for this specific date.`,
        )
      } else {
        toast.error(`Maximum ${maxTentsPerBooking} tents per booking`)
      }
      return
    }

    if (newCount >= 1 && (increment ? newCount <= maxAllowed : true)) {
      setFormData((prev) => {
        const newArrangements = Array.from({ length: newCount }, (_, i) => ({
          tentNumber: i + 1,
          arrangement: prev.sleepingArrangements[i]?.arrangement || ("all-singles" as const),
        }))

        return {
          ...prev,
          numberOfTents: newCount,
          sleepingArrangements: newArrangements,
        }
      })

      if (formData.location === "Wadi" && newCount === 1) {
        setShowWadiModal(true)
      } else {
        // Removed the error logic and show popup instead
        setShowWadiModal(false) // Ensure modal is closed if not needed
        const newErrors = { ...errors }
        delete newErrors.numberOfTents
        setErrors(newErrors)
      }
    }
  }

  const handleAdultsChange = (increment: boolean) => {
    setUserInteracting(true, 3000)
    const newCount = increment ? adults + 1 : adults - 1
    const totalPeople = newCount + children
    const requiredCapacity = formData.numberOfTents * 4

    if (increment && totalPeople > requiredCapacity) {
      toast.error(
        `You selected ${formData.numberOfTents} tent${
          formData.numberOfTents === 1 ? "" : "s"
        }, each tent accommodates 4 people including children.`,
      )
      return
    }

    if (newCount >= 1 && newCount <= 20) {
      setAdults(newCount)
      setFormData((prev) => ({ ...prev, adults: newCount }))
    }
  }

  const handleChildrenChange = (increment: boolean) => {
    setUserInteracting(true, 3000)
    const newCount = increment ? children + 1 : children - 1
    const totalPeople = adults + newCount
    const requiredCapacity = formData.numberOfTents * 4

    if (increment && totalPeople > requiredCapacity) {
      toast.error(
        `You selected ${formData.numberOfTents} tent${
          formData.numberOfTents === 1 ? "" : "s"
        }, each tent accommodates 4 people including children.`,
      )
      return
    }

    if (newCount >= 0 && newCount <= 10) {
      setChildren(newCount)
      setFormData((prev) => ({
        ...prev,
        children: newCount,
        hasChildren: newCount > 0,
        addOns: {
          ...prev.addOns,
          portableToilet: newCount > 0 ? true : prev.addOns.portableToilet,
        },
      }))
    }
  }

  const handleSleepingArrangementChange = (
    tentNumber: number,
    arrangement: "all-singles" | "two-doubles" | "mix" | "double-bed" | "custom",
  ) => {
    setFormData((prev) => ({
      ...prev,
      sleepingArrangements: prev.sleepingArrangements.map((arr) =>
        arr.tentNumber === tentNumber
          ? {
              ...arr,
              arrangement,
              ...(arrangement !== "custom" && { customArrangement: undefined }),
            }
          : arr,
      ),
    }))
  }

  const handleCustomArrangementChange = (tentNumber: number, customText: string) => {
    setFormData((prev) => ({
      ...prev,
      sleepingArrangements: prev.sleepingArrangements.map((arr) =>
        arr.tentNumber === tentNumber
          ? {
              ...arr,
              customArrangement: customText,
            }
          : arr,
      ),
    }))
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setTouched((prev) => ({ ...prev, [field]: true }))

    const fetchDateConstraints = async (dateString: string) => {
      try {
        const response = await fetch(`/api/date-constraints?date=${dateString}`)
        const data = await response.json()
        setDateConstraints(data)
      } catch (error) {
        console.error("Error fetching date constraints:", error)
      }
    }

    if (field === "bookingDate" && value) {
      const selectedDate = new Date(value)
      setSelectedDate(selectedDate)
      fetchDateConstraints(value)
    }

    if (typeof value === "string") {
      validateField(field, value)
    }
  }

  const handleAddOnChange = (addOn: keyof typeof formData.addOns, checked: boolean) => {
    setUserInteracting(true)
    setFormData((prev) => ({
      ...prev,
      addOns: { ...prev.addOns, [addOn]: checked },
    }))
  }

  const handleCustomAddOnChange = (addOnId: string, checked: boolean) => {
    setUserInteracting(true)
    setSelectedCustomAddOns((prev) => (checked ? [...prev, addOnId] : prev.filter((id) => id !== addOnId)))
  }

  const validateField = (field: string, value: any) => {
    const newErrors = { ...errors }

    switch (field) {
      case "customerName":
        if (!value.trim()) {
          newErrors.customerName = "Name is required"
        } else {
          delete newErrors.customerName
        }
        break
      case "customerEmail":
        if (!value.trim()) {
          newErrors.customerEmail = "Email is required"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.customerEmail = "Please enter a valid email address"
        } else {
          delete newErrors.customerEmail
        }
        break
      case "customerPhone":
        if (!value.startsWith("+971") || value.length < 12) {
          newErrors.customerPhone = "Valid UAE phone number required (+971501234567)"
        } else {
          delete newErrors.customerPhone
        }
        break
      case "bookingDate":
        if (!value) {
          newErrors.bookingDate = "Booking date is required"
        } else {
          // Simple date comparison without timezone issues
          const selectedDate = new Date(value)
          const today = new Date()

          // Reset both dates to midnight for accurate comparison
          const selectedMidnight = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
          const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())

          // Calculate difference in milliseconds and convert to days
          const diffMs = selectedMidnight.getTime() - todayMidnight.getTime()
          const diffDays = diffMs / (1000 * 60 * 60 * 24)

          if (diffDays < 2) {
            newErrors.bookingDate = `Booking must be at least 2 days in advance`
            if (touched.bookingDate) {
              // toast.error(`Please select a date at least 2 days from today.`);
            }
          } else {
            delete newErrors.bookingDate
          }
        }
        break
      case "numberOfTents":
        // No validation needed for numberOfTents
        delete newErrors.numberOfTents
        break
      case "arrivalTime":
        if (!value) {
          newErrors.arrivalTime = "Arrival time is required"
        } else if (dateConstraints.bookedArrivalTimes?.includes(value)) {
          newErrors.arrivalTime = "This time slot is already booked for this date."
        } else {
          delete newErrors.arrivalTime
        }
        break
    }

    setErrors(newErrors)
  }

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    validateField(field, value)
    setUserInteracting(true, 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Name is required"
    }

    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      newErrors.customerEmail = "Please enter a valid email address"
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = "Phone number is required"
    } else if (!formData.customerPhone.startsWith("+971")) {
      newErrors.customerPhone = "Phone number must start with +971"
    }

    if (!formData.bookingDate) {
      newErrors.bookingDate = "Booking date is required"
    } else {
      const selectedDate = new Date(formData.bookingDate)
      const today = new Date()

      const selectedMidnight = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())

      const diffTime = selectedMidnight.getTime() - todayMidnight.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays < 2) {
        newErrors.bookingDate = `Booking must be at least 2 days in advance`
      }
    }

    if (formData.numberOfTents > 5) {
      newErrors.numberOfTents = "For larger bookings or special requests, please enquire directly with our team."
    }

    if (!formData.arrivalTime) {
      newErrors.arrivalTime = "Arrival time is required"
    } else if (dateConstraints.bookedArrivalTimes?.includes(formData.arrivalTime)) {
      newErrors.arrivalTime = "This time slot is already booked for this date. Please choose another."
    }

    if (dateConstraints.maxBookingsReached) {
      newErrors.bookingDate = "choose another Date this date filled"
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0]
      toast.error(firstError)

      // Find first error field and scroll to it
      const firstErrorField = Object.keys(newErrors)[0]
      if (firstErrorField) {
        const element =
          document.querySelector(`[name="${firstErrorField}"]`) || document.querySelector(`#${firstErrorField}`)
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }
      return
    }

    if (formData.numberOfTents > 5) {
      toast.info("For larger bookings or special requests, please enquire directly with our team.")
      return
    }

    if (formData.location === "Wadi" && formData.numberOfTents === 1 && !wadiModalConfirmed) {
      setPendingSubmit(true)
      setShowWadiModal(true)
      return
    }

    setIsLoading(true)

    // Show loading toast
    const loadingToast = toast.loading("Processing your booking request... Please wait while we confirm the details.")

    try {
      const bookingData = {
        ...formData,
        selectedCustomAddOns,
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create booking")
      }

      const { bookingId } = await response.json()

      const checkoutResponse = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          ...formData,
          selectedCustomAddOns,
          pricing,
        }),
      })

      if (!checkoutResponse.ok) {
        throw new Error("Failed to create checkout session")
      }

      const { url } = await checkoutResponse.json()

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast)
      toast.success("Redirecting to payment...")

      // Add a small delay to show the success message
      setTimeout(() => {
        window.location.href = url
      }, 1500)
    } catch (error) {
      // Dismiss loading toast and show error
      toast.dismiss(loadingToast)
      const errorMessage = error instanceof Error ? error.message : "Booking failed. Please try again."
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
      setPendingSubmit(false)
      setWadiModalConfirmed(false) // Reset modal confirmation state
    }
  }

  const handleManualRefresh = async () => {
    isUserInteracting.current = false
    await refreshSettings()
  }

  useEffect(() => {
    return () => {
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current)
      }
    }
  }, [])

  if (loadingSettings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FBF9D9] via-[#E6CFA9] to-[#D3B88C] flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-[#3C2317] mx-auto mb-6" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-[#3C2317]/20 rounded-full animate-pulse mx-auto"></div>
          </div>
          <p className="text-[#3C2317] text-lg font-medium">Loading your premium camping experience...</p>
        </div>
      </div>
    )
  }

  const handleLocationChange = (location: string) => {
    setFormData((prev) => ({ ...prev, location }))
    setTouched((prev) => ({ ...prev, location: true }))

    // Clear any existing Wadi-related errors when location changes
    setErrors((prev) => {
      const newErrors = { ...prev }
      if (prev.numberOfTents === "Wadi location requires at least 2 tents") {
        delete newErrors.numberOfTents
      }
      return newErrors
    })

    // No validation needed - users can now book 1 tent at Wadi with surcharge
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FBF9D9] via-[#E6CFA9] to-[#D3B88C]">
      <WadiSingleTentModal
        isOpen={showWadiModal}
        onConfirm={() => {
          setWadiModalConfirmed(true)
          setShowWadiModal(false)
          // Manually trigger handleSubmit again after confirmation
          if (pendingSubmit) {
            handleSubmit(new Event("submit") as any)
          }
        }}
        onCancel={() => {
          setShowWadiModal(false)
          setPendingSubmit(false)
        }}
        // This is a placeholder value; you might want to fetch this dynamically or define it elsewhere.
        extraCharge={500}
      />
      <nav className="bg-[#3C2317]/90 backdrop-blur-md border-b border-[#3C2317]/50 shadow-lg sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="NOMADIC"
                  width={120}
                  height={40}
                  className="h-8 md:h-10 w-auto group-hover:scale-105 transition-all duration-300"
                />
              </div>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 lg:px-10 py-6">
        <div className={cn("mb-8 animate-fade-in-up", showBookingFlow && "hidden")}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <div className="lg:col-span-3">
              <div className="relative w-full h-[300px] md:h-[420px] rounded-xl overflow-hidden shadow-xl group">
                <Image
                  src={
                    campingImages[currentImageIndex].src ||
                    "/placeholder.svg?height=420&width=1000&query=luxury desert camping" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg"
                  }
                  alt={campingImages[currentImageIndex].alt}
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  priority={currentImageIndex === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#3C2317]/40 via-transparent to-transparent"></div>
              </div>
            </div>
            <div className="grid grid-cols-4 lg:grid-cols-1 gap-2">
              {campingImages.slice(1, 5).map((image, index) => (
                <div
                  key={index}
                  className="relative h-[70px] lg:h-[95px] rounded-lg overflow-hidden shadow-md cursor-pointer group transition-all duration-300 hover:shadow-xl hover:scale-105"
                  onClick={() => setCurrentImageIndex(index + 1)}
                >
                  <Image
                    src={
                      image.src ||
                      "/placeholder.svg?height=130&width=200&query=camping scene" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg"
                    }
                    alt={image.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-[#3C2317]/20 group-hover:bg-[#3C2317]/10 transition-colors duration-300"></div>
                  {currentImageIndex === index + 1 && (
                    <div className="absolute inset-0 border-2 border-[#D3B88C] rounded-lg"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {/* LEFT: Main description and CTA */}
            <div className="lg:col-span-2 space-y-6">
              <div className="text-left">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#3C2317] mb-3 flex items-center gap-2">
                  Nomadic Camping Rental Setups ⛺
                </h1>
                <p className="text-[#3C2317]/80 text-sm mb-4">The UAE's ultimate camping experience</p>
                <div className="flex items-center space-x-1 text-[#3C2317]/80">
                  <MapPin className="w-4 h-4 text-[#D3B88C]" />
                  <span className="text-sm font-medium">Dubai, Sharjah, Fujairah</span>
                </div>
                <p className="text-sm text-[#3C2317]/80 max-w-3xl text-pretty leading-relaxed mb-4" id="tour1-step1">
                  Nomadic was created to make camping magical, stress-free, and unforgettable. Forget about buying
                  expensive gear, figuring out how to pitch a tent, or packing endless supplies. With Nomadic, your
                  private campsite is fully set up before you arrive - all you need to bring is your food, drinks, and
                  sense of adventure.
                </p>
                <p className="hidden sm:block text-sm text-[#3C2317]/80 max-w-3xl text-pretty leading-relaxed">
                  Experience the UAE's most luxurious camping adventure with Nomadic. We handle all the setup, so you
                  can focus on making memories. Our premium tents are equipped with everything you need for a
                  comfortable and unforgettable stay under the stars.
                </p>
                {/* Mobile accordion for full details */}
                <div className="block sm:hidden">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="details">
                      <AccordionTrigger className="text-[#3C2317] text-base">Read full details</AccordionTrigger>
                      <AccordionContent className="text-[#3C2317]/80 text-sm leading-relaxed bg-[#E6CFA9]/30 rounded-md p-3">
                        Experience the UAE's most luxurious camping adventure with Nomadic. We handle all the setup, so
                        you can focus on making memories. Our premium tents are equipped with everything you need for a
                        comfortable and unforgettable stay under the stars.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
              {/* Updated CTA Box */}
              <section className="bg-gradient-to-r from-[#E6CFA9] to-[#D3B88C] rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-[#3C2317]/10 w-fit">
                <div className="flex flex-col lg:flex-column items-center lg:items-start justify-between gap-4 sm:gap-6 text-center lg:text-left">
                  {/* Text Content */}
                  <div className="max-w-lg">
                    <h2 className="text-[#3C2317] text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 text-balance">
                      Ready to book your camping setup?
                    </h2>
                    <p className="text-[#3C2317]/80 text-sm sm:text-base leading-relaxed">
                      Book your Nomadic setup now and experience the UAE's wild beauty, without lifting a finger.
                    </p>
                  </div>

                  {/* Button */}
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-[#3C2317] text-[#FBF9D9] hover:bg-[#3C2317] font-bold text-sm sm:text-base px-6 sm:px-10 py-3 sm:py-4 rounded-xl shadow-lg  transition-all duration-300 transform hover:scale-105 cursor-pointer"
                    onClick={() => {
                      setShowBookingFlow(true)
                      setTimeout(() => {
                        stepperSectionRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        })
                      }, 100)
                    }}
                  >
                    Book Your Setup Now
                  </Button>
                </div>
              </section>

              <div className="space-y-8">
                {/* Itinerary */}
                <section className="pl-3 border-l-3 border-[#D3B88C]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full ring-1 ring-[#D3B88C] text-[#3C2317]">
                      <Calendar className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="text-[#3C2317] text-base font-extrabold tracking-widest uppercase">Itinerary</h3>
                  </div>

                  <ol className="space-y-6">
                    {" "}
                    {/* increased spacing for clarity */}
                    {[
                      "Arrival at meeting point (16:30, 17:00 or 17:30 see confirmation email upon booking).",
                      "Meet your camp leader. Park and transfer, or drive your own 4x4.",
                      "Camp walkthrough & safety briefing.",
                      "Enjoy your Nomadic setup at your leisure, BBQ, campfire, stargazing.",
                      "Relaxed checkout anytime up to 12:00.",
                      "Agree pickup time with the camp leader in advance, or message at least 90 minutes before leaving.",
                      "Take all trash with you to keep nature pristine #LeaveNoTrace",
                    ].map((step, idx, arr) => (
                      <li key={idx} className="relative flex gap-4 text-xs text-[#3C2317]/90 leading-relaxed">
                        {/* Number circle */}
                        <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#3C2317] text-[#FBF9D9] text-xs font-bold ring-1 ring-[#D3B88C]">
                          {idx + 1}
                        </span>

                        {/* Vertical line (only if not last item) */}
                        {idx < arr.length - 1 && (
                          <span
                            aria-hidden
                            className="absolute left-[13px] top-7 bottom-[-22px] w-px bg-[#3C2317]/30"
                          />
                        )}

                        {/* Step text */}
                        <span className="flex-1 min-w-0 pt-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                </section>

                {/* Know Before You Go */}
                <section className="pl-3 border-l-3 border-[#D3B88C]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full ring-1 ring-[#D3B88C] text-[#3C2317]">
                      <Compass className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="text-[#3C2317] text-base font-extrabold tracking-widest uppercase">
                      Know Before You Go
                    </h3>
                  </div>
                  <ul className="space-y-3 text-xs text-[#3C2317]/90 leading-relaxed">
                    {[
                      {
                        title: "Getting there",
                        content:
                          "Camping Setups are in quiet, natural spots that may be tricky for saloon cars but all cars can reach the meeting points.",
                      },
                      {
                        title: "Don't have a 4x4?",
                        content:
                          "Park at the meeting point - our team will transfer you and your belongings to your camp.",
                      },
                      {
                        title: "Driving a 4x4?",
                        content: "You can head straight to your setup and follow our camp leader.",
                      },
                      {
                        title: "Meeting point",
                        content:
                          "You'll receive a Google Maps pin by email once booked. Meet your camp leader there, then follow them to your setup or transfer with them.",
                      },
                      {
                        title: "Clothing",
                        content:
                          "Evenings can get chilly, especially Dec–Jan. Bring warm jumpers to enjoy the night sky by the fire.",
                      },
                      {
                        title: "Pets",
                        content:
                          "Pets are welcome as long as you provide their bedding and they don't damage equipment.",
                      },
                      {
                        title: "Environment",
                        content:
                          "Help us preserve these incredible landscapes. Please take all the trash with you. Bin bags are provided. #LeaveNoTrace",
                      },
                      {
                        title: "What to bring",
                        content:
                          "Food & drinks, Charcoal & firewood (or book as add-ons), Power bank (generators available on request: 250 AED + VAT)",
                      },
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full ring-1 ring-[#D3B88C] text-[#3C2317] flex-shrink-0">
                          <Check className="w-3 h-3" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <strong className="text-[#3C2317]">{item.title}:</strong> {item.content}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Cancellation Policy */}
                <section className="pl-3 border-l-3 border-[#D3B88C]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full ring-1 ring-[#D3B88C] text-[#3C2317]">
                      <Shield className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="text-[#3C2317] text-base font-extrabold tracking-widest uppercase">
                      Cancellation Policy
                    </h3>
                  </div>
                  <ul className="space-y-3 text-xs text-[#3C2317]/90 leading-relaxed">
                    {[
                      "All bookings are non-refundable.",
                      "Free date changes up to 72 hours before arrival (subject to availability).",
                      "Changes within 72 hours of your booking are subject to availability and incur additional fees.",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full ring-1 ring-[#D3B88C] text-[#3C2317] flex-shrink-0">
                          <X className="w-3 h-3" />
                        </span>
                        <span className="flex-1 min-w-0">{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
            {/* RIGHT: Book Your Setup Now + Highlights + Included/Not Included */}
            <aside className="space-y-6 sm:space-y-4 lg:space-y-4 lg:sticky lg:top-24 h-max">
              <Card className="border-[#D3B88C]/40 shadow-md bg-gradient-to-br from-[#FBF9D9] to-[#E6CFA9] rounded-lg lg:rounded-xl overflow-hidden !pt-0 !gap-0">
                <CardHeader className="bg-gradient-to-r from-[#D3B88C]/20 to-[#E6CFA9]/20 px-2 sm:px-3 lg:px-4 h-9 sm:h-11 py-2 sm:py-3 border-b border-[#D3B88C]/30">
                  <CardTitle className="text-[#3C2317] flex items-center text-sm sm:text-sm lg:text-base font-bold tracking-wide">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 text-[#3C2317]" />
                    Highlights
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-3 lg:px-4 py-3 sm:py-3 lg:py-3 ">
                  <ul className="divide-y divide-[#3C2317]/15 text-xs text-[#3C2317]">
                    {[
                      "Private Camping Setups in the Desert or Wadi",
                      "Complete Camping Rental Setup done for you",
                      "Nomadic Glamping Tents with all camping equipment",
                      "Each tent setup can sleep up to 4 pax",
                      "Exact Meeting Point Location shared upon booking",
                      "The perfect camping experience under the stars",
                    ].map((item, i) => (
                      <li key={i} className="py-1 sm:py-1.5 flex items-start">
                        <span className="mr-1.5 text-[#3C2317]/80 flex-shrink-0 mt-0.5">✓</span>
                        <span className="flex-1 min-w-0">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* What's Included and Not Included stacked */}
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {/* What's Included */}
                <Card className="border-[#D3B88C]/40 shadow-md bg-gradient-to-br from-[#FBF9D9] to-[#E6CFA9] rounded-lg lg:rounded-xl overflow-hidden !pt-0 !gap-0">
                  <CardHeader className="bg-gradient-to-r from-[#D3B88C]/20 to-[#E6CFA9]/20 px-2 sm:px-3 lg:px-4 h-9 sm:h-11 py-2 sm:py-3 border-b border-[#D3B88C]/30">
                    <CardTitle className="text-[#3C2317] flex items-center text-sm sm:text-sm lg:text-base font-bold tracking-wide">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 text-[#3C2317]" />
                      What's Included
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-3 lg:px-4 py-3 sm:py-3 lg:py-3">
                    <ul className="divide-y divide-[#3C2317]/15 text-xs text-[#3C2317]">
                      {[
                        "Canvas Nomadic Tent (sleeps up to 4 people, singles & doubles available)",
                        "Beds with all bedding, pillows, and blankets",
                        "Tent & outdoor lighting",
                        "Fire lanterns (with fuel)",
                        "Foldable chairs & picnic blanket",
                        "Raised BBQ & raised fire pit (with firelighters + lighter)",
                        "Gas stove with fuel, pots, frying pan & cooking utensils",
                        "Plates, cutlery & picnic basket",
                        "Cooler box & raised table",
                      ].map((item, i) => (
                        <li key={i} className="py-1 sm:py-1.5 flex items-start">
                          <span className="mr-1.5 text-[#3C2317]/80 flex-shrink-0 mt-0.5">✓</span>
                          <span className="flex-1 min-w-0">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Not Included */}
                <Card className="border-[#D3B88C]/40 shadow-md bg-gradient-to-br from-[#FBF9D9] to-[#E6CFA9] rounded-lg lg:rounded-xl overflow-hidden !pt-0 !gap-0">
                  <CardHeader className="bg-gradient-to-r from-[#D3B88C]/20 to-[#E6CFA9]/20 px-2 sm:px-3 lg:px-4 h-9 sm:h-11 py-2 sm:py-3 border-b border-[#D3B88C]/30">
                    <CardTitle className="text-[#3C2317] flex items-center text-sm sm:text-sm lg:text-base font-bold tracking-wide">
                      <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 text-[#3C2317]" />
                      Not Included
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-3 lg:px-4 py-3 sm:py-3 lg:py-3">
                    <ul className="divide-y divide-[#3C2317]/15 text-xs text-[#3C2317]">
                      {[
                        "Food & beverages",
                        "Transportation to the meeting point",
                        "Charcoal & firewood (available as add-ons)",
                        "Portable toilet setup (available as add-on)",
                      ].map((item, i) => (
                        <li key={i} className="py-1 sm:py-1.5 flex items-start">
                          <span className="mr-1.5 text-[#3C2317]/80 flex-shrink-0 mt-0.5">✗</span>
                          <span className="flex-1 min-w-0">{item}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-[#E6CFA9]/60 rounded-md sm:rounded-lg border border-[#D3B88C]/30">
                      <p className="text-xs text-[#3C2317] leading-relaxed">
                        💡 Pro Tip: Bring your food, drinks, and a power bank. Add charcoal & firewood to your booking
                        (or bring your own) - everything else is already waiting for you.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-[#D3B88C]/40 bg-gradient-to-br from-[#FBF9D9] via-[#F5EBD0] to-[#E6CFA9] rounded-2xl shadow-lg sm:p-8 p-5 text-center">
                  <CardContent className="flex flex-col items-center space-y-3">
                    {/* Heading */}
                    <h3 className="text-[#3C2317] font-bold text-2xl">Got a Question?</h3>
                    <p className="text-[#3C2317]/80 text-sm leading-relaxed max-w-xs mx-auto">
                      Whether it’s a quick question or a booking request, we’re just a WhatsApp message away.
                    </p>

                    {/* Single WhatsApp Button */}
                    <Button
                      onClick={() =>
                        window.open(
                          "https://wa.me/971585271420?text=Hi%21%20I%20have%20a%20question%20about%20the%20Nomadic%20camping%20setup.",
                          "_blank",
                        )
                      }
                      className="bg-[#25D366] hover:bg-[#25D366] text-white !px-8 !py-4 rounded-full flex items-center justify-center gap-2 text-sm font-medium shadow-md hover:shadow-lg transition cursor-pointer"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 32 32"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path d="M16 0C7.2 0 0 7.2 0 16c0 2.8.7 5.5 2.1 7.9L0 32l8.3-2.2c2.3 1.3 4.9 2 7.7 2 8.8 0 16-7.2 16-16S24.8 0 16 0zm0 29c-2.5 0-4.9-.7-7-2l-.5-.3-4.9 1.3 1.3-4.8-.3-.5C3.4 21.6 3 18.8 3 16 3 8.8 8.8 3 16 3s13 5.8 13 13-5.8 13-13 13zm7.4-9.4c-.4-.2-2.3-1.1-2.6-1.2-.4-.2-.6-.2-.9.2-.3.4-1 1.2-1.2 1.4-.2.2-.4.3-.8.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.9-2.2-2.1-2.6-.2-.4 0-.6.2-.8.2-.2.4-.4.6-.6.2-.2.3-.4.5-.6.2-.2.2-.4.1-.7s-.9-2.1-1.3-2.9c-.3-.7-.6-.6-.9-.6h-.8c-.3 0-.7.1-1.1.5-.4.4-1.5 1.4-1.5 3.4s1.6 3.9 1.8 4.2c.2.3 3.1 4.7 7.7 6.6 1.1.5 2 .8 2.7 1 .6.2 1.1.2 1.6.1.5-.1 1.6-.6 1.8-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.7-.4z" />
                      </svg>
                      Enquire Now
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </aside>
          </div>
        </div>

        <div
          ref={stepperSectionRef}
          className={cn("grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6", !showBookingFlow && "hidden")}
        >
          <div className="xl:col-span-2 space-y-3 sm:space-4 lg:space-y-6">
            {/* add an invisible anchor above the Stepper for smooth scrolling */}
            <span id="booking-stepper" className="block h-0" aria-hidden />
            <Stepper
              active={uiStep}
              steps={[
                { label: "Step 1: Select Date/Location" },
                { label: "Step 2: Add Info/addOns" },
                { label: "Step 3: Payment" },
              ]}
              onChange={handleStepChange}
            />

            {/* show only Step 1 card when uiStep === 1 and add Next button */}
            {uiStep === 1 && (
              <>
                <Card
                  className="border-[#D3B88C]/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-[#FBF9D9]/80 backdrop-blur-sm !pt-0"
                  id="tour2-step1"
                >
                  <CardHeader className="bg-gradient-to-r from-[#D3B88C]/20 to-[#E6CFA9]/20 border-b border-[#D3B88C]/50 h-10 sm:h-12 py-2 sm:py-3 px-3 sm:px-6">
                    <CardTitle className="text-[#3C2317] flex items-center space-x-2 text-sm sm:text-base lg:text-lg">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#3C2317]" />
                      <span>Choose your perfect date</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 lg:p-6 !pt-0">
                    <div className="mb-2 sm:mb-3">
                      <Label htmlFor="bookingDate" className="text-[#3C2317] font-medium mb-2 block text-xs sm:text-sm">
                        Select Date *
                      </Label>
                    </div>

                    <Input
                      id="bookingDate"
                      type="date"
                      value={formData.bookingDate}
                      onChange={(e) => {
                        handleInputChange("bookingDate", e.target.value)
                        if (e.target.value) {
                          setSelectedDate(new Date(e.target.value))
                          validateField("bookingDate", e.target.value)
                        }
                      }}
                      onBlur={(e) => handleBlur("bookingDate", e.target.value)}
                      min={minDateString} // This should prevent selecting invalid dates
                      className={cn(
                        "border-2 border-[#D3B88C] focus:border-[#3C2317] focus:ring-2 focus:ring-[#3C2317]/20 transition-all duration-300 h-9 sm:h-10 lg:h-12 rounded-lg sm:rounded-xl cursor-pointer text-xs sm:text-sm",
                        errors.bookingDate && touched.bookingDate && "border-red-500 focus:border-red-500",
                      )}
                    />
                    {errors.bookingDate && touched.bookingDate && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs sm:text-sm text-red-700 flex items-center space-x-2">
                          <X className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span>{errors.bookingDate}</span>
                        </p>
                      </div>
                    )}

                    <div className="mt-2">
                      <p className="text-xs text-blue-700 flex items-center space-x-2">
                        <Shield className="w-3 h-3 flex-shrink-0 text-blue-600" />
                        <span>Minimum 2 days advance booking required for premium preparation</span>
                      </p>
                    </div>

                    {/* START CHANGE */}
                    {formData.bookingDate && dateConstraints?.blocked && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs sm:text-sm text-red-700">
                          {dateConstraints.blockedReason ||
                            "This date is unavailable (blocked by admin). Please choose another date."}
                        </p>
                      </div>
                    )}

                    {formData.bookingDate &&
                      !dateConstraints?.blocked &&
                      dateConstraints.remainingCapacity !== undefined && (
                        <div className="mt-2">
                          {dateConstraints.remainingCapacity > 0 ? (
                            <div className="flex items-center space-x-2 text-xs sm:text-sm">
                              <span className="text-green-700">Available</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 text-xs sm:text-sm">
                              <span className="text-red-700">Fully booked</span>
                            </div>
                          )}
                        </div>
                      )}
                    {/* END CHANGE */}
                  </CardContent>
                </Card>

                <Card
                  className="border-[#D3B88C]/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-[#FBF9D9]/80 backdrop-blur-sm !pt-0"
                  id="tour2-step2"
                >
                  <CardHeader className="bg-gradient-to-r from-[#D3B88C]/20 to-[#E6CFA9]/20 border-b border-[#D3B88C]/50 h-10 sm:h-12 py-2 sm:py-3 px-3 sm:px-6">
                    <CardTitle className="text-[#3C2317] text-sm sm:text-base lg:text-lg">Location & Setup</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 lg:p-6 space-y-3 !pt-0">
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-[#3C2317] font-semibold text-xs sm:text-sm">
                        Location *
                      </Label>
                      {locationMessage && (
                        <div className="p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-amber-800 text-xs sm:text-sm">{locationMessage}</p>
                        </div>
                      )}

                      <Select
                        value={formData.location}
                        onValueChange={(value: "Desert" | "Mountain" | "Wadi") => {
                          if (dateConstraints.lockedLocation && value !== dateConstraints.lockedLocation) {
                            setLocationMessage(
                              `This date is reserved for ${dateConstraints.lockedLocation} location only. Please select a different date to book ${value}.`,
                            )
                            return
                          }

                          handleInputChange("location", value)
                          validateField("numberOfTents", formData.numberOfTents.toString())
                          setLocationMessage("")
                        }}
                        disabled={checkingConstraints}
                      >
                        <SelectTrigger className="border-2 border-[#D3B88C] focus:border-[#3C2317] focus:ring-2 focus:ring-[#3C2317]/20 transition-all duration-300 h-9 sm:h-10 lg:h-12 rounded-lg sm:rounded-xl text-xs sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {settings?.locations?.map((location: any) => (
                            <SelectItem
                              key={location.id}
                              value={location.name}
                              disabled={
                                dateConstraints.lockedLocation && dateConstraints.lockedLocation !== location.name
                              }
                            >
                              {location.name}
                              {/* {location.name === "Wadi" && (
                                <span className="text-xs text-amber-600 ml-2">
                                  (AED {location.weekdayPrice} - {location.weekendPrice})
                                </span>
                              )}
                              {location.name === "Desert" && (
                                <span className="text-xs text-gray-600 ml-2">
                                  (AED {location.weekdayPrice} - {location.weekendPrice})
                                </span>
                              )} */}
                              {dateConstraints.lockedLocation && dateConstraints.lockedLocation !== location.name && (
                                <span className="text-xs text-gray-500 ml-2">(Not available for this date)</span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {formData.location === "Wadi" && (
                        <div className="space-y-2">
                          {dateConstraints.remainingCapacity < 1 && (
                            <div className="p-2 sm:p-3 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                                <span className="text-xs sm:text-sm font-medium text-red-800">
                                  No tents available for Wadi on this date. Please choose another date.
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Location & Setup info bullets */}
                      <div className="mt-3 p-3 bg-[#E6CFA9]/40 border border-[#D3B88C]/40 rounded-lg">
                        <ul className="list-disc pl-4 text-[#3C2317] text-xs sm:text-sm space-y-1">
                          <li>Desert Setups: 40 minutes from Dubai</li>
                          <li>Wadi Setups: Sharjah & Fujairah (approx. 1 hr 25 mins from Dubai)</li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="arrivalTime" className="text-[#3C2317] font-semibold text-xs sm:text-sm">
                        Arrival Time *
                      </Label>

                      <Select
                        value={formData.arrivalTime}
                        onValueChange={(value: "4:30 PM" | "5:00 PM" | "5:30 PM" | "6:00 PM") => {
                          handleInputChange("arrivalTime", value)
                        }}
                        disabled={checkingConstraints}
                      >
                        <SelectTrigger className="border-2 border-[#D3B88C] focus:border-[#3C2317] focus:ring-2 focus:ring-[#3C2317]/20 transition-all duration-300 h-9 sm:h-10 lg:h-12 rounded-lg sm:rounded-xl text-xs sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM"].map((time) => (
                            <SelectItem
                              key={time}
                              value={time}
                              disabled={dateConstraints.bookedArrivalTimes?.includes(time) || false}
                            >
                              {time}
                              {dateConstraints.bookedArrivalTimes?.includes(time) && (
                                <span className="text-xs text-red-500 ml-2">(Already booked)</span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {dateConstraints.maxBookingsReached && (
                        <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-800 text-xs sm:text-sm">
                            Maximum 3 bookings per day reached. Please select a different date.
                          </p>
                        </div>
                      )}

                      <div className="mt-2 p-2 bg-[#E6CFA9]/40 border border-[#D3B88C]/40 rounded-lg">
                        <p className="text-[#3C2317] text-xs">
                          <strong>Note:</strong> Arrival times are staggered by 30 minutes.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="border-[#D3B88C]/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-[#FBF9D9]/80 backdrop-blur-sm !pt-0"
                  id="tour2-step3"
                >
                  <CardHeader className="bg-gradient-to-r from-[#D3B88C]/20 to-[#E6CFA9]/20 border-b border-[#D3B88C]/50 h-10 sm:h-12 py-2 sm:py-3 px-3 sm:px-6">
                    <CardTitle className="text-[#3C2317] flex items-center space-x-2 text-sm sm:text-base lg:text-lg">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#3C2317]" />
                      <span>Booking Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 !pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3">
                      {/* Number of Tents */}
                      <div>
                        <Label className="text-[#3C2317] mb-2 block font-medium text-xs sm:text-sm">
                          Number of Tents *
                        </Label>
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleTentChange(false)}
                            disabled={formData.numberOfTents <= 1}
                            className="border-2 border-[#D3B88C] hover:border-[#3C2317] cursor-pointer hover:bg-[#D3B88C] transition-all duration-300 h-7 w-7 sm:h-8 sm:w-8 rounded-lg p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <div className="text-center min-w-[40px] sm:min-w-[50px]">
                            <div className="text-base sm:text-lg font-bold text-[#3C2317]">
                              {formData.numberOfTents}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleTentChange(true)}
                            disabled={formData.numberOfTents >= 5}
                            className="border-2 border-[#D3B88C] hover:border-[#3C2317] hover:bg-[#D3B88C] cursor-pointer transition-all duration-300 h-7 w-7 sm:h-8 sm:w-8 rounded-lg p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        {/* Remove the error message display for Wadi minimum tents */}
                      </div>

                      {/* Adults */}
                      <div>
                        <Label className="text-[#3C2317] mb-2 block font-medium text-xs sm:text-sm">Adults *</Label>
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAdultsChange(false)}
                            disabled={adults <= 1}
                            className="border-2 border-[#D3B88C] hover:border-[#3C2317] cursor-pointer transition-all duration-300 h-7 w-7 sm:h-8 sm:w-8 rounded-lg hover:bg-[#D3B88C] p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <div className="text-center min-w-[40px] sm:min-w-[50px]">
                            <div className="text-base sm:text-lg font-bold text-[#3C2317]">{adults}</div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAdultsChange(true)}
                            disabled={adults >= 20 || adults + children >= formData.numberOfTents * 4}
                            className="border-2 border-[#D3B88C] hover:border-[#3C2317] cursor-pointer hover:bg-[#D3B88C] transition-all duration-300 h-7 w-7 sm:h-8 sm:w-8 rounded-lg p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Children */}
                      <div>
                        <Label className="text-[#3C2317] mb-2 block font-medium text-xs sm:text-sm">
                          Children <span className="text-xs text-[#3C2317]/70">(under 12)</span>
                        </Label>
                        <div className="flex items-start justify-center space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleChildrenChange(false)}
                            disabled={children <= 0}
                            className="border-2 border-[#D3B88C] hover:border-[#3C2317] cursor-pointer transition-all duration-300 h-7 w-7 sm:h-8 sm:w-8 rounded-lg hover:bg-[#D3B88C] p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <div className="text-center min-w-[40px] sm:min-w-[50px]">
                            <div className="text-base sm:text-lg font-bold text-[#3C2317]">{children}</div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleChildrenChange(true)}
                            disabled={children >= 10 || adults + children >= formData.numberOfTents * 4}
                            className="border-2 border-[#D3B88C] hover:border-[#3C2317] cursor-pointer hover:bg-[#D3B88C] transition-all duration-300 h-7 w-7 sm:h-8 sm:w-8 rounded-lg p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        {children > 0 && (
                          <p className="text-xs text-green-600 mt-1 font-medium text-center">
                            Free portable toilet included!
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-center p-2 rounded-lg">
                      <p className="text-xs text-[#3C2317]/70">
                        Each tent accommodates up to 4 guests • Total capacity: {formData.numberOfTents * 4} guests
                      </p>
                    </div>

                    {formData.numberOfTents >= 5 && (
                      <div className="text-center p-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-800 font-medium">
                          For larger bookings or special requests, please enquire directly with our team.
                        </p>
                      </div>
                    )}

                    {formData.numberOfTents > 0 && (
                      <div className="mt-2 sm:mt-3">
                        <Label className="text-[#3C2317] block font-medium text-xs sm:text-sm mb-1">
                          Sleeping Arrangements
                        </Label>
                        <div className="text-[10px] sm:text-xs text-[#3C2317]/70 mb-2 sm:mb-2 leading-snug">
                          Configure how guests will sleep in each tent (max 4 guests per tent)
                        </div>

                        <div className="space-y-2 sm:space-y-3">
                          {formData.sleepingArrangements.map((arrangement) => (
                            <div
                              key={arrangement.tentNumber}
                              className="bg-[#E6CFA9]/20 rounded-lg p-3 border border-[#D3B88C]/40"
                            >
                              {/* Tent Header and Select */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[#3C2317] font-semibold text-[11px] sm:text-sm">
                                    Tent {arrangement.tentNumber}
                                  </span>
                                </div>

                                <Select
                                  value={arrangement.arrangement}
                                  onValueChange={(
                                    value: "all-singles" | "two-doubles" | "mix" | "double-bed" | "custom",
                                  ) => handleSleepingArrangementChange(arrangement.tentNumber, value)}
                                >
                                  <SelectTrigger className="w-full sm:w-32 border-0 border-[#D3B88C] focus:border-[#3C2317] h-6 text-xs bg-white/90 rounded-md">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="text-xs">
                                    <SelectItem value="all-singles">All Single beds</SelectItem>
                                    <SelectItem value="two-doubles">2 double beds</SelectItem>
                                    <SelectItem value="mix">1 double + 2 singles</SelectItem>
                                    <SelectItem value="double-bed">Double bed</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Custom Input Field */}
                              {arrangement.arrangement === "custom" && (
                                <div className="mt-2 pt-2 border-t border-[#D3B88C]/30">
                                  <Label className="text-[#3C2317] text-xs font-medium mb-1.5 block">
                                    Custom sleeping arrangement
                                  </Label>
                                  <Input
                                    placeholder="e.g., '1 double + 1 single'"
                                    value={arrangement.customArrangement || ""}
                                    onChange={(e) =>
                                      handleCustomArrangementChange(arrangement.tentNumber, e.target.value)
                                    }
                                    className="w-full border border-[#D3B88C] focus:border-[#3C2317] focus:ring-1 focus:ring-[#3C2317]/20 h-9 text-xs px-2 rounded-md bg-white placeholder:text-[#3C2317]/40 transition-all duration-200"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-between sm:justify-between sm:gap-5 pt-2 sm:pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowBookingFlow(false)
                    }}
                    className="border-none text-[#3C2317] cursor-pointer hover:bg-[#3C2317] hover:text-[#FBF9D9]"
                  >
                    Back
                  </Button>

                  <Button
                    type="button"
                    onClick={() => handleStepChange(3)}
                    className="bg-[#3C2317] text-[#FBF9D9] hover:bg-[#5D4037] cursor-pointer"
                  >
                    Next
                  </Button>
                </div>
              </>
            )}

            {/* Step 2: Personal Info & Add-Ons */}
            {uiStep === 2 && (
              <>
                <Card className="border-[#D3B88C]/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-[#FBF9D9]/80 backdrop-blur-sm !pt-0">
                  <CardHeader className="bg-gradient-to-r from-[#D3B88C]/20 to-[#E6CFA9]/20 border-b border-[#D3B88C]/50 h-10 sm:h-12 py-2 sm:py-3 px-3 sm:px-6">
                    <CardTitle className="text-[#3C2317] text-sm sm:text-base lg:text-lg">Premium Add-ons</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 space-y-1 !pt-0">
                    <div className="grid gap-1">
                      {/* Charcoal Add-on */}
                      <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-[#E6CFA9]/50 transition-all duration-300 border border-transparent hover:border-[#D3B88C]/30">
                        <Checkbox
                          id="charcoal"
                          checked={formData.addOns.charcoal}
                          onCheckedChange={(checked) => handleAddOnChange("charcoal", checked as boolean)}
                          className="border-2 border-[#3C2317] data-[state=checked]:bg-[#3C2317] data-[state=checked]:border-[#3C2317] h-4 w-4 mt-0.5 flex-shrink-0 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1">
                            <Label
                              htmlFor="charcoal"
                              className="text-[#3C2317] font-medium text-xs sm:text-sm cursor-pointer"
                            >
                              Premium Charcoal
                            </Label>
                            <span className="text-[#3C2317] font-bold text-xs sm:text-sm whitespace-nowrap sm:ml-2">
                              AED {settings?.addOnPrices?.charcoal || 60}
                            </span>
                          </div>
                          <p className="text-xs text-[#3C2317]/80 mt-1">High-quality charcoal for perfect grilling</p>
                        </div>
                      </div>

                      {/* Firewood Add-on */}
                      <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-[#E6CFA9]/50 transition-all duration-300 border border-transparent hover:border-[#D3B88C]/30">
                        <Checkbox
                          id="firewood"
                          checked={formData.addOns.firewood}
                          onCheckedChange={(checked) => handleAddOnChange("firewood", checked as boolean)}
                          className="border-2 border-[#3C2317] data-[state=checked]:bg-[#3C2317] data-[state=checked]:border-[#3C2317] h-4 w-4 mt-0.5 flex-shrink-0 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1">
                            <Label
                              htmlFor="firewood"
                              className="text-[#3C2317] font-medium text-xs sm:text-sm cursor-pointer"
                            >
                              Premium Firewood
                            </Label>
                            <span className="text-[#3C2317] font-bold text-xs sm:text-sm whitespace-nowrap sm:ml-2">
                              AED {settings?.addOnPrices?.firewood || 75}
                            </span>
                          </div>
                          <p className="text-xs text-[#3C2317]/80 mt-1">Seasoned wood for cozy campfires</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-[#E6CFA9]/50 transition-all duration-300 border border-transparent hover:border-[#D3B88C]/30">
                        <Checkbox
                          id="portableToilet"
                          checked={formData.addOns.portableToilet}
                          onCheckedChange={(checked) => handleAddOnChange("portableToilet", checked as boolean)}
                          className="border-2 border-[#3C2317] data-[state=checked]:bg-[#3C2317] data-[state=checked]:border-[#3C2317] h-4 w-4 mt-0.5 flex-shrink-0 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1">
                            <Label
                              htmlFor="portableToilet"
                              className="text-[#3C2317] font-medium text-xs sm:text-sm cursor-pointer"
                            >
                              Portable Camping Toilet
                            </Label>
                            <span className="text-[#3C2317] font-bold text-xs sm:text-sm whitespace-nowrap sm:ml-2">
                              {formData.hasChildren
                                ? "FREE with children"
                                : `AED ${settings?.addOnPrices?.portableToilet || 200}`}
                            </span>
                          </div>
                          <p className="text-xs text-[#3C2317]/80 mt-1">Private, clean facilities for your comfort</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {settings?.customAddOns && settings.customAddOns.length > 0 && (
                  <Card className="border-[#D3B88C]/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-[#FBF9D9]/80 backdrop-blur-sm !pt-0">
                    <CardHeader className="bg-gradient-to-r from-[#D3B88C]/20 to-[#E6CFA9]/20 border-b border-[#D3B88C]/50 h-10 sm:h-12 py-2 sm:py-3 px-3 sm:px-6">
                      <CardTitle className="text-[#3C2317] flex items-center justify-between text-sm sm:text-base lg:text-lg">
                        <span>Other Services</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleManualRefresh}
                          disabled={loadingSettings}
                          className="text-[#3C2317] hover:text-[#3C2317]/80 hover:bg-[#3C2317]/10 p-1 h-6 w-auto text-xs"
                        >
                          {loadingSettings ? <Loader2 className="w-3 h-3 animate-spin" /> : "Refresh"}
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 space-y-1 !pt-0">
                      {settings.customAddOns.map((addon) => (
                        <div
                          key={addon.id}
                          className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-[#E6CFA9]/50 transition-all duration-300 border border-transparent hover:border-[#D3B88C]/30"
                        >
                          <Checkbox
                            id={`custom-${addon.id}`}
                            checked={selectedCustomAddOns.includes(addon.id)}
                            onCheckedChange={(checked) => handleCustomAddOnChange(addon.id, checked as boolean)}
                            className="border-2 border-[#3C2317] data-[state=checked]:bg-[#3C2317] data-[state=checked]:border-[#3C2317] h-4 w-4 mt-0.5 flex-shrink-0 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1">
                              <Label
                                htmlFor={`custom-${addon.id}`}
                                className="text-[#3C2317] font-medium text-xs sm:text-sm cursor-pointer"
                              >
                                {addon.name}
                              </Label>
                              <span className="text-[#3C2317] font-bold text-xs sm:text-sm whitespace-nowrap sm:ml-2">
                                AED {addon.price}
                              </span>
                            </div>
                            {addon.description && <p className="text-xs text-[#3C2317]/80 mt-1">{addon.description}</p>}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                <Card className="border-[#D3B88C]/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-[#FBF9D9]/80 backdrop-blur-sm !pt-0">
                  <CardHeader className="bg-gradient-to-r from-[#D3B88C]/20 to-[#E6CFA9]/20 border-b border-[#D3B88C]/50 h-10 sm:h-12 py-2 sm:py-3 px-3 sm:px-6">
                    <CardTitle className="text-[#3C2317] text-sm sm:text-base lg:text-lg">
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 !pt-0">
                    <div>
                      <Label
                        htmlFor="customerName"
                        className="text-[#3C2317] mb-2 block font-medium text-xs sm:text-sm"
                      >
                        Full Name *
                      </Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => handleInputChange("customerName", e.target.value)}
                        onBlur={(e) => handleBlur("customerName", e.target.value)}
                        className={cn(
                          "border-2 border-[#D3B88C] focus:border-[#3C2317] focus:ring-2 focus:ring-[#3C2317]/20 transition-all duration-300 h-9 sm:h-10 rounded-lg sm:rounded-xl text-xs sm:text-sm",
                          errors.customerName && touched.customerName && "border-red-500 focus:border-red-500",
                        )}
                        placeholder="Enter your full name"
                      />
                      {errors.customerName && touched.customerName && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs sm:text-sm text-red-700 flex items-center space-x-2">
                            <X className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span>{errors.customerName}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="customerEmail"
                        className="text-[#3C2317] mb-2 block font-medium text-xs sm:text-sm"
                      >
                        Email Address *
                      </Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                        onBlur={(e) => handleBlur("customerEmail", e.target.value)}
                        className={cn(
                          "border-2 border-[#D3B88C] focus:border-[#3C2317] focus:ring-2 focus:ring-[#3C2317]/20 transition-all duration-300 h-9 sm:h-10 rounded-lg sm:rounded-xl text-xs sm:text-sm",
                          errors.customerEmail && touched.customerEmail && "border-red-500 focus:border-red-500",
                        )}
                        placeholder="your.email@example.com"
                      />
                      {errors.customerEmail && touched.customerEmail && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs sm:text-sm text-red-700 flex items-center space-x-2">
                            <X className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span>{errors.customerEmail}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="customerPhone"
                        className="text-[#3C2317] mb-2 block font-medium text-xs sm:text-sm"
                      >
                        Phone Number *
                      </Label>
                      <Input
                        id="customerPhone"
                        value={formData.customerPhone}
                        onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                        onBlur={(e) => handleBlur("customerPhone", e.target.value)}
                        placeholder="+971501234567"
                        className={cn(
                          "border-2 border-[#D3B88C] focus:border-[#3C2317] focus:ring-2 focus:ring-[#3C2317]/20 transition-all duration-300 h-9 sm:h-10 rounded-lg sm:rounded-xl text-xs sm:text-sm",
                          errors.customerPhone && touched.customerPhone && "border-red-500 focus:border-red-500",
                        )}
                      />
                      {errors.customerPhone && touched.customerPhone && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs sm:text-sm text-red-700 flex items-center space-x-2">
                            <X className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span>{errors.customerPhone}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between sm:justify-between sm:gap-5 pt-2 sm:pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleStepChange(1)}
                    className="border-none text-[#3C2317] cursor-pointer hover:bg-[#3C2317] hover:text-[#FBF9D9]"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleStepChange(3)}
                    className="bg-[#3C2317] text-[#FBF9D9] hover:bg-[#5D4037] cursor-pointer"
                  >
                    Next
                  </Button>
                </div>
              </>
            )}

            {/* Step 3: Payment */}
            {uiStep === 3 && (
              <form className="space-y-3 sm:space-4 lg:space-y-6" onSubmit={handleSubmit}>
                <Card className="border-[#D3B88C]/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-[#FBF9D9]/80 backdrop-blur-sm !pt-0">
                  <CardHeader className="bg-gradient-to-r from-[#D3B88C]/20 to-[#E6CFA9]/20 border-b border-[#D3B88C]/50 h-10 sm:h-12 py-2 sm:py-3 px-3 sm:px-6">
                    <CardTitle className="text-[#3C2317] text-sm sm:text-base lg:text-lg">Payment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 !pt-0">
                    <div className="bg-[#D3B88C]/20 p-8 rounded-lg text-center">
                      <h4 className="font-bold text-[#3C2317] mb-3 text-2xl">Complete Your Booking</h4>
                      <p className="text-sm text-[#3C2317]/80 mb-6 max-w-md mx-auto">
                        Secure and seamless payment processing to finalize your reservation with confidence.
                      </p>
                      <Button
                        onClick={handleSubmit}
                        type="submit"
                        className="bg-[#5D4037] text-[#FBF9D9] hover:bg-[#5D4037] cursor-pointer px-8 py-4 rounded-lg"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-2">
                            <Loader2Icon className="w-4 h-4 animate-spin" />
                            <span>Processing...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Proceed to Payment</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-start pt-2 sm:pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleStepChange(2)}
                    className="border-none text-[#3C2317] cursor-pointer hover:bg-[#3C2317] hover:text-[#FBF9D9]"
                  >
                    Back
                  </Button>
                </div>
              </form>
            )}
          </div>

          <div className="xl:col-span-1">
            <Card
              className="sticky top-12 sm:top-16 lg:top-20 border-[#D3B88C]/50 shadow-2xl bg-gradient-to-br from-[#FBF9D9]/95 to-[#E6CFA9]/95 backdrop-blur-md overflow-hidden !pt-0 transform hover:scale-[1.01] lg:hover:scale-[1.02] transition-all duration-300"
              id="tour2-step4"
            >
              <CardHeader className="bg-gradient-to-r from-[#3C2317] to-[#5D4037] text-[#FBF9D9] p-4 sm:p-4 lg:p-6 relative overflow-hidden">
                <div className="relative z-10">
                  <CardTitle className="text-base sm:text-lg lg:text-xl font-bold flex items-center space-x-2">
                    <span>Booking Summary</span>
                  </CardTitle>
                  <p className="text-[#FBF9D9]/90 text-xs sm:text-sm">The UAE’s ultimate camping experience</p>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3 lg:space-y-4 !pt-0">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-[#E6CFA9]/40 to-[#D3B88C]/30 rounded-lg sm:rounded-xl border border-[#D3B88C]/30 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#3C2317] rounded-full flex items-center justify-center">
                        <span className="text-[#FBF9D9] text-xs font-bold">{formData.numberOfTents}</span>
                      </div>
                      <div>
                        <span className="text-[#3C2317] font-semibold text-xs sm:text-sm">
                          Tent
                          {formData.numberOfTents > 1 ? "s" : ""}
                        </span>
                        <p className="text-[#3C2317]/70 text-xs">{formData.location} Location</p>
                      </div>
                    </div>
                    <span className="font-bold text-[#3C2317] text-sm sm:text-base lg:text-lg">
                      AED {pricing.tentPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* {formData.location === "Wadi" && formData.numberOfTents < 2 && (
                    <div className="mt-2 sm:mt-3 p-3 sm:p-4 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-400 rounded-lg shadow-sm">
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-red-600 text-xs sm:text-sm font-bold">!</span>
                        </div>
                        <div>
                          <p className="text-red-800 font-semibold text-xs sm:text-sm">Wadi Location Requirement</p>
                          <p className="text-red-700 text-xs mt-1 leading-relaxed">
                            Minimum 2 tents required for Wadi bookings due to logistics and safety requirements, In case of 1 tent, there is additinal surcharge
                          </p>
                        </div>
                      </div>
                    </div>
                  )} */}

                  {formData.location === "Wadi" && (
                    <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-800 font-medium text-xs sm:text-sm">Wadi Location</span>
                        </div>
                        <span className="text-blue-900 font-semibold text-xs sm:text-sm">
                          +AED {settings?.wadiSurcharge || DEFAULT_SETTINGS.wadiSurcharge}
                        </span>
                      </div>
                      {/* <p className="text-blue-700 text-xs mt-1">
                        Includes exclusive desert location access and enhanced amenities
                      </p> */}
                    </div>
                  )}

                  {pricing.addOnsCost > 0 && (
                    <div className="flex justify-between items-center text-xs sm:text-sm p-2 sm:p-3 bg-gradient-to-r from-[#E6CFA9]/20 to-[#D3B88C]/20 rounded-lg border border-[#D3B88C]/20">
                      <div className="flex items-center space-x-2">
                        <span className="text-[#3C2317]/80 font-medium">Premium Add-ons</span>
                      </div>
                      <span className="text-[#3C2317] font-semibold">AED {pricing.addOnsCost.toFixed(2)}</span>
                    </div>
                  )}

                  {pricing.customAddOnsCost > 0 && (
                    <div className="flex justify-between items-center text-xs sm:text-sm p-2 sm:p-3 bg-gradient-to-r from-[#E6CFA9]/20 to-[#D3B88C]/20 rounded-lg border border-[#D3B88C]/20">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#D3B88C] rounded-full"></div>
                        <span className="text-[#3C2317]/80 font-medium">Other Services</span>
                      </div>
                      <span className="text-[#3C2317] font-semibold">AED {pricing.customAddOnsCost.toFixed(2)}</span>
                    </div>
                  )}

                  {/* CHANGE START */}
                  {pricing.specialPricingAmount > 0 && (
                    <div className="flex justify-between items-center text-xs sm:text-sm p-2 sm:p-3 bg-gradient-to-r from-[#E6CFA9]/20 to-[#D3B88C]/20 rounded-lg border border-[#D3B88C]/20">
                      <div className="flex items-center space-x-2">
                        <span className="text-[#3C2317]/80 font-medium">
                          {pricing.specialPricingName || "Special Pricing"}
                        </span>{" "}
                        {/* show name instead of generic text */}
                      </div>
                      <span className="text-[#3C2317] font-semibold">
                        AED {pricing.specialPricingAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {/* CHANGE END */}

                  <div className="border-t border-[#D3B88C] pt-2 sm:pt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#3C2317] font-medium text-xs sm:text-sm">Subtotal</span>
                      <span className="text-[#3C2317] font-bold text-xs sm:text-sm">
                        AED {pricing.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#3C2317]/80">
                        VAT ({((settings?.vatRate || DEFAULT_SETTINGS.vatRate) * 100).toFixed(0)}
                        %)
                      </span>
                      <span className="text-[#3C2317] font-medium">AED {pricing.vat.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="border-t-2 border-[#3C2317]/20 pt-4 sm:pt-4">
                    <div className="flex justify-between text-base sm:text-lg font-bold p-2 sm:p-3 bg-gradient-to-r from-[#3C2317]/10 to-[#5D4037]/10 rounded-lg sm:rounded-xl">
                      <span className="text-[#3C2317]">Total</span>
                      <span className="text-[#3C2317]">AED {pricing.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#3C2317] to-[#5D4037] hover:from-[#3C2317]/90 hover:to-[#5D4037]/90 text-[#FBF9D9] font-bold py-2 sm:py-3 text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Reserve Your Adventure</span>
                      </div>
                    )}
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-xs text-[#3C2317]/80 mb-3 sm:mb-3">
                    🔒 Secure payment powered by Stripe. You will be redirected to complete your payment safely.
                  </p>
                </div>
                <div className="bg-gradient-to-r from-[#E6CFA9]/50 to-[#D3B88C]/20 p-3 sm:p-4 lg:p-5 rounded-xl lg:rounded-2xl border border-[#3C2317]/10 shadow-md hover:shadow-lg transition-all duration-300">
                  <h4 className="font-bold text-[#3C2317] mb-3 sm:mb-4 text-sm sm:text-base lg:text-lg border-b border-[#3C2317]/20 pb-2">
                    Pricing Guide
                  </h4>

                  <div className="space-y-3 sm:space-3">
                    {/* Weekdays */}
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-[#3C2317]/80 flex items-center gap-2">
                        <i className="fa-regular fa-calendar-days"></i> Weekdays (Mon–Thu)
                      </span>
                      <span className="font-semibold text-[11px] sm:text-xs text-[#3C2317]">
                        AED {(settings?.tentPrice || DEFAULT_SETTINGS.tentPrice).toFixed(2)} + VAT
                      </span>
                    </div>

                    {/* Weekends */}
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-[#3C2317]/80 flex items-center gap-2">
                        <i className="fa-solid fa-calendar-week"></i> Weekends (Fri–Sun)
                      </span>
                      <span className="font-semibold text-[11px] sm:text-xs text-[#3C2317]">
                        AED {((settings?.tentPrice || DEFAULT_SETTINGS.tentPrice) + 200).toFixed(2)} + VAT
                      </span>
                    </div>

                    {/* 2+ tents */}
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-[#3C2317]/80 flex items-center gap-2">
                        <i className="fa-solid fa-campground"></i> 2+ tents (any day)
                      </span>
                      <span className="font-semibold text-[11px] sm:text-xs text-[#3C2317]">
                        AED {(settings?.tentPrice || DEFAULT_SETTINGS.tentPrice).toFixed(2)} each + VAT
                      </span>
                    </div>

                    {/* Wadi surcharge */}
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-[#3C2317]/80 flex items-center gap-2">
                        <i className="fa-solid fa-mountain"></i> Wadi surcharge
                      </span>
                      <span className="font-semibold text-[11px] sm:text-xs text-[#3C2317]">
                        AED {settings?.wadiSurcharge || DEFAULT_SETTINGS.wadiSurcharge}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-[#3C2317]/80 flex items-center gap-2">
                        <i className="fa-solid fa-mountain"></i>
                        Wadi surcharge (1 tent booking)
                      </span>
                      <span className="font-semibold text-[11px] sm:text-xs text-[#3C2317]">
                        AED 750 (includes AED 500 additional for 1 tent)
                      </span>
                    </div>

                    {/* Children bonus */}
                    {children > 0 && (
                      <div className="border-t border-[#3C2317]/20 pt-2 sm:pt-3 mt-2 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] sm:text-xs text-[#3C2317]/90 flex items-center gap-2">
                            🚻 Family bookings
                          </span>
                          <span className="font-semibold text-[11px] sm:text-xs text-[#3C2317]">
                            FREE portable toilet
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* WhatsApp Floating Button */}
      <div className="fixed bottom-4 right-3 z-50">
        <a
          href="https://wa.link/wf9dkt"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#25D366] hover:bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 cursor-pointer flex items-center justify-center"
          aria-label="Contact us on WhatsApp"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className="w-6 h-6">
            <path d="M16 0C7.2 0 0 7.2 0 16c0 2.8.7 5.5 2.1 7.9L0 32l8.3-2.2c2.3 1.3 4.9 2 7.7 2 8.8 0 16-7.2 16-16S24.8 0 16 0zm0 29c-2.5 0-4.9-.7-7-2l-.5-.3-4.9 1.3 1.3-4.8-.3-.5C3.4 21.6 3 18.8 3 16 3 8.8 8.8 3 16 3s13 5.8 13 13-5.8 13-13 13zm7.4-9.4c-.4-.2-2.3-1.1-2.6-1.2-.4-.2-.6-.2-.9.2-.3.4-1 1.2-1.2 1.4-.2.2-.4.3-.8.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.9-2.2-2.1-2.6-.2-.4 0-.6.2-.8.2-.2.4-.4.6-.6.2-.2.3-.4.5-.6.2-.2.2-.4.1-.7s-.9-2.1-1.3-2.9c-.3-.7-.6-.6-.9-.6h-.8c-.3 0-.7.1-1.1.5-.4.4-1.5 1.4-1.5 3.4s1.6 3.9 1.8 4.2c.2.3 3.1 4.7 7.7 6.6 1.1.5 2 .8 2.7 1 .6.2 1.1.2 1.6.1.5-.1 1.6-.6 1.8-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.7-.4z" />
          </svg>
        </a>
      </div>
    </div>
  )
}
