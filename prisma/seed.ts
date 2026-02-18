// ============================================================
// prisma/seed.ts
// ------------------------------------------------------------
// Script untuk mengisi database dengan data awal (seed data).
//
// PENTING: Harus pakai adapter pg agar kompatibel dengan
// Prisma v7 + @prisma/adapter-pg yang dipakai project ini.
// Tanpa adapter, akan muncul error PrismaClientInitializationError.
//
// Jalankan dengan: npx prisma db seed
// ============================================================

import { PrismaClient, Role } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

// Wajib pakai adapter pg — sama persis seperti di lib/prisma.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seeding...");

  // Hash semua password sebelum disimpan ke database
  // JANGAN simpan plain text — selalu hash dengan bcrypt!
  const customerPassword = await bcrypt.hash("123456", 10);
  const vendorPassword = await bcrypt.hash("123456", 10);
  const adminPassword = await bcrypt.hash("admin123", 10);

  // ----------------------------------------------------------
  // Buat user CUSTOMER sebagai demo
  // upsert = insert jika belum ada, skip jika sudah ada
  // ----------------------------------------------------------
  const customer = await prisma.user.upsert({
    where: { email: "customer@mail.com" },
    update: {},
    create: {
      name: "Customer Demo",
      email: "customer@mail.com",
      phone: "08123456789",
      password: customerPassword,
      role: Role.CUSTOMER,
    },
  });
  console.log("✅ Customer created:", customer.email);

  // ----------------------------------------------------------
  // Buat user ADMIN sebagai demo
  // ----------------------------------------------------------
  const admin = await prisma.user.upsert({
    where: { email: "admin@mail.com" },
    update: {},
    create: {
      name: "Admin Demo",
      email: "admin@mail.com",
      phone: "08100000000",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log("✅ Admin created:", admin.email);

  // ----------------------------------------------------------
  // Buat user VENDOR lengkap dengan VendorProfile, Venue, dan Field
  // Semua dibuat sekaligus menggunakan nested create Prisma
  // ----------------------------------------------------------
  const vendor = await prisma.user.upsert({
    where: { email: "vendor@mail.com" },
    update: {},
    create: {
      name: "Vendor Demo",
      email: "vendor@mail.com",
      phone: "08123456780",
      password: vendorPassword,
      role: Role.VENDOR,

      // VendorProfile dibuat otomatis saat role VENDOR
      vendorProfile: {
        create: {
          venues: {
            create: {
              name: "Futsal Arena Jakarta",
              description: "Lapangan futsal indoor ber-AC dengan rumput sintetis berkualitas tinggi",
              city: "Jakarta",
              fields: {
                create: [
                  {
                    name: "Lapangan A",
                    type: "FUTSAL",
                    price: 100000, // Rp 100.000/jam
                  },
                  {
                    name: "Lapangan B",
                    type: "FUTSAL",
                    price: 120000, // Rp 120.000/jam
                  },
                  {
                    name: "Court Badminton 1",
                    type: "BADMINTON",
                    price: 75000, // Rp 75.000/jam
                  },
                ],
              },
            },
          },
        },
      },
    },
    include: {
      vendorProfile: {
        include: {
          venues: {
            include: { fields: true },
          },
        },
      },
    },
  });
  console.log("✅ Vendor created:", vendor.email);
  console.log("   Venues:", vendor.vendorProfile?.venues.length);
  console.log(
    "   Fields:",
    vendor.vendorProfile?.venues.reduce((acc, v) => acc + v.fields.length, 0)
  );

  // ----------------------------------------------------------
  // Buat sample Event
  // ----------------------------------------------------------
  const sampleEvent = await prisma.event.upsert({
    where: { id: "sample-event-001" },
    update: {},
    create: {
      id: "sample-event-001",
      title: "Turnamen Futsal Antar Komunitas",
      description: "Turnamen futsal seru untuk semua kalangan. Hadiah total Rp 5.000.000!",
      location: "Futsal Arena Jakarta",
      date: new Date("2025-08-15"),
      startHour: 8,
      endHour: 20,
      ticketPrice: 50000,
      capacity: 16,
      creatorId: admin.id,
    },
  });
  console.log("✅ Sample event created:", sampleEvent.title);

  console.log("\n🎉 Seeding completed successfully!");
  console.log("\n📋 Test credentials:");
  console.log("   Customer → customer@mail.com / 123456");
  console.log("   Vendor   → vendor@mail.com   / 123456");
  console.log("   Admin    → admin@mail.com     / admin123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });