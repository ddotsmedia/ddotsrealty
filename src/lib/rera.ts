// Dubai RERA rental increase calculator
// Based on Decree No. (43) of 2013 — Determining the Increase Percentage on Rental Values
// The allowed increase is banded by how far the CURRENT rent is below the
// average market rent (per RERA's rental index) for a similar unit.

export interface ReraBand {
  minBelowPct: number
  maxBelowPct: number
  maxIncreasePct: number
  label: string
}

export const RERA_BANDS: ReraBand[] = [
  { minBelowPct: 0, maxBelowPct: 10, maxIncreasePct: 0, label: "Up to 10% below market" },
  { minBelowPct: 11, maxBelowPct: 20, maxIncreasePct: 5, label: "11% – 20% below market" },
  { minBelowPct: 21, maxBelowPct: 30, maxIncreasePct: 10, label: "21% – 30% below market" },
  { minBelowPct: 31, maxBelowPct: 40, maxIncreasePct: 15, label: "31% – 40% below market" },
  { minBelowPct: 41, maxBelowPct: Infinity, maxIncreasePct: 20, label: "More than 40% below market" },
]

export interface RentIncreaseInput {
  currentRent: number
  marketRent: number
}

export interface RentIncreaseResult {
  pctBelowMarket: number
  allowedIncreasePct: number
  maxNewRent: number
  bandLabel: string
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function calcRentIncrease(input: RentIncreaseInput): RentIncreaseResult {
  const { currentRent, marketRent } = input

  if (!marketRent || marketRent <= 0 || !currentRent || currentRent <= 0 || currentRent >= marketRent) {
    return {
      pctBelowMarket: 0,
      allowedIncreasePct: 0,
      maxNewRent: round2(currentRent > 0 ? currentRent : 0),
      bandLabel: currentRent >= marketRent ? "At or above market" : "—",
    }
  }

  const pctBelowMarket = round2(((marketRent - currentRent) / marketRent) * 100)

  const band =
    RERA_BANDS.find((b) => pctBelowMarket >= b.minBelowPct && pctBelowMarket <= b.maxBelowPct) ??
    RERA_BANDS[RERA_BANDS.length - 1]

  const allowedIncreasePct = band.maxIncreasePct
  const maxNewRent = round2(currentRent * (1 + allowedIncreasePct / 100))

  return {
    pctBelowMarket,
    allowedIncreasePct,
    maxNewRent,
    bandLabel: band.label,
  }
}
