import "dotenv/config";
import { db } from "@/server/db";
import {
  tenants,
  users,
  properties,
  propertyPhotos,
  owners,
  propertyTenants,
  contracts,
  cheques,
  listings,
  leads,
  leadActivities,
  maintenanceRequests,
  transactions,
  commissions,
  documents,
} from "@/server/db/schema";
import { hashPassword } from "@/lib/password";
import { encryptPII } from "@/lib/crypto";
import { buildChequeSchedule } from "@/server/services/cheque.service";
import { eq } from "drizzle-orm";

const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "ChangeMe123!";

// Helper: Add days to a date
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Helper: Random element from array
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper: Generate random integer
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: Generate a date within range
function randomDateBetween(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

async function seed() {
  console.log("Starting database seed...");

  // Step 1: Clear all tables in FK-safe order
  console.log("Clearing existing data...");
  await db.delete(leadActivities);
  await db.delete(cheques);
  await db.delete(commissions);
  await db.delete(transactions);
  await db.delete(documents);
  await db.delete(maintenanceRequests);
  await db.delete(contracts);
  await db.delete(listings);
  await db.delete(leads);
  await db.delete(propertyPhotos);
  await db.delete(properties);
  await db.delete(owners);
  await db.delete(propertyTenants);
  await db.delete(users);
  await db.delete(tenants);

  // Step 2: Create PLATFORM tenant and SUPER_ADMIN user
  console.log("Creating platform tenant and super admin...");
  const platformTenantResult = await db
    .insert(tenants)
    .values({
      name: "Ddots Media",
      slug: "ddotsmedia",
      type: "agency",
      emirate: "dubai",
      subscription: "enterprise",
      isActive: true,
    })
    .returning();
  const platformTenantId = platformTenantResult[0].id;

  const hashedSuperAdminPassword = await hashPassword(SUPER_ADMIN_PASSWORD);
  await db.insert(users).values({
    tenantId: platformTenantId,
    email: "admin@ddotsmedia.com",
    name: "Platform Admin",
    role: "super_admin",
    passwordHash: hashedSuperAdminPassword,
    isActive: true,
  });

  // Step 3: Create 3 demo tenants
  console.log("Creating demo tenants...");
  const tenantA = await db
    .insert(tenants)
    .values({
      name: "Al Shamsi Properties",
      slug: "al-shamsi",
      type: "agency",
      emirate: "dubai",
      tradeLicense: "CN-1023456",
      reraOrn: "ORN-2210",
      phone: "+97143334444",
      email: "info@alshamsi.ae",
      subscription: "pro",
      isActive: true,
    })
    .returning();
  const tenantAId = tenantA[0].id;

  const tenantB = await db
    .insert(tenants)
    .values({
      name: "Gulf Star Realty",
      slug: "gulf-star",
      type: "agency",
      emirate: "abu_dhabi",
      tradeLicense: "CN-7781234",
      reraOrn: "ORN-5567",
      phone: "+97126667777",
      email: "info@gulfstar.ae",
      subscription: "basic",
      isActive: true,
    })
    .returning();
  const tenantBId = tenantB[0].id;

  const tenantC = await db
    .insert(tenants)
    .values({
      name: "Mohammed Ali",
      slug: "mohammed-ali",
      type: "independent",
      emirate: "sharjah",
      phone: "+97165551212",
      email: "m.ali@example.ae",
      subscription: "free",
      isActive: true,
    })
    .returning();
  const tenantCId = tenantC[0].id;

  // Step 4: Create users for each tenant
  console.log("Creating users for each tenant...");
  const hashedPassword = await hashPassword("Password123!");

  // Tenant A users
  const userAAdmin = await db
    .insert(users)
    .values({
      tenantId: tenantAId,
      email: "admin@alshamsi.ae",
      name: "Khalid Al Shamsi",
      role: "admin",
      passwordHash: hashedPassword,
      isActive: true,
    })
    .returning();

  const userAManager = await db
    .insert(users)
    .values({
      tenantId: tenantAId,
      email: "manager@alshamsi.ae",
      name: "Saeed Manager",
      role: "manager",
      passwordHash: hashedPassword,
      isActive: true,
    })
    .returning();

  const userABroker1 = await db
    .insert(users)
    .values({
      tenantId: tenantAId,
      email: "broker1@alshamsi.ae",
      name: "Ahmed Broker",
      role: "broker",
      reraBrn: "BRN-1101",
      passwordHash: hashedPassword,
      isActive: true,
    })
    .returning();

  const userABroker2 = await db
    .insert(users)
    .values({
      tenantId: tenantAId,
      email: "broker2@alshamsi.ae",
      name: "Noor Broker",
      role: "broker",
      passwordHash: hashedPassword,
      isActive: true,
    })
    .returning();

  const userAAccounts = await db
    .insert(users)
    .values({
      tenantId: tenantAId,
      email: "accounts@alshamsi.ae",
      name: "Fatima Accountant",
      role: "accountant",
      passwordHash: hashedPassword,
      isActive: true,
    })
    .returning();

  // Tenant B users
  const userBAdmin = await db
    .insert(users)
    .values({
      tenantId: tenantBId,
      email: "admin@gulfstar.ae",
      name: "Aisha Gulf",
      role: "admin",
      passwordHash: hashedPassword,
      isActive: true,
    })
    .returning();

  const userBBroker = await db
    .insert(users)
    .values({
      tenantId: tenantBId,
      email: "broker@gulfstar.ae",
      name: "Hassan Broker",
      role: "broker",
      reraBrn: "BRN-3303",
      passwordHash: hashedPassword,
      isActive: true,
    })
    .returning();

  const userBAccounts = await db
    .insert(users)
    .values({
      tenantId: tenantBId,
      email: "accounts@gulfstar.ae",
      name: "Leila Accountant",
      role: "accountant",
      passwordHash: hashedPassword,
      isActive: true,
    })
    .returning();

  // Tenant C users
  const userCOwner = await db
    .insert(users)
    .values({
      tenantId: tenantCId,
      email: "owner@mohammedali.ae",
      name: "Mohammed Ali",
      role: "admin",
      passwordHash: hashedPassword,
      isActive: true,
    })
    .returning();

  // Step 5: Create 50 properties distributed across tenants
  console.log("Creating properties...");
  const communities = [
    "Dubai Marina",
    "JBR",
    "Downtown Dubai",
    "Business Bay",
    "JLT",
    "Palm Jumeirah",
    "Dubai Hills Estate",
    "Al Reem Island",
    "Yas Island",
    "Saadiyat Island",
    "Al Raha Beach",
    "Al Khalidiyah",
  ];
  const propertyTypes = [
    "apartment",
    "villa",
    "townhouse",
    "office",
    "studio",
    "penthouse",
  ];

  const allProperties: Array<{ id: string; tenantId: string }> = [];

  // Tenant A: 22 properties
  for (let i = 0; i < 22; i++) {
    const prop = await (db
      .insert(properties)
      .values({
        tenantId: tenantAId,
        referenceNo: `PROP-${String(i + 1).padStart(4, "0")}`,
        title: `Property ${i + 1} - Dubai`,
        type: pick(propertyTypes) as unknown as "apartment" | "villa" | "townhouse" | "office" | "warehouse" | "land" | "building" | "penthouse" | "studio",
        purpose: Math.random() > 0.8 ? "sale" : "rent",
        status: pick([
          "available",
          "available",
          "rented",
          "rented",
          "rented",
          "under_maintenance",
        ]) as unknown as "available" | "rented" | "under_maintenance",
        bedrooms: randInt(0, 5),
        bathrooms: randInt(1, 6),
        areaSqft: randInt(400, 6000),
        price: Math.random() > 0.8 ? randInt(100000, 500000) : randInt(30000, 200000),
        priceFrequency: Math.random() > 0.8 ? "total" : "yearly",
        community: pick(communities),
        emirate: "dubai",
      } as any)
      .returning());
    allProperties.push({ id: prop[0].id, tenantId: tenantAId });
  }

  // Tenant B: 18 properties
  for (let i = 0; i < 18; i++) {
    const prop = await (db
      .insert(properties)
      .values({
        tenantId: tenantBId,
        referenceNo: `PROP-${String(i + 23).padStart(4, "0")}`,
        title: `Property ${i + 23} - Abu Dhabi`,
        type: pick(propertyTypes) as unknown as "apartment" | "villa" | "townhouse" | "office" | "warehouse" | "land" | "building" | "penthouse" | "studio",
        purpose: Math.random() > 0.8 ? "sale" : "rent",
        status: pick([
          "available",
          "available",
          "rented",
          "rented",
          "rented",
          "under_maintenance",
        ]) as unknown as "available" | "rented" | "under_maintenance",
        bedrooms: randInt(0, 5),
        bathrooms: randInt(1, 6),
        areaSqft: randInt(400, 6000),
        price: Math.random() > 0.8 ? randInt(100000, 500000) : randInt(30000, 200000),
        priceFrequency: Math.random() > 0.8 ? "total" : "yearly",
        community: pick(communities),
        emirate: "abu_dhabi",
      } as any)
      .returning());
    allProperties.push({ id: prop[0].id, tenantId: tenantBId });
  }

  // Tenant C: 10 properties
  for (let i = 0; i < 10; i++) {
    const prop = await (db
      .insert(properties)
      .values({
        tenantId: tenantCId,
        referenceNo: `PROP-${String(i + 41).padStart(4, "0")}`,
        title: `Property ${i + 41} - Sharjah`,
        type: pick(propertyTypes) as unknown as "apartment" | "villa" | "townhouse" | "office" | "warehouse" | "land" | "building" | "penthouse" | "studio",
        purpose: Math.random() > 0.8 ? "sale" : "rent",
        status: pick([
          "available",
          "available",
          "rented",
          "rented",
          "rented",
          "under_maintenance",
        ]) as unknown as "available" | "rented" | "under_maintenance",
        bedrooms: randInt(0, 5),
        bathrooms: randInt(1, 6),
        areaSqft: randInt(400, 6000),
        price: Math.random() > 0.8 ? randInt(100000, 500000) : randInt(30000, 200000),
        priceFrequency: Math.random() > 0.8 ? "total" : "yearly",
        community: pick(communities),
        emirate: "sharjah",
      } as any)
      .returning());
    allProperties.push({ id: prop[0].id, tenantId: tenantCId });
  }

  // Step 6: Add property photos to properties
  console.log("Adding property photos...");
  for (let i = 0; i < allProperties.length; i++) {
    const prop = allProperties[i];
    const photoCount = randInt(1, 3);
    for (let j = 0; j < photoCount; j++) {
      await db.insert(propertyPhotos).values({
        propertyId: prop.id,
        url: `https://picsum.photos/seed/prop${i}-${j}/800/600`,
        isPrimary: j === 0,
        sortOrder: j,
      });
    }
  }

  // Step 7: Create 15 owners
  console.log("Creating owners...");
  const ownerNames = [
    "Ahmed Al Mansoori",
    "Rajesh Patel",
    "Fatima Bibi",
    "Maria Santos",
    "James Wilson",
    "Amina Al Mazrouei",
    "Priya Kumar",
    "Hassan Al Dhaheri",
    "Sarah Johnson",
    "Carlos Rodriguez",
    "Zainab Al Ketbi",
    "Arjun Singh",
    "Elena Rossi",
    "Mohammed Al Nuaimi",
    "Lisa Chen",
  ];

  const allOwners: Array<{ id: string; tenantId: string }> = [];

  // 7 for Tenant A
  for (let i = 0; i < 7; i++) {
    const owner = await db
      .insert(owners)
      .values({
        tenantId: tenantAId,
        name: ownerNames[i],
        phone: `+971${String(randInt(5000000, 9999999)).slice(0, 8)}`,
        nationality: pick([
          "Emirati",
          "Indian",
          "Pakistani",
          "Filipino",
          "British",
        ]),
        bankName: pick(["Emirates NBD", "FAB", "ADIB", "DIB"]),
        bankIban: `AE${String(randInt(100000000000000000, 999999999999999999))}`,
        emiratesId: encryptPII(
          `${String(randInt(100, 999))}-${String(randInt(1980, 2005))}-${String(randInt(1000000, 9999999))}-${String(randInt(1, 9))}`
        ),
        passportNo: encryptPII(
          `${String(Math.random() * 26)
            .charAt(0)
            .toUpperCase()}${String(randInt(1000000, 9999999))}`
        ),
      })
      .returning();
    allOwners.push({ id: owner[0].id, tenantId: tenantAId });
  }

  // 5 for Tenant B
  for (let i = 7; i < 12; i++) {
    const owner = await db
      .insert(owners)
      .values({
        tenantId: tenantBId,
        name: ownerNames[i],
        phone: `+971${String(randInt(5000000, 9999999)).slice(0, 8)}`,
        nationality: pick([
          "Emirati",
          "Indian",
          "Pakistani",
          "Filipino",
          "British",
        ]),
        bankName: pick(["Emirates NBD", "FAB", "ADIB", "DIB"]),
        bankIban: `AE${String(randInt(100000000000000000, 999999999999999999))}`,
        emiratesId: encryptPII(
          `${String(randInt(100, 999))}-${String(randInt(1980, 2005))}-${String(randInt(1000000, 9999999))}-${String(randInt(1, 9))}`
        ),
        passportNo: encryptPII(
          `${String(Math.random() * 26)
            .charAt(0)
            .toUpperCase()}${String(randInt(1000000, 9999999))}`
        ),
      })
      .returning();
    allOwners.push({ id: owner[0].id, tenantId: tenantBId });
  }

  // 3 for Tenant C
  for (let i = 12; i < 15; i++) {
    const owner = await db
      .insert(owners)
      .values({
        tenantId: tenantCId,
        name: ownerNames[i],
        phone: `+971${String(randInt(5000000, 9999999)).slice(0, 8)}`,
        nationality: pick([
          "Emirati",
          "Indian",
          "Pakistani",
          "Filipino",
          "British",
        ]),
        bankName: pick(["Emirates NBD", "FAB", "ADIB", "DIB"]),
        bankIban: `AE${String(randInt(100000000000000000, 999999999999999999))}`,
        emiratesId: encryptPII(
          `${String(randInt(100, 999))}-${String(randInt(1980, 2005))}-${String(randInt(1000000, 9999999))}-${String(randInt(1, 9))}`
        ),
        passportNo: encryptPII(
          `${String(Math.random() * 26)
            .charAt(0)
            .toUpperCase()}${String(randInt(1000000, 9999999))}`
        ),
      })
      .returning();
    allOwners.push({ id: owner[0].id, tenantId: tenantCId });
  }

  // Step 8: Create 25 property tenants (renters)
  console.log("Creating property tenants...");
  const tenantNames = [
    "Ahmed Al Noaimi",
    "Priya Sharma",
    "Muhammad Hassan",
    "Sofia Garcia",
    "Ibrahim Al Mazrouei",
    "Yuki Tanaka",
    "Amina Al Zaabi",
    "Rahul Verma",
    "Layla Al Khaleeli",
    "Juan Carlos",
    "Hana Al Darmaki",
    "Amit Patel",
    "Zainab Al Mansouri",
    "Michael Brown",
    "Noor Al Falahi",
    "Sanjay Kumar",
    "Mariam Al Shehhi",
    "David Miller",
    "Leila Al Haddad",
    "Vikram Singh",
    "Samira Al Maktoum",
    "Robert Taylor",
    "Rania Al Dhaheri",
    "Anish Kapoor",
    "Huda Al Mazrouei",
  ];

  const allPropertyTenants: Array<{
    id: string;
    tenantId: string;
  }> = [];

  // 13 for Tenant A
  for (let i = 0; i < 13; i++) {
    const pt = await db
      .insert(propertyTenants)
      .values({
        tenantId: tenantAId,
        name: tenantNames[i],
        phone: `+971${String(randInt(5000000, 9999999)).slice(0, 8)}`,
        email: `tenant${i}@example.ae`,
        nationality: pick([
          "Indian",
          "Pakistani",
          "Filipino",
          "British",
          "Emirati",
        ]),
        emiratesId: encryptPII(
          `${String(randInt(100, 999))}-${String(randInt(1980, 2005))}-${String(randInt(1000000, 9999999))}-${String(randInt(1, 9))}`
        ),
        passportNo: encryptPII(
          `${String(Math.random() * 26)
            .charAt(0)
            .toUpperCase()}${String(randInt(1000000, 9999999))}`
        ),
        companyName: Math.random() > 0.5 ? `Company ${i}` : undefined,
        emergencyContact: `Emergency ${i}`,
      })
      .returning();
    allPropertyTenants.push({ id: pt[0].id, tenantId: tenantAId });
  }

  // 8 for Tenant B
  for (let i = 13; i < 21; i++) {
    const pt = await db
      .insert(propertyTenants)
      .values({
        tenantId: tenantBId,
        name: tenantNames[i],
        phone: `+971${String(randInt(5000000, 9999999)).slice(0, 8)}`,
        email: `tenant${i}@example.ae`,
        nationality: pick([
          "Indian",
          "Pakistani",
          "Filipino",
          "British",
          "Emirati",
        ]),
        emiratesId: encryptPII(
          `${String(randInt(100, 999))}-${String(randInt(1980, 2005))}-${String(randInt(1000000, 9999999))}-${String(randInt(1, 9))}`
        ),
        passportNo: encryptPII(
          `${String(Math.random() * 26)
            .charAt(0)
            .toUpperCase()}${String(randInt(1000000, 9999999))}`
        ),
        companyName: Math.random() > 0.5 ? `Company ${i}` : undefined,
        emergencyContact: `Emergency ${i}`,
      })
      .returning();
    allPropertyTenants.push({ id: pt[0].id, tenantId: tenantBId });
  }

  // 4 for Tenant C
  for (let i = 21; i < 25; i++) {
    const pt = await db
      .insert(propertyTenants)
      .values({
        tenantId: tenantCId,
        name: tenantNames[i],
        phone: `+971${String(randInt(5000000, 9999999)).slice(0, 8)}`,
        email: `tenant${i}@example.ae`,
        nationality: pick([
          "Indian",
          "Pakistani",
          "Filipino",
          "British",
          "Emirati",
        ]),
        emiratesId: encryptPII(
          `${String(randInt(100, 999))}-${String(randInt(1980, 2005))}-${String(randInt(1000000, 9999999))}-${String(randInt(1, 9))}`
        ),
        passportNo: encryptPII(
          `${String(Math.random() * 26)
            .charAt(0)
            .toUpperCase()}${String(randInt(1000000, 9999999))}`
        ),
        companyName: Math.random() > 0.5 ? `Company ${i}` : undefined,
        emergencyContact: `Emergency ${i}`,
      })
      .returning();
    allPropertyTenants.push({ id: pt[0].id, tenantId: tenantCId });
  }

  // Update properties with owner IDs (assign ~70%)
  console.log("Assigning owners and brokers to properties...");
  for (let i = 0; i < allProperties.length; i++) {
    const prop = allProperties[i];
    if (Math.random() < 0.7) {
      const ownerForTenant = allOwners.filter(
        (o) => o.tenantId === prop.tenantId
      );
      if (ownerForTenant.length > 0) {
        const ownerId = pick(ownerForTenant).id;
        await db
          .update(properties)
          .set({ ownerId })
          .where(eq(properties.id, prop.id));
      }
    }
    // Assign broker for ~70% of properties
    if (Math.random() < 0.7) {
      let assignedBroker: string | undefined;
      if (prop.tenantId === tenantAId) {
        assignedBroker = pick([
          userABroker1[0].id,
          userABroker2[0].id,
        ]);
      } else if (prop.tenantId === tenantBId) {
        assignedBroker = userBBroker[0].id;
      }
      if (assignedBroker) {
        await db
          .update(properties)
          .set({ assignedBroker })
          .where(eq(properties.id, prop.id));
      }
    }
  }

  // Step 9: Create 12 contracts
  console.log("Creating contracts...");
  const allContracts: Array<{
    id: string;
    tenantId: string;
    propertyId: string;
    rentAmount: number;
  }> = [];

  // Create contracts for rented properties from Tenant A
  const rentedPropsA = allProperties.filter(
    (p) => p.tenantId === tenantAId && Math.random() < 0.3
  );
  const contractCountA = Math.min(6, rentedPropsA.length);
  for (let i = 0; i < contractCountA; i++) {
    const prop = rentedPropsA[i];
    const tenant = pick(allPropertyTenants.filter((t) => t.tenantId === tenantAId));
    const owner = allOwners.find((o) => o.tenantId === tenantAId) || allOwners[0];

    const startDate = addDays(new Date(), -randInt(0, 240)); // Last 8 months
    const endDate = addDays(startDate, 365);
    const numCheques = pick([1, 2, 4, 6, 12]);
    const rentAmount = randInt(40000, 200000);

    const contract = await db
      .insert(contracts)
      .values({
        tenantId: tenantAId,
        propertyId: prop.id,
        propertyTenantId: tenant.id,
        ownerId: owner.id,
        contractType: "new",
        startDate,
        endDate,
        rentAmount: String(rentAmount),
        numCheques,
        paymentMode: "cheques",
        commissionPct: "5",
        securityDeposit: String(Math.round((rentAmount * 0.075) * 100) / 100),
        ejariNumber: "EJA-" + String(randInt(100000, 999999)),
        status: i === contractCountA - 1 ? "active" : "active",
      })
      .returning();
    allContracts.push({
      id: contract[0].id,
      tenantId: tenantAId,
      propertyId: prop.id,
      rentAmount,
    });
  }

  // Create contracts for rented properties from Tenant B
  const rentedPropsB = allProperties.filter(
    (p) => p.tenantId === tenantBId && Math.random() < 0.3
  );
  const contractCountB = Math.min(4, rentedPropsB.length);
  for (let i = 0; i < contractCountB; i++) {
    const prop = rentedPropsB[i];
    const tenant = pick(allPropertyTenants.filter((t) => t.tenantId === tenantBId));
    const owner = allOwners.find((o) => o.tenantId === tenantBId) || allOwners[5];

    const startDate = addDays(new Date(), -randInt(0, 240));
    const endDate = addDays(startDate, 365);
    const numCheques = pick([1, 2, 4, 6, 12]);
    const rentAmount = randInt(40000, 200000);

    const contract = await db
      .insert(contracts)
      .values({
        tenantId: tenantBId,
        propertyId: prop.id,
        propertyTenantId: tenant.id,
        ownerId: owner.id,
        contractType: "new",
        startDate,
        endDate,
        rentAmount: String(rentAmount),
        numCheques,
        paymentMode: "cheques",
        commissionPct: "5",
        securityDeposit: String(Math.round((rentAmount * 0.075) * 100) / 100),
        tawtheeqNumber: "TAW-" + String(randInt(100000, 999999)),
        status: "active",
      })
      .returning();
    allContracts.push({
      id: contract[0].id,
      tenantId: tenantBId,
      propertyId: prop.id,
      rentAmount,
    });
  }

  // Create contracts for rented properties from Tenant C
  const rentedPropsC = allProperties.filter(
    (p) => p.tenantId === tenantCId && Math.random() < 0.3
  );
  const contractCountC = Math.min(2, rentedPropsC.length);
  for (let i = 0; i < contractCountC; i++) {
    const prop = rentedPropsC[i];
    const tenant = pick(allPropertyTenants.filter((t) => t.tenantId === tenantCId));
    const owner = allOwners.find((o) => o.tenantId === tenantCId) || allOwners[12];

    const startDate = addDays(new Date(), -randInt(0, 240));
    const endDate = addDays(startDate, 365);
    const numCheques = pick([1, 2, 4, 6, 12]);
    const rentAmount = randInt(40000, 200000);

    const contract = await db
      .insert(contracts)
      .values({
        tenantId: tenantCId,
        propertyId: prop.id,
        propertyTenantId: tenant.id,
        ownerId: owner.id,
        contractType: "new",
        startDate,
        endDate,
        rentAmount: String(rentAmount),
        numCheques,
        paymentMode: "cheques",
        commissionPct: "5",
        securityDeposit: String(Math.round((rentAmount * 0.075) * 100) / 100),
        status: "active",
      })
      .returning();
    allContracts.push({
      id: contract[0].id,
      tenantId: tenantCId,
      propertyId: prop.id,
      rentAmount,
    });
  }

  // Step 10: Create cheques for contracts
  console.log("Creating cheques...");
  let totalCheques = 0;
  const now = new Date();
  for (const contract of allContracts) {
    const contractData = await db
      .select()
      .from(contracts)
      .where(eq(contracts.id, contract.id));
    if (contractData.length === 0) continue;

    const c = contractData[0];
    const schedule = buildChequeSchedule({
      rentAmount: contract.rentAmount,
      numCheques: c.numCheques,
      startDate: new Date(c.startDate),
      endDate: new Date(c.endDate),
    });

    for (let i = 0; i < schedule.length; i++) {
      const { amount, dueDate } = schedule[i];
      const isOverdue = dueDate < now;
      const isThisWeek =
        dueDate >= now && dueDate <= addDays(now, 7);

      let chequeStatus: "pending" | "cleared" | "bounced" | "deposited" =
        "pending";
      let clearedDate: Date | undefined;
      let bounceReason: string | undefined;

      if (isOverdue) {
        // Overdue cheques: mostly cleared, some bounced, some still pending
        const rand = Math.random();
        if (rand < 0.65) {
          chequeStatus = "cleared";
          clearedDate = addDays(
            dueDate,
            randInt(0, 30)
          );
        } else if (rand < 0.85) {
          chequeStatus = "bounced";
          bounceReason = pick([
            "Insufficient funds",
            "Account closed",
            "Stopped payment",
          ]);
        }
        // else remains pending (overdue)
      } else if (isThisWeek) {
        chequeStatus = "deposited";
      }

      const chequeNum = `CHQ-${String(100000 + i + totalCheques).slice(-6)}`;
      const bankName = pick([
        "Emirates NBD",
        "FAB",
        "ADIB",
        "DIB",
        "ADCB",
      ]);

      await db.insert(cheques).values({
        tenantId: contract.tenantId,
        contractId: contract.id,
        propertyId: contract.propertyId,
        propertyTenantId: c.propertyTenantId,
        ownerId: c.ownerId,
        chequeNumber: chequeNum,
        bankName,
        amount: String(amount),
        dueDate,
        status: chequeStatus,
        clearedDate,
        bounceReason,
      });

      totalCheques++;
    }
  }

  // Step 11: Create transactions (6-10 per active contract)
  console.log("Creating transactions...");
  let totalTransactions = 0;
  for (const contract of allContracts) {
    const txnCount = randInt(6, 10);
    for (let i = 0; i < txnCount; i++) {
      // Spread transactions over last 6 months, with some in current month
      const txnDate = randomDateBetween(
        addDays(now, -180),
        now
      );

      const txnType = Math.random() > 0.7 ? "commission" : "rent_income";
      const amount =
        txnType === "commission"
          ? Math.round(
              (contract.rentAmount * 0.05 * 0.5) * 100
            ) / 100
          : contract.rentAmount;

      await db.insert(transactions).values({
        tenantId: contract.tenantId,
        type: txnType,
        amount: String(amount),
        currency: "AED",
        referenceType: "contract",
        referenceId: contract.id,
        paymentMethod: pick(["cheque", "bank_transfer"]),
        status: "completed",
        transactionDate: txnDate,
      });

      totalTransactions++;
    }
  }

  // Step 12: Create commissions
  console.log("Creating commissions...");
  let totalCommissions = 0;
  for (const contract of allContracts) {
    const commissionAmount = Math.round(
      (contract.rentAmount * 0.05 * 100)
    ) / 100;

    // Assign to a broker from the same tenant
    let brokerId: string | undefined;
    if (contract.tenantId === tenantAId) {
      brokerId = pick([userABroker1[0].id, userABroker2[0].id]);
    } else if (contract.tenantId === tenantBId) {
      brokerId = userBBroker[0].id;
    }

    if (brokerId) {
      await db.insert(commissions).values({
        tenantId: contract.tenantId,
        contractId: contract.id,
        brokerId,
        dealType: "rent",
        dealValue: String(contract.rentAmount),
        commissionPct: "5",
        commissionAmount: String(commissionAmount),
        companyShare: String(Math.round((commissionAmount * 0.5) * 100) / 100),
        brokerShare: String(
          Math.round((commissionAmount * 0.5) * 100) / 100
        ),
        status: pick(["pending", "pending", "pending", "paid"]),
      });

      totalCommissions++;
    }
  }

  // Step 13: Create 20 leads
  console.log("Creating leads...");
  const leadSources = ["website", "whatsapp", "phone", "walk_in", "referral"];
  const leadStatuses = [
    "new",
    "contacted",
    "qualified",
    "viewing",
    "negotiation",
    "won",
    "lost",
  ];
  const leadNames = [
    "Salim Al Zaabi",
    "Isha Kapoor",
    "Omar Al Mazrouei",
    "Sofia De Bruyn",
    "Ahmed Bin Zayed",
    "Priya Singh",
    "Khalid Al Muhairi",
    "Elena Rodriguez",
    "Hassan Al Noor",
    "Ananya Sharma",
    "Mohammed Al Suwaidi",
    "Maria Gonzalez",
    "Ibrahim Al Ketbi",
    "Yuki Sato",
    "Saeed Al Mansoori",
    "Caroline Dubois",
    "Ali Al Dhaheri",
    "Rajesh Kumar",
    "Nawal Al Haddad",
    "Pierre Laurent",
  ];

  let totalLeads = 0;
  // 10 for Tenant A
  for (let i = 0; i < 10; i++) {
    const assignedBroker = Math.random() > 0.4
      ? pick([userABroker1[0].id, userABroker2[0].id])
      : undefined;

    const leadObj = await (db
      .insert(leads)
      .values({
        tenantId: tenantAId,
        name: leadNames[i],
        phone: `+971${String(randInt(5000000, 9999999)).slice(0, 8)}`,
        email: `lead${i}@example.ae`,
        source: pick(leadSources) as unknown as "website" | "whatsapp" | "phone" | "walk_in" | "referral" | "portal" | "social",
        status: pick(leadStatuses) as unknown as "new" | "contacted" | "qualified" | "viewing" | "negotiation" | "won" | "lost",
        budgetMin: randInt(50000, 300000),
        budgetMax: randInt(300000, 1000000),
        assignedTo: assignedBroker,
        nextFollowUp: randomDateBetween(
          now,
          addDays(now, 30)
        ),
      } as any)
      .returning());

    totalLeads++;

    // Add 1-2 activities for ~half the leads
    if (Math.random() > 0.5) {
      const activityCount = randInt(1, 2);
      for (let j = 0; j < activityCount; j++) {
        await db.insert(leadActivities).values({
          leadId: leadObj[0].id,
          userId: assignedBroker || userABroker1[0].id,
          type: pick([
            "call",
            "whatsapp",
            "email",
            "viewing",
            "meeting",
            "note",
          ] as const),
          content: `Activity ${j + 1} for lead`,
          completedAt: Math.random() > 0.5 ? new Date() : undefined,
        });
      }
    }
  }

  // 6 for Tenant B
  for (let i = 10; i < 16; i++) {
    const assignedBroker = Math.random() > 0.4 ? userBBroker[0].id : undefined;

    const leadObj = await (db
      .insert(leads)
      .values({
        tenantId: tenantBId,
        name: leadNames[i],
        phone: `+971${String(randInt(5000000, 9999999)).slice(0, 8)}`,
        email: `lead${i}@example.ae`,
        source: pick(leadSources) as unknown as "website" | "whatsapp" | "phone" | "walk_in" | "referral" | "portal" | "social",
        status: pick(leadStatuses) as unknown as "new" | "contacted" | "qualified" | "viewing" | "negotiation" | "won" | "lost",
        budgetMin: randInt(50000, 300000),
        budgetMax: randInt(300000, 1000000),
        assignedTo: assignedBroker,
        nextFollowUp: randomDateBetween(
          now,
          addDays(now, 30)
        ),
      } as any)
      .returning());

    totalLeads++;

    if (Math.random() > 0.5) {
      const activityCount = randInt(1, 2);
      for (let j = 0; j < activityCount; j++) {
        await db.insert(leadActivities).values({
          leadId: leadObj[0].id,
          userId: assignedBroker || userBBroker[0].id,
          type: pick([
            "call",
            "whatsapp",
            "email",
            "viewing",
            "meeting",
            "note",
          ]),
          content: `Activity ${j + 1} for lead`,
          completedAt: Math.random() > 0.5 ? new Date() : undefined,
        });
      }
    }
  }

  // 4 for Tenant C
  for (let i = 16; i < 20; i++) {
    const assignedBroker = undefined; // Tenant C might not have a broker

    const leadObj = await (db
      .insert(leads)
      .values({
        tenantId: tenantCId,
        name: leadNames[i],
        phone: `+971${String(randInt(5000000, 9999999)).slice(0, 8)}`,
        email: `lead${i}@example.ae`,
        source: pick(leadSources) as unknown as "website" | "whatsapp" | "phone" | "walk_in" | "referral" | "portal" | "social",
        status: pick(leadStatuses) as unknown as "new" | "contacted" | "qualified" | "viewing" | "negotiation" | "won" | "lost",
        budgetMin: randInt(50000, 300000),
        budgetMax: randInt(300000, 1000000),
        assignedTo: assignedBroker,
        nextFollowUp: randomDateBetween(
          now,
          addDays(now, 30)
        ),
      } as any)
      .returning());

    totalLeads++;

    if (Math.random() > 0.5) {
      const activityCount = randInt(1, 2);
      for (let j = 0; j < activityCount; j++) {
        await db.insert(leadActivities).values({
          leadId: leadObj[0].id,
          type: pick([
            "call",
            "whatsapp",
            "email",
            "viewing",
            "meeting",
            "note",
          ] as const),
          content: `Activity ${j + 1} for lead`,
          completedAt: Math.random() > 0.5 ? new Date() : undefined,
        });
      }
    }
  }

  // Step 14: Create maintenance requests
  console.log("Creating maintenance requests...");
  const maintenanceCategories = [
    "plumbing",
    "electrical",
    "ac",
    "painting",
    "carpentry",
    "cleaning",
    "pest_control",
  ];
  const maintenancePriorities = ["low", "medium", "high", "urgent"];
  const maintenanceStatuses = [
    "reported",
    "approved",
    "in_progress",
    "completed",
  ];

  let totalMaintenance = 0;
  // 3 for Tenant A
  for (let i = 0; i < 3; i++) {
    const prop = pick(allProperties.filter((p) => p.tenantId === tenantAId));
    const tenant =
      Math.random() > 0.5
        ? pick(allPropertyTenants.filter((t) => t.tenantId === tenantAId))
        : undefined;

    const status = pick(maintenanceStatuses);
    const costEstimate = randInt(500, 10000);

    const mr = await (db
      .insert(maintenanceRequests)
      .values({
        tenantId: tenantAId,
        propertyId: prop.id,
        propertyTenantId: tenant?.id,
        category: pick(maintenanceCategories) as unknown as "plumbing" | "electrical" | "ac" | "painting" | "carpentry" | "cleaning" | "pest_control" | "other",
        priority: pick(maintenancePriorities) as unknown as "low" | "medium" | "high" | "urgent",
        status,
        description: `Maintenance issue description ${i}`,
        costEstimate: costEstimate,
        costActual: status === "completed" ? randInt(500, 12000) : undefined,
        costApproved: status === "completed",
        beforePhotos: [
          `https://picsum.photos/seed/before${i}-1/800/600`,
          `https://picsum.photos/seed/before${i}-2/800/600`,
        ],
        afterPhotos:
          status === "completed"
            ? [
                `https://picsum.photos/seed/after${i}-1/800/600`,
                `https://picsum.photos/seed/after${i}-2/800/600`,
              ]
            : [],
        completedAt: status === "completed" ? randomDateBetween(addDays(now, -90), now) : undefined,
      } as any)
      .returning());

    totalMaintenance++;
  }

  // 4 for Tenant B
  for (let i = 3; i < 7; i++) {
    const prop = pick(allProperties.filter((p) => p.tenantId === tenantBId));
    const tenant =
      Math.random() > 0.5
        ? pick(allPropertyTenants.filter((t) => t.tenantId === tenantBId))
        : undefined;

    const status = pick(maintenanceStatuses);
    const costEstimate = randInt(500, 10000);

    await (db.insert(maintenanceRequests).values({
      tenantId: tenantBId,
      propertyId: prop.id,
      propertyTenantId: tenant?.id,
      category: pick(maintenanceCategories) as unknown as "plumbing" | "electrical" | "ac" | "painting" | "carpentry" | "cleaning" | "pest_control" | "other",
      priority: pick(maintenancePriorities) as unknown as "low" | "medium" | "high" | "urgent",
      status,
      description: `Maintenance issue description ${i}`,
      costEstimate: costEstimate,
      costActual: status === "completed" ? randInt(500, 12000) : undefined,
      costApproved: status === "completed",
      beforePhotos: [
        `https://picsum.photos/seed/before${i}-1/800/600`,
        `https://picsum.photos/seed/before${i}-2/800/600`,
      ],
      afterPhotos:
        status === "completed"
          ? [
              `https://picsum.photos/seed/after${i}-1/800/600`,
              `https://picsum.photos/seed/after${i}-2/800/600`,
            ]
          : [],
      completedAt: status === "completed" ? randomDateBetween(addDays(now, -90), now) : undefined,
    } as any));

    totalMaintenance++;
  }

  // 3 for Tenant C
  for (let i = 7; i < 10; i++) {
    const prop = pick(allProperties.filter((p) => p.tenantId === tenantCId));
    const tenant =
      Math.random() > 0.5
        ? pick(allPropertyTenants.filter((t) => t.tenantId === tenantCId))
        : undefined;

    const status = pick(maintenanceStatuses);
    const costEstimate = randInt(500, 10000);

    await (db.insert(maintenanceRequests).values({
      tenantId: tenantCId,
      propertyId: prop.id,
      propertyTenantId: tenant?.id,
      category: pick(maintenanceCategories) as unknown as "plumbing" | "electrical" | "ac" | "painting" | "carpentry" | "cleaning" | "pest_control" | "other",
      priority: pick(maintenancePriorities) as unknown as "low" | "medium" | "high" | "urgent",
      status,
      description: `Maintenance issue description ${i}`,
      costEstimate: costEstimate,
      costActual: status === "completed" ? randInt(500, 12000) : undefined,
      costApproved: status === "completed",
      beforePhotos: [
        `https://picsum.photos/seed/before${i}-1/800/600`,
        `https://picsum.photos/seed/before${i}-2/800/600`,
      ],
      afterPhotos:
        status === "completed"
          ? [
              `https://picsum.photos/seed/after${i}-1/800/600`,
              `https://picsum.photos/seed/after${i}-2/800/600`,
            ]
          : [],
      completedAt: status === "completed" ? randomDateBetween(addDays(now, -90), now) : undefined,
    } as any));

    totalMaintenance++;
  }

  // Step 15: Create listings
  console.log("Creating listings...");
  let totalListings = 0;
  // Create listings for ~20% of properties
  for (const prop of allProperties) {
    if (Math.random() < 0.2) {
      let brokerAssigned: string | undefined;
      if (prop.tenantId === tenantAId) {
        brokerAssigned = pick([userABroker1[0].id, userABroker2[0].id]);
      } else if (prop.tenantId === tenantBId) {
        brokerAssigned = userBBroker[0].id;
      }

      const listingType = Math.random() > 0.8 ? "sale" : "rent";
      const propData = allProperties.find((p) => p.id === prop.id);

      await db.insert(listings).values({
        tenantId: prop.tenantId,
        propertyId: prop.id,
        brokerId: brokerAssigned,
        title: `Listing ${prop.id}`,
        listingType,
        price: String(randInt(50000, 300000)),
        status: pick(["draft", "active", "paused"]),
        publishedAt: Math.random() > 0.5 ? new Date() : undefined,
        expiresAt: addDays(now, 30),
      });

      totalListings++;
    }
  }

  // Step 16: Create documents
  console.log("Creating documents...");
  const docTypes = [
    "trade_license",
    "rera_card",
    "ejari",
    "tawtheeq",
    "title_deed",
    "passport",
    "emirates_id",
    "contract",
    "noc",
    "oqood",
    "invoice",
    "other",
  ];

  let totalDocuments = 0;

  // Documents for properties
  for (const prop of allProperties) {
    if (Math.random() < 0.3) {
      const uploader =
        prop.tenantId === tenantAId
          ? userAAdmin[0].id
          : prop.tenantId === tenantBId
            ? userBAdmin[0].id
            : userCOwner[0].id;

      const expiryInDays = randInt(-30, 180); // Some expired, some expiring soon
      const expiryDate =
        Math.random() > 0.4 ? addDays(now, expiryInDays) : undefined;

      await db.insert(documents).values({
        tenantId: prop.tenantId,
        entityType: "property" as const,
        entityId: prop.id,
        docType: pick(docTypes) as unknown as "trade_license" | "rera_card" | "ejari" | "tawtheeq" | "title_deed" | "passport" | "emirates_id" | "contract" | "noc" | "oqood" | "invoice" | "other",
        name: `Property Document`,
        fileUrl: `https://example.com/docs/property-${prop.id}.pdf`,
        uploadedBy: uploader,
        expiryDate,
      });

      totalDocuments++;
    }
  }

  // Documents for owners
  for (const owner of allOwners) {
    if (Math.random() < 0.5) {
      const uploader =
        owner.tenantId === tenantAId
          ? userAAdmin[0].id
          : owner.tenantId === tenantBId
            ? userBAdmin[0].id
            : userCOwner[0].id;

      const expiryInDays = randInt(-30, 180);
      const expiryDate =
        Math.random() > 0.4 ? addDays(now, expiryInDays) : undefined;

      await db.insert(documents).values({
        tenantId: owner.tenantId,
        entityType: "owner" as const,
        entityId: owner.id,
        docType: pick(["passport", "emirates_id"] as const),
        name: `Owner Document`,
        fileUrl: `https://example.com/docs/owner-${owner.id}.pdf`,
        uploadedBy: uploader,
        expiryDate,
      });

      totalDocuments++;
    }
  }

  // Documents for contracts
  for (const contract of allContracts) {
    const uploader =
      contract.tenantId === tenantAId
        ? userAAdmin[0].id
        : contract.tenantId === tenantBId
          ? userBAdmin[0].id
          : userCOwner[0].id;

    await db.insert(documents).values({
      tenantId: contract.tenantId,
      entityType: "contract" as const,
      entityId: contract.id,
      docType: "contract" as const,
      name: `Contract Document`,
      fileUrl: `https://example.com/docs/contract-${contract.id}.pdf`,
      uploadedBy: uploader,
    });

    totalDocuments++;
  }

  // Summary
  console.log("\n=== SEED COMPLETED SUCCESSFULLY ===");
  console.log(`Tenants: 4 (1 platform + 3 demo)`);
  console.log(`Users: 14`);
  console.log(`Properties: 50`);
  console.log(`Property Photos: ~80-120`);
  console.log(`Owners: 15`);
  console.log(`Property Tenants: 25`);
  console.log(`Contracts: ${allContracts.length}`);
  console.log(`Cheques: ${totalCheques}`);
  console.log(`Transactions: ${totalTransactions}`);
  console.log(`Commissions: ${totalCommissions}`);
  console.log(`Leads: ${totalLeads}`);
  console.log(`Lead Activities: ~${Math.round(totalLeads * 0.4)}-${Math.round(totalLeads * 0.7)}`);
  console.log(`Maintenance Requests: ${totalMaintenance}`);
  console.log(`Listings: ${totalListings}`);
  console.log(`Documents: ${totalDocuments}`);
  console.log("====================================\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
