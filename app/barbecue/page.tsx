//@ts-nocheck
"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MapPin,
  Check,
  X,
  Loader2,
  Calendar,
  Shield,
  Compass,
  Loader2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Stepper from "@/components/ui/stepper";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

type BarbecueGroupSize = 10 | 15 | 20;

const DEFAULT_SETTINGS = {
  groupPrices: {
    10: 1497,
    15: 1697,
    20: 1897,
  },
  vatRate: 0.05,
  addOnPrices: {
    charcoal: 60,
    firewood: 75,
    portableToilet: 200,
  },
  customAddOns: [],
};

interface Settings {
  groupPrices: {
    10: number;
    15: number;
    20: number;
  };
  vatRate: number;
  addOnPrices: {
    charcoal: number;
    firewood: number;
    portableToilet: number;
  };
  customAddOns: Array<{
    id: string;
    name: string;
    price: number;
    description?: string;
  }>;
}

const calculateBarbecuePrice = (
  groupSize: BarbecueGroupSize,
  addOns: any,
  selectedCustomAddOns: string[],
  settings: Settings,
  bookingDate?: string
) => {
  const basePrice = settings.groupPrices[groupSize];

  let specialPricingAmount = 0;
  let specialPricingName = ""; // track special pricing name
  if (bookingDate && settings.specialPricing) {
    const date = new Date(bookingDate);
    const specialPrice = settings.specialPricing.find((sp) => {
      if (!sp.isActive) return false;
      const startDate = new Date(sp.startDate);
      const endDate = new Date(sp.endDate);
      return date >= startDate && date <= endDate;
    });
    if (specialPrice) {
      specialPricingAmount = specialPrice.amount;
      specialPricingName = specialPrice.name; // store the name
    }
  }

  let addOnsTotal = 0;
  if (addOns.charcoal) addOnsTotal += settings.addOnPrices.charcoal;
  if (addOns.firewood) addOnsTotal += settings.addOnPrices.firewood;
  if (addOns.portableToilet) addOnsTotal += settings.addOnPrices.portableToilet;

  let customAddOnsCost = 0;
  selectedCustomAddOns.forEach((id) => {
    const addon = settings.customAddOns.find((a) => a.id === id);
    if (addon) customAddOnsCost += addon.price;
  });

  const subtotal =
    basePrice + addOnsTotal + customAddOnsCost + specialPricingAmount;
  const vat = subtotal * settings.vatRate;
  const total = subtotal + vat;

  return {
    subtotal,
    vat,
    total,
    basePrice,
    addOnsTotal,
    customAddOnsCost,
    specialPricingAmount,
    specialPricingName,
  }; // return name
};

const fetchPricingSettings = async () => {
  try {
    const response = await fetch("/api/barbecue/settings");
    if (!response.ok) throw new Error("Failed to fetch settings");
    return await response.json();
  } catch (error) {
    console.error("Error fetching settings:", error);
    return DEFAULT_SETTINGS;
  }
};

