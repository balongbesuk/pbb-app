import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Linking, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PaymentCheckScreen({ route, navigation }: any) {
  const { serverUrl } = route.params;
  const [nop, setNop] = useState('');
  const [loading, setLoading] = useState(false);
  const [taxData, setTaxData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showUnpaidModal, setShowUnpaidModal] = useState(false);

  const handleNopChange = (text: string) => {
    if (/[a-zA-Z]/.test(text)) {
      setNop(text);
      return;
    }
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
        newList = [...pinnedList, { nop: taxData.nop, name: taxData.namaWp, status: taxData.status }];
      }
      await AsyncStorage.setItem('@pinned_nops_v2', JSON.stringify(newList));
      setPinnedList(newList);
    } catch (e) {
      console.log('Gagal menyimpan pin', e);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-slate-50">
       <View className="absolute top-0 right-0 w-96 h-96 rounded-full bg-emerald-500/5" style={{ transform: [{ translateX: 100 }, { translateY: -100 }] }}></View>

       <View className="flex-1 px-6 pt-16">
        <View className="mb-8 flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-5 w-12 h-12 rounded-2xl items-center justify-center border bg-white border-slate-100 shadow-sm shadow-slate-100">
             <Text className="font-bold text-lg text-slate-900">←</Text>
          </TouchableOpacity>
          <View>
            <View className="px-3 py-1 rounded-full self-start mb-1 border bg-emerald-500/10 border-emerald-500/10">
              <Text className="font-bold text-[9px] uppercase tracking-widest text-emerald-600">Portal Layanan</Text>
            </View>
            <Text className="text-3xl font-black tracking-tighter text-slate-900">Cek Tagihan</Text>
          </View>
        </View>

        {pinnedList.length > 0 && !taxData && (
          <View className="mb-8">
            <Text className="text-[10px] font-black uppercase tracking-widest mb-4 ml-1 text-slate-400">Koleksi Pajak</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
              {pinnedList.map((p, idx) => (
                <TouchableOpacity 
                   key={p.nop + idx}
                   className="border p-6 rounded-[32px] mr-4 relative min-w-[240px] bg-white border-slate-100 shadow-sm shadow-slate-100"
                   onPress={() => {
                     setNop(p.nop);
                     fetchTaxData(p.nop);
                   }}
                >
                  <View className="absolute top-6 right-6 w-8 h-8 rounded-full items-center justify-center bg-slate-50">
                     <Text className="text-xs">📌</Text>
                  </View>
                  <Text className="font-black text-lg uppercase pr-10 mb-1 text-slate-900" numberOfLines={1}>{p.name}</Text>
                  <View className="flex-row items-center mb-4">
                    <View className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 shadow-sm shadow-emerald-500"></View>
                    <Text className="font-mono text-[10px] text-slate-400 tracking-tighter">{p.nop}</Text>
                  </View>
                  {p.status && (
                    <View className={`self-start px-3 py-1 rounded-lg border ${p.status === 'LUNAS' ? 'bg-emerald-500/10 border-emerald-500/10' : 'bg-rose-500/10 border-rose-500/10'}`}>
                      <Text className={`text-[8px] font-black uppercase tracking-widest ${p.status === 'LUNAS' ? 'text-emerald-600' : 'text-rose-600'}`}>{p.status}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View className="p-7 rounded-[32px] border mb-8 bg-white border-slate-100 shadow-sm shadow-slate-100 relative overflow-hidden">
          <View className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-emerald-500/5"></View>
          
          <Text className="text-[10px] font-black uppercase tracking-widest mb-3 ml-1 text-slate-400">Nomor Objek Pajak (NOP)</Text>
          <TextInput
            className="px-5 py-4 rounded-2xl border mb-5 font-mono font-bold text-base focus:border-emerald-500 bg-slate-50 text-slate-900 border-slate-100"
            placeholder="35.17... (atau ketik nama)"
            placeholderTextColor="#94a3b8"
            value={nop}
            keyboardType="numeric"
            onChangeText={handleNopChange}
          />
          {errorMsg ? <Text className="text-rose-600 text-[10px] font-bold mb-4 ml-1 uppercase tracking-widest">⚠️ {errorMsg}</Text> : null}

          <TouchableOpacity 
            className={`py-5 rounded-2xl flex-row justify-center items-center ${nop ? 'bg-emerald-900 shadow-xl shadow-emerald-900/40' : 'bg-slate-50 border border-slate-100'}`}
            disabled={!nop || loading}
            onPress={handleCheck}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text className={`font-black uppercase tracking-widest text-[12px] ${nop ? 'text-white' : 'text-slate-400'}`}>Periksa Tagihan</Text>}
          </TouchableOpacity>
        </View>

        {taxData && (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="p-7 rounded-[32px] border mb-8 relative overflow-hidden bg-white border-slate-100 shadow-sm shadow-slate-100">
              <View className="absolute -left-4 top-1/2 w-8 h-8 rounded-full bg-slate-50 border border-slate-100"></View>
              <View className="absolute -right-4 top-1/2 w-8 h-8 rounded-full bg-slate-50 border border-slate-100"></View>
              <View className="absolute top-1/2 left-6 right-6 h-[1px] bg-slate-100" style={{ borderStyle: 'dotted', borderWidth: 1, borderColor: '#e2e8f0' }}></View>

              <View className="flex-row justify-between items-start mb-8 pb-8">
                 <View className="flex-1 pr-4">
                   <Text className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-400">Wajib Pajak</Text>
                   <Text className="text-2xl font-black uppercase tracking-tighter leading-none text-slate-900">{taxData.namaWp}</Text>
                 </View>
                 <TouchableOpacity 
                   className={`w-14 h-14 rounded-2xl items-center justify-center border ${isPinned ? 'bg-emerald-50 border-emerald-100 shadow-sm shadow-emerald-100' : 'bg-slate-50 border-slate-100'}`}
                   onPress={togglePin}
                 >
                   <Text className="text-2xl">{isPinned ? '📌' : '📍'}</Text>
                 </TouchableOpacity>
              </View>

              <View className="mb-8">
                 <Text className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-400">Alamat Objek</Text>
                 <Text className="text-sm font-bold uppercase leading-relaxed text-slate-600">{taxData.alamatObjek}</Text>
              </View>

              <View className="p-6 rounded-3xl border bg-slate-50 border-slate-100">
                 <View className="flex-row justify-between items-center">
                   <View>
                     <Text className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-400">Tagihan ({taxData.tahun})</Text>
                     <Text className={`text-4xl font-black tracking-tighter ${taxData.status === 'LUNAS' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        Rp {taxData.tagihanPajak.toLocaleString('id-ID')}
                     </Text>
                   </View>
                   
                   <View className={`px-4 py-2 rounded-xl border ${taxData.status === 'LUNAS' ? 'bg-emerald-100 border-emerald-200' : 'bg-rose-100 border-rose-200'}`}>
                     <Text className={`text-[10px] font-black uppercase tracking-widest ${taxData.status === 'LUNAS' ? 'text-emerald-700' : 'text-rose-700'}`}>{taxData.status}</Text>
                   </View>
                 </View>

                 {taxData.status !== 'LUNAS' && (
                    <View className="mt-8 flex-row gap-4">
                      <TouchableOpacity 
                        className="flex-1 py-5 rounded-2xl flex-row justify-center items-center shadow-sm bg-emerald-50 border border-emerald-100 shadow-emerald-100"
                        onPress={async () => {
                          try {
                            setLoading(true);
                            const response = await fetch(`${serverUrl}/api/mobile/sync-bapenda`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ nop: taxData.nop, tahun: taxData.tahun })
                            });
                            const result = await response.json();
                            if (response.ok && result?.isPaid) {
                              Alert.alert('Sukses', result.message);
                              fetchTaxData(taxData.nop);
                            } else {
                              setShowUnpaidModal(true);
                              setLoading(false);
                            }
                          } catch (e) {
                            Alert.alert('Error', 'Gagal sinkronisasi.');
                            setLoading(false);
                          }
                        }}
                      >
                        {loading ? <ActivityIndicator color="#10b981" /> : (
                          <>
                            <Text className="text-xl mr-2">🔄</Text>
                            <Text className="font-black uppercase tracking-widest text-[10px] text-emerald-600">Update Bayar</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity 
                        className="flex-1 py-5 rounded-2xl flex-row justify-center items-center border bg-slate-50 border-slate-100"
                        onPress={() => {
                          Linking.openURL(`https://bapenda.jombangkab.go.id/epay/epaypbb.php?orc=dataGIS&nopGIS=${taxData.nop}`);
                        }}
                      >
                        <Text className="text-xl mr-2">🌐</Text>
                        <Text className="font-black uppercase tracking-widest text-[10px] text-slate-500">EPAY Jombang</Text>
                      </TouchableOpacity>
                    </View>
                 )}
              </View>
            </View>
          </ScrollView>
        )}
        
        {taxData && showUnpaidModal && (
          <View className="absolute inset-0 z-50 bg-black/40 justify-center items-center p-8" style={{ elevation: 100 }}>
            <View className="w-full max-w-sm rounded-[40px] p-8 items-center bg-white border border-slate-100 shadow-2xl">
              <View className="w-20 h-20 rounded-full items-center justify-center mb-6 bg-emerald-50">
                  <Text className="text-4xl">💳</Text>
              </View>
              <Text className="text-2xl font-black uppercase tracking-tighter mb-4 text-center text-slate-900">
                Belum Terbayar
              </Text>
              <Text className="text-center mb-8 leading-relaxed text-sm text-slate-500 font-medium">
                Pajak atas nama <Text className="font-bold text-emerald-600">{taxData.namaWp}</Text> dengan NOP <Text className="font-bold text-slate-800">{taxData.nop}</Text> masih tercatat <Text className="font-bold text-rose-600">BELUM LUNAS</Text> di Bapenda.
              </Text>
              <View className="w-full flex-col gap-3">
                <TouchableOpacity 
                   className="w-full bg-emerald-900 py-5 rounded-2xl items-center justify-center shadow-lg shadow-emerald-900/40 flex-row"
                   onPress={() => {
                       setShowUnpaidModal(false);
                       Linking.openURL(`https://bapenda.jombangkab.go.id/epay/epaypbb.php?orc=dataGIS&nopGIS=${taxData.nop}`);
                   }}
                >
                  <Text className="text-white font-black uppercase tracking-widest text-[11px]">Lunas Sekarang Online</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="w-full py-5 rounded-2xl items-center justify-center border border-slate-100 bg-slate-50"
                  onPress={() => setShowUnpaidModal(false)}
                >
                  <Text className="font-black uppercase tracking-widest text-[11px] text-slate-400">Tutup</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        
        <StatusBar style="dark" />
      </View>
    </KeyboardAvoidingView>
  );
}
