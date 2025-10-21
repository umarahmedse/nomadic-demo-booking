"use client"

type Step = {
  label: string
}

export default function Stepper({
  steps,
  active = 1,
  className = "",
  onChange,
}: {
  steps: Step[]
  active?: number
  className?: string
  onChange?: (step: number) => void // Added onChange prop
}) {
  return (
    <nav aria-label="Progress" className={className}>
      <ol className="grid grid-cols-3 mx-auto">
        {steps.map((step, idx) => {
          const stepNumber = idx + 1
          const isActive = stepNumber === active
          const isCompleted = stepNumber < active

          return (
            <li key={step.label} className="flex items-center flex-1">
              {/* connector line before the circle */}
              {idx > 0 && (
                <span
                  aria-hidden="true"
                  className={`h-px flex-1 -mr-1 ${isCompleted ? "bg-[#3C2317]" : "bg-[#d6af6f]"}`}
                />
              )}

              <div className="flex items-center pr-2">
                <span
                  aria-current={isActive ? "step" : undefined}
                  className={[
                    "inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border-2 text-xs sm:text-sm font-semibold cursor-pointer", // Added cursor-pointer for clickable steps
                    isCompleted
                      ? "bg-[#3C2317] border-[#3C2317] text-white"
                      : isActive
                        ? "bg-[#E6CFA9] border-[#3C2317] text-[#3C2317]"
                        : "bg-[#FBF9D9] border-[#D3B88C] text-[#3C2317]/70",
                  ].join(" ")}
                  onClick={() => onChange?.(stepNumber)} // Added click handler to call onChange
                >
                  {stepNumber}
                </span>
                <span
                  className={[
                    "hidden md:block text-[11px] sm:text-xs lg:text-sm font-medium ml-2 cursor-pointer", // Added cursor-pointer
                    isCompleted ? "text-[#3C2317]" : isActive ? "text-[#3C2317]" : "text-[#3C2317]/70",
                  ].join(" ")}
                  onClick={() => onChange?.(stepNumber)} // Added click handler to call onChange
                >
                  {step.label}
                </span>
              </div>

              {/* connector line after the circle */}
              {idx < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`h-px flex-1 -ml-1 ${isCompleted ? "bg-[#3C2317]" : "bg-[#d6af6f]"}`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