export default function BarbecueBookingPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  interface DateConstraints {
    booked: boolean;
    blocked: boolean;
    blockedReason: string | null;
  }

  const [dateConstraints, setDateConstraints] = useState<DateConstraints>({
    booked: false,
    blocked: false,
    blockedReason: null,
  });
  const [checkingConstraints, setCheckingConstraints] = useState(false);
  const isUserInteracting = useRef(false);
  const interactionTimeoutRef = useRef<NodeJS.Timeout>();
  const isRefreshing = useRef(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [uiStep, setUiStep] = useState(1);
  const [showBookingFlow, setShowBookingFlow] = useState(false);

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "+971",
    bookingDate: "",
    arrivalTime: "6:00 PM",
    groupSize: 10 as BarbecueGroupSize,
    addOns: {
      charcoal: false,
      firewood: false,
      portableToilet: false,
    },
    notes: "",
  });

  const [selectedCustomAddOns, setSelectedCustomAddOns] = useState<string[]>(
    []
  );
  const [pricing, setPricing] = useState(
    calculateBarbecuePrice(10, formData.addOns, [], DEFAULT_SETTINGS)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const stepperSectionRef = useRef<HTMLDivElement>(null);

  const scrollToStepperTop = () => {
    stepperSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const validateCurrentStep = () => {
    switch (uiStep) {
      case 1:
        const step1Errors = [];
        if (!formData.bookingDate) step1Errors.push("bookingDate");

        if (formData.bookingDate) {
          const selectedDate = new Date(formData.bookingDate);
          const today = new Date();
          const selectedMidnight = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate()
          );
          const todayMidnight = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
          );
          const diffTime = selectedMidnight.getTime() - todayMidnight.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays < 2) step1Errors.push("bookingDate");
        }

        return step1Errors.length === 0;

      case 2:
        const step2Errors = [];
        if (!formData.customerName.trim()) step2Errors.push("customerName");
        if (
          !formData.customerEmail.trim() ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)
        )
          step2Errors.push("customerEmail");
        if (
          !formData.customerPhone.startsWith("+971") ||
          formData.customerPhone.length < 12
        )
          step2Errors.push("customerPhone");
        return step2Errors.length === 0;

      case 3:
        return true;

      default:
        return true;
    }
  };

  const handleStepChange = (newStep: number) => {
    if (newStep > uiStep && !validateCurrentStep()) {
      if (uiStep === 1) {
        setTouched((prev) => ({
          ...prev,
          bookingDate: true,
        }));
        validateField("bookingDate", formData.bookingDate);
      } else if (uiStep === 2) {
        setTouched((prev) => ({
          ...prev,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
        }));
        validateField("customerName", formData.customerName);
        validateField("customerEmail", formData.customerEmail);
        validateField("customerPhone", formData.customerPhone);
      }
      toast.error("Please complete all required fields before proceeding");
      return;
    }

    setUiStep(newStep);
    setTimeout(() => {
      scrollToStepperTop();
    }, 100);
  };

  const campingImages = [
    { src: "/image1.png", alt: "Desert BBQ setup with fire" },
    { src: "/image2.png", alt: "BBQ grilling area" },
    { src: "/image3.png", alt: "Desert camping BBQ" },
    { src: "/image4.png", alt: "Evening BBQ setup" },
    { src: "/image5.png", alt: "BBQ gathering" },
  ];

  useEffect(() => {
    const loadSettings = async () => {
      if (isRefreshing.current) return;

      try {
        setLoadingSettings(true);
        isRefreshing.current = true;
        const settingsData = await fetchPricingSettings();
        setSettings(settingsData);
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoadingSettings(false);
        isRefreshing.current = false;
      }
    };
    loadSettings();
  }, []);

  const refreshSettings = useCallback(async () => {
    if (!isUserInteracting.current && !isRefreshing.current) {
      try {
        isRefreshing.current = true;
        const settingsData = await fetchPricingSettings();
        setSettings(settingsData);
      } catch (error) {
        console.error("Failed to refresh settings:", error);
      } finally {
        isRefreshing.current = false;
      }
    }
  }, []);

  useEffect(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const scheduleRefresh = () => {
      refreshTimeoutRef.current = setTimeout(() => {
        refreshSettings();
        scheduleRefresh();
      }, 30000);
    };

    scheduleRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [refreshSettings]);

  const today = new Date();
  const minDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 2
  );
  const minDateString = minDate.toISOString().split("T")[0];

  useEffect(() => {
    if (!settings) return;

    const customAddOnsWithSelection = (settings.customAddOns || []).map(
      (addon) => ({
        ...addon,
        selected: selectedCustomAddOns.includes(addon.id),
      })
    );

    const newPricing = calculateBarbecuePrice(
      formData.groupSize,
      formData.addOns,
      selectedCustomAddOns,
      settings,
      formData.bookingDate
    );
    setPricing(newPricing);
  }, [
    formData.groupSize,
    formData.addOns,
    selectedCustomAddOns,
    settings,
    formData.bookingDate,
  ]);

  const setUserInteracting = useCallback(
    (interacting: boolean, duration = 5000) => {
      isUserInteracting.current = interacting;

      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }

      if (interacting) {
        interactionTimeoutRef.current = setTimeout(() => {
          isUserInteracting.current = false;
        }, duration);
      }
    },
    []
  );

  const checkDateConstraints = async (dateString: string) => {
    setCheckingConstraints(true);
    try {
      const response = await fetch(
        `/api/barbecue/date-constraints?date=${dateString}`
      );
      const data = await response.json();

      setDateConstraints({
        booked: data.booked || false,
        blocked: data.blocked || false,
        blockedReason: data.blockedReason || null,
      });
    } catch (error) {
      setDateConstraints({
        booked: false,
        blocked: false,
        blockedReason: null,
      });
    } finally {
      setCheckingConstraints(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));

    if (field === "bookingDate" && value) {
      checkDateConstraints(value);
    }

    if (typeof value === "string") {
      validateField(field, value);
    }
  };

  const handleAddOnChange = (
    addOn: keyof typeof formData.addOns,
    checked: boolean
  ) => {
    setUserInteracting(true);
    setFormData((prev) => ({
      ...prev,
      addOns: { ...prev.addOns, [addOn]: checked },
    }));
  };

  const handleCustomAddOnChange = (addOnId: string, checked: boolean) => {
    setUserInteracting(true);
    setSelectedCustomAddOns((prev) =>
      checked ? [...prev, addOnId] : prev.filter((id) => id !== addOnId)
    );
  };

  const validateField = (field: string, value: any) => {
    const newErrors = { ...errors };

    switch (field) {
      case "customerName":
        if (!value.trim()) {
          newErrors.customerName = "Name is required";
        } else {
          delete newErrors.customerName;
        }
        break;
      case "customerEmail":
        if (!value.trim()) {
          newErrors.customerEmail = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.customerEmail = "Please enter a valid email address";
        } else {
          delete newErrors.customerEmail;
        }
        break;
      case "customerPhone":
        if (!value.startsWith("+971") || value.length < 12) {
          newErrors.customerPhone =
            "Valid UAE phone number required (+971501234567)";
        } else {
          delete newErrors.customerPhone;
        }
        break;
      case "bookingDate":
        if (!value) {
          newErrors.bookingDate = "Booking date is required";
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          const selectedMidnight = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate()
          );
          const todayMidnight = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
          );
          const diffMs = selectedMidnight.getTime() - todayMidnight.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);

          if (diffDays < 2) {
            newErrors.bookingDate = `Booking must be at least 2 days in advance`;
          } else {
            delete newErrors.bookingDate;
          }
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, value);
    setUserInteracting(true, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Name is required";
    }

    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      newErrors.customerEmail = "Please enter a valid email address";
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = "Phone number is required";
    } else if (!formData.customerPhone.startsWith("+971")) {
      newErrors.customerPhone = "Phone number must start with +971";
    }

    if (!formData.bookingDate) {
      newErrors.bookingDate = "Booking date is required";
    } else {
      const selectedDate = new Date(formData.bookingDate);
      const today = new Date();
      const selectedMidnight = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      const todayMidnight = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const diffTime = selectedMidnight.getTime() - todayMidnight.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 2) {
        newErrors.bookingDate = `Booking must be at least 2 days in advance`;
      }
    }

    if (dateConstraints.blocked) {
      newErrors.bookingDate =
        dateConstraints.blockedReason || "This date is blocked";
    }

    if (dateConstraints.booked) {
      newErrors.bookingDate = "This date is already booked";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);

      const firstErrorField = Object.keys(newErrors)[0];
      if (firstErrorField) {
        const element =
          document.querySelector(`[name="${firstErrorField}"]`) ||
          document.querySelector(`#${firstErrorField}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }

    setIsLoading(true);

    const loadingToast = toast.loading(
      "Processing your booking request... Please wait while we confirm the details."
    );

    try {
      const bookingData = {
        ...formData,
        selectedCustomAddOns,
      };

      const response = await fetch("/api/barbecue/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create booking");
      }

      const { bookingId } = await response.json();

      const checkoutResponse = await fetch(
        "/api/barbecue/create-checkout-session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId,
            customerName: formData.customerName,
            customerEmail: formData.customerEmail,
            bookingDate: formData.bookingDate,
            groupSize: formData.groupSize,
            pricing,
          }),
        }
      );

      if (!checkoutResponse.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await checkoutResponse.json();

      toast.dismiss(loadingToast);
      toast.success("Redirecting to payment...");

      setTimeout(() => {
        window.location.href = url;
      }, 1500);
    } catch (error) {
      toast.dismiss(loadingToast);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Booking failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    isUserInteracting.current = false;
    await refreshSettings();
  };

  useEffect(() => {
    return () => {
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, []);

  if (loadingSettings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FBF9D9] via-[#E6CFA9] to-[#D3B88C] flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-[#3C2317] mx-auto mb-6" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-[#3C2317]/20 rounded-full animate-pulse mx-auto"></div>
          </div>
          <p className="text-[#3C2317] text-lg font-medium">
            Loading your premium BBQ experience...
          </p>
        </div>
      </div>
    );
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
        <div
          className={cn("mb-8 animate-fade-in-up", showBookingFlow && "hidden")}
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <div className="lg:col-span-3">
              <div className="relative w-full h-[300px] md:h-[420px] rounded-xl overflow-hidden shadow-xl group">
                <Image
                  src={
                    campingImages[currentImageIndex].src || "/placeholder.svg"
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
                    src={image.src || "/placeholder.svg"}
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
            <div className="lg:col-span-2 space-y-6">
              <div className="text-left">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#3C2317] mb-3 flex items-center gap-2">
                  Nomadic Desert BBQ Setup 🏜️
                </h1>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center space-x-1 text-[#3C2317]/80">
                    <MapPin className="w-4 h-4 text-[#D3B88C]" />
                    <span className="text-sm font-medium">
                      40 minutes from Dubai
                    </span>
                  </div>
                </div>
                <p className="text-sm text-[#3C2317]/80 max-w-3xl text-pretty leading-relaxed mb-4">
                  Ever wanted to BBQ in the Dubai desert without the hassle of
                  bringing or setting anything up yourself? Now you can with
                  Nomadic's Ultimate Desert BBQ Setup - the perfect way to enjoy
                  an unforgettable evening surrounded by sand dunes, sunset
                  views, and the glow of fire lanterns as day turns to night.
                  Nomadic's Desert BBQ setups were created for those who want an
                  immersive, private desert experience without the stress of
                  organizing equipment or logistics. Every setup is fully
                  prepared before you arrive - all you need to bring is your
                  food, drinks, charcoal, and firewood (or add them to your
                  booking). Each BBQ setup is exclusive to your booking - just
                  you, your group and the serenity of the desert night. Your
                  setup includes everything you need for the perfect desert BBQ:
                  comfortable floor seating with cushions, chairs, lighting,
                  raised BBQ and fire pit, butane gas stove, cooking utensils,
                  plates, cutlery, and a cooler box for your refreshments.
                  Simply arrive, cook, relax, and enjoy.
                </p>

                <p className="hidden sm:block text-sm text-[#3C2317]/80 max-w-3xl text-pretty leading-relaxed">
                  Perfect for groups of 10 to 20 people. We handle all the
                  setup, so you can focus on enjoying your time with friends and
                  family under the desert stars. For larger groups (more than 20
                  people), please{" "}
                  <span className="font-medium text-[#3C2317]">
                    contact us directly
                  </span>{" "}
                  for custom arrangements.
                </p>

                <div className="block sm:hidden">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="details">
                      <AccordionTrigger className="text-[#3C2317] text-base">
                        Read full details
                      </AccordionTrigger>
                      <AccordionContent className="text-[#3C2317]/80 text-sm leading-relaxed bg-[#E6CFA9]/30 rounded-md p-3">
                        Perfect for groups of 10 to 20 people. We handle all the
                        setup, so you can focus on enjoying your time with
                        friends and family under the desert stars.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>

              <section className="bg-gradient-to-r from-[#E6CFA9] to-[#D3B88C] rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-[#3C2317]/10 w-fit">
                <div className="flex flex-col lg:flex-column items-center lg:items-start justify-between gap-4 sm:gap-6 text-center lg:text-left">
                  <div className="max-w-lg">
                    <h2 className="text-[#3C2317] text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 text-balance">
                      Ready to book your BBQ setup?
                    </h2>
                    <p className="text-[#3C2317]/80 text-sm sm:text-base leading-relaxed">
                      Book your Nomadic BBQ setup now and experience the UAE's
                      desert beauty with a hassle-free BBQ.
                    </p>
                  </div>

                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-[#3C2317] text-[#FBF9D9] hover:bg-[#3C2317] font-bold text-sm sm:text-base px-6 sm:px-10 py-3 sm:py-4 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer"
                    onClick={() => {
                      setShowBookingFlow(true);
                      setTimeout(() => {
                        stepperSectionRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }, 100);
                    }}
                  >
                    Book Your BBQ Setup Now
                  </Button>
                </div>
              </section>

              <div className="space-y-8">
                <section className="pl-3 border-l-3 border-[#D3B88C]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full ring-1 ring-[#D3B88C] text-[#3C2317]">
                      <Calendar className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="text-[#3C2317] text-base font-extrabold tracking-widest uppercase">
                      Itinerary
                    </h3>
                  </div>

                  <ol className="space-y-6">
                    {[
                      "Arrival at Meeting Point (18:00 – see confirmation email upon booking).",
                      "Park and Transfer, or Drive Your Own 4x4.",
                      "Setup Walkthrough & Safety Briefing.",
                      "Enjoy Your Nomadic Desert BBQ Experience.",
                      "Departure (Anytime up to Midnight).",
                      "Take all trash with you to keep nature pristine #LeaveNoTrace.",
                    ].map((step, idx, arr) => (
                      <li
                        key={idx}
                        className="relative flex gap-4 text-xs text-[#3C2317]/90 leading-relaxed"
                      >
                        <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#3C2317] text-[#FBF9D9] text-xs font-bold ring-1 ring-[#D3B88C]">
                          {idx + 1}
                        </span>
                        {idx < arr.length - 1 && (
                          <span
                            aria-hidden
                            className="absolute left-[13px] top-7 bottom-[-22px] w-px bg-[#3C2317]/30"
                          />
                        )}
                        <span className="flex-1 min-w-0 pt-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                </section>

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
                        title: "Fixed Arrival Time",
                        content:
                          "6:00 PM sharp — one BBQ setup per day for exclusivity.",
                      },
                      {
                        title: "Getting there",
                        content:
                          "Desert area is ~40 minutes from Dubai (Al Qudra). Meeting point is accessible by all vehicles.",
                      },
                      {
                        title: "Don't have a 4x4?",
                        content:
                          "Park at the meeting point — our team will transfer you and your belongings to your setup.",
                      },
                      {
                        title: "Have a 4x4?",
                        content:
                          "You can drive directly to your private setup and follow our team leader.",
                      },
                      {
                        title: "Meeting point",
                        content:
                          "You'll receive a Google Maps pin by email once your booking is confirmed.",
                      },
                      {
                        title: "Clothing",
                        content:
                          "Bring warm jumpers for evenings, especially in Dec–Jan. The campfire keeps you cozy.",
                      },
                      {
                        title: "Environment",
                        content:
                          "Help us #LeaveNoTrace. Bin bags provided; please take all trash with you.",
                      },
                      {
                        title: "What to bring",
                        content:
                          "BBQ food & drinks, Charcoal & firewood (or book as add-ons), Power bank (generators on request: 250 AED + VAT).",
                      },
                      {
                        title: "Duration & Timing",
                        content:
                          "Standard setup time is 6:00 PM — up to midnight.",
                      },
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full ring-1 ring-[#D3B88C] text-[#3C2317] flex-shrink-0">
                          <Check className="w-3 h-3" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <strong className="text-[#3C2317]">
                            {item.title}:
                          </strong>{" "}
                          {item.content}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

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
                      "Changes within 72 hours of your booking are subject to availability and may incur fees.",
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
                      "Private Desert BBQ Setup – Exclusive to Your Group",
                      "Fully Prepared BBQ Experience (No Setup Required)",
                      "Relaxed Floor Seating, Chairs & Ambient Lighting",
                      "Complete BBQ Equipment & Cooking Essentials Included",
                      "Ideal for Groups of 10, 15, or 20 People",
                      "Enjoy a Magical Sunset-to-Night BBQ Under the Stars",
                    ].map((item, i) => (
                      <li key={i} className="py-1 sm:py-1.5 flex items-start">
                        <span className="mr-1.5 text-[#3C2317]/80 flex-shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span className="flex-1 min-w-0">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-2 sm:gap-3">
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
                        "Floor seating & cushions",
                        "Camping chairs (per person)",
                        "Outdoor lighting & fire lanterns (with fuel)",
                        "Raised BBQ & raised fire pit",
                        "Firelighters & lighter",
                        "Gas stove with butane gas",
                        "Cooking pots & frying pan",
                        "Raised table",
                        "Cooler box (ice not included)",
                        "Picnic basket",
                        "Plates, cutlery & cups",
                        "Cooking utensils",
                        "Bin & bin liners",
                      ].map((item, i) => (
                        <li key={i} className="py-1 sm:py-1.5 flex items-start">
                          <span className="mr-1.5 text-[#3C2317]/80 flex-shrink-0 mt-0.5">
                            ✓
                          </span>
                          <span className="flex-1 min-w-0">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

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
                          <span className="mr-1.5 text-[#3C2317]/80 flex-shrink-0 mt-0.5">
                            ✗
                          </span>
                          <span className="flex-1 min-w-0">{item}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-[#E6CFA9]/60 rounded-md sm:rounded-lg border border-[#D3B88C]/30">
                      <p className="text-xs text-[#3C2317] leading-relaxed">
                        💡 Pro Tip: Bring your food, drinks, and a power bank.
                        Add charcoal & firewood to your booking (or bring your
                        own) - everything else is ready for you.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-[#D3B88C]/40 bg-gradient-to-br from-[#FBF9D9] via-[#F5EBD0] to-[#E6CFA9] rounded-2xl shadow-lg sm:p-8 p-5 text-center">
                  <CardContent className="flex flex-col items-center space-y-3">
                    <h3 className="text-[#3C2317] font-bold text-2xl">
                      Got a Question?
                    </h3>
                    <p className="text-[#3C2317]/80 text-sm leading-relaxed max-w-xs mx-auto">
                      Whether it's a quick question or a booking request, we're
                      just a WhatsApp message away.
                    </p>

                    <Button
                      onClick={() =>
                        window.open(
                          "https://wa.me/971585271420?text=Hi%21%20I%20have%20a%20question%20about%20the%20Nomadic%20BBQ%20setup.",
                          "_blank"
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
          className={cn(
            "grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6",
            !showBookingFlow && "hidden"
          )}
        >
          <div className="xl:col-span-2 space-y-3 sm:space-y-4 lg:space-y-6">
            <Stepper
              active={uiStep}
              steps={[
                { label: "Step 1: Select Date" },
                { label: "Step 2: Add Info/Add-ons" },
                { label: "Step 3: Payment" },
              ]}
              onChange={handleStepChange}
            />

            {uiStep === 1 && (
              <>
                <Card className="border-[#D3B88C]/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-[#FBF9D9]/80 backdrop-blur-sm !pt-0">
                  <CardHeader className="bg-gradient-to-r from-[#D3B88C]/20 to-[#E6CFA9]/20 border-b border-[#D3B88C]/50 h-10 sm:h-12 py-2 sm:py-3 px-3 sm:px-6">
                    <CardTitle className="text-[#3C2317] flex items-center space-x-2 text-sm sm:text-base lg:text-lg">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#3C2317]" />
                      <span>Choose your perfect date</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 lg:p-6 !pt-0">
                    <div className="mb-2 sm:mb-3">
                      <Label
                        htmlFor="bookingDate"
                        className="text-[#3C2317] font-medium mb-2 block text-xs sm:text-sm"
                      >
                        Select Date *
                      </Label>
                    </div>

                    <Input
                      id="bookingDate"
                      type="date"
                      value={formData.bookingDate}
                      onChange={(e) =>
                        handleInputChange("bookingDate", e.target.value)
                      }
                      onBlur={(e) => handleBlur("bookingDate", e.target.value)}
                      min={minDateString}
                      className={cn(
                        "border-2 border-[#D3B88C] focus:border-[#3C2317] focus:ring-2 focus:ring-[#3C2317]/20 transition-all duration-300 h-9 sm:h-10 lg:h-12 rounded-lg sm:rounded-xl cursor-pointer text-xs sm:text-sm",
                        errors.bookingDate &&
                          touched.bookingDate &&
                          "border-red-500 focus:border-red-500"
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
                        <span>
                          Minimum 2 days advance booking required for premium
                          preparation
                        </span>
                      </p>
                    </div>

                    {formData.bookingDate && dateConstraints?.blocked && (
                      <div className="mt-4 p-6 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl text-center">
                        <div className=" w-96 mx-auto">
                          <DotLottieReact
                            src="/dateerror.lottie"
                            loop
                            autoplay
                          />
                        </div>
                        <h3 className="text-lg font-bold text-red-800 mb-2">
                          Sorry, We're Unavailable
                        </h3>
                        <p className="text-sm text-red-700 mb-4">
                          Bookings are not available on the selected date.
                        </p>
                        <p className="text-sm font-semibold text-red-800 bg-white/60 p-3 rounded-lg">
                          {dateConstraints.blockedReason ||
                            "This date is unavailable. Please choose another date."}
                        </p>
                      </div>
                    )}

                    {formData.bookingDate && !dateConstraints?.blocked && (
                      <div className="mt-2">
                        <p className="text-xs text-green-700 flex items-center space-x-2">
                          <Check className="w-3 h-3 flex-shrink-0 text-green-600" />
                          <span>This date is available for booking</span>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {!dateConstraints?.blocked && (
                  <>
                    <Card className="border-[#D3B88C]/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-[#FBF9D9]/80 backdrop-blur-sm !pt-0">
                      <CardHeader className="bg-gradient-to-r from-[#D3B88C]/20 to-[#E6CFA9]/20 border-b border-[#D3B88C]/50 h-10 sm:h-12 py-2 sm:py-3 px-3 sm:px-6">
                        <CardTitle className="text-[#3C2317] text-sm sm:text-base lg:text-lg">
                          Group Size & Time
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 !pt-0">
                        <div className="space-y-2">
                          <Label className="text-[#3C2317] font-semibold text-xs sm:text-sm">
                            Select Group Size *
                          </Label>
                          <div className="grid grid-cols-3 gap-3">
                            {[10, 15, 20].map((size) => (
                              <Button
                                key={size}
                                type="button"
                                variant={
                                  formData.groupSize === size
                                    ? "default"
                                    : "outline"
                                }
                                onClick={() =>
                                  setFormData((p) => ({
                                    ...p,
                                    groupSize: size as BarbecueGroupSize,
                                  }))
                                }
                                className={cn(
                                  "rounded-lg cursor-pointer transition-all duration-300",
                                  formData.groupSize === size
                                    ? "bg-[#3C2317] text-[#FBF9D9] hover:bg-[#3C2317]/90"
                                    : "border-2 border-[#D3B88C] hover:border-[#3C2317] hover:bg-[#D3B88C]/20"
                                )}
                              >
                                Up to {size}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[#3C2317] font-semibold text-xs sm:text-sm">
                            Arrival Time
                          </Label>
                          <div className="mt-2">
                            <Button
                              type="button"
                              variant="default"
                              disabled
                              className="bg-[#3C2317] text-[#FBF9D9] rounded-xl w-full sm:w-auto"
                            >
                              6:00 PM (Fixed)
                            </Button>
                          </div>
                          <div className="mt-2 p-2 bg-[#E6CFA9]/40 border border-[#D3B88C]/40 rounded-lg">
                            <p className="text-[#3C2317] text-md">
                              <strong>Note:</strong> Arrival time is fixed at
                              6:00 PM. One BBQ setup per day for exclusivity.{" "}
                              <br />
                              For groups of more than 20 people, please{" "}
                              <strong>contact us</strong>.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-between sm:justify-between sm:gap-5 pt-2 sm:pt-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowBookingFlow(false)}
                        className="border-none text-[#3C2317] cursor-pointer hover:bg-[#3C2317] hover:text-[#FBF9D9]"
                      >
                        Back
                      </Button>

                      <Button
                        type="button"
                        onClick={() => handleStepChange(2)}
                        className="bg-[#3C2317] text-[#FBF9D9] hover:bg-[#5D4037] cursor-pointer"
                      >
                        Next
                      </Button>
                    </div>
                  </>
                )}

                {dateConstraints?.blocked && (
                  <div className="flex justify-start pt-2 sm:pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowBookingFlow(false)}
                      className="border-none text-[#3C2317] cursor-pointer hover:bg-[#3C2317] hover:text-[#FBF9D9]"
                    >
                      Back
                    </Button>
                  </div>
                )}
              </>
            )}

            {uiStep === 2 && (
              <>
                <Card className="border-[#D3B88C]/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-[#FBF9D9]/80 backdrop-blur-sm !pt-0">
                  <CardHeader className="bg-gradient-to-r from-[#D3B88C]/20 to-[#E6CFA9]/20 border-b border-[#D3B88C]/50 h-10 sm:h-12 py-2 sm:py-3 px-3 sm:px-6">
                    <CardTitle className="text-[#3C2317] text-sm sm:text-base lg:text-lg">
                      Premium Add-ons
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 space-y-1 !pt-0">
                    <div className="grid gap-1">
                      <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-[#E6CFA9]/50 transition-all duration-300 border border-transparent hover:border-[#D3B88C]/30">
                        <Checkbox
                          id="charcoal"
                          checked={formData.addOns.charcoal}
                          onCheckedChange={(checked) =>
                            handleAddOnChange("charcoal", checked as boolean)
                          }
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
                          <p className="text-xs text-[#3C2317]/80 mt-1">
                            High-quality charcoal for perfect grilling
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-[#E6CFA9]/50 transition-all duration-300 border border-transparent hover:border-[#D3B88C]/30">
                        <Checkbox
                          id="firewood"
                          checked={formData.addOns.firewood}
                          onCheckedChange={(checked) =>
                            handleAddOnChange("firewood", checked as boolean)
                          }
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
                          <p className="text-xs text-[#3C2317]/80 mt-1">
                            Seasoned wood for cozy campfires
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-[#E6CFA9]/50 transition-all duration-300 border border-transparent hover:border-[#D3B88C]/30">
                        <Checkbox
                          id="portableToilet"
                          checked={formData.addOns.portableToilet}
                          onCheckedChange={(checked) =>
                            handleAddOnChange(
                              "portableToilet",
                              checked as boolean
                            )
                          }
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
                              AED {settings?.addOnPrices?.portableToilet || 200}
                            </span>
                          </div>
                          <p className="text-xs text-[#3C2317]/80 mt-1">
                            Private, clean facilities for your comfort
                          </p>
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
                          {loadingSettings ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Refresh"
                          )}
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
                            onCheckedChange={(checked) =>
                              handleCustomAddOnChange(
                                addon.id,
                                checked as boolean
                              )
                            }
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
                            {addon.description && (
                              <p className="text-xs text-[#3C2317]/80 mt-1">
                                {addon.description}
                              </p>
                            )}
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
                        onChange={(e) =>
                          handleInputChange("customerName", e.target.value)
                        }
                        onBlur={(e) =>
                          handleBlur("customerName", e.target.value)
                        }
                        className={cn(
                          "border-2 border-[#D3B88C] focus:border-[#3C2317] focus:ring-2 focus:ring-[#3C2317]/20 transition-all duration-300 h-9 sm:h-10 rounded-lg sm:rounded-xl text-xs sm:text-sm",
                          errors.customerName &&
                            touched.customerName &&
                            "border-red-500 focus:border-red-500"
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
                        onChange={(e) =>
                          handleInputChange("customerEmail", e.target.value)
                        }
                        onBlur={(e) =>
                          handleBlur("customerEmail", e.target.value)
                        }
                        className={cn(
                          "border-2 border-[#D3B88C] focus:border-[#3C2317] focus:ring-2 focus:ring-[#3C2317]/20 transition-all duration-300 h-9 sm:h-10 rounded-lg sm:rounded-xl text-xs sm:text-sm",
                          errors.customerEmail &&
                            touched.customerEmail &&
                            "border-red-500 focus:border-red-500"
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
                        onChange={(e) =>
                          handleInputChange("customerPhone", e.target.value)
                        }
                        onBlur={(e) =>
                          handleBlur("customerPhone", e.target.value)
                        }
                        placeholder="+971501234567"
                        className={cn(
                          "border-2 border-[#D3B88C] focus:border-[#3C2317] focus:ring-2 focus:ring-[#3C2317]/20 transition-all duration-300 h-9 sm:h-10 rounded-lg sm:rounded-xl text-xs sm:text-sm",
                          errors.customerPhone &&
                            touched.customerPhone &&
                            "border-red-500 focus:border-red-500"
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

            {uiStep === 3 && (
              <form
                className="space-y-3 sm:space-4 lg:space-y-6"
                onSubmit={handleSubmit}
              >
                <Card className="border-[#D3B88C]/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-[#FBF9D9]/80 backdrop-blur-sm !pt-0">
                  <CardHeader className="bg-gradient-to-r from-[#D3B88C]/20 to-[#E6CFA9]/20 border-b border-[#D3B88C]/50 h-10 sm:h-12 py-2 sm:py-3 px-3 sm:px-6">
                    <CardTitle className="text-[#3C2317] text-sm sm:text-base lg:text-lg">
                      Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 !pt-0">
                    <div className="bg-[#D3B88C]/20 p-8 rounded-lg text-center">
                      <h4 className="font-bold text-[#3C2317] mb-3 text-2xl">
                        Complete Your Booking
                      </h4>
                      <p className="text-sm text-[#3C2317]/80 mb-6 max-w-md mx-auto">
                        Secure and seamless payment processing to finalize your
                        reservation with confidence.
                      </p>
                      <Button
                        onClick={handleSubmit}
                        type="submit"
                        className="bg-[#5D4037] text-[#FBF9D9] hover:bg-[#5D4037]/90 cursor-pointer px-8 py-4 rounded-lg"
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
            <Card className="sticky top-12 sm:top-16 lg:top-20 border-[#D3B88C]/50 shadow-2xl bg-gradient-to-br from-[#FBF9D9]/95 to-[#E6CFA9]/95 backdrop-blur-md overflow-hidden !pt-0 transform hover:scale-[1.01] lg:hover:scale-[1.02] transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-[#3C2317] to-[#5D4037] text-[#FBF9D9] p-4 sm:p-4 lg:p-6 relative overflow-hidden">
                <div className="relative z-10">
                  <CardTitle className="text-base sm:text-lg lg:text-xl font-bold flex items-center space-x-2">
                    <span>Booking Summary</span>
                  </CardTitle>
                  <p className="text-[#FBF9D9]/90 text-xs sm:text-sm">
                    Desert BBQ Experience
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3 lg:space-y-4 !pt-0">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-[#E6CFA9]/40 to-[#D3B88C]/30 rounded-lg sm:rounded-xl border border-[#D3B88C]/30 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#3C2317] rounded-full flex items-center justify-center">
                        <span className="text-[#FBF9D9] text-xs font-bold">
                          {formData.groupSize}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#3C2317] font-semibold text-xs sm:text-sm">
                          Group Size
                        </span>
                        <p className="text-[#3C2317]/70 text-xs">
                          Up to {formData.groupSize} people
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-[#3C2317] text-sm sm:text-base lg:text-lg">
                      AED {pricing.basePrice.toFixed(2)}
                    </span>
                  </div>

                  {pricing.specialPricingAmount > 0 && (
                    <div className="flex justify-between items-center text-xs sm:text-sm p-2 sm:p-3 bg-gradient-to-r from-[#E6CFA9]/20 to-[#D3B88C]/20 rounded-lg border border-[#D3B88C]/20">
                      <div className="flex items-center space-x-2">
                        <span className="text-[#3C2317]/80 font-medium">
                          {pricing.specialPricingName || "Special Pricing"}
                        </span>
                      </div>
                      <span className="text-[#3C2317] font-semibold">
                        AED {pricing.specialPricingAmount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {pricing.addOnsTotal > 0 && (
                    <div className="flex justify-between items-center text-xs sm:text-sm p-2 sm:p-3 bg-gradient-to-r from-[#E6CFA9]/20 to-[#D3B88C]/20 rounded-lg border border-[#D3B88C]/20">
                      <div className="flex items-center space-x-2">
                        <span className="text-[#3C2317]/80 font-medium">
                          Premium Add-ons
                        </span>
                      </div>
                      <span className="text-[#3C2317] font-semibold">
                        AED {pricing.addOnsTotal.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {pricing.customAddOnsCost > 0 && (
                    <div className="flex justify-between items-center text-xs sm:text-sm p-2 sm:p-3 bg-gradient-to-r from-[#E6CFA9]/20 to-[#D3B88C]/20 rounded-lg border border-[#D3B88C]/20">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#D3B88C] rounded-full"></div>
                        <span className="text-[#3C2317]/80 font-medium">
                          Other Services
                        </span>
                      </div>
                      <span className="text-[#3C2317] font-semibold">
                        AED {pricing.customAddOnsCost.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-[#D3B88C] pt-2 sm:pt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#3C2317] font-medium text-xs sm:text-sm">
                        Subtotal
                      </span>
                      <span className="text-[#3C2317] font-bold text-xs sm:text-sm">
                        AED {pricing.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#3C2317]/80">
                        VAT ({((settings?.vatRate || 0.05) * 100).toFixed(0)}%)
                      </span>
                      <span className="text-[#3C2317] font-medium">
                        AED {pricing.vat.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t-2 border-[#3C2317]/20 pt-4 sm:pt-4">
                    <div className="flex justify-between text-base sm:text-lg font-bold p-2 sm:p-3 bg-gradient-to-r from-[#3C2317]/10 to-[#5D4037]/10 rounded-lg sm:rounded-xl">
                      <span className="text-[#3C2317]">Total</span>
                      <span className="text-[#3C2317]">
                        AED {pricing.total.toFixed(2)}
                      </span>
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
                        <span>Reserve Your BBQ Setup</span>
                      </div>
                    )}
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-xs text-[#3C2317]/80 mb-3 sm:mb-3">
                    🔒 Secure payment powered by Stripe. You will be redirected
                    to complete your payment safely.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-[#E6CFA9]/50 to-[#D3B88C]/20 p-3 sm:p-4 lg:p-5 rounded-xl lg:rounded-2xl border border-[#3C2317]/10 shadow-md hover:shadow-lg transition-all duration-300">
                  <h4 className="font-bold text-[#3C2317] mb-3 sm:mb-4 text-sm sm:text-base lg:text-lg border-b border-[#3C2317]/20 pb-2">
                    Pricing Guide
                  </h4>

                  <div className="space-y-3 sm:space-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-[#3C2317]/80 flex items-center gap-2">
                        <i className="fa-solid fa-users"></i> Up to 10 people
                      </span>
                      <span className="font-semibold text-[11px] sm:text-xs text-[#3C2317]">
                        AED{" "}
                        {(
                          settings?.groupPrices?.[10] ||
                          DEFAULT_SETTINGS.groupPrices[10]
                        ).toFixed(2)}{" "}
                        + VAT
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-[#3C2317]/80 flex items-center gap-2">
                        <i className="fa-solid fa-users"></i> Up to 15 people
                      </span>
                      <span className="font-semibold text-[11px] sm:text-xs text-[#3C2317]">
                        AED{" "}
                        {(
                          settings?.groupPrices?.[15] ||
                          DEFAULT_SETTINGS.groupPrices[15]
                        ).toFixed(2)}{" "}
                        + VAT
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[11px] sm:text-xs text-[#3C2317]/80 flex items-center gap-2">
                        <i className="fa-solid fa-users"></i> Up to 20 people
                      </span>
                      <span className="font-semibold text-[11px] sm:text-xs text-[#3C2317]">
                        AED{" "}
                        {(
                          settings?.groupPrices?.[20] ||
                          DEFAULT_SETTINGS.groupPrices[20]
                        ).toFixed(2)}{" "}
                        + VAT
                      </span>
                    </div>

                    <div className="border-t border-[#3C2317]/20 pt-2 sm:pt-3 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] sm:text-xs text-[#3C2317]/90 flex items-center gap-2">
                          ⏰ Arrival Time
                        </span>
                        <span className="font-semibold text-[11px] sm:text-xs text-[#3C2317]">
                          6:00 PM (Fixed)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 right-3 z-50">
        <a
          href="https://wa.link/wf9dkt"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#25D366] hover:bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 cursor-pointer flex items-center justify-center"
          aria-label="Contact us on WhatsApp"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path d="M16 0C7.2 0 0 7.2 0 16c0 2.8.7 5.5 2.1 7.9L0 32l8.3-2.2c2.3 1.3 4.9 2 7.7 2 8.8 0 16-7.2 16-16S24.8 0 16 0zm0 29c-2.5 0-4.9-.7-7-2l-.5-.3-4.9 1.3 1.3-4.8-.3-.5C3.4 21.6 3 18.8 3 16 3 8.8 8.8 3 16 3s13 5.8 13 13-5.8 13-13 13zm7.4-9.4c-.4-.2-2.3-1.1-2.6-1.2-.4-.2-.6-.2-.9.2-.3.4-1 1.2-1.2 1.4-.2.2-.4.3-.8.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.9-2.2-2.1-2.6-.2-.4 0-.6.2-.8.2-.2.4-.4.6-.6.2-.2.3-.4.5-.6.2-.2.2-.4.1-.7s-.9-2.1-1.3-2.9c-.3-.7-.6-.6-.9-.6h-.8c-.3 0-.7.1-1.1.5-.4.4-1.5 1.4-1.5 3.4s1.6 3.9 1.8 4.2c.2.3 3.1 4.7 7.7 6.6 1.1.5 2 .8 2.7 1 .6.2 1.1.2 1.6.1.5-.1 1.6-.6 1.8-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.7-.4z" />
          </svg>
        </a>
      </div>
    </div>
  );
}
