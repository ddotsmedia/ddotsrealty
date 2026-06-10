import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { owners, properties, contracts, cheques, commissions, maintenanceRequests } from "@/server/db/schema";
import { eq, and, gte, lte, sum } from "drizzle-orm";
import { OwnerStatementDocument } from "@/lib/pdf/owner-statement";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;
    const url = new URL(request.url);
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");

    // Parse dates or default to current month
    let from: Date;
    let to: Date;

    if (fromParam && toParam) {
      from = new Date(fromParam);
      to = new Date(toParam);
    } else {
      const now = new Date();
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const tenantId = (session.user as any).tenantId ?? null; // eslint-disable-line @typescript-eslint/no-explicit-any
    const role = (session.user as any).role ?? null; // eslint-disable-line @typescript-eslint/no-explicit-any

    // Get owner
    const owner = await db.query.owners.findFirst({
      where: and(
        eq(owners.id, id),
        role === "super_admin" && tenantId === null
          ? undefined
          : eq(owners.tenantId, tenantId!)
      ),
    });

    if (!owner) {
      return new Response("Owner not found", { status: 404 });
    }

    // Calculate totalRent
    const rentResult = await db
      .select({ total: sum(cheques.amount) })
      .from(cheques)
      .where(
        and(
          eq(cheques.ownerId, id),
          eq(cheques.direction, "receivable"),
          eq(cheques.status, "cleared"),
          gte(cheques.clearedDate, from),
          lte(cheques.clearedDate, to),
          role === "super_admin" && tenantId === null
            ? undefined
            : eq(cheques.tenantId, tenantId!)
        )
      );

    const totalRent = rentResult[0]?.total ? Number(rentResult[0].total) : 0;

    // Calculate totalCommission
    const commissionResult = await db
      .select({ total: sum(commissions.commissionAmount) })
      .from(commissions)
      .innerJoin(contracts, eq(commissions.contractId, contracts.id))
      .where(
        and(
          eq(contracts.ownerId, id),
          gte(commissions.createdAt, from),
          lte(commissions.createdAt, to),
          role === "super_admin" && tenantId === null
            ? undefined
            : eq(commissions.tenantId, tenantId!)
        )
      );

    const totalCommission = commissionResult[0]?.total
      ? Number(commissionResult[0].total)
      : 0;

    // Calculate totalMaintenance
    const maintenanceResult = await db
      .select({ total: sum(maintenanceRequests.costActual) })
      .from(maintenanceRequests)
      .innerJoin(properties, eq(maintenanceRequests.propertyId, properties.id))
      .where(
        and(
          eq(properties.ownerId, id),
          gte(maintenanceRequests.completedAt, from),
          lte(maintenanceRequests.completedAt, to),
          role === "super_admin" && tenantId === null
            ? undefined
            : eq(maintenanceRequests.tenantId, tenantId!)
        )
      );

    const totalMaintenance = maintenanceResult[0]?.total
      ? Number(maintenanceResult[0].total)
      : 0;

    // Calculate netPayable
    const netPayable = totalRent - totalCommission - totalMaintenance;

    const data = {
      owner: {
        id: owner.id,
        name: owner.name,
      },
      from,
      to,
      totalRent,
      totalCommission,
      totalMaintenance,
      netPayable,
    };

    const buffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(OwnerStatementDocument, { data }) as any
    );

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="owner-statement-${owner.name.replace(/\s+/g, "-").toLowerCase()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Statement route error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
