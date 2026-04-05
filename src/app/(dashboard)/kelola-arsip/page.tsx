import { ArchiveManager } from "@/components/settings/archive-manager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kelola Arsip | PBB",
  description: "Manajemen arsip digital PBB",
};

export default function ArsipPbbPage() {
  return (
    <div className="p-1 sm:p-2">
      <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <ArchiveManager />
      </div>
    </div>
  );
}
