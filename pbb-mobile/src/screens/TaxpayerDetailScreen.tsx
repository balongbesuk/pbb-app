import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Modal, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl, formatCurrency } from '../utils/server';

export default function TaxpayerDetailScreen({ route, navigation }: ScreenProps<'TaxpayerDetail'>) {
  const { serverUrl, taxpayer: initialTaxpayer, user, villageName } = route.params;
  const [taxpayer, setTaxpayer] = useState(initialTaxpayer);
  const [updating, setUpdating] = useState(false);

  // Status Modal State
  const [statusModal, setStatusModal] = useState({
    visible: false,
    type: 'success' as 'success' | 'error',
    message: ''
  });

  const isLunas = taxpayer.paymentStatus === 'LUNAS';

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      const url = joinServerUrl(serverUrl, '/api/mobile/officer/taxpayers/status');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxId: taxpayer.id,
          status: newStatus,
          userId: user.id
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setTaxpayer(data.data);
        setStatusModal({
          visible: true,
          type: 'success',
          message: data.message
        });
      } else {
        setStatusModal({
          visible: true,
          type: 'error',
          message: data.error || 'Gagal memperbarui status'
        });
      }
    } catch (err) {
      setStatusModal({
        visible: true,
        type: 'error',
        message: 'Terjadi kesalahan koneksi'
      });
    } finally {
      setUpdating(false);
    }
  };

  // Payment state
  const [showUnpaidModal, setShowUnpaidModal] = useState(false);

  const handlePaymentCheck = async () => {
    setUpdating(true);
    try {
      const url = joinServerUrl(serverUrl, '/api/check-bapenda');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nop: taxpayer.nop, tahun: taxpayer.tahun })
      });
      const data = await res.json();
      
      if (res.ok && data?.isPaid) {
        // Update local status if it was changed to paid on central
        setTaxpayer({ ...taxpayer, paymentStatus: 'LUNAS' });
        setStatusModal({
          visible: true,
          type: 'success',
          message: 'Pembayaran terdeteksi lunas di server pusat!'
        });
      } else {
        setShowUnpaidModal(true);
      }
    } catch (err) {
      setStatusModal({
        visible: true,
        type: 'error',
        message: 'Gagal sinkron server Bapenda'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleGoToPortal = async () => {
    setShowUnpaidModal(false);
    const portalUrl = `https://bapenda.jombangkab.go.id/epay/epaypbb.php?orc=dataGIS&nopGIS=${encodeURIComponent(taxpayer.nop)}`;
    try {
      const { Linking, Alert } = require('react-native');
      const supported = await Linking.canOpenURL(portalUrl);
      if (supported) {
        await Linking.openURL(portalUrl);
      } else {
        Alert.alert('Error', 'Gagal membuka halaman pembayaran.');
      }
    } catch (e) {}
  };

  const InfoRow = ({ label, value, icon, color = "#64748b" }: { label: string, value: string, icon: any, color?: string }) => (
    <View className="flex-row items-center mb-6">
      <View className="w-10 h-10 rounded-xl bg-slate-50 items-center justify-center border border-slate-100">
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View className="ml-4 flex-1">
        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-0.5">{label}</Text>
        <Text className="text-slate-900 font-bold text-sm tracking-tight">{value || '-'}</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 220 }}>
        {/* Header Section */}
        <View className="bg-slate-900 pt-16 pb-20 px-6 rounded-b-[40px] shadow-lg relative">
          <View className="flex-row items-center justify-between mb-8">
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="w-11 h-11 bg-white/10 rounded-2xl items-center justify-center border border-white/10"
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>
            <View className="bg-white/10 px-4 py-2 rounded-full border border-white/10">
              <Text className="text-white text-[10px] font-black uppercase tracking-widest">Detail Wajib Pajak</Text>
            </View>
            <View className="w-11" />
          </View>

          <View className="items-center">
            <View className={`px-4 py-1 rounded-full mb-3 border ${
              taxpayer.paymentStatus === 'LUNAS' ? 'bg-emerald-500/20 border-emerald-500/30' : 
              taxpayer.paymentStatus === 'SUSPEND' ? 'bg-amber-500/20 border-amber-500/30' :
              taxpayer.paymentStatus === 'TIDAK_TERBIT' ? 'bg-slate-500/20 border-slate-500/30' :
              'bg-rose-500/20 border-rose-500/30'
            }`}>
               <Text className={`text-[10px] font-black uppercase tracking-[2px] ${
                 taxpayer.paymentStatus === 'LUNAS' ? 'text-emerald-400' : 
                 taxpayer.paymentStatus === 'SUSPEND' ? 'text-amber-400' :
                 taxpayer.paymentStatus === 'TIDAK_TERBIT' ? 'text-slate-400' :
                 'text-rose-400'
               }`}>
                 {taxpayer.paymentStatus === 'LUNAS' ? 'LUNAS TERBAYAR' : 
                  taxpayer.paymentStatus === 'SUSPEND' ? 'SENGKETA' :
                  taxpayer.paymentStatus === 'TIDAK_TERBIT' ? 'TIDAK TERBIT' :
                  'TAGIHAN PIUTANG'}
               </Text>
            </View>
            <Text className="text-white text-3xl font-black text-center tracking-tighter uppercase leading-tight px-4" numberOfLines={2}>
              {taxpayer.namaWp}
            </Text>
            <Text className="text-slate-400 font-mono font-bold text-sm mt-3 tracking-widest">
              {taxpayer.nop}
            </Text>
          </View>
        </View>

        {/* Info Content */}
        <View className="px-6 -mt-10">
          <View className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
            <Text className="text-slate-900 font-black text-lg mb-6 tracking-tight">Informasi Objek Pajak</Text>
            
            <InfoRow label="Alamat Objek" value={taxpayer.alamatObjek || `Wilayah ${villageName}`} icon="location" color="#3b82f6" />
            
            <View className="flex-row mb-6">
              <View className="flex-1 mr-2">
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Dusun</Text>
                <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <Text className="text-slate-900 font-bold text-sm">{taxpayer.dusun || '-'}</Text>
                </View>
              </View>
              <View className="flex-1 ml-2">
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">RT / RW</Text>
                <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <Text className="text-slate-900 font-bold text-sm">{taxpayer.rt || '0'} / {taxpayer.rw || '0'}</Text>
                </View>
              </View>
            </View>

            <View className="bg-slate-900 p-6 rounded-[24px] mt-2 shadow-lg shadow-slate-900/20">
               <View className="flex-row justify-between items-center mb-1">
                 <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Ketetapan Pajak</Text>
                 <Ionicons name="card-outline" size={16} color="#94a3b8" />
               </View>
               <Text className="text-white text-3xl font-black tracking-tighter">
                 {formatCurrency(taxpayer.ketetapan)}
               </Text>
               <Text className="text-blue-400 text-[10px] font-bold mt-2 uppercase tracking-widest">Tahun Pajak {taxpayer.tahun || new Date().getFullYear()}</Text>
            </View>
          </View>

          {/* Transfer Button - Only for Admin or current Penarik */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SelectOfficer', { 
              serverUrl, 
              senderId: user.id, 
              senderRole: user.role || 'PENARIK',
              taxId: taxpayer.id,
              taxName: taxpayer.namaWp
            })}
            className="bg-white border border-blue-100 mt-6 p-6 rounded-[32px] flex-row items-center shadow-sm"
          >
            <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center">
              <Ionicons name="swap-horizontal" size={24} color="#3b82f6" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-slate-900 font-black text-base tracking-tight">Pindahkan Alokasi</Text>
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Re-alokasi ke petugas lain</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          {!isLunas && (
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={handlePaymentCheck}
              className="bg-emerald-600 mt-4 p-6 rounded-[32px] flex-row items-center shadow-lg shadow-emerald-600/30"
            >
              <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center">
                <Ionicons name="cash-outline" size={24} color="white" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-white font-black text-base tracking-tight">Bayar Online</Text>
                <Text className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mt-0.5">Proses pelunasan via portal</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Floating Footer Actions */}
      <View 
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 20
        }}
        className="absolute bottom-0 left-0 right-0 bg-white px-6 pt-5 pb-10 border-t border-slate-50"
      >
         <View className="flex-row gap-3">
            <TouchableOpacity 
              disabled={updating}
              onPress={() => handleStatusUpdate('SUSPEND')}
              className="flex-1 bg-rose-600 rounded-[20px] items-center justify-center py-4 shadow-md shadow-rose-600/20"
            >
               <Ionicons name="shield-outline" size={20} color="white" />
               <Text className="text-white font-black text-[9px] uppercase tracking-widest mt-1">Sengketa</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              disabled={updating}
              onPress={() => handleStatusUpdate('TIDAK_TERBIT')}
              className="flex-1 bg-white border border-slate-200 rounded-[20px] items-center justify-center py-4 shadow-sm"
            >
               <Ionicons name="document-text-outline" size={20} color="#64748b" />
               <Text className="text-slate-500 font-black text-[9px] uppercase tracking-widest mt-1 text-center">Tdk Terbit</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              disabled={updating}
              onPress={() => handleStatusUpdate(isLunas ? 'BELUM_LUNAS' : 'LUNAS')}
              className={`flex-1 ${isLunas ? 'bg-amber-500 shadow-amber-500/20' : 'bg-emerald-600 shadow-emerald-600/20'} rounded-[20px] items-center justify-center py-4 shadow-md`}
            >
               <Ionicons name={isLunas ? "refresh-outline" : "checkmark-circle-outline"} size={20} color="white" />
               <Text className="text-white font-black text-[9px] uppercase tracking-widest mt-1">
                 {isLunas ? 'Batal Lunas' : 'Tandai Lunas'}
               </Text>
            </TouchableOpacity>
         </View>
      </View>

      {/* Loading Overlay */}
      {updating && (
        <View className="absolute inset-0 bg-white/60 items-center justify-center z-50">
           <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      )}

      {/* Unpaid Portal Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showUnpaidModal}
        onRequestClose={() => setShowUnpaidModal(false)}
      >
        <View className="flex-1 bg-slate-900/60 justify-center items-center p-6">
           <View className="bg-white w-full rounded-[40px] p-8 items-center shadow-2xl">
              <View className="w-16 h-16 bg-rose-50 rounded-3xl items-center justify-center mb-4">
                 <Ionicons name="card" size={32} color="#f43f5e" />
              </View>
              <Text className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Belum Terbayar</Text>
              <Text className="text-center text-slate-500 text-xs font-bold leading-relaxed mb-8">
                 Tagihan atas nama <Text className="text-emerald-600">{taxpayer.namaWp}</Text> masih tercatat <Text className="text-rose-600">BELUM LUNAS</Text> di server pusat.
              </Text>
              <TouchableOpacity 
                 className="w-full bg-emerald-700 py-5 rounded-[22px] items-center mb-3 shadow-lg shadow-emerald-700/20"
                 onPress={handleGoToPortal}
              >
                 <Text className="text-white font-black text-xs uppercase tracking-[2px]">Lanjut ke EPAY JOMBANG</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowUnpaidModal(false)} className="py-2">
                <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Tutup</Text>
              </TouchableOpacity>
           </View>
        </View>
      </Modal>

      {/* Result Status Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={statusModal.visible}
        onRequestClose={() => setStatusModal({ ...statusModal, visible: false })}
      >
        <View className="flex-1 bg-slate-900/60 justify-center items-center p-8">
           <View className="bg-white w-full rounded-[40px] p-8 items-center shadow-2xl">
              <View className={`w-20 h-20 ${statusModal.type === 'success' ? 'bg-emerald-50' : 'bg-rose-50'} rounded-[28px] items-center justify-center mb-6`}>
                 <Ionicons 
                   name={statusModal.type === 'success' ? "checkmark-circle" : "close-circle"} 
                   size={40} 
                   color={statusModal.type === 'success' ? "#10b981" : "#f43f5e"} 
                 />
              </View>
              
              <Text className="text-2xl font-black text-slate-900 mb-2 text-center uppercase tracking-tighter">
                {statusModal.type === 'success' ? 'Berhasil!' : 'Gagal!'}
              </Text>
              
              <View className="bg-slate-50 p-6 rounded-3xl w-full mb-8 border border-slate-100">
                <Text className="text-center text-slate-500 text-xs font-bold leading-relaxed">
                  {statusModal.message}
                </Text>
              </View>

              <TouchableOpacity 
                className={`w-full ${statusModal.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'} py-5 rounded-[22px] items-center shadow-lg`}
                onPress={() => setStatusModal({ ...statusModal, visible: false })}
              >
                 <Text className="text-white font-black text-xs uppercase tracking-[2px]">Tutup</Text>
              </TouchableOpacity>
           </View>
        </View>
      </Modal>

      <StatusBar style="light" />
    </View>
  );
}
