"use client"

import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { ReraCalculator } from "@/components/data/rera-calculator"
import { RERA_BANDS } from "@/lib/rera"

export default function RentCalculatorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="RERA Rent Increase Calculator"
        description="Estimate the maximum legal rent increase allowed under the Dubai RERA rental index bands"
      />

      <ReraCalculator />

      <Card className="p-6">
        <h3 className="font-semibold mb-4">RERA Rental Increase Bands</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                  Below Market Rent
                </th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                  Max Allowed Increase
                </th>
              </tr>
            </thead>
            <tbody>
              {RERA_BANDS.map((band) => (
                <tr key={band.label} className="border-b border-border">
                  <td className="py-2 px-3">{band.label}</td>
                  <td className="py-2 px-3 text-right font-medium">
                    {band.maxIncreasePct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Reference: Dubai RERA Decree No. (43) of 2013 on determining the increase percentage
          on rental values in the Emirate of Dubai.
        </p>
      </Card>
    </div>
  )
}
