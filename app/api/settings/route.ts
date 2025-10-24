import { type NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

type Settings = {
  tentPrice: number;
  addOnPrices: { charcoal: number; firewood: number; portableToilet: number };
  customAddOns: Array<{
    id: string;
    name: string;
    price: number;
    description?: string;
  }>;
  wadiSurcharge: number;
  vatRate: number;
  maxTentsPerDay: number;
  specialPricing: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    amount: number;
    type: "total" | "per-tent";
    isActive: boolean;
  }>;
  locations: Array<{
    id: string;
    name: string;
    weekdayPrice: number;
    weekendPrice: number;
    surcharge: number;
    isActive: boolean;
  }>;
  updatedAt?: Date;
};

const DEFAULTS: Settings = {
  tentPrice: 1297,
  addOnPrices: {
    charcoal: 60,
    firewood: 75,
    portableToilet: 200,
  },
  customAddOns: [],
  wadiSurcharge: 250,
  vatRate: 0.05,
  maxTentsPerDay: 15,
  specialPricing: [],
  locations: [
    {
      id: "desert",
      name: "Desert",
      weekdayPrice: 1297,
      weekendPrice: 1497,
      surcharge: 0,
      isActive: true,
    },
    {
      id: "wadi",
      name: "Wadi",
      weekdayPrice: 1297,
      weekendPrice: 1497,
      surcharge: 250,
      isActive: true,
    },
  ],
};

export async function GET() {
  try {
    const db = await getDatabase();
    let settings = await db.collection("settings").findOne({});
    if (!settings) {
      const result = await db
        .collection("settings")
        .insertOne({ ...DEFAULTS, updatedAt: new Date() });
      settings = { _id: result.insertedId, ...DEFAULTS };
    }
    return NextResponse.json({
      tentPrice: settings.tentPrice ?? DEFAULTS.tentPrice,
      addOnPrices: settings.addOnPrices ?? DEFAULTS.addOnPrices,
      customAddOns: settings.customAddOns ?? [],
      wadiSurcharge: settings.wadiSurcharge ?? DEFAULTS.wadiSurcharge,
      vatRate: settings.vatRate ?? DEFAULTS.vatRate,
      maxTentsPerDay: settings.maxTentsPerDay ?? DEFAULTS.maxTentsPerDay,
      specialPricing: settings.specialPricing ?? DEFAULTS.specialPricing,
      locations: settings.locations ?? DEFAULTS.locations,
    });
  } catch (e) {
    console.error("Camping settings GET error:", e);
    return NextResponse.json(DEFAULTS, { status: 200 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = (await request.json()) as Partial<Settings>;
    const clean: Settings = {
      tentPrice: Number(payload.tentPrice ?? DEFAULTS.tentPrice),
      addOnPrices: {
        charcoal: Number(
          payload.addOnPrices?.charcoal ?? DEFAULTS.addOnPrices.charcoal
        ),
        firewood: Number(
          payload.addOnPrices?.firewood ?? DEFAULTS.addOnPrices.firewood
        ),
        portableToilet: Number(
          payload.addOnPrices?.portableToilet ??
            DEFAULTS.addOnPrices.portableToilet
        ),
      },
      customAddOns: (payload.customAddOns ?? []).map((a) => ({
        id: a.id || Date.now().toString(),
        name: a.name || "",
        price: Number(a.price) || 0,
        description: a.description || "",
      })),
      wadiSurcharge: Number(payload.wadiSurcharge ?? DEFAULTS.wadiSurcharge),
      vatRate:
        typeof payload.vatRate === "number"
          ? payload.vatRate
          : DEFAULTS.vatRate,
      maxTentsPerDay: Number(payload.maxTentsPerDay ?? DEFAULTS.maxTentsPerDay),
      specialPricing: (payload.specialPricing ?? []).map((sp) => ({
        id: sp.id || Date.now().toString(),
        name: sp.name || "",
        startDate: sp.startDate || "",
        endDate: sp.endDate || "",
        amount: Number(sp.amount) || 0,
        type: (sp.type as "total" | "per-tent") || "total",
        isActive: sp.isActive ?? true,
      })),
      locations: (payload.locations ?? DEFAULTS.locations).map((loc) => ({
        id: loc.id || Date.now().toString(),
        name: loc.name || "",
        weekdayPrice: Number(loc.weekdayPrice) || 0,
        weekendPrice: Number(loc.weekendPrice) || 0,
        surcharge: Number(loc.surcharge) || 0,
        isActive: loc.isActive ?? true,
      })),
      updatedAt: new Date(),
    };

    const db = await getDatabase();
    await db
      .collection("settings")
      .updateOne({}, { $set: clean }, { upsert: true });
    return NextResponse.json(clean);
  } catch (e) {
    console.error("Camping settings PATCH error:", e);
    return NextResponse.json(
      { error: "Failed to update camping settings" },
      { status: 500 }
    );
  }
}
