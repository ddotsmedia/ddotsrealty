import { addDays } from "date-fns"
import { cheques } from "@/server/db/schema"

export function buildChequeSchedule(opts: {
  rentAmount: number
  numCheques: number
  startDate: Date
  endDate: Date
}): { amount: number; dueDate: Date }[] {
  const { rentAmount, numCheques, startDate, endDate } = opts

  if (numCheques <= 0) return []

  // Base amount per cheque (rounded to 2 decimal places)
  const baseAmount = Math.round((rentAmount / numCheques) * 100) / 100

  // Spacing in days between cheques
  const termMs = endDate.getTime() - startDate.getTime()
  const termDays = termMs / (1000 * 60 * 60 * 24)
  const spacingDays = termDays / numCheques

  const result: { amount: number; dueDate: Date }[] = []

  for (let i = 0; i < numCheques; i++) {
    const dueDate = addDays(startDate, Math.round(i * spacingDays))

    // Last cheque absorbs rounding remainder
    let amount: number
    if (i === numCheques - 1) {
      const sumSoFar = result.reduce((acc, c) => acc + c.amount, 0)
      amount = Math.round((rentAmount - sumSoFar) * 100) / 100
    } else {
      amount = baseAmount
    }

    result.push({ amount, dueDate })
  }

  return result
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateChequesForContract(db: any, contract: any): Promise<number> {
  const schedule = buildChequeSchedule({
    rentAmount: Number(contract.rentAmount),
    numCheques: contract.numCheques,
    startDate: new Date(contract.startDate),
    endDate: new Date(contract.endDate),
  })

  if (schedule.length === 0) return 0

  const rows = schedule.map((item) => ({
    tenantId: contract.tenantId,
    contractId: contract.id,
    propertyId: contract.propertyId,
    propertyTenantId: contract.propertyTenantId,
    ownerId: contract.ownerId ?? null,
    amount: String(item.amount),
    dueDate: item.dueDate,
    status: "pending" as const,
    chequeNumber: null,
  }))

  await db.insert(cheques).values(rows)

  return rows.length
}
