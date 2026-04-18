import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Alert, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl } from '../utils/server';

export default function SelectOfficerScreen({ route, navigation }: ScreenProps<'SelectOfficer'>) {
  const { serverUrl, senderId, senderRole, taxId, taxName } = route.params;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [officers, setOfficers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  // Custom Modal State
  const [confirmModal, setConfirmModal] = useState<{ visible: boolean, officerId: string, officerName: string }>({
    visible: false,
    officerId: '',
    officerName: ''
  });

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    try {
      const url = joinServerUrl(serverUrl, '/api/mobile/officers');
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setOfficers(data.data.filter((o: any) => o.id !== senderId));
      }
    } catch (err) {
      console.error('Fetch Officers Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Result Modal State
  const [resultModal, setResultModal] = useState<{ visible: boolean, type: 'success' | 'error', title: string, message: string }>({
    visible: false,
    type: 'success',
    title: '',
    message: ''
  });

  const executeTransfer = async () => {
    setSubmitting(true);
    const { officerId, officerName } = confirmModal;
    
    try {
      const url = joinServerUrl(serverUrl, '/api/mobile/officer/taxpayers/transfer');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxId,
          senderId,
          receiverId: officerId,
          type: 'GIVE',
          message: `Pemindahan dari mobile oleh ${senderRole}`
        })
      });
      const data = await res.json();
      if (data.success) {
        setConfirmModal({ ...confirmModal, visible: false });
        setResultModal({
          visible: true,
          type: 'success',
          title: 'Berhasil!',
          message: data.message || 'Data WP telah berhasil dialokasikan.'
        });
      } else {
        setResultModal({
          visible: true,
          type: 'error',
          title: 'Gagal',
          message: data.error || 'Terjadi kesalahan sistem.'
        });
      }
    } catch (err) {
      setResultModal({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'Gagal terhubung ke server.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onResultClose = () => {
    setResultModal({ ...resultModal, visible: false });
    if (resultModal.type === 'success') {
      navigation.pop(2);
    }
  };

  const filteredOfficers = officers.filter(o => 
    o.name?.toLowerCase().includes(search.toLowerCase()) || 
    o.dusun?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white pt-16 pb-6 px-6 border-b border-slate-100 shadow-sm">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100"
          >
            <Ionicons name="arrow-back" size={20} color="#64748b" />
          </TouchableOpacity>
          <View className="ml-4">
            <Text className="text-slate-900 text-xl font-black tracking-tight">Pilih Petugas</Text>
            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Alokasi WP: {taxName}</Text>
          </View>
        </View>

        <View className="relative">
          <Ionicons name="search" size={18} color="#94a3b8" style={{ position: 'absolute', left: 16, top: 14, zIndex: 1 }} />
          <TextInput 
            className="bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-6 text-slate-900 font-bold"
            placeholder="Cari nama atau wilayah..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 60 }}>
        {loading ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : filteredOfficers.length > 0 ? (
          filteredOfficers.map((officer) => (
            <TouchableOpacity 
              key={officer.id} 
              onPress={() => setConfirmModal({ visible: true, officerId: officer.id, officerName: officer.name })}
              className="bg-white p-5 rounded-[28px] mb-4 border border-slate-100 shadow-sm flex-row items-center"
            >
              <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center mr-4">
                <Text className="text-blue-600 font-black text-lg">{officer.name?.charAt(0) || 'P'}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-slate-900 font-black text-base">{officer.name}</Text>
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Wilayah: {officer.dusun || 'Semua'}</Text>
              </View>
              <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center">
                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View className="py-20 items-center">
            <Ionicons name="people-outline" size={64} color="#e2e8f0" />
            <Text className="text-slate-400 font-bold text-sm mt-4">Tidak ada petugas lain ditemukan</Text>
          </View>
        )}
      </ScrollView>

      {/* Custom Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={confirmModal.visible}
        onRequestClose={() => setConfirmModal({ ...confirmModal, visible: false })}
      >
        <View className="flex-1 bg-slate-900/60 justify-center items-center p-8">
           <View className="bg-white w-full rounded-[40px] p-8 items-center shadow-2xl">
              <View className="w-20 h-20 bg-blue-50 rounded-[28px] items-center justify-center mb-6">
                 <Ionicons name="swap-horizontal" size={40} color="#3b82f6" />
              </View>
              
              <Text className="text-2xl font-black text-slate-900 mb-2 text-center uppercase tracking-tighter">Konfirmasi Alokasi</Text>
              
              <View className="bg-slate-50 p-6 rounded-3xl w-full mb-8 border border-slate-100">
                <Text className="text-center text-slate-500 text-xs font-bold leading-relaxed">
                   Anda akan memindahkan data WP <Text className="text-blue-600 font-black">{taxName}</Text> kepada:
                </Text>
                <View className="mt-4 items-center">
                   <Text className="text-slate-900 text-lg font-black uppercase text-center">{confirmModal.officerName}</Text>
                   <View className="h-1 w-12 bg-blue-600 rounded-full mt-2" />
                </View>
              </View>

              <View className="w-full space-y-3">
                <TouchableOpacity 
                   className="w-full bg-blue-600 py-5 rounded-[22px] items-center shadow-lg shadow-blue-600/30 flex-row justify-center"
                   onPress={executeTransfer}
                   disabled={submitting}
                >
                   {submitting ? (
                     <ActivityIndicator color="white" />
                   ) : (
                     <>
                        <Text className="text-white font-black text-xs uppercase tracking-[2px]">Ya, Pindahkan Data</Text>
                        <Ionicons name="checkmark-circle" size={18} color="white" style={{ marginLeft: 8 }} />
                     </>
                   )}
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => !submitting && setConfirmModal({ ...confirmModal, visible: false })} 
                  className="py-4 w-full items-center mt-2"
                >
                  <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Batalkan</Text>
                </TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>

      {/* Result Modal (Success/Error) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={resultModal.visible}
        onRequestClose={onResultClose}
      >
        <View className="flex-1 bg-slate-900/60 justify-center items-center p-8">
           <View className="bg-white w-full rounded-[40px] p-8 items-center shadow-2xl">
              <View className={`w-20 h-20 ${resultModal.type === 'success' ? 'bg-emerald-50' : 'bg-rose-50'} rounded-[28px] items-center justify-center mb-6`}>
                 <Ionicons 
                    name={resultModal.type === 'success' ? 'checkmark-circle' : 'alert-circle'} 
                    size={48} 
                    color={resultModal.type === 'success' ? '#10b981' : '#f43f5e'} 
                 />
              </View>
              
              <Text className="text-2xl font-black text-slate-900 mb-2 text-center uppercase tracking-tighter">{resultModal.title}</Text>
              
              <View className="bg-slate-50 p-6 rounded-3xl w-full mb-8 border border-slate-100">
                <Text className="text-center text-slate-500 text-sm font-bold leading-relaxed">
                   {resultModal.message}
                </Text>
              </View>

              <TouchableOpacity 
                 className={`w-full ${resultModal.type === 'success' ? 'bg-emerald-600' : 'bg-slate-900'} py-5 rounded-[22px] items-center shadow-lg`}
                 onPress={onResultClose}
              >
                 <Text className="text-white font-black text-xs uppercase tracking-[2px]">Tutup</Text>
              </TouchableOpacity>
           </View>
        </View>
      </Modal>

      <StatusBar style="dark" />
    </View>
  );
}
