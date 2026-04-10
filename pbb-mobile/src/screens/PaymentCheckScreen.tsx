import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Linking, Alert, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PaymentCheckScreen({ route, navigation }: any) {
  const { serverUrl, isDark } = route.params;
  const [nop, setNop] = useState('');
  const [loading, setLoading] = useState(false);
  const [taxData, setTaxData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showUnpaidModal, setShowUnpaidModal] = useState(false);

  const handleNopChange = (text: string) => {
    // Cek apakah user berniat mencari nama wp (mengandung huruf)
    if (/[a-zA-Z]/.test(text)) {
      setNop(text);
      return;
    }

    // Auto format if it's numbers
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

  const [pinnedList, setPinnedList] = useState<{nop: string, name: string, status?: string}[]>([]);

  useEffect(() => {
    loadPinnedNopes();
  }, []);

  const loadPinnedNopes = async () => {
    try {
      const saved = await AsyncStorage.getItem('@pinned_nops_v2');
      if (saved) {
        setPinnedList(JSON.parse(saved));
      } else {
         // legacy fallback
         const oldSaved = await AsyncStorage.getItem('@pinned_nop');
         if (oldSaved) {
           setPinnedList([{ nop: oldSaved, name: 'SPOP Utama', status: 'LUNAS' }]);
         }
      }
    } catch (e) {
      console.log('Gagal memuat pin', e);
    }
  };

  const fetchTaxData = async (targetNop: string) => {
    if(!targetNop.trim()) return;
    
    setLoading(true);
    setErrorMsg('');
    setTaxData(null);
    
    try {
      const response = await fetch(`${serverUrl}/api/mobile/tax?nop=${targetNop}`);
      const data = await response.json();
      
      if (data.success) {
        setTaxData(data.data);
        
        // Auto-update status di koleksi pin jika ada
        const updatedList = pinnedList.map(p => 
           p.nop === data.data.nop ? { ...p, status: data.data.status } : p
        );
        if (JSON.stringify(updatedList) !== JSON.stringify(pinnedList)) {
           setPinnedList(updatedList);
           AsyncStorage.setItem('@pinned_nops_v2', JSON.stringify(updatedList));
        }

      } else {
        setErrorMsg(data.error || 'Terjadi kesalahan saat memeriksa tagihan');
      }
    } catch (err) {
      setErrorMsg('Gagal mengambil data dari server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = () => {
    fetchTaxData(nop);
  };

  const isPinned = taxData ? pinnedList.some(p => p.nop === taxData.nop) : false;

  const togglePin = async () => {
    if (!taxData) return;
    try {
      let newList;
      if (isPinned) {
        newList = pinnedList.filter(p => p.nop !== taxData.nop);
      } else {
        // Tambahkan ke array
        newList = [...pinnedList, { nop: taxData.nop, name: taxData.namaWp, status: taxData.status }];
      }
      await AsyncStorage.setItem('@pinned_nops_v2', JSON.stringify(newList));
      setPinnedList(newList);
    } catch (e) {
      console.log('Gagal menyimpan pin', e);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className={`flex-1 ${isDark ? 'bg-[#09090b]' : 'bg-slate-50'}`}>
       {/* Background Graphic */}
       <View className={`absolute top-0 right-0 w-96 h-96 rounded-full ${isDark ? 'bg-blue-900/20' : 'bg-blue-100/50'}`} style={{ transform: [{ translateX: 100 }, { translateY: -100 }] }}></View>

       <View className="flex-1 px-6 pt-16">
        {/* Header */}
        <View className="mb-8 flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className={`mr-4 w-12 h-12 rounded-full items-center justify-center border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
             <Text className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-600'}`}>←</Text>
          </TouchableOpacity>
          <View>
            <View className={`px-3 py-1 rounded-full self-start mb-1 border ${isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-100 border-emerald-200'}`}>
              <Text className={`font-bold text-[9px] uppercase tracking-widest ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Portal Pembayaran</Text>
            </View>
            <Text className={`text-3xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>Cek Tagihan</Text>
          </View>
        </View>

        {/* Koleksi Pajak (Pinned List) */}
        {pinnedList.length > 0 && !taxData && (
          <View className="mb-6">
            <Text className={`text-[10px] font-black uppercase tracking-widest mb-3 ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Koleksi Pajak Anda</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
              {pinnedList.map((p, idx) => (
                <TouchableOpacity 
                   key={p.nop + idx}
                   className={`border p-4 rounded-3xl mr-4 relative min-w-[220px] ${isDark ? 'bg-[#18181b] border-white/5 shadow-2xl' : 'bg-white border-slate-100 shadow-sm'}`}
                   onPress={() => {
                     setNop(p.nop);
                     fetchTaxData(p.nop);
                   }}
                >
                  <View className={`absolute top-4 right-4 w-8 h-8 rounded-full items-center justify-center border ${isDark ? 'bg-blue-500/20 border-blue-500/30' : 'bg-blue-50 border-blue-100'}`}>
                     <Text className="text-xs">📌</Text>
                  </View>
                  <Text className={`font-black text-base uppercase pr-10 mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`} numberOfLines={1}>{p.name}</Text>
                  <View className="flex-row items-center mb-2">
                    <View className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></View>
                    <Text className={`font-mono text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{p.nop}</Text>
                  </View>
                  {p.status && (
                    <View className={`self-start px-2 py-0.5 rounded-md border ${p.status === 'LUNAS' ? (isDark ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200') : (isDark ? 'bg-rose-500/20 border-rose-500/30' : 'bg-rose-50 border-rose-200')}`}>
                      <Text className={`text-[8px] font-black uppercase tracking-widest ${p.status === 'LUNAS' ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-rose-400' : 'text-rose-600')}`}>{p.status}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Kotak Pencarian */}
        <View className={`p-6 rounded-[32px] border mb-6 relative overflow-hidden ${isDark ? 'bg-[#18181b] border-white/5 shadow-2xl' : 'bg-white border-slate-100 shadow-sm'}`}>
          <View className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}></View>
          
          <Text className={`text-[10px] font-black uppercase tracking-widest mb-3 ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Nomor Objek Pajak (NOP)</Text>
          <TextInput
            className={`px-5 py-4 rounded-2xl border mb-4 font-mono font-bold text-base focus:border-blue-500 ${isDark ? 'bg-black/50 text-white border-white/10' : 'bg-slate-50 text-slate-900 border-slate-200'}`}
            placeholder="35.17... (atau ketik nama)"
            placeholderTextColor={isDark ? "#475569" : "#94a3b8"}
            value={nop}
            onChangeText={handleNopChange}
          />
          {errorMsg ? <Text className="text-rose-400 text-[10px] font-bold mb-4 ml-1 uppercase tracking-widest">⚠️ {errorMsg}</Text> : null}

          <TouchableOpacity 
            className={`py-4 rounded-2xl flex-row justify-center items-center ${nop ? 'bg-blue-600 shadow-xl shadow-blue-600/30' : (isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-100 border border-slate-200')}`}
            disabled={!nop || loading}
            onPress={handleCheck}
          >
            {loading ? <ActivityIndicator color={nop ? 'white' : 'gray'} /> : <Text className={`font-black uppercase tracking-widest text-[11px] ${nop ? 'text-white' : (isDark ? 'text-slate-500' : 'text-slate-400')}`}>Cari Data Sekarang</Text>}
          </TouchableOpacity>
        </View>

        {/* Hasil Pencarian */}
        {taxData && (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className={`p-6 rounded-[32px] border mb-8 relative overflow-hidden ${isDark ? 'bg-[#18181b] border-white/5 shadow-2xl' : 'bg-white border-slate-100 shadow-sm'}`}>
              {/* Ornamen Tanda Terima */}
              <View className={`absolute -left-4 top-1/2 w-8 h-8 rounded-full ${isDark ? 'bg-[#09090b] border border-white/5' : 'bg-slate-50 border border-slate-100'}`}></View>
              <View className={`absolute -right-4 top-1/2 w-8 h-8 rounded-full ${isDark ? 'bg-[#09090b] border border-white/5' : 'bg-slate-50 border border-slate-100'}`}></View>
              <View className={`absolute top-1/2 left-4 right-4 h-[1px] ${isDark ? 'bg-white/5' : 'bg-slate-200'}`} style={{ borderStyle: 'dashed', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}></View>

              <View className="flex-row justify-between items-start mb-6 pb-6">
                 <View className="flex-1 pr-4">
                   <Text className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Ditemukan Wajib Pajak</Text>
                   <Text className={`text-2xl font-black uppercase tracking-tighter leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{taxData.namaWp}</Text>
                 </View>
                 <TouchableOpacity 
                   className={`w-12 h-12 rounded-full items-center justify-center border ${isPinned ? (isDark ? 'bg-amber-500/20 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-amber-100 border-amber-200') : (isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')}`}
                   onPress={togglePin}
                 >
                   <Text className="text-xl">{isPinned ? '📌' : '📍'}</Text>
                 </TouchableOpacity>
              </View>

              <View className="mb-6">
                 <Text className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Alamat Objek</Text>
                 <Text className={`text-sm font-medium uppercase leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{taxData.alamatObjek}</Text>
              </View>

              <View className={`p-5 rounded-2xl border ${isDark ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                 <View className="flex-row justify-between items-center">
                   <View>
                     <Text className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Total Kewajiban ({taxData.tahun})</Text>
                     <Text className={`text-3xl font-black tracking-tighter ${taxData.status === 'LUNAS' ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-rose-400' : 'text-rose-600')}`}>
                        Rp {taxData.tagihanPajak.toLocaleString('id-ID')}
                     </Text>
                   </View>
                   
                   <View className={`px-4 py-2 rounded-xl border ${taxData.status === 'LUNAS' ? (isDark ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-emerald-100 border-emerald-200') : (isDark ? 'bg-rose-500/20 border-rose-500/30' : 'bg-rose-100 border-rose-200')}`}>
                     <Text className={`text-[10px] font-black uppercase tracking-widest ${taxData.status === 'LUNAS' ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-rose-400' : 'text-rose-600')}`}>{taxData.status}</Text>
                   </View>
                 </View>

                 {taxData.status !== 'LUNAS' && (
                    <View className="mt-6 flex-row gap-3">
                      <TouchableOpacity 
                        className={`flex-1 py-4 rounded-xl flex-row justify-center items-center shadow-lg ${isDark ? 'bg-emerald-600/20 shadow-emerald-500/20 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-500/30 shadow-emerald-200/50'}`}
                        onPress={async () => {
                          try {
                            setLoading(true);
                            // Hit real bapenda sync endpoint that the web uses
                            const response = await fetch(`${serverUrl}/api/check-bapenda`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ nop: taxData.nop, tahun: taxData.tahun })
                            });
                            const result = await response.json();
                            if (response.ok && result?.isPaid) {
                              Alert.alert('Sinkronisasi Sukses', result.message);
                              fetchTaxData(taxData.nop);
                            } else {
                              setShowUnpaidModal(true);
                              setLoading(false);
                            }
                          } catch (e) {
                            Alert.alert('Error', 'Gagal menghubungi Bapenda.');
                            setLoading(false);
                          }
                        }}
                      >
                        {loading ? <ActivityIndicator color={isDark ? '#34d399' : '#059669'} /> : (
                          <>
                            <Text className="text-lg mr-2">🔄</Text>
                            <Text className={`font-black uppercase tracking-widest text-[9px] ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Update Lunas</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity 
                        className={`flex-1 py-4 rounded-xl flex-row justify-center items-center shadow-lg border ${isDark ? 'bg-white/5 border-white/10 shadow-black' : 'bg-white border-slate-200 shadow-slate-200'}`}
                        onPress={() => {
                          Linking.openURL(`https://bapenda.jombangkab.go.id/epay/epaypbb.php?orc=dataGIS&nopGIS=${taxData.nop}`);
                        }}
                      >
                        <Text className="text-lg mr-2">🌐</Text>
                        <Text className={`font-black uppercase tracking-widest text-[9px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Cek Bapenda</Text>
                      </TouchableOpacity>
                    </View>
                 )}
              </View>
            </View>
          </ScrollView>
        )}
        
        {/* Custom Unpaid Modal Overlay (Mencegah Modal Breakout di Expo Web) */}
        {taxData && showUnpaidModal && (
          <View className="absolute inset-0 z-50 bg-black/60 justify-center items-center p-6" style={{ elevation: 100 }}>
            <View className={`w-full max-w-sm max-h-[90%] rounded-[32px] p-6 items-center shadow-2xl ${isDark ? 'bg-[#18181b] border border-white/10' : 'bg-white'}`}>
              
              <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 shrink-0 ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                  <Text className="text-3xl">💳</Text>
              </View>
              
              <Text className={`text-xl font-black uppercase tracking-tighter mb-4 text-center shrink-0 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Tagihan Belum Lunas
              </Text>
              
              <View className="shrink w-full">
                <Text className={`text-center mb-6 leading-relaxed text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Sistem mengecek ke Bapenda Jombang. Tagihan atas nama <Text className={`font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{taxData.namaWp}</Text> dengan NOP <Text className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{taxData.nop}</Text> masih tercatat <Text className="font-bold text-rose-500">BELUM LUNAS</Text>.
                </Text>

                <View className={`w-full p-4 rounded-2xl mb-6 flex-row items-center ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                  <Text className="text-xl mr-3">ℹ️</Text>
                  <Text className={`flex-1 text-[11px] sm:text-xs font-semibold leading-relaxed ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    Ingin melunasi sekarang secara online? Anda bisa menggunakan layanan resmi E-PAY Bapenda Jombang.
                  </Text>
                </View>
              </View>

              <View className="w-full flex-row gap-3 mt-auto shrink-0">
                <TouchableOpacity 
                  className={`flex-1 py-4 rounded-xl items-center justify-center border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}
                  onPress={() => setShowUnpaidModal(false)}
                >
                  <Text className={`font-black uppercase tracking-widest text-[9px] sm:text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Nanti Saja</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="flex-[1.5] bg-emerald-600 py-4 px-2 rounded-xl items-center justify-center shadow-lg shadow-emerald-600/30 flex-row"
                  onPress={() => {
                      setShowUnpaidModal(false);
                      Linking.openURL(`https://bapenda.jombangkab.go.id/epay/epaypbb.php?orc=dataGIS&nopGIS=${taxData.nop}`);
                  }}
                >
                  <Text className="text-sm mr-2">💳</Text>
                  <Text className="text-white font-black uppercase tracking-widest text-[9px] sm:text-[10px]">Bayar Sekarang</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </View>
    </KeyboardAvoidingView>
  );
}
