import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Linking, Alert, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function PaymentCheckScreen({ route, navigation }: any) {
  const { serverUrl } = route.params;
  const [nop, setNop] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [showUnpaidModal, setShowUnpaidModal] = useState<any>(null);
  const [pinnedList, setPinnedList] = useState<{nop: string, name: string, status?: string}[]>([]);

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
      const response = await fetch(`${serverUrl}/api/mobile/tax?nop=${targetNop}`);
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

                   {item.status !== 'LUNAS' && (
                     <TouchableOpacity 
                        className="mt-4 bg-emerald-700 py-4 rounded-2xl items-center shadow-lg shadow-emerald-900/20"
                        onPress={async () => {
                           try {
                             setLoading(true);
                             const res = await fetch(`${serverUrl}/api/check-bapenda`, {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ nop: item.nop, tahun: item.tahun })
                             });
                             const data = await res.json();
                             if (res.ok && data?.isPaid) {
                               Alert.alert('Sukses', 'Pembayaran terdeteksi lunas!');
                               fetchTaxData(item.nop);
                             } else {
                               setShowUnpaidModal(item);
                               setLoading(false);
                             }
                           } catch (e) { Alert.alert('Error', 'Gagal sinkron server.'); setLoading(false); }
                        }}
                     >
                       <Text className="text-white font-black text-[10px] uppercase tracking-widest">Bayar Online Sekarang</Text>
                     </TouchableOpacity>
                   )}
                </View>
              </Animated.View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Unpaid Modal */}
      {showUnpaidModal && (
        <View className="absolute inset-0 bg-slate-900/60 justify-center items-center p-6 z-[100]">
           <View className="bg-white w-full rounded-[40px] p-8 items-center shadow-2xl">
              <View className="w-16 h-16 bg-rose-50 rounded-3xl items-center justify-center mb-4">
                 <Text className="text-3xl">💳</Text>
              </View>
              <Text className="text-xl font-black text-slate-900 mb-2">BELUM TERBAYAR</Text>
              <Text className="text-center text-slate-500 text-xs font-bold leading-relaxed mb-8">
                 Tagihan atas nama <Text className="text-emerald-600">{showUnpaidModal.namaWp}</Text> masih tercatat <Text className="text-rose-600">BELUM LUNAS</Text> di server pusat.
              </Text>
              <TouchableOpacity 
                 className="w-full bg-emerald-700 py-4 rounded-2xl items-center mb-3"
                 onPress={() => {
                    setShowUnpaidModal(null);
                    Linking.openURL(`https://bapenda.jombangkab.go.id/epay/epaypbb.php?orc=dataGIS&nopGIS=${showUnpaidModal.nop}`);
                 }}
              >
                 <Text className="text-white font-black text-[11px] uppercase tracking-widest">Lanjut ke EPAY JOMBANG</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowUnpaidModal(null)} className="py-2"><Text className="text-slate-400 font-bold text-[10px] uppercase">Tutup</Text></TouchableOpacity>
           </View>
        </View>
      )}

      <StatusBar style="dark" />
    </KeyboardAvoidingView>
  );
}
