import { TRPCError } from "@trpc/server"
import { z } from "zod"
import {
  eq,
  and,
  or,
  ilike,
  gte,
  lte,
  desc,
  asc,
  count,
} from "drizzle-orm"
import { createTRPCRouter, tenantProcedure } from "@/server/trpc/trpc"
import { db } from "@/server/db"
import {
  contracts,
  cheques,
  properties,
  owners,
  propertyTenants,
} from "@/server/db/schema"
import {
  contractCreateSchema,
  contractUpdateSchema,
  contractListSchema,
  contractRenewSchema,
} from "@/lib/validators/contract"
import { generateChequesForContract } from "@/server/services/cheque.service"

export const contractRouter = createTRPCRouter({
  list: tenantProcedure
    .input(contractListSchema)
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, status, sortBy, sortDir } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = []

      // Tenant scope
      if (ctx.role !== "super_admin" || ctx.tenantId) {
        conditions.push(eq(contracts.tenantId, ctx.tenantId!))
      }

      if (search) {
        conditions.push(
          or(
            ilike(contracts.ejariNumber, `%${search}%`),
            ilike(contracts.tawtheeqNumber, `%${search}%`)
          )
        )
      }

      if (status) {
        conditions.push(eq(contracts.status, status as "active" | "expired" | "terminated" | "pending_renewal"))
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined

      // Total count
      const totalResult = await db
        .select({ count: count() })
        .from(contracts)
        .where(where)
      const total = totalResult[0]?.count ?? 0

      // Sort column
      const orderByColumn =
        sortBy === "endDate"
          ? contracts.endDate
          : sortBy === "rentAmount"
            ? contracts.rentAmount
            : contracts.createdAt

      const orderByDir = sortDir === "asc" ? asc : desc

      const rows = await db
        .select()
        .from(contracts)
        .where(where)
        .orderBy(orderByDir(orderByColumn))
        .limit(pageSize)
        .offset((page - 1) * pageSize)

      // Enrich with property title and tenant name
      const items = await Promise.all(
        rows.map(async (row) => {
          const property = await db.query.properties.findFirst({
            where: eq(properties.id, row.propertyId),
            columns: { id: true, title: true, referenceNo: true },
          })
          const tenant = await db.query.propertyTenants.findFirst({
            where: eq(propertyTenants.id, row.propertyTenantId),
            columns: { id: true, name: true },
          })
          // Count cheques for this contract
          const chequeCount = await db
            .select({ count: count() })
            .from(cheques)
            .where(eq(cheques.contractId, row.id))
          return {
            ...row,
            propertyTitle: property?.title ?? null,
            propertyRef: property?.referenceNo ?? null,
            tenantName: tenant?.name ?? null,
            chequeCount: chequeCount[0]?.count ?? 0,
          }
        })
      )

      return {
        items,
        total,
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
      }
    }),

  getById: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const contract = await db.query.contracts.findFirst({
        where: and(
          eq(contracts.id, input.id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(contracts.tenantId, ctx.tenantId!)
        ),
      })

      if (!contract) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" })
      }

      const property = await db.query.properties.findFirst({
        where: eq(properties.id, contract.propertyId),
        columns: { id: true, title: true, referenceNo: true },
      })

      const tenant = await db.query.propertyTenants.findFirst({
        where: eq(propertyTenants.id, contract.propertyTenantId),
        columns: { id: true, name: true, phone: true },
      })

      let owner = null
      if (contract.ownerId) {
        owner = await db.query.owners.findFirst({
          where: eq(owners.id, contract.ownerId),
          columns: { id: true, name: true, phone: true },
        })
      }

      const contractCheques = await db
        .select()
        .from(cheques)
        .where(eq(cheques.contractId, contract.id))
        .orderBy(asc(cheques.dueDate))

      return {
        ...contract,
        property: property ?? null,
        tenant: tenant ?? null,
        owner: owner ?? null,
        cheques: contractCheques,
      }
    }),

  create: tenantProcedure
    .input(contractCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No tenant selected" })
      }

      const [inserted] = await db
        .insert(contracts)
        .values({
          ...input,
          tenantId: ctx.tenantId,
          ownerId: input.ownerId ?? null,
          rentAmount: String(input.rentAmount),
          securityDeposit: input.securityDeposit ? String(input.securityDeposit) : null,
          commissionPct: input.commissionPct ? String(input.commissionPct) : null,
          depositDeductions: String(input.depositDeductions ?? 0),
          escalationPct: input.escalationPct ? String(input.escalationPct) : null,
          earlyTerminationPenalty: input.earlyTerminationPenalty ? String(input.earlyTerminationPenalty) : null,
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .returning({ id: contracts.id })

      let chequesCreated = 0
      if (input.paymentMode === "cheques" || input.paymentMode === "mixed") {
        const fullContract = {
          id: inserted.id,
          tenantId: ctx.tenantId,
          propertyId: input.propertyId,
          propertyTenantId: input.propertyTenantId,
          ownerId: input.ownerId ?? null,
          rentAmount: input.rentAmount,
          numCheques: input.numCheques,
          startDate: input.startDate,
          endDate: input.endDate,
        }
        chequesCreated = await generateChequesForContract(db, fullContract)
      }

      return { id: inserted.id, chequesCreated }
    }),

  update: tenantProcedure
    .input(contractUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      }
      if (data.rentAmount !== undefined) updateData.rentAmount = String(data.rentAmount)
      if (data.securityDeposit !== undefined) updateData.securityDeposit = data.securityDeposit ? String(data.securityDeposit) : null
      if (data.commissionPct !== undefined) updateData.commissionPct = data.commissionPct ? String(data.commissionPct) : null
      if (data.depositDeductions !== undefined) updateData.depositDeductions = String(data.depositDeductions ?? 0)
      if (data.escalationPct !== undefined) updateData.escalationPct = data.escalationPct ? String(data.escalationPct) : null
      if (data.earlyTerminationPenalty !== undefined) updateData.earlyTerminationPenalty = data.earlyTerminationPenalty ? String(data.earlyTerminationPenalty) : null

      await db
        .update(contracts)
        .set(updateData)
        .where(
          and(
            eq(contracts.id, id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(contracts.tenantId, ctx.tenantId!)
          )
        )

      return { id }
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Delete cheques first
      await db.delete(cheques).where(eq(cheques.contractId, input.id))

      // Delete contract
      await db
        .delete(contracts)
        .where(
          and(
            eq(contracts.id, input.id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(contracts.tenantId, ctx.tenantId!)
          )
        )

      return { ok: true }
    }),

  selectableProperties: tenantProcedure.query(async ({ ctx }) => {
    const rows = await db.query.properties.findMany({
      where:
        ctx.role === "super_admin" && ctx.tenantId === null
          ? undefined
          : eq(properties.tenantId, ctx.tenantId!),
      orderBy: asc(properties.title),
      columns: { id: true, title: true, referenceNo: true },
    })
    return rows.map((r) => ({
      id: r.id,
      label: r.referenceNo ? `${r.title} (${r.referenceNo})` : r.title,
    }))
  }),

  selectableTenants: tenantProcedure.query(async ({ ctx }) => {
    const rows = await db.query.propertyTenants.findMany({
      where:
        ctx.role === "super_admin" && ctx.tenantId === null
          ? undefined
          : eq(propertyTenants.tenantId, ctx.tenantId!),
      orderBy: asc(propertyTenants.name),
      columns: { id: true, name: true },
    })
    return rows.map((r) => ({ id: r.id, label: r.name }))
  }),

  selectableOwners: tenantProcedure.query(async ({ ctx }) => {
    const rows = await db.query.owners.findMany({
      where:
        ctx.role === "super_admin" && ctx.tenantId === null
          ? undefined
          : eq(owners.tenantId, ctx.tenantId!),
      orderBy: asc(owners.name),
      columns: { id: true, name: true },
    })
    return rows.map((r) => ({ id: r.id, label: r.name }))
  }),

  renewalsDue: tenantProcedure.query(async ({ ctx }) => {
    const now = new Date()
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any[] = [
      eq(contracts.status, "active"),
      gte(contracts.endDate, now),
      lte(contracts.endDate, in60Days),
    ]

    if (ctx.role !== "super_admin" || ctx.tenantId) {
      conditions.push(eq(contracts.tenantId, ctx.tenantId!))
    }

    const rows = await db
      .select()
      .from(contracts)
      .where(and(...conditions))
      .orderBy(asc(contracts.endDate))

    const items = await Promise.all(
      rows.map(async (row) => {
        const property = await db.query.properties.findFirst({
          where: eq(properties.id, row.propertyId),
          columns: { id: true, title: true, referenceNo: true },
        })
        const tenant = await db.query.propertyTenants.findFirst({
          where: eq(propertyTenants.id, row.propertyTenantId),
          columns: { id: true, name: true },
        })
        return {
          ...row,
          propertyTitle: property?.title ?? null,
          tenantName: tenant?.name ?? null,
        }
      })
    )

    return items
  }),

  renew: tenantProcedure
    .input(contractRenewSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No tenant selected" })
      }

      const oldContract = await db.query.contracts.findFirst({
        where: and(
          eq(contracts.id, input.contractId),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(contracts.tenantId, ctx.tenantId!)
        ),
      })

      if (!oldContract) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" })
      }

      const paymentMode = input.paymentMode ?? oldContract.paymentMode

      const [inserted] = await db
        .insert(contracts)
        .values({
          tenantId: ctx.tenantId,
          propertyId: oldContract.propertyId,
          propertyTenantId: oldContract.propertyTenantId,
          ownerId: oldContract.ownerId,
          commissionPct: oldContract.commissionPct,
          securityDeposit: oldContract.securityDeposit,
          contractType: "renewal" as const,
          renewedFromContractId: oldContract.id,
          status: "active" as const,
          startDate: input.startDate,
          endDate: input.endDate,
          rentAmount: String(input.rentAmount),
          numCheques: input.numCheques,
          paymentMode,
          escalationPct:
            input.escalationPct !== undefined && input.escalationPct !== null
              ? String(input.escalationPct)
              : null,
          ejariNumber: input.ejariNumber ?? oldContract.ejariNumber,
          notes: input.notes,
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .returning({ id: contracts.id })

      let chequesCreated = 0
      if (paymentMode === "cheques" || paymentMode === "mixed") {
        const fullContract = {
          id: inserted.id,
          tenantId: ctx.tenantId,
          propertyId: oldContract.propertyId,
          propertyTenantId: oldContract.propertyTenantId,
          ownerId: oldContract.ownerId ?? null,
          rentAmount: input.rentAmount,
          numCheques: input.numCheques,
          startDate: input.startDate,
          endDate: input.endDate,
        }
        chequesCreated = await generateChequesForContract(db, fullContract)
      }

      await db
        .update(contracts)
        .set({ status: "expired" as const, updatedAt: new Date() })
        .where(
          and(
            eq(contracts.id, oldContract.id),
            ctx.role === "super_admin" && ctx.tenantId === null
              ? undefined
              : eq(contracts.tenantId, ctx.tenantId!)
          )
        )

      return { id: inserted.id, chequesCreated }
    }),

  renewalChain: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const contract = await db.query.contracts.findFirst({
        where: and(
          eq(contracts.id, input.id),
          ctx.role === "super_admin" && ctx.tenantId === null
            ? undefined
            : eq(contracts.tenantId, ctx.tenantId!)
        ),
        columns: { renewedFromContractId: true },
      })

      if (!contract || !contract.renewedFromContractId) {
        return null
      }

      const previous = await db.query.contracts.findFirst({
        where: eq(contracts.id, contract.renewedFromContractId),
        columns: { id: true, startDate: true, endDate: true, rentAmount: true, status: true },
      })

      return previous ?? null
    }),
})
