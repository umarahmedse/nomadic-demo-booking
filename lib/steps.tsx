import { Tour } from "nextstepjs";

export const steps: Tour[] = [
  {
    tour: "firsttour",
    steps: [
      {
        icon: "🧑‍🚀",
        title: "Welcome to the Nomadic Booking System!",
        content:
          "Hi there! I'm your guide. Let me walk you through everything step by step.",
        // selector: "body", // Attach to the whole page (or null if allowed by lib)
        showControls: true,
        showSkip: true,
        pointerPadding: 0,
        pointerRadius: 0,
      },
      {
        icon: "👋",
        title: "Say Yalla To Adventure",
        content:
          "Please Read The Instructions Carefully Before Booking A Unique Adventure",
        selector: "#tour1-step1",
        side: "top",
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: "🎉",
        title: "Continue the Booking",
        content: "Once you've read everything — click Next to proceed.",
        selector: "#tour1-step2",
        side: "top",
        showControls: true,
        showSkip: false,
        pointerPadding: 10,
        pointerRadius: 10,
      },
    ],
  },
  {
    tour: "secondtour",
    steps: [
      {
        icon: "🚀",
        title: "Choose your perfect date",
        content: "Choose the date that suits your adventure plans!",
        selector: "#tour2-step1",
        side: "top",
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
    icon: "📍",
    title: "Location & Setup",
    content: "Set your adventure location and initial setup!",
    selector: "#tour2-step2",
    side: "right",
    showControls: true,
    showSkip: true,
    pointerPadding: 10,
    pointerRadius: 10,
  },
  {
    icon: "📝",
    title: "Booking Details",
    content: "Fill in all the booking details for your adventure.",
    selector: "#tour2-step3",
    side: "right",
    showControls: true,
    showSkip: true,
    pointerPadding: 10,
    pointerRadius: 10,
  },
  {
    icon: "📄",
    title: "Booking Summary",
    content: "Review your booking summary before confirming.",
    selector: "#tour2-step4",
    side: "left",
    showControls: true,
    showSkip: true,
    pointerPadding: 10,
    pointerRadius: 10,
  },
    ],
  },
];
