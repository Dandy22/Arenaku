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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Memulai proses seeding data UAT Arenaku (Fixed Path)...");

  // 1. CLEANUP (Menghapus data lama)
  await prisma.notification.deleteMany();
  await prisma.eventTicket.deleteMany();
  await prisma.eventParticipant.deleteMany();
  await prisma.eventTicketTier.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.vendorRating.deleteMany();
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

  const adminPassword = await bcrypt.hash("admin123", 10);
  const customerPassword = await bcrypt.hash("customer123", 10);
  const vendorPassword = await bcrypt.hash("vendor123", 10);
  const secondaryPassword = await bcrypt.hash("password123", 10);

  // 2. CREATE USERS
  const adminUser = await prisma.user.create({
    data: {
      name: "Super Admin Arenaku",
      email: "admin@arenaku.com",
      phone: "0811111111",
      password: adminPassword,
      role: Role.ADMIN,
      isEmailVerified: true,
    },
  });

  const mainCustomer = await prisma.user.create({
    data: {
      name: "Rizky Ramadhan",
      email: "customer@arenaku.com",
      phone: "0833333333",
      password: customerPassword,
      role: Role.CUSTOMER,
      isEmailVerified: true,
      address: "Pekayon Jaya",
      district: "Bekasi Selatan",
    },
  });

  const mainVendorOwner = await prisma.user.create({
    data: {
      name: "Budi Santoso",
      email: "vendor@arenaku.com",
      phone: "0821111111",
      password: vendorPassword,
      role: Role.VENDOR,
      isEmailVerified: true,
    },
  });

  const reviewerUser1 = await prisma.user.create({
    data: {
      name: "Dandy Antariksa",
      email: "dandy@example.com",
      phone: "08123456789",
      password: secondaryPassword,
      role: Role.CUSTOMER,
      isEmailVerified: true,
    },
  });

  const reviewerUser2 = await prisma.user.create({
    data: {
      name: "Siti Aminah",
      email: "siti@example.com",
      phone: "08987654321",
      password: secondaryPassword,
      role: Role.CUSTOMER,
      isEmailVerified: true,
    },
  });

  const vendorOwner2 = await prisma.user.create({
    data: {
      name: "Andi Wijaya",
      email: "futsal@vendor.com",
      phone: "0822222222",
      password: secondaryPassword,
      role: Role.VENDOR,
      isEmailVerified: true,
    },
  });

  // 3. CREATE VENDORS & VENUES (LOCAL ASSETS - DIRECT PUBLIC ROOT)

  // Vendor 1: Badminton
  const vendorBadminton = await prisma.vendor.create({
    data: {
      name: "Bekasi Smash Center",
      description:
        "Pusat pelatihan dan penyewaan lapangan badminton profesional di Bekasi. Fasilitas bersertifikasi BWF dengan pencahayaan standar turnamen nasional.",
      status: VendorStatus.VERIFIED,
      bankName: "BCA",
      bankAccountNumber: "1234567890",
      bankAccountName: "Budi Santoso",
      balance: 1500000,
      members: {
        create: {
          userId: mainVendorOwner.id,
          role: VendorRole.OWNER,
        },
      },
      venues: {
        create: {
          name: "Bekasi Smash Arena",
          description:
            "Arena badminton eksklusif yang dilengkapi dengan lapangan karpet premium. Memiliki sirkulasi udara optimal, ruang ganti ber-AC, dan area penonton.",
          city: "Bekasi",
          district: "Bekasi Selatan",
          address: "Jl. Boulevard Raya No. 88, Pekayon Jaya",
          latitude: -6.2573,
          longitude: 106.9896,
          thumbnailUrl: "/venueimg/Thumbnail Venue Bulu Tangkis.jpg",
          isOpen: true,
          openHour: 8,
          closeHour: 23,
          images: {
            create: [
              {
                url: "/venueimg/Lapangan Bulu Tangkis Tampak Depan.jpg",
                title: "Tampak Depan Lapangan",
              },
            ],
          },
          fields: {
            create: {
              name: "Court 1 (VIP)",
              type: "BADMINTON",
              floorType: "Carpet BWF",
              length: 13.4,
              width: 6.1,
              price: 75000,
              description:
                "Lapangan utama dengan karpet standar internasional. Posisi di tengah arena, jauh dari silau matahari.",
              thumbnailUrl: "/venueimg/Lapangan Bulu Tangkis Tampak Depan.jpg",
              images: {
                create: {
                  url: "/venueimg/Lapangan Bulu Tangkis Tampak Depan.jpg",
                  title: "Detail Lapangan",
                },
              },
              contacts: {
                create: { name: "Admin Smash", phone: "0812345678" },
              },
            },
          },
        },
      },
    },
  });

  // Vendor 2: Futsal
  const vendorFutsal = await prisma.vendor.create({
    data: {
      name: "Juara Futsal Bekasi",
      description:
        "Kompleks olahraga futsal terbesar di Bekasi Barat. Menyediakan lapangan dengan fasilitas setara stadion mini.",
      status: VendorStatus.VERIFIED,
      bankName: "MANDIRI",
      bankAccountNumber: "0987654321123",
      bankAccountName: "Andi Wijaya",
      balance: 500000,
      members: {
        create: {
          userId: vendorOwner2.id,
          role: VendorRole.OWNER,
        },
      },
      venues: {
        create: {
          name: "Juara Futsal Hub",
          description:
            "Venue futsal indoor dengan pencahayaan yang merata. Fasilitas mencakup parkir luas, loker, mushola, dan area tunggu.",
          city: "Bekasi",
          district: "Bekasi Barat",
          address: "Jl. Bintara Raya No. 15",
          latitude: -6.2345,
          longitude: 106.9745,
          thumbnailUrl: "/venueimg/Thumbnail Venue Lapangan Futsal 1.jpg",
          isOpen: true,
          openHour: 7,
          closeHour: 24,
          images: {
            create: [
              {
                url: "/venueimg/Lapangan Futsal Tampak Atas 2.jpg",
                title: "Tampak Atas Lapangan Utama",
              },
              {
                url: "/venueimg/Lapangan Futsal Tampak Atas.jpg",
                title: "View Drone Lapangan",
              },
            ],
          },
          fields: {
            create: {
              name: "Lapangan Sintetis A",
              type: "FUTSAL",
              floorType: "Rumput Sintetis",
              length: 25,
              width: 15,
              price: 150000,
              description:
                "Lapangan futsal dengan rumput sintetis premium. Empuk, meminimalisir cedera lutut.",
              thumbnailUrl: "/venueimg/Thumbnail Venue Lapangan Futsal 2.jpg",
              images: {
                create: [
                  {
                    url: "/venueimg/Gawang 2 Lapangan Futsal.jpg",
                    title: "Gawang Lapangan",
                  },
                  {
                    url: "/venueimg/Gawang Lapangan Futsal.jpg",
                    title: "Detail Area Gawang",
                  },
                ],
              },
              contacts: {
                create: { name: "Bang Andi", phone: "0855555555" },
              },
            },
          },
        },
      },
    },
  });

  // 4. CREATE REVIEWS/RATINGS
  const targetVenue = await prisma.venue.findFirst({
    where: { name: "Bekasi Smash Arena" },
  });

  if (targetVenue) {
    await prisma.venueRating.createMany({
      data: [
        {
          venueId: targetVenue.id,
          userId: mainCustomer.id,
          rating: 5,
          comment:
            "Luar biasa! Pengalaman booking lewat Arenaku sangat mulus. Pas sampai lokasi, lapangannya terawat banget. Karpetnya nge-grip dan gak licin sama sekali.",
        },
        {
          venueId: targetVenue.id,
          userId: reviewerUser1.id,
          rating: 5,
          comment:
            "Pencahayaannya pas, gak bikin silau kalau lagi ambil bola lob atau mau smash. Kantinnya juara!",
        },
      ],
    });
  }

  // 5. CREATE EVENTS

  // Event 1: Futsal Championship
  await prisma.event.create({
    data: {
      title: "Liga Pelajar & Mahasiswa: Bekasi Futsal Championship 2026",
      description:
        "Ajang pembuktian tim futsal terbaik se-Bekasi Raya! Turnamen bergengsi ini memperebutkan total hadiah uang tunai Rp 15.000.000, medali, dan piala bergilir walikota.",
      location: "Juara Futsal Hub",
      city: "Bekasi",
      district: "Bekasi Barat",
      category: "Turnamen",
      topic: "Futsal",
      date: new Date("2026-08-15T08:00:00Z"),
      endDate: new Date("2026-08-17T20:00:00Z"),
      startHour: 8,
      endHour: 20,
      capacity: 500,
      creatorId: vendorOwner2.id,
      status: EventStatus.ACTIVE,
      ticketPrice: 20000,
      contactName: "Panitia BFC",
      contactPhone: "081299998888",
      imageUrl: "/venueimg/Thumbnail Event Olahraga Futsal.jpg",
      ticketTiers: {
        create: [
          {
            name: "Pendaftaran Tim",
            stock: 32,
            price: 350000,
            description: "Tiket registrasi untuk 1 tim futsal.",
          },
        ],
      },
    },
  });

  // Event 2: Mabar Badminton
  await prisma.event.create({
    data: {
      title: "Main Bareng (Mabar) Badminton: Fun Match & Networking",
      description:
        "Yuk gabung di sesi 'Mabar Fun Match'! Acara ini ditujukan khusus untuk pegiat olahraga amatir yang ingin cari keringat sekaligus nambah relasi di area Bekasi.\n\nPeserta cukup membawa raket dan sepatu sendiri.",
      location: "Bekasi Smash Arena",
      city: "Bekasi",
      district: "Bekasi Selatan",
      category: "Olahraga",
      topic: "Badminton",
      date: new Date("2026-06-20T19:00:00Z"),
      endDate: new Date("2026-06-20T22:00:00Z"),
      startHour: 19,
      endHour: 22,
      capacity: 40,
      creatorId: mainVendorOwner.id,
      status: EventStatus.ACTIVE,
      ticketPrice: 35000,
      contactName: "Admin Mabar",
      contactPhone: "081122223333",
      imageUrl: "/venueimg/Thumbnail Event Komunitas Badminton.jpg",
      ticketTiers: {
        create: [
          {
            name: "Slot Pemain Reguler",
            stock: 40,
            price: 35000,
            description: "Tiket jaminan main. Mengcover patungan lapangan.",
          },
        ],
      },
    },
  });

  // Event 3: Masterclass Badminton
  await prisma.event.create({
    data: {
      title: "Masterclass Intensif: Teknik Smash & Footwork BWF",
      description:
        "Kami menghadirkan mantan asisten pelatih Pelatnas untuk membedah biomekanika gerakan badminton yang benar.",
      location: "Bekasi Smash Arena",
      city: "Bekasi",
      district: "Bekasi Selatan",
      category: "Olahraga",
      topic: "Badminton",
      date: new Date("2026-07-05T08:00:00Z"),
      endDate: new Date("2026-07-05T12:00:00Z"),
      startHour: 8,
      endHour: 12,
      capacity: 16,
      creatorId: mainVendorOwner.id,
      status: EventStatus.ACTIVE,
      ticketPrice: 150000,
      contactName: "Coach Budi",
      contactPhone: "085566667777",
      imageUrl: "/venueimg/Lapangan Bulu Tangkis Tampak Depan.jpg",
      ticketTiers: {
        create: [
          {
            name: "Masterclass Access",
            stock: 12,
            price: 150000,
            description: "Akses penuh 4 jam latihan, modul, dan konsumsi.",
          },
        ],
      },
    },
  });

  // 6. ORDER & NOTIFICATION
  const badmintonField = await prisma.field.findFirst({
    where: { name: "Court 1 (VIP)" },
  });

  if (badmintonField) {
    const order = await prisma.order.create({
      data: {
        userId: mainCustomer.id,
        totalAmount: 75000,
        status: OrderStatus.PAID,
        customerName: mainCustomer.name,
        customerPhone: mainCustomer.phone,
        customerEmail: mainCustomer.email,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        items: {
          create: {
            fieldId: badmintonField.id,
            date: new Date(),
            startHour: 19,
            endHour: 20,
            price: 75000,
          },
        },
      },
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: 75000,
        method: "QRIS",
        status: PaymentStatus.SUCCESS,
        paidAt: new Date(),
        expiredAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      },
    });

    await prisma.notification.create({
      data: {
        userId: mainVendorOwner.id,
        type: NotificationType.BOOKING_NEW,
        target: NotificationTarget.VENDOR,
        title: "Pesanan Baru Masuk!",
        message: `${mainCustomer.name} telah memesan lapangan ${badmintonField.name}`,
        data: { orderId: order.id },
      },
    });
  }

  console.log("Seeding selesai! Path gambar sudah diarahin ke /venueimg/");
}

main()
  .catch((e) => {
    console.error("Gagal melakukan seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
