import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      name: "Customer Demo",
      email: "customer@mail.com",
      phone: "08123456789",
      password: "123456",
      role: Role.CUSTOMER,
    },
  });

  const vendorUser = await prisma.user.create({
    data: {
      name: "Vendor Demo",
      email: "vendor@mail.com",
      phone: "08123456780",
      password: "123456",
      role: Role.VENDOR,
      vendorProfile: {
        create: {
          venues: {
            create: {
              name: "Futsal Arena",
              description: "Lapangan futsal indoor",
              city: "Jakarta",
              fields: {
                create: [
                  { name: "Lapangan A", type: "FUTSAL", price: 100000 },
                  { name: "Lapangan B", type: "FUTSAL", price: 120000 },
                ],
              },
            },
          },
        },
      },
    },
  });

  console.log({ user, vendorUser });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
