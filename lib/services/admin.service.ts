import { adminRepository } from "@/lib/repositories/admin.repository";
import { notificationService } from "@/lib/services/notification.service";

export const adminService = {
  // ----------------------------------------------------------
  // getAllVendors
  // Ambil semua vendor, bisa difilter by status.
  // ----------------------------------------------------------
  async getAllVendors(
    userRole: string,
    status?: "PENDING" | "VERIFIED" | "REJECTED",
    search?: string,
  ) {
    if (userRole !== "ADMIN") {
      throw new Error("Only admins can view vendor list");
    }

    return adminRepository.findAllVendors(status, search);
  },
  // ----------------------------------------------------------
  // updateVendorStatus
  // Admin approve atau reject vendor.
  // Vendor yang VERIFIED bisa tambah venue & lapangan.
  // ----------------------------------------------------------
  async updateVendorStatus(
    userRole: string,
    vendorId: string,
    status: "VERIFIED" | "REJECTED",
  ) {
    if (userRole !== "ADMIN") {
      throw new Error("Only admins can verify vendors");
    }

    const vendor = await adminRepository.findVendorById(vendorId);
    if (!vendor) throw new Error("Vendor not found");

    // Jangan proses yang sudah di-approve/reject dengan status sama
    if (vendor.status === status) {
      throw new Error(`Vendor is already ${status}`);
    }

    // Jika ingin verifikasi tapi bank details kosong, tolak
    if (status === "VERIFIED") {
      if (
        !vendor.bankName ||
        !vendor.bankAccountNumber ||
        !vendor.bankAccountName
      ) {
        throw new Error("Vendor must fill bank details before verification");
      }
    }

    // Update vendor status
    const updatedVendor = await adminRepository.updateVendorStatus(
      vendorId,
      status,
    );

    // Trigger notifikasi ke vendor
    await notificationService.notifyVendorStatusChange(vendorId, status);

    // Jika vendor baru (dari PENDING ke VERIFIED), trigger notifikasi ke admin
    if (vendor.status === "PENDING" && status === "VERIFIED") {
      // Vendor sudah diapprove, tidak perlu notifikasi tambahan ke admin
      console.log(`[AdminService] Vendor ${vendorId} verified successfully`);
    }

    return updatedVendor;
  },

  // ----------------------------------------------------------
  // getAllOrders
  // Monitor semua order di sistem (khusus admin).
  // ----------------------------------------------------------
  async getAllOrders(userRole: string) {
    if (userRole !== "ADMIN") {
      throw new Error("Only admins can view all orders");
    }
    return adminRepository.findAllOrders();
  },

  // ----------------------------------------------------------
  // getAllUsers
  // Ambil semua user dengan optional filter role
  // ----------------------------------------------------------
  async getAllUsers(userRole: string, role?: "ADMIN" | "VENDOR" | "CUSTOMER") {
    if (userRole !== "ADMIN") {
      throw new Error("Only admins can view all users");
    }
    return adminRepository.findAllUsers(role);
  },

  // ----------------------------------------------------------
  // updateUserSuspension
  // Admin suspend atau aktifkan kembali user
  // ----------------------------------------------------------
  async updateUserSuspension(
    userRole: string,
    userId: string,
    isSuspended: boolean,
  ) {
    if (userRole !== "ADMIN") {
      throw new Error("Only admins can suspend users");
    }

    return adminRepository.updateUserSuspension(userId, isSuspended);
  },

  // ----------------------------------------------------------
  // deleteUser
  // Admin hapus user
  // ----------------------------------------------------------
  async deleteUser(userRole: string, userId: string) {
    if (userRole !== "ADMIN") {
      throw new Error("Only admins can delete users");
    }

    return adminRepository.deleteUser(userId);
  },

  // ----------------------------------------------------------
  // deleteVendor
  // Hapus vendor beserta data terkait (cascade).
  // ----------------------------------------------------------
  async deleteVendor(userRole: string, vendorId: string) {
    if (userRole !== "ADMIN") {
      throw new Error("Only admins can delete vendors");
    }

    const vendor = await adminRepository.findVendorById(vendorId);
    if (!vendor) throw new Error("Vendor not found");

    return adminRepository.deleteVendor(vendorId);
  },
};
