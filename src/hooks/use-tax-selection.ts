import { useState, useCallback, useMemo } from "react";
import type { TaxDataItem, AppUser } from "@/types/app";

export function useTaxSelection({
  displayData,
  currentUser,
  isPenarik,
  ownPenarikFilterActive,
  onSwitchToOwnAssignments,
}: {
  displayData: TaxDataItem[];
  currentUser: AppUser | undefined;
  isPenarik: boolean;
  ownPenarikFilterActive: boolean;
  onSwitchToOwnAssignments: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedAmounts, setSelectedAmounts] = useState<Map<number, { amount: number; name: string }>>(new Map());
  const [isAllFilteredSelected, setIsAllFilteredSelected] = useState(false);

  const selectedSum = useMemo(() => 
    Array.from(selectedAmounts.values()).reduce((acc, obj) => acc + obj.amount, 0),
  [selectedAmounts]);

  const resetSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectedAmounts(new Map());
    setIsAllFilteredSelected(false);
  }, []);

  const isRowSelectable = useCallback((item: TaxDataItem) => {
    if (!isPenarik) return true;
    return item.penarikId === currentUser?.id && item.paymentStatus !== "LUNAS";
  }, [isPenarik, currentUser?.id]);

  const getSelectionHint = useCallback((item: TaxDataItem) => {
    if (!isPenarik) return undefined;
    if (item.paymentStatus === "LUNAS") return "Data yang lunas tidak bisa dicentang.";
    if (item.penarikId !== currentUser?.id) return "Hanya data milik Anda (Penarik) yang bisa dicentang.";
    return undefined;
  }, [isPenarik, currentUser?.id]);

  const toggleSelectAll = useCallback(() => {
    if (isPenarik && !ownPenarikFilterActive) {
      onSwitchToOwnAssignments();
      return;
    }

    const selectable = displayData.filter((d: TaxDataItem) => isRowSelectable(d));
    const allSelected = selectable.length > 0 && selectable.every((item: TaxDataItem) => selectedIds.has(item.id));

    if (allSelected) {
      const newSet = new Set(selectedIds);
      const newAmounts = new Map(selectedAmounts);
      selectable.forEach((d: TaxDataItem) => {
        newSet.delete(d.id);
        newAmounts.delete(d.id);
      });
      setSelectedIds(newSet);
      setSelectedAmounts(newAmounts);
      setIsAllFilteredSelected(false);
    } else {
      const newSet = new Set(selectedIds);
      const newAmounts = new Map(selectedAmounts);
      selectable.forEach((d: TaxDataItem) => {
        newSet.add(d.id);
        newAmounts.set(d.id, {
          amount: d.sisaTagihan > 0 ? d.sisaTagihan : d.ketetapan,
          name: d.namaWp
        });
      });
      setSelectedIds(newSet);
      setSelectedAmounts(newAmounts);
    }
  }, [selectedIds, selectedAmounts, displayData, isPenarik, ownPenarikFilterActive, onSwitchToOwnAssignments, isRowSelectable]);

  const toggleSelect = useCallback((id: number) => {
    const newSet = new Set(selectedIds);
    const newAmounts = new Map(selectedAmounts);
    
    if (newSet.has(id)) {
      newSet.delete(id);
      newAmounts.delete(id);
      setIsAllFilteredSelected(false);
      setSelectedIds(newSet);
      setSelectedAmounts(newAmounts);
      return;
    }

    if (isPenarik && !ownPenarikFilterActive) {
      onSwitchToOwnAssignments();
      return;
    }

    const item = displayData.find((d: TaxDataItem) => d.id === id);
    if (!item || !isRowSelectable(item)) return;

    newSet.add(id);
    newAmounts.set(id, { 
      amount: item.sisaTagihan > 0 ? item.sisaTagihan : item.ketetapan,
      name: item.namaWp
    });

    setSelectedIds(newSet);
    setSelectedAmounts(newAmounts);
  }, [selectedIds, selectedAmounts, displayData, isPenarik, ownPenarikFilterActive, onSwitchToOwnAssignments, isRowSelectable]);

  return {
    selectedIds,
    selectedAmounts,
    isAllFilteredSelected,
    setIsAllFilteredSelected,
    selectedSum,
    resetSelection,
    isRowSelectable,
    getSelectionHint,
    toggleSelectAll,
    toggleSelect,
  };
}
