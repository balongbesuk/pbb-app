import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Linking, Alert, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl } from '../utils/server';

export default function PaymentCheckScreen({ route, navigation }: ScreenProps<'PaymentCheck'>) {
  const { serverUrl } = route.params;
  const [nop, setNop] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [pinnedList, setPinnedList] = useState<{nop: string, name: string, status?: string}[]>([]);
  const [bapendaConfig, setBapendaConfig] = useState<any>(null);
  
  // Unified Sync Result Modal State
  const [syncModal, setSyncModal] = useState<{
    visible: boolean;
    type: 'success' | 'unpaid' | 'error';
    message: string;
    wpData?: any;
  }>({
    visible: false,
    type: 'success',
    message: '',
  });

  useEffect(() => {
    loadPinnedNopes();
  }, []);

  const loadPinnedNopes = async () => {
    try {
      const saved = await AsyncStorage.getItem('@pinned_nops_v2');
      if (saved) setPinnedList(JSON.parse(saved));
    } catch (e) { console.log('Gagal muat pin', e); }
  };

  const handleNopChange = (text: string) => {
    if (/[a-zA-Z]/.test(text)) { setNop(text); return; }
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = '';
    for (let i = 0; i < cleaned.length; i++) {
        if (i === 2 || i === 4 || i === 7 || i === 10) formatted += '.';
        else if (i === 13) formatted += '-';
        else if (i === 17) formatted += '.';
        formatted += cleaned[i];
    }
    setNop(formatted.substring(0, 24));
  };

  const fetchTaxData = async (targetNop: string) => {
    if(!targetNop.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setResults([]);
    try {
      const response = await fetch(`${joinServerUrl(serverUrl, '/api/mobile/tax')}?nop=${encodeURIComponent(targetNop.trim())}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setResults(data.data);
        
        // Update statuses in pinned list if matches found
        const updatedList = pinnedList.map(p => {
           const match = data.data.find((d: any) => d.nop === p.nop);
           return match ? { ...p, status: match.status } : p;
        });
        
        // Simple comparison to avoid JSON.stringify crash on context
        if (updatedList.length > 0) {
           setPinnedList(updatedList);
           AsyncStorage.setItem('@pinned_nops_v2', JSON.stringify(updatedList));
        }

        if (data.villageConfig) {
           setBapendaConfig(data.villageConfig);
        }
      } else {
        setErrorMsg(data.error || 'Terjadi kesalahan sistem');
      }
    } catch (err) { setErrorMsg('Gagal mengambil data.'); }
    finally { setLoading(false); }
  };

  const isPinned = (item: any) => pinnedList.some(p => p.nop === item.nop);

  const togglePin = async (item: any) => {
    if (!item) return;
    try {
      let newList;
      if (isPinned(item)) {
        newList = pinnedList.filter(p => p.nop !== item.nop);
      } else {
        newList = [...pinnedList, { nop: item.nop, name: item.namaWp, status: item.status }];
      }
      await AsyncStorage.setItem('@pinned_nops_v2', JSON.stringify(newList));
      setPinnedList(newList);
    } catch (e) { console.log('Gagal simpan pin', e); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-slate-50">
      <View className="absolute top-0 right-0 w-80 h-80 rounded-full bg-emerald-500/5 -translate-y-20 translate-x-20" />
      
      <View className="flex-1 px-6 pt-16">
        {/* Header */}
        <View className="mb-6 flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 w-11 h-11 rounded-2xl items-center justify-center bg-white border border-slate-100 shadow-sm shadow-slate-200">
             <Text className="text-xl font-bold">←</Text>
          </TouchableOpacity>
          <View>
            <View className="bg-emerald-100 px-2 py-0.5 rounded-full self-start mb-0.5">
               <Text className="text-[8px] font-black text-emerald-800 uppercase tracking-widest">Portal Layanan</Text>
            </View>
            <Text className="text-2xl font-black text-slate-900 tracking-tighter">Cek Pajak</Text>
          </View>
        </View>

        {/* Pinned Section */}
        {pinnedList.length > 0 && results.length === 0 && (
          <View className="mb-6">
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tersimpan</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {pinnedList.map((p, idx) => (
                <TouchableOpacity 
                   key={idx} 
                   onPress={() => { setNop(p.nop); fetchTaxData(p.nop); }}
                   className="bg-white border border-slate-100 p-4 rounded-3xl mr-3 min-w-[140px] shadow-sm shadow-slate-200"
                >
                  <Text className="font-black text-xs text-slate-800" numberOfLines={1}>{p.name}</Text>
                  <Text className="text-[9px] text-slate-400 font-mono mb-2">{p.nop}</Text>
                  {p.status && (
                    <View className={`self-start px-2 py-0.5 rounded-md ${p.status === 'LUNAS' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                       <Text className={`text-[7px] font-bold ${p.status === 'LUNAS' ? 'text-emerald-600' : 'text-rose-600'}`}>{p.status}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Search Input */}
        <View className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm shadow-slate-200 mb-6">
          <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nomor Objek Pajak / Nama</Text>
          <TextInput
            className="bg-slate-50 px-4 py-3.5 rounded-2xl border border-slate-100 font-mono font-bold text-sm mb-4"
            placeholder="Ketik NOP atau Nama..."
            value={nop}
            onChangeText={handleNopChange}
          />
          <TouchableOpacity 
             onPress={() => fetchTaxData(nop)}
             disabled={loading || !nop}
             className={`py-4 rounded-2xl items-center justify-center ${nop ? 'bg-emerald-900' : 'bg-slate-100'}`}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text className={`font-black text-[11px] uppercase tracking-widest ${nop ? 'text-white' : 'text-slate-400'}`}>Cari Tagihan</Text>}
          </TouchableOpacity>
          {errorMsg ? <Text className="text-rose-600 text-[10px] font-bold mt-3 ml-1 text-center">⚠️ {errorMsg}</Text> : null}
        </View>

        {/* Results List */}
        {results.length > 0 && (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {results.map((item, index) => (
              <Animated.View 
                entering={FadeInDown.delay(index * 100)}
                key={index} 
                className={`p-6 rounded-[35px] border mb-6 bg-white shadow-xl ${item.status === 'LUNAS' ? 'border-emerald-50 shadow-emerald-900/5' : 'border-rose-50 shadow-rose-900/5'}`}
                style={{ overflow: 'hidden' }}
              >
                <View className="flex-row justify-between items-start mb-5">
                   <View className="flex-1">
                      <View className="flex-row items-center mb-1">
                        <View className={`px-2 py-0.5 rounded-md mr-2 ${item.status === 'LUNAS' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                           <Text className={`text-[8px] font-black ${item.status === 'LUNAS' ? 'text-emerald-700' : 'text-rose-700'}`}>{item.status}</Text>
                        </View>
                        <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Wajib Pajak</Text>
                      </View>
                      <Text className="text-xl font-black text-slate-900 leading-tight uppercase" numberOfLines={2}>{item.namaWp}</Text>
                      <Text className="text-[10px] font-mono font-bold text-slate-400 mt-1">{item.nop}</Text>
                   </View>
                   <TouchableOpacity 
                      onPress={() => togglePin(item)}
                      className={`w-10 h-10 rounded-xl items-center justify-center border ${isPinned(item) ? 'bg-emerald-900 border-emerald-900' : 'bg-white border-slate-100'}`}
                   >
                      <Text>{isPinned(item) ? '📌' : '📍'}</Text>
                   </TouchableOpacity>
                </View>

                <View className="mb-5 px-1">
                   <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Alamat Objek / Tahun</Text>
                   <Text className="text-[11px] font-bold text-slate-600 uppercase" numberOfLines={1}>{item.alamatObjek} • {item.tahun}</Text>
                </View>

                <View className={`p-5 rounded-[25px] ${item.status === 'LUNAS' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                   <View className="flex-row justify-between items-center">
                      <View>
                        <Text className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Tagihan</Text>
                        <Text className={`text-3xl font-black ${item.status === 'LUNAS' ? 'text-emerald-600' : 'text-rose-600'}`}>
                           Rp {item.tagihanPajak.toLocaleString('id-ID')}
                        </Text>
                      </View>
                      {item.status === 'LUNAS' && <View className="w-8 h-8 bg-emerald-500 rounded-full items-center justify-center"><Text className="text-white font-bold">✓</Text></View>}
                   </View>

                   {item.status !== 'LUNAS' && bapendaConfig?.isJombangBapenda && (bapendaConfig?.enableBapendaPayment ? bapendaConfig?.bapendaPaymentUrl : (bapendaConfig?.enableBapendaSync && bapendaConfig?.bapendaUrl)) && (
                     <TouchableOpacity 
                        className={`mt-4 ${bapendaConfig?.enableBapendaPayment ? 'bg-emerald-700' : 'bg-slate-700'} py-4 rounded-2xl items-center shadow-lg shadow-slate-900/20`}
                        onPress={async () => {
                           try {
                             setLoading(true);
                             const res = await fetch(joinServerUrl(serverUrl, '/api/check-bapenda'), {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ nop: item.nop, tahun: item.tahun })
                             });
                             const data = await res.json();
                             if (res.ok && data?.isPaid) {
                               fetchTaxData(item.nop);
                               setSyncModal({
                                 visible: true,
                                 type: 'success',
                                 message: 'Pembayaran terdeteksi lunas di server pusat!',
                                 wpData: item
                               });
                             } else {
                               setSyncModal({
                                 visible: true,
                                 type: 'unpaid',
                                 message: `Tagihan atas nama ${item.namaWp} masih tercatat BELUM LUNAS.`,
                                 wpData: item
                               });
                               setLoading(false);
                             }
                           } catch (e) { 
                             setSyncModal({
                               visible: true,
                               type: 'error',
                               message: 'Gagal menghubungkan ke server Bapenda. Pastikan koneksi internet Anda stabil.',
                             });
                             setLoading(false); 
                           }
                        }}
                     >
                       <Text className="text-white font-black text-[10px] uppercase tracking-widest">
                          {bapendaConfig?.enableBapendaPayment ? 'Bayar Online Sekarang' : 'Cek Status Bapenda'}
                       </Text>
                     </TouchableOpacity>
                   )}
                </View>
              </Animated.View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Premium Unified Sync Result Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={syncModal.visible}
        onRequestClose={() => setSyncModal({ ...syncModal, visible: false })}
      >
        <View className="flex-1 bg-slate-900/60 justify-center items-center p-8">
           <View className="bg-white w-full rounded-[40px] p-8 items-center shadow-2xl relative">
              <TouchableOpacity 
                onPress={() => setSyncModal({ ...syncModal, visible: false })}
                className="absolute top-6 right-6 w-8 h-8 items-center justify-center bg-slate-50 rounded-full z-10"
              >
                <Text className="text-slate-400 font-bold">×</Text>
              </TouchableOpacity>

              <View className={`w-20 h-20 ${
                syncModal.type === 'success' ? 'bg-emerald-50' : 
                syncModal.type === 'unpaid' ? 'bg-rose-50' : 'bg-amber-50'
              } rounded-[28px] items-center justify-center mb-6`}>
                 <Text style={{ fontSize: 32 }}>
                   {syncModal.type === 'success' ? '✅' : syncModal.type === 'unpaid' ? '💳' : '⚠️'}
                 </Text>
              </View>
              
              <Text className="text-xl font-black text-slate-900 mb-1 text-center uppercase tracking-tighter">
                {syncModal.type === 'success' ? 'Pembayaran Lunas' : syncModal.type === 'unpaid' ? 'Belum Terbayar' : 'Gangguan Sistem'}
              </Text>
              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-6">Status Bapenda</Text>
              
              <View className="bg-slate-50 p-6 rounded-3xl w-full mb-8 border border-slate-100">
                <Text className="text-center text-slate-600 text-xs font-bold leading-relaxed">
                  {syncModal.message}
                </Text>
                {syncModal.wpData && (
                  <View className="mt-4 pt-4 border-t border-slate-200/50">
                    <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center mb-1">Objek Pajak</Text>
                    <Text className="text-center text-slate-900 font-black text-sm uppercase">{syncModal.wpData.namaWp}</Text>
                    <Text className="text-center text-slate-400 font-mono text-[10px] mt-0.5">{syncModal.wpData.nop}</Text>
                  </View>
                )}
              </View>

              <View className="w-full space-y-3">
                {syncModal.type === 'unpaid' && bapendaConfig?.isJombangBapenda && (bapendaConfig?.enableBapendaPayment ? bapendaConfig?.bapendaPaymentUrl : (bapendaConfig?.enableBapendaSync && bapendaConfig?.bapendaUrl)) && (
                  <TouchableOpacity 
                     className={`w-full ${bapendaConfig?.enableBapendaPayment ? 'bg-emerald-700 shadow-emerald-700/20' : 'bg-slate-700 shadow-slate-700/20'} py-5 rounded-[22px] items-center shadow-lg flex-row justify-center`}
                     onPress={async () => {
                        setSyncModal({ ...syncModal, visible: false });
                        try {
                          const cleanNop = syncModal.wpData.nop.replace(/\D/g, '');
                          const isPayment = bapendaConfig.enableBapendaPayment;
                          const configUrl = isPayment ? bapendaConfig.bapendaPaymentUrl : bapendaConfig.bapendaUrl;
                          
                          let targetUrl = configUrl;
                          if (!isPayment && bapendaConfig.isJombangBapenda && cleanNop.length === 18) {
                            const k0 = cleanNop.substring(0, 2);
                            const k1 = cleanNop.substring(2, 4);
                            const k2 = cleanNop.substring(4, 7);
                            const k3 = cleanNop.substring(7, 10);
                            const k4 = cleanNop.substring(10, 13);
                            const k5 = cleanNop.substring(13, 17);
                            const k6 = cleanNop.substring(17, 18);
                            const baseUrl = configUrl.split("?")[0];
                            targetUrl = `${baseUrl}?module=pbb&kata=${k0}&kata1=${k1}&kata2=${k2}&kata3=${k3}&kata4=${k4}&kata5=${k5}&kata6=${k6}&viewpbb=`;
                          } else {
                            targetUrl = configUrl.replace(/\{nop\}/gi, cleanNop);
                          }
                          
                          await Linking.openURL(targetUrl);
                        } catch (e) {
                          Alert.alert('Error', 'Gagal membuka halaman Bapenda.');
                        }
                     }}
                  >
                     <Text className="text-white font-black text-[11px] uppercase tracking-widest">
                        {bapendaConfig?.enableBapendaPayment 
                          ? `Lanjut ke ${bapendaConfig.bapendaRegionName || "EPAY"}` 
                          : "Cek Website Bapenda"}
                     </Text>
                     <Text style={{ marginLeft: 8 }}>→</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity 
                   onPress={() => setSyncModal({ ...syncModal, visible: false })} 
                   className="w-full py-5 rounded-[22px] bg-slate-100 items-center"
                >
                  <Text className="text-slate-500 font-black text-[10px] uppercase tracking-widest">Tutup</Text>
                </TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>

      <StatusBar style="dark" />
    </KeyboardAvoidingView>
  );
}
