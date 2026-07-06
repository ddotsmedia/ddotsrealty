import React from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import { auth } from "@/lib/auth"
import { db } from "@/server/db"
import { tenantClearances, propertyTenants, properties } from "@/server/db/schema"
import { eq, and } from "drizzle-orm"
import { ClearanceCertificateDocument } from "@/lib/pdf/clearance-certificate"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { id } = await context.params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tenantId = (session.user as any).tenantId ?? null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const role = (session.user as any).role ?? null

    const clearance = await db.query.tenantClearances.findFirst({
      where: and(
        eq(tenantClearances.id, id),
        role === "super_admin" && tenantId === null
          ? undefined
          : eq(tenantClearances.tenantId, tenantId!)
      ),
    })

    if (!clearance) {
      return new Response("Clearance not found", { status: 404 })
    }

    let tenantName: string | null = null
    if (clearance.propertyTenantId) {
      const pt = await db.query.propertyTenants.findFirst({
        where: eq(propertyTenants.id, clearance.propertyTenantId),
        columns: { id: true, name: true },
      })
      tenantName = pt?.name ?? null
    }

    let propertyTitle: string | null = null
    if (clearance.propertyId) {
      const prop = await db.query.properties.findFirst({
        where: eq(properties.id, clearance.propertyId),
        columns: { id: true, title: true },
      })
      propertyTitle = prop?.title ?? null
    }

    const data = {
      id: clearance.id,
      tenantName,
      propertyTitle,
      actualMoveOut: clearance.actualMoveOut ?? null,
      plannedMoveOut: clearance.plannedMoveOut ?? null,
      clearedAt: clearance.clearedAt ?? null,
      outstandingRent: clearance.outstandingRent,
      outstandingUtility: clearance.outstandingUtility,
      outstandingMaintenance: clearance.outstandingMaintenance,
      penaltyAmount: clearance.penaltyAmount,
      totalOutstanding: clearance.totalOutstanding,
      depositAmount: clearance.depositAmount ?? null,
      depositDeductions: clearance.depositDeductions,
      depositRefundAmount: clearance.depositRefundAmount,
      settlementStatus: clearance.settlementStatus,
    }

    const buffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(ClearanceCertificateDocument, { data }) as any
    )

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="clearance-${id}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Clearance certificate route error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
