import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

const BCRYPT_SALT_ROUNDS = 10;

export const profileService = {
  async updateProfile(
    userId: string,
    data: {
      name?: string;
      phone?: string;
      vendorName?: string;
      currentPassword?: string;
      newPassword?: string;
    },
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.phone) updateData.phone = data.phone;

    // Ganti password hanya jika keduanya diisi
    if (data.newPassword) {
      if (!data.currentPassword) {
        throw new Error("Current password is required to set a new password");
      }

      const isValid = await bcrypt.compare(data.currentPassword, user.password);
      if (!isValid) throw new Error("Current password is incorrect");

      if (data.newPassword.length < 6) {
        throw new Error("New password must be at least 6 characters");
      }

      updateData.password = await bcrypt.hash(
        data.newPassword,
        BCRYPT_SALT_ROUNDS,
      );
    }

    // 1. UPDATE DATA USER BISA (Nama & Password)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    // 2. UPDATE DATA VENDOR (Nama Bisnis) JIKA DIA OWNER
    let updatedVendor = null;
    if (data.vendorName) {
      const vendorMember = await prisma.vendorMember.findFirst({
        where: { userId },
      });

      // Pastikan yang nge-request emang OWNER
      if (vendorMember && vendorMember.role === "OWNER") {
        try {
          updatedVendor = await prisma.vendor.update({
            where: { id: vendorMember.vendorId },
            data: { name: data.vendorName },
          });
        } catch (err) {
          console.error("Failed to update vendor name:", err);
        }
      }
    }

    return { user: updatedUser, vendor: updatedVendor };
  },
};
