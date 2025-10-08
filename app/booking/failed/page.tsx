"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Mail, Headset, CreditCard, MapPin, Star } from "lucide-react";
import Link from "next/link";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import Image from "next/image";

export default function BookingFailedPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-[#3C2317]/90 backdrop-blur-md border-b border-[#3C2317]/50 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-4 group">
              <Image
                src="/logo.png"
                alt="NOMADIC"
                width={140}
                height={45}
                className="h-10 w-auto"
              />
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Failure Header */}
        <div className="text-center mb-6">
          <div className="w-full flex justify-center">
            <div className="w-64">
              <DotLottieReact src="/failed.lottie" loop autoplay />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#3C2317] mb-3">
            Payment <span className="text-[#D3B88C]">Failed</span>
          </h1>
          <p className="text-base text-[#3C2317]/80">
            Oops! Your payment could not be processed. Please try again or
            contact support if the issue persists.
          </p>
        </div>

        {/* Next Steps */}
        <Card className="mt-6 border-[#D3B88C]/50 shadow-xl bg-[#FBF9D9]/80 backdrop-blur-sm !py-0 !gap-0">
          <CardHeader className="bg-gradient-to-r from-[#D3B88C]/20 to-[#E6CFA9]/20 px-2 sm:px-3 lg:px-4 h-8 sm:h-10 py-1.5 sm:py-2 border-b border-[#D3B88C]/30">
            <CardTitle className="text-[#3C2317] text-base">
              How to Proceed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start space-x-2">
              <CreditCard className="w-4 h-4 text-[#3C2317] mt-0.5" />
              <div>
                <p className="font-medium text-[#3C2317] text-sm">Retry Payment</p>
                <p className="text-[#3C2317]/80 text-sm">
                  You can attempt the payment again from the bookings page.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Mail className="w-4 h-4 text-[#3C2317] mt-0.5" />
              <div>
                <p className="font-medium text-[#3C2317] text-sm">Check Email</p>
                <p className="text-[#3C2317]/80 text-sm">
                  If any charges were made, you'll receive a confirmation email
                  shortly.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Headset className="w-4 h-4 text-[#3C2317] mt-0.5" />
              <div>
                <p className="font-medium text-[#3C2317] text-sm">Contact Support</p>
                <p className="text-[#3C2317]/80 text-sm">
                  Our team is here to help. Please reach out if you continue to
                  face issues.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Information */}
        <Card className="mt-4 border-[#D3B88C]/50 shadow-xl bg-[#FBF9D9]/80 backdrop-blur-sm !py-0 !gap-0">
          <CardHeader className="bg-gradient-to-r from-[#D3B88C]/20 to-[#E6CFA9]/20 px-2 sm:px-3 lg:px-4 h-8 sm:h-10 py-1.5 sm:py-2 border-b border-[#D3B88C]/30">
            <CardTitle className="text-[#3C2317] text-base">Get Help</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <h3 className="font-medium text-[#3C2317] text-sm">Email Support</h3>
                <p className="text-[#3C2317]/80 text-sm">support@nomadic.com</p>
                <p className="text-xs text-[#3C2317]/60">
                  Typically responds within 1 hour
                </p>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-medium text-[#3C2317] text-sm">Phone Support</h3>
                <p className="text-[#3C2317]/80 text-sm">+971 800 666 234</p>
                <p className="text-xs text-[#3C2317]/60">
                  Available 9AM - 6PM GST
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-[#3C2317] to-[#5D4037] hover:from-[#3C2317]/90 hover:to-[#5D4037]/90 text-[#FBF9D9] font-bold py-3 text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
          >
            <Link href="https://nomadic.ae/">Return Home</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-2 border-[#D3B88C] hover:border-[#3C2317] hover:bg-[#3C2317]/5 text-[#3C2317] transition-all duration-300 cursor-pointer py-3 text-base"
          >
            <Link href="https://nomadic.ae/">Try Again</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
