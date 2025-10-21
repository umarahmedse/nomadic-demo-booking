"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function BarbecueFailedPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="max-w-2xl mx-auto p-6 md:p-10">
        <Card>
          <CardHeader>
            <CardTitle>Payment Cancelled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>Your Desert Barbecue Setup payment was not completed.</p>
            <Button asChild>
              <Link href="/barbecue">Try again</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
