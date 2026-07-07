import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { contracts, properties, propertyTenants } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { RenewalOfferDocument } from "@/lib/pdf/renewal-offer";

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
    const newRentParam = url.searchParams.get("newRent");
    const startDateParam = url.searchParams.get("startDate");
    const endDateParam = url.searchParams.get("endDate");

    const tenantId = (session.user as any).tenantId ?? null; // eslint-disable-line @typescript-eslint/no-explicit-any
    const role = (session.user as any).role ?? null; // eslint-disable-line @typescript-eslint/no-explicit-any

    const contract = await db.query.contracts.findFirst({
      where: and(
        eq(contracts.id, id),
        role === "super_admin" && tenantId === null
          ? undefined
          : eq(contracts.tenantId, tenantId!)
      ),
    });

    if (!contract) {
      return new Response("Contract not found", { status: 404 });
    }

    const property = await db.query.properties.findFirst({
      where: eq(properties.id, contract.propertyId),
      columns: { id: true, title: true },
    });

    const tenant = await db.query.propertyTenants.findFirst({
      where: eq(propertyTenants.id, contract.propertyTenantId),
      columns: { id: true, name: true },
    });

    const currentRent = Number(contract.rentAmount);
    const newRent = newRentParam ? Number(newRentParam) : currentRent;
    const startDate = startDateParam ? new Date(startDateParam) : new Date(contract.endDate);
    const endDate = endDateParam
      ? new Date(endDateParam)
      : new Date(
          new Date(contract.endDate).setFullYear(new Date(contract.endDate).getFullYear() + 1)
        );
    const increasePct = currentRent > 0 ? ((newRent - currentRent) / currentRent) * 100 : 0;

    const data = {
      contract: {
        id: contract.id,
        ejariNumber: contract.ejariNumber,
      },
      propertyTitle: property?.title ?? "—",
      tenantName: tenant?.name ?? "—",
      currentRent,
      newRent,
      startDate,
      endDate,
      increasePct,
    };

    const buffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(RenewalOfferDocument, { data }) as any
    );

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="renewal-offer-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Renewal offer route error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
