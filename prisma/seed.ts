import {
  PrismaClient,
  Role,
  VendorRole,
  VendorStatus,
  OrderStatus,
  PaymentStatus,
  EventStatus,
  TicketStatus,
  NotificationType,
  NotificationTarget,
} from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";

// Inisialisasi koneksi pool ke PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Adapter Prisma dengan pg pool
const adapter = new PrismaPg(pool);

// Buat PrismaClient dengan adapter
const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Memulai proses seeding...");

  // 1. CLEANUP (Menghapus data lama dengan urutan yang benar)
  // Hapus tabel anak terlebih dahulu sebelum tabel induk
  await prisma.notification.deleteMany();
  await prisma.eventTicket.deleteMany();
  await prisma.eventParticipant.deleteMany();
  await prisma.eventTicketTier.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.fieldContact.deleteMany();
  await prisma.fieldImage.deleteMany();
  await prisma.field.deleteMany();
  await prisma.venueRating.deleteMany();
  await prisma.venueImage.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.event.deleteMany();
  await prisma.vendorMember.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();

  // Hash password masing-masing role agar mudah diingat
  const adminPassword = await bcrypt.hash("admin123", 10);
  const vendorPassword = await bcrypt.hash("vendor123", 10);
  const customerPassword = await bcrypt.hash("customer123", 10);

  // 2. CREATE USERS
  const adminUser = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "admin@example.com",
      phone: "0811111111",
      password: adminPassword,
      role: Role.ADMIN,
      isEmailVerified: true,
    },
  });

  const vendorOwner = await prisma.user.create({
    data: {
      name: "Budi Santoso",
      email: "vendor@example.com",
      phone: "0822222222",
      password: vendorPassword,
      role: Role.VENDOR,
      isEmailVerified: true,
      address: "Jl. Ir. H. Juanda No. 10",
      district: "Coblong",
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      name: "Rizky Ramadhan",
      email: "customer@example.com",
      phone: "0833333333",
      password: customerPassword,
      role: Role.CUSTOMER,
      isEmailVerified: true,
    },
  });

  // 3. CREATE VENDOR (ORGANIZATION)
  const gorSukamaju = await prisma.vendor.create({
    data: {
      name: "GOR Sukamaju Center",
      description: "Pusat olahraga terlengkap dan termurah di Bandung.",
      status: VendorStatus.VERIFIED,
      bankName: "BCA",
      bankAccountNumber: "8877665544",
      bankAccountName: "Budi Santoso",
      balance: 500000,
    },
  });

  // 4. CREATE VENDOR MEMBER (LINK USER TO VENDOR)
  await prisma.vendorMember.create({
    data: {
      userId: vendorOwner.id,
      vendorId: gorSukamaju.id,
      role: VendorRole.OWNER,
    },
  });

  // 5. CREATE VENUE
  const venueBadminton = await prisma.venue.create({
    data: {
      name: "Sukamaju Badminton Arena",
      description:
        "Lapangan badminton eksklusif dengan karpet standar internasional.",
      city: "Bandung",
      district: "Coblong",
      address: "Jl. Ir. H. Juanda No. 10",
      latitude: -6.8915,
      longitude: 107.6107,
      vendorId: gorSukamaju.id,
      thumbnailUrl: "https://placehold.co/600x400/png",
    },
  });

  // 6. CREATE VENUE IMAGE & RATING
  await prisma.venueImage.create({
    data: {
      venueId: venueBadminton.id,
      url: "https://placehold.co/600x400/png",
      title: "Tampak Depan",
    },
  });

  await prisma.venueRating.create({
    data: {
      venueId: venueBadminton.id,
      userId: customerUser.id,
      rating: 5,
      comment: "Tempatnya bersih banget, mantap!",
    },
  });

  // 7. CREATE FIELD
  const field1 = await prisma.field.create({
    data: {
      name: "Lapangan 1 (VIP)",
      type: "Badminton",
      floorType: "Carpet",
      length: 13.4,
      width: 6.1,
      price: 60000,
      description: "Lapangan khusus VIP dekat dengan kantin.",
      venueId: venueBadminton.id,
      thumbnailUrl: "https://placehold.co/600x400/png",
    },
  });

  // 8. FIELD CONTACT & IMAGE
  await prisma.fieldContact.create({
    data: {
      fieldId: field1.id,
      name: "Staff Jaga Sore",
      phone: "0812345678",
    },
  });

  await prisma.fieldImage.create({
    data: {
      fieldId: field1.id,
      url: "https://placehold.co/600x400/png",
      title: "Foto Lapangan 1",
    },
  });

  // 9. CREATE EVENT & TICKET TIERS
  const eventFutsal = await prisma.event.create({
    data: {
      title: "Bandung Futsal League 2026",
      description: "Turnamen futsal bergengsi tingkat kota.",
      location: "GOR Sukamaju",
      city: "Bandung",
      date: new Date("2026-06-10T08:00:00Z"),
      endDate: new Date("2026-06-10T20:00:00Z"),
      startHour: 8,
      endHour: 20,
      capacity: 200,
      creatorId: vendorOwner.id,
      status: EventStatus.ACTIVE,
      ticketPrice: 25000,
      contactName: "Panitia Event",
      contactPhone: "089999999",
    },
  });

  await prisma.eventTicketTier.createMany({
    data: [
      {
        eventId: eventFutsal.id,
        name: "Regular Entrance",
        stock: 150,
        price: 25000,
        description: "Akses masuk tribun.",
      },
      {
        eventId: eventFutsal.id,
        name: "Courtside VIP",
        stock: 50,
        price: 75000,
        description: "Akses duduk pinggir lapangan.",
      },
    ],
  });

  // 10. CREATE ORDER & ORDER ITEM (Booking Lapangan)
  const order = await prisma.order.create({
    data: {
      userId: customerUser.id,
      totalAmount: 60000,
      status: OrderStatus.PAID,
      customerName: customerUser.name,
      customerPhone: customerUser.phone,
      customerEmail: customerUser.email,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 jam
      items: {
        create: {
          fieldId: field1.id,
          date: new Date(),
          startHour: 19,
          endHour: 20,
          price: 60000,
        },
      },
    },
  });

  // 11. CREATE PAYMENT
  await prisma.payment.create({
    data: {
      orderId: order.id,
      amount: 60000,
      method: "QRIS",
      status: PaymentStatus.SUCCESS,
      paidAt: new Date(),
      expiredAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    },
  });

  // 12. CREATE EVENT TICKET & PARTICIPANT
  await prisma.eventTicket.create({
    data: {
      eventId: eventFutsal.id,
      userId: customerUser.id,
      quantity: 1,
      totalPrice: 25000,
      status: TicketStatus.CONFIRMED,
      orderId: order.id,
      confirmedAt: new Date(),
    },
  });

  await prisma.eventParticipant.create({
    data: {
      eventId: eventFutsal.id,
      userId: customerUser.id,
    },
  });

  // 13. CREATE CART ITEM
  await prisma.cartItem.create({
    data: {
      userId: customerUser.id,
      fieldId: field1.id,
      date: new Date(),
      startHour: 20,
      endHour: 21,
    },
  });

  // 14. CREATE NOTIFICATION
  await prisma.notification.create({
    data: {
      userId: vendorOwner.id,
      type: NotificationType.BOOKING_NEW,
      target: NotificationTarget.VENDOR,
      title: "Pesanan Baru!",
      message: `${customerUser.name} telah memesan lapangan ${field1.name}`,
      data: { orderId: order.id },
    },
  });

  console.log("Seeding selesai!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
