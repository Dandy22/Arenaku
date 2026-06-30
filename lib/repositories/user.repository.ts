import { prisma } from "@/lib/prisma";

export const userRepository = {
  findByEmail: (email: string) =>
    prisma.user.findUnique({
      where: { email },
    }),
  findById: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        vendorMemberships: {
          include: { vendor: true },
        },
      },
    }),
  findAll: () =>
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        // password dikecualikan
      },
      orderBy: { createdAt: "desc" },
    }),

  create: (data: {
    name: string;
    vendorName?: string;
    email: string;
    phone: string;
    password: string;
    role?: "CUSTOMER" | "VENDOR" | "ADMIN";
    address?: string;
    district?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountName?: string;
  }) =>
    prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: data.role ?? "CUSTOMER",
        address: data.address,
        district: data.district,
        // GANTI vendorProfile jadi vendorMemberships
        vendorMemberships:
          data.role === "VENDOR"
            ? {
                create: {
                  role: "OWNER",
                  vendor: {
                    create: {
                      status: "PENDING",
                      name: data.vendorName || data.name,
                    },
                  },
                },
              }
            : undefined,
      },
    }),
};
