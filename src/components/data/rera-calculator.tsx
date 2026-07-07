"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { calcRentIncrease } from "@/lib/rera"
import { formatCurrency } from "@/lib/utils"

interface ReraCalculatorProps {
  defaultCurrentRent?: number
  onApply?: (maxNewRent: number) => void
}

export function ReraCalculator({ defaultCurrentRent, onApply }: ReraCalculatorProps) {
  const [currentRent, setCurrentRent] = useState<string>(
    defaultCurrentRent !== undefined ? String(defaultCurrentRent) : ""
  )
  const [marketRent, setMarketRent] = useState<string>("")

  const result = useMemo(() => {
    return calcRentIncrease({
      currentRent: Number(currentRent) || 0,
      marketRent: Number(marketRent) || 0,
    })
  }, [currentRent, marketRent])

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">RERA Rent Increase Calculator</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Current Rent (AED)</label>
          <Input
            type="number"
            min="0"
            placeholder="e.g. 60000"
            value={currentRent}
            onChange={(e) => setCurrentRent(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Average Market Rent (AED)</label>
          <Input
            type="number"
            min="0"
            placeholder="e.g. 75000"
            value={marketRent}
            onChange={(e) => setMarketRent(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-muted/40 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">% Below Market</span>
          <span className="font-semibold">{result.pctBelowMarket.toFixed(2)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Band</span>
          <span className="font-medium text-sm">{result.bandLabel}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Allowed Increase</span>
          <span className="font-semibold">{result.allowedIncreasePct}%</span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2 mt-2">
          <span className="text-sm font-semibold">Max Legal New Rent</span>
          <span className="text-lg font-bold text-primary">{formatCurrency(result.maxNewRent)}</span>
        </div>
      </div>

      {onApply && (
        <div className="mt-4">
          <Button size="sm" onClick={() => onApply(result.maxNewRent)}>
            Apply to Renewal
          </Button>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Based on Dubai RERA rental increase bands (Decree No. 43 of 2013), calculated against
        the RERA rental index. This is a guide only — always confirm against the current
        published index for the unit&apos;s location and type.
      </p>
    </Card>
  )
}
