"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Edit2, Save, X, CheckSquare } from "lucide-react";
import { getWpByRegion, updateWpRegion, updateWpRegionBulk } from "@/app/actions/tax-update-actions";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";

interface RwWpDialogProps {
  dusun: string | null;
  rw: string | null;
  tahun: number;
  count: number;
}

export function RwWpDialog({ dusun, rw, tahun, count }: RwWpDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states for individual editing
  const [editDusun, setEditDusun] = useState("");
  const [editRt, setEditRt] = useState("");
  const [editRw, setEditRw] = useState("");

  // Bulk edit states
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [bulkDusun, setBulkDusun] = useState("");
  const [bulkRt, setBulkRt] = useState("");
  const [bulkRw, setBulkRw] = useState("");

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setLoading(true);
      const res = await getWpByRegion(dusun, rw, tahun);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        toast.error("Gagal mengambil data Wajib Pajak");
      }
      setLoading(false);
    } else {
      setEditingId(null);
      setSelectedIds(new Set());
      setIsBulkEditing(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(d => d.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditDusun(item.dusun || "");
    setEditRt(item.rt || "");
    setEditRw(item.rw || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: number) => {
    const res = await updateWpRegion(id, editDusun || null, editRt || null, editRw || null);
    if (res.success) {
      toast.success("Berhasil memperbarui data wilayah WP");
      setEditingId(null);
      
      // Update local state instead of refetching all
      setData(data.map(item => 
        item.id === id ? { ...item, dusun: editDusun || null, rt: editRt || null, rw: editRw || null } : item
      ));
    } else {
      toast.error(`Gagal memperbarui: ${res.message}`);
    }
  };

  const saveBulkEdit = async () => {
    if (selectedIds.size === 0) return;
    
    setIsBulkEditing(true);
    const res = await updateWpRegionBulk(Array.from(selectedIds), bulkDusun || null, bulkRt || null, bulkRw || null);
    
    if (res.success) {
      toast.success(`Berhasil memperbarui ${res.count} data wp`);
      
      // Update local state
      setData(data.map(item => 
        selectedIds.has(item.id) 
          ? { ...item, dusun: bulkDusun || null, rt: bulkRt || null, rw: bulkRw || null } 
          : item
      ));
      
      setSelectedIds(new Set());
      setBulkDusun("");
      setBulkRt("");
      setBulkRw("");
    } else {
      toast.error(`Gagal update masal: ${res.message}`);
    }
    setIsBulkEditing(false);
  };


  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger
        render={
          <Button variant="link" className="p-0 h-auto font-bold text-primary hover:text-primary/80">
            {count}
          </Button>
        }
      />
      <DialogContent className="max-w-[95vw] lg:max-w-7xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Daftar Wajib Pajak - RW {rw || "N/A"} ({dusun || "N/A"})</DialogTitle>
        </DialogHeader>

        {!loading && data.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center justify-between mt-2 p-3 bg-primary/5 rounded-lg border border-primary/20 gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={data.length > 0 && selectedIds.size === data.length}
                onCheckedChange={toggleSelectAll}
                id="select-all"
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Pilih Semua ({selectedIds.size}/{data.length})
              </label>
            </div>
            
            {selectedIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 animate-in fade-in zoom-in duration-200 w-full md:w-auto">
                <Input value={bulkDusun} onChange={e => setBulkDusun(e.target.value)} placeholder="Dusun Baru" className="h-8 w-full sm:w-28 text-xs bg-background/50" />
                <Input value={bulkRt} onChange={e => setBulkRt(e.target.value)} placeholder="RT" className="h-8 w-[calc(50%-0.5rem)] sm:w-16 text-xs bg-background/50" />
                <Input value={bulkRw} onChange={e => setBulkRw(e.target.value)} placeholder="RW" className="h-8 w-[calc(50%-0.5rem)] sm:w-16 text-xs bg-background/50" />
                <Button size="sm" onClick={saveBulkEdit} disabled={isBulkEditing} className="h-8 gap-1 w-full sm:w-auto">
                  {isBulkEditing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckSquare className="w-3 h-3" />}
                  Terapkan Perubahan
                </Button>
              </div>
            )}
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto mt-2 pr-2">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">Tidak ada data ditemukan</div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[40px] text-center">#</TableHead>
                    <TableHead className="w-[80px]">Aksi</TableHead>
                    <TableHead className="w-[150px]">NOP</TableHead>
                    <TableHead>Nama Wajib Pajak & Alamat</TableHead>
                    <TableHead className="w-[300px]">Wilayah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map(item => (
                    <TableRow key={item.id} className={editingId === item.id ? "bg-muted/30" : "hover:bg-muted/40 cursor-pointer"}>
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={() => toggleSelect(item.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell>
                        {editingId === item.id ? (
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={cancelEdit} className="h-7 w-7 text-muted-foreground hover:text-foreground">
                              <X className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="default" onClick={() => saveEdit(item.id)} className="h-7 w-7">
                              <Save className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="icon" variant="ghost" onClick={() => startEdit(item)} className="h-7 w-7 text-muted-foreground hover:text-primary">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{item.nop}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-sm">{item.namaWp}</div>
                        <div className="text-xs text-muted-foreground break-words">{item.alamatObjek}</div>
                      </TableCell>
                      <TableCell>
                        {editingId === item.id ? (
                          <div className="grid grid-cols-3 gap-1.5 w-[250px]">
                            <Input value={editDusun} onChange={e => setEditDusun(e.target.value)} placeholder="Dusun" className="h-7 text-xs px-1.5" />
                            <Input value={editRt} onChange={e => setEditRt(e.target.value)} placeholder="RT" className="h-7 text-xs px-1.5" />
                            <Input value={editRw} onChange={e => setEditRw(e.target.value)} placeholder="RW" className="h-7 text-xs px-1.5" />
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] w-fit px-1.5 py-0.5 bg-primary/10 text-primary font-medium rounded border border-primary/20">
                              {item.dusun || "N/A"}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              RT {item.rt || "0"} / RW {item.rw || "0"}
                            </span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
