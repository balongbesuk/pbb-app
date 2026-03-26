/**
 * Standard column widths for the Tax Data Table to ensure 
 * perfect alignment between Header and Virtualized Rows.
 */
export const TAX_TABLE_WIDTHS = {
  checkbox: "w-[50px] shrink-0",
  nop: "w-[180px] shrink-0",
  wpInfo: "flex-1 min-w-[300px] shrink-0", // Includes Nama WP & Alamat
  wilayah: "w-[150px] shrink-0",
  tagihan: "w-[130px] shrink-0",
  status: "w-[120px] shrink-0",
  penarik: "w-[150px] shrink-0",
  minContainerWidth: "md:min-w-[1100px]",
};

export type TaxColumnKey = keyof typeof TAX_TABLE_WIDTHS;
