// ============================================================
// prisma/seed.ts
// ============================================================

import { PrismaClient, Role } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seeding...");

  const customerPassword = await bcrypt.hash("123456", 10);
  const vendorPassword = await bcrypt.hash("123456", 10);
  const adminPassword = await bcrypt.hash("admin123", 10);

  // ----------------------------------------------------------
  // CUSTOMER
  // ----------------------------------------------------------
  const customer = await prisma.user.upsert({
    where: { email: "customer@arenaku.com" },
    update: {},
    create: {
      name: "Budi Santoso",
      email: "customer@arenaku.com",
      phone: "08123456789",
      password: customerPassword,
      role: Role.CUSTOMER,
    },
  });
  // ----------------------------------------------------------
  // ADMIN
  // ----------------------------------------------------------
 const admin = await prisma.user.upsert({
    where: { email: "admin@arenaku.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@arenaku.com",
      phone: "08100000000",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  // ----------------------------------------------------------
  // VENDOR + VendorProfile + Venue + Fields + Images + Contacts
  // ----------------------------------------------------------
  const vendor = await prisma.user.upsert({
    where: { email: "vendor@arenaku.com" },
    update: {},
    create: {
      name: "Vendor Jaya",
      email: "vendor@arenaku.com",
      phone: "08123456780",
      password: vendorPassword,
      role: Role.VENDOR,
      vendorProfile: {
        create: {
          status: "VERIFIED", // langsung verified untuk testing
          venues: {
            create: {
              name: "Futsal Arena Jakarta",
              description: "Lapangan futsal indoor ber-AC dengan rumput sintetis berkualitas tinggi.",
              city: "Jakarta",
              address: "Jl. Sudirman No. 10, Jakarta Pusat",
              latitude: -6.2088,
              longitude: 106.8456,
              images: {
                create: [
                  { url: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800" },
                ],
              },
              fields: {
                create: [
                  {
                    name: "Lapangan A",
                    type: "FUTSAL",
                    floorType: "Rumput Sintetis",
                    length: 40,
                    width: 20,
                    price: 100000,
                    description: "Lapangan futsal indoor ber-AC.",
                    images: {
                      create: [
                        { url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800" },
                      ],
                    },
                    contacts: {
                      create: [
                        {
                          name: "Pak Budi",
                          email: "budi@futsalarena.com",
                          phone: "08111222333",
                        },
                      ],
                    },
                  },
                  {
                    name: "Lapangan B",
                    type: "FUTSAL",
                    floorType: "Vinyl",
                    length: 40,
                    width: 20,
                    price: 120000,
                    description: "Lapangan futsal dengan lantai vinyl premium.",
                    images: {
                      create: [
                        { url: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800" },
                      ],
                    },
                    contacts: {
                      create: [
                        {
                          name: "Pak Budi",
                          email: "budi@futsalarena.com",
                          phone: "08111222333",
                        },
                      ],
                    },
                  },
                  {
                    name: "Court Badminton 1",
                    type: "BADMINTON",
                    floorType: "Kayu",
                    length: 13,
                    width: 6,
                    price: 75000,
                    description: "Court badminton standar BWF dengan lantai kayu.",
                    contacts: {
                      create: [
                        {
                          name: "Pak Budi",
                          email: "budi@futsalarena.com",
                          phone: "08111222333",
                        },
                      ],
                    },
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
          venues: { include: { fields: true } },
        },
      },
    },
  });
  console.log("✅ Vendor:", vendor.email);
  console.log("   Venues:", vendor.vendorProfile?.venues.length);
  console.log(
    "   Fields:",
    vendor.vendorProfile?.venues.reduce((acc, v) => acc + v.fields.length, 0)
  );

  // ----------------------------------------------------------
  // EVENT
  // ----------------------------------------------------------
  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 30);

  const sampleEvent = await prisma.event.upsert({
    where: { id: "sample-event-001" },
    update: {},
    create: {
      id: "sample-event-001",
      title: "Turnamen Futsal Antar Komunitas",
      description: "Turnamen futsal seru untuk semua kalangan. Hadiah total Rp 5.000.000!",
      location: "Futsal Arena Jakarta",
      city: "Jakarta",
      category: "FUTSAL",
      imageUrl: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800",
      date: eventDate,
      startHour: 8,
      endHour: 20,
      ticketPrice: 50000,
      capacity: 16,
      additionalInfo: "- Registrasi ulang 1 jam sebelum pertandingan\n- Bawa perlengkapan sendiri\n- Sistem gugur",
      termsConditions: "- Biaya tidak dapat dikembalikan\n- Keputusan wasit bersifat final\n- Wajib sportivitas",
      contactName: "Pak Budi",
      contactEmail: "budi@futsalarena.com",
      contactPhone: "08111222333",
      latitude: -6.2088,
      longitude: 106.8456,
      creatorId: admin.id,
    },
  });
  console.log("✅ Event:", sampleEvent.title);

  console.log("\n🎉 Seeding completed!");
  console.log("\n📋 Test credentials:");
  console.log("   Customer → customer@mail.com / 123456");
  console.log("   Vendor   → vendor@mail.com   / 123456  (status: VERIFIED)");
  console.log("   Admin    → admin@mail.com     / admin123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });