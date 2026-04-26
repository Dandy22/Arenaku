import bcrypt from "bcrypt";
import { userRepository } from "@/lib/repositories/user.repository";
import { prisma } from "@/lib/prisma";

const BCRYPT_SALT_ROUNDS = 10;

export const profileService = {
  async updateProfile(
    userId: string,
    data: {
      name?: string;
      phone?: string;
      currentPassword?: string;
      newPassword?: string;
    }
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

      updateData.password = await bcrypt.hash(data.newPassword, BCRYPT_SALT_ROUNDS);
    }

    const updated = await prisma.user.update({
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

    return updated;
  },
};