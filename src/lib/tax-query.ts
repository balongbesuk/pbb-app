import { PaymentStatus, Prisma, Role } from "@prisma/client";
import { getNopVariations } from "@/lib/utils";

export const PAYMENT_STATUS_VALUES: PaymentStatus[] = [
  "LUNAS",
  "BELUM_LUNAS",
  "SUSPEND",
  "TIDAK_TERBIT",
];

export type TaxFilterInput = {
  tahun: number;
  q?: string;
  dusun?: string;
  rw?: string;
  rt?: string;
  blok?: string;
  penarik?: string;
  regionStatus?: string;
  paymentStatus?: string;
};

type TaxWhereOptions = {
  includeAddressSearch?: boolean;
  includePaymentStatus?: boolean;
  roleScope?: {
    role?: Role | string;
    userId?: string;
    restrictPenarikToOwn?: boolean;
  };
};

export function buildTaxWhereInput(
  filters: TaxFilterInput,
  options: TaxWhereOptions = {}
): Prisma.TaxDataWhereInput {
  const includeAddressSearch = options.includeAddressSearch ?? true;
  const includePaymentStatus = options.includePaymentStatus ?? true;
  const whereClause: Prisma.TaxDataWhereInput = {
    tahun: filters.tahun,
  };
  const andFilters: Prisma.TaxDataWhereInput[] = [];

  if (
    includePaymentStatus &&
    filters.paymentStatus &&
    filters.paymentStatus !== "all" &&
    PAYMENT_STATUS_VALUES.includes(filters.paymentStatus as PaymentStatus)
  ) {
    whereClause.paymentStatus = filters.paymentStatus as PaymentStatus;
  }

  if (filters.q) {
    const searchQuery = filters.q.trim();
    const variations = getNopVariations(searchQuery);
    const orConditions: Prisma.TaxDataWhereInput[] = [
      ...variations.map((variation) => ({ nop: { contains: variation } })),
      { namaWp: { contains: searchQuery } },
      { namaWp: { contains: searchQuery.toUpperCase() } },
    ];

    if (includeAddressSearch) {
      orConditions.push(
        { alamatObjek: { contains: searchQuery } },
        { alamatObjek: { contains: searchQuery.toUpperCase() } }
      );
    }

    andFilters.push({ OR: orConditions });
  }

  if (filters.regionStatus === "incomplete") {
    andFilters.push({
      OR: [
        { dusun: null },
        { rw: null },
        { rt: null },
        { dusun: "" },
        { rw: "" },
        { rt: "" },
      ],
    });
  }

  if (filters.dusun && filters.dusun !== "all") whereClause.dusun = filters.dusun;
  if (filters.rw && filters.rw !== "all") whereClause.rw = filters.rw;
  if (filters.rt && filters.rt !== "all") whereClause.rt = filters.rt;

  if (filters.blok && filters.blok !== "all") {
    // Blok is segment 5 of NOP (length 3).
    // Based on user feedback, the block segment is usually surrounded by a dot and a dash: .BBB-
    // Example: 35.17.040.019.017-XXXX.X
    // We match ".BLOK-" to avoid false positives in the object segment.
    andFilters.push({
      OR: [
        { nop: { contains: `.${filters.blok}-` } },
        { nop: { contains: `.${filters.blok}.` } }
      ]
    });
  }

  if (filters.penarik && filters.penarik !== "all") {
    whereClause.penarikId = filters.penarik === "none" ? null : filters.penarik;
  }

  if (
    options.roleScope?.restrictPenarikToOwn &&
    options.roleScope.role === "PENARIK" &&
    options.roleScope.userId
  ) {
    whereClause.penarikId = options.roleScope.userId;
  }

  if (andFilters.length > 0) {
    whereClause.AND = andFilters;
  }

  return whereClause;
}

export function buildTaxOrderBy(
  sortBy = "nop",
  sortOrder = "asc"
): Prisma.TaxDataOrderByWithRelationInput {
  const order = sortOrder === "desc" ? "desc" : "asc";
  const field =
    sortBy === "tagihan"
      ? "sisaTagihan"
      : sortBy === "nama"
        ? "namaWp"
        : sortBy === "status"
          ? "paymentStatus"
          : "nop";

  return { [field]: order };
}
