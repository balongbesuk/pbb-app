import { z } from "zod";

export const UserSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  username: z.string().min(3, "Username minimal 3 karakter"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  password: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal("")),
  role: z.enum(["ADMIN", "PENARIK", "PENGGUNA"]),
  dusun: z.string().optional(),
  rt: z.string().optional(),
  rw: z.string().optional(),
});

export const TaxRegionUpdateSchema = z.object({
  taxId: z.number(),
  dusun: z.string().min(1, "Dusun harus diisi"),
  rt: z.string().min(1, "RT harus diisi"),
  rw: z.string().min(1, "RW harus diisi"),
});

export const TransferRequestSchema = z.object({
  taxId: z.number(),
  receiverId: z.string().min(1, "Pilih penerima"),
  type: z.enum(["GIVE", "TAKE"]),
  message: z.string().max(200, "Pesan maksimal 200 karakter").optional(),
});

export const VillageConfigSchema = z.object({
  namaDesa: z.string().min(1, "Nama desa harus diisi").optional().or(z.literal("")),
  kecamatan: z.string().min(1, "Kecamatan harus diisi").optional().or(z.literal("")),
  kabupaten: z.string().min(1, "Kabupaten harus diisi").optional().or(z.literal("")),
  alamatKantor: z.string().optional().or(z.literal("")),
  email: z.string().optional().or(z.literal("")),
  kodePos: z.string().optional().or(z.literal("")),
  namaKades: z.string().optional().or(z.literal("")),
  tahunPajak: z.number().int().min(2000).max(2100).optional(),
  jatuhTempo: z.string().min(1, "Jatuh tempo harus diisi").optional(),
  bapendaUrl: z.string().url("Format URL tidak valid").or(z.literal("")).optional(),
  bapendaPaymentUrl: z.string().url("Format URL tidak valid").or(z.literal("")).optional(),
  enableBapendaPayment: z.boolean().optional(),
  bapendaRegionName: z.string().optional().or(z.literal("")),
  isJombangBapenda: z.boolean().optional(),
  enableBapendaSync: z.boolean().optional(),
  showNominalPajak: z.boolean().optional(),
  enableDigitalArchive: z.boolean().optional(),
  archiveOnlyLunas: z.boolean().optional(),
  enablePublicGis: z.boolean().optional(),
  showUnpaidDetailsGis: z.boolean().optional(),
  enablePbbMobile: z.boolean().optional(),
  mapCenterLat: z.number().optional(),
  mapCenterLng: z.number().optional(),
  mapDefaultZoom: z.number().int().min(1).max(22).optional(),
});

export const PaymentStatusSchema = z.object({
  id: z.union([z.string(), z.number()]),
  paymentStatus: z.enum(["LUNAS", "BELUM_LUNAS", "TIDAK_TERBIT"]),
});

export function formatZodError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues.map((e) => e.message).join(", ");
  }

  // Handle errors that looks like ZodError but lost instance (e.g. through IPC/actions)
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "ZodError"
  ) {
    const serialized = error as { issues?: Array<{ message?: string }>; errors?: Array<{ message?: string }>; message?: string };
    const issues = serialized.issues || serialized.errors;
    if (Array.isArray(issues)) {
      return issues.map((issue) => issue.message || "Terjadi kesalahan validasi").join(", ");
    }
  }

  // Fallback: If Zod serialized the error message as a JSON array string
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (typeof message === "string" && message.startsWith("[")) {
    try {
      const parsed = JSON.parse(message) as Array<{ message?: string }>;
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.message) {
        return parsed.map((entry) => entry.message || "Terjadi kesalahan validasi").join(", ");
      }
    } catch {
      // ignore JSON parse error
    }
  }

  return message || "Terjadi kesalahan sistem";
}
