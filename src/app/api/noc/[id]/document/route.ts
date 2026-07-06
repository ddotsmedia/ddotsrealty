import React from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import { auth } from "@/lib/auth"
import { db } from "@/server/db"
import { nocRequests, propertyTenants } from "@/server/db/schema"
import { eq, and } from "drizzle-orm"
import { NocDocument } from "@/lib/pdf/noc"

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

    const noc = await db.query.nocRequests.findFirst({
      where: and(
        eq(nocRequests.id, id),
        role === "super_admin" && tenantId === null
          ? undefined
          : eq(nocRequests.tenantId, tenantId!)
      ),
    })

    if (!noc) {
      return new Response("NOC not found", { status: 404 })
    }

    if (noc.status !== "approved") {
      return new Response("NOC is not approved", { status: 400 })
    }

    let tenantName: string | null = null
    if (noc.propertyTenantId) {
      const pt = await db.query.propertyTenants.findFirst({
        where: eq(propertyTenants.id, noc.propertyTenantId),
        columns: { id: true, name: true },
      })
      tenantName = pt?.name ?? null
    }

    const data = {
      id: noc.id,
      nocType: noc.nocType,
      tenantName,
      description: noc.description ?? null,
      issuedAt: noc.reviewedAt ?? noc.createdAt,
      validUntil: noc.validUntil ?? null,
      nocDocumentUrl: noc.nocDocumentUrl ?? null,
    }

    const buffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(NocDocument, { data }) as any
    )

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="noc-${id}.pdf"`,
      },
    })
  } catch (error) {
    console.error("NOC document route error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
