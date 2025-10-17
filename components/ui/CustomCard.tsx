"use client"
import Image from "next/image"
import type { CardComponentProps } from "nextstepjs"

// full-body avatar
import avatar from "@/public/placeholder-user.jpg"

export const CustomCard = ({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  arrow,
}: CardComponentProps) => {
  return (
    <div className="relative w-[340px] rounded-xl bg-[#fff8f0] shadow-md border border-[#e2c7a0] p-6 flex flex-col gap-4">
      {/* Avatar floating above card */}
      <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
        <div className="w-28 h-28 overflow-hidden">
          <Image
            src={avatar || "/placeholder.svg"}
            alt="Tour Guide Avatar"
            width={112}
            height={112}
            className="object-contain"
          />
        </div>
      </div>

      {/* Step header */}
      <div className="mt-16 flex items-center gap-2">
        {/* <span className="text-2xl">{step.icon}</span> */}
        <h1 className="text-lg font-bold text-[#5c3d2e]">{step.title}</h1>
      </div>

      {/* Progress */}
      <h2 className="text-sm text-[#7a5c43]">
        Step {currentStep + 1} of {totalSteps}
      </h2>

      {/* Content */}
      <p className="text-[#4a3b2c] leading-relaxed">{step.content}</p>

      {/* Navigation controls */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={prevStep}
          className="px-3 py-1 text-sm rounded-lg bg-[#f5e1c8] text-[#5c3d2e] hover:bg-[#e9d3b5] transition"
        >
          Previous
        </button>
        <button
          onClick={nextStep}
          className="px-3 py-1 text-sm rounded-lg bg-[#d97b2a] text-white hover:bg-[#c46b21] transition"
        >
          Next
        </button>
        <button
          onClick={skipTour}
          className="px-3 py-1 text-sm rounded-lg bg-[#f5c2b5] text-[#7a1f0f] hover:bg-[#eba699] transition"
        >
          Skip
        </button>
      </div>

      {/* Pointer arrow */}
      <div className="absolute">{arrow}</div>
    </div>
  )
}
