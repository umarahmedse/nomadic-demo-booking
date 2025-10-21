//@ts-nocheck
"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { calculateBookingPrice, fetchPricingSettings } from "@/lib/pricing"
import type { BookingFormData, Settings } from "@/lib/types"

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
}

export default function BookingPage() {
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)

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
    calculateBookingPrice(1, "Desert", formData.addOns, false, [], DEFAULT_SETTINGS, formData.bookingDate),
  )
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const [locationMessage, setLocationMessage] = useState("")
  const stepperSectionRef = useRef<HTMLDivElement>(null)

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
        if (formData.location === "Wadi" && formData.numberOfTents < 2) step1Errors.push("numberOfTents")

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

    const newPricing = calculateBookingPrice(
      formData.numberOfTents,
      formData.location,
      formData.addOns,
      formData.hasChildren,
      customAddOnsWithSelection,
      settings,
      formData.bookingDate,
    )
    setPricing(newPricing)
  }, [
    formData.numberOfTents,
    formData.location,
    formData.addOns,
    formData.hasChildren,
    selectedCustomAddOns,
    settings,
    formData.bookingDate,
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
    setUserInteracting(true)
    const newCount = increment ? formData.numberOfTents + 1 : formData.numberOfTents - 1

    const maxTentsPerBooking = 5
    const maxAllowed = Math.min(maxTentsPerBooking, dateConstraints.remainingCapacity || 15) // Updated from 10 to 15

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
      setTouched((prev) => ({ ...prev, numberOfTents: true }))

      if (formData.location === "Wadi") {
        const newErrors = { ...errors }
        if (newCount === 1) {
          // Show notification about surcharge but don't block
          toast.info("Wadi location with 1 tent: +500 AED surcharge applied + weekend rate charged even on weekdays")
          delete newErrors.numberOfTents
        } else {
          delete newErrors.numberOfTents
        }
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
        // Only validate for Wadi if current location is Wadi
        if (formData.location === "Wadi" && formData.numberOfTents < 2) {
          newErrors.numberOfTents = "Wadi location requires at least 2 tents"
        } else {
          delete newErrors.numberOfTents
        }
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

    if (formData.location === "Wadi" && formData.numberOfTents < 2) {
      newErrors.numberOfTents = "Wadi location requires at least 2 tents"
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
        body: JSON.stringify(bookingData), // ✅ Correct
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

    setErrors((prev) => {
      const newErrors = { ...prev }
      if (prev.numberOfTents === "Wadi location requires at least 2 tents") {
        delete newErrors.numberOfTents
      }
      return newErrors
    })

    // Show notification if switching to Wadi with 1 tent
    if (location === "Wadi" && formData.numberOfTents === 1) {
      toast.info("Wadi location with 1 tent: +500 AED surcharge applied + weekend rate charged even on weekdays")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FBF9D9] via-[#E6CFA9] to-[#D3B88C]">
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
                    "/placeholder.svg?height=420&width=1000&query=luxury desert camping"
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
                    src={image.src || "/placeholder.svg?height=130&width=200&query=camping scene"}
                    alt={image.alt}
                    fill
                    className="object-cover object-center group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
