import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function MutationScreen({ route, navigation }: any) {
  const { serverUrl, isDark } = route.params;

  const [form, setForm] = useState({
    nopLama: '',
    namaPemohon: '',
    nik: '',
    telp: '',
    alasan: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdate = (field: string, value: string) => {
    if (field === 'nopLama') {
      const cleaned = value.replace(/[^0-9]/g, '');
      let formatted = '';
      for (let i = 0; i < cleaned.length; i++) {
          if (i === 2 || i === 4 || i === 7 || i === 10) formatted += '.';
          else if (i === 13) formatted += '-';
          else if (i === 17) formatted += '.';
          formatted += cleaned[i];
      }
      setForm(prev => ({ ...prev, [field]: formatted.substring(0, 24) }));
      return;
    }

    if (field === 'nik' || field === 'telp') {
      setForm(prev => ({ ...prev, [field]: value.replace(/[^0-9]/g, '') }));
      return;
    }

    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validasi basic
    if (!form.nopLama || !form.namaPemohon || !form.nik) {
      Alert.alert('Perhatian', 'NOP, Nama, dan NIK wajib diisi.');
      return;
    }

    setLoading(true);
    // Dummy simulate API post
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 2000);
  };

  if (success) {
    return (
      <View className={`flex-1 items-center justify-center p-8 pt-16 ${isDark ? 'bg-[#09090b]' : 'bg-slate-50'}`}>
        <View className={`p-6 rounded-full mb-6 relative ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-500/10'}`}>
           <Text className="text-emerald-500 text-6xl">📝</Text>
           <View className={`absolute bottom-0 right-0 bg-emerald-500 rounded-full w-8 h-8 items-center justify-center border-4 ${isDark ? 'border-[#09090b]' : 'border-slate-50'}`}>
             <Text className="text-white text-xs font-bold">✓</Text>
           </View>
        </View>
        <Text className={`text-2xl font-black mb-2 text-center uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>Pengajuan Diterima</Text>
        <Text className={`text-center mb-8 px-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Permintaan Mutasi / Pemecahan PBB atas nama <Text className={`font-bold ${isDark ? 'text-blue-400' : 'text-slate-900'}`}>{form.namaPemohon}</Text> akan ditinjau oleh operator Desa.
        </Text>
        <TouchableOpacity 
          className={`px-8 py-4 rounded-xl w-full ${isDark ? 'bg-blue-600' : 'bg-slate-900'}`}
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white text-center font-bold uppercase tracking-widest text-xs">Kembali ke Dasbor</Text>
        </TouchableOpacity>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className={`flex-1 ${isDark ? 'bg-[#09090b]' : 'bg-slate-50'}`}>
      <View className={`p-8 pt-16 pb-4 flex-row items-center border-b z-10 ${isDark ? 'bg-[#09090b] border-white/5' : 'bg-white border-slate-100'}`}>
        <TouchableOpacity onPress={() => navigation.goBack()} className={`mr-4 p-2 rounded-full ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
           <Text className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-500'}`}>←</Text>
        </TouchableOpacity>
        <View>
          <Text className={`text-2xl font-black uppercase tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>Mutasi PBB</Text>
          <Text className={`font-medium text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Pengajuan Perubahan Data SPPT</Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-8" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className={`p-6 rounded-3xl border mb-6 ${isDark ? 'bg-[#18181b] border-white/5 shadow-2xl' : 'bg-white border-slate-100 shadow-sm'}`}>
          <Text className={`text-[10px] font-black uppercase tracking-widest mb-3 ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Data Objek Pajak Lama</Text>
          <TextInput
            className={`px-5 py-4 rounded-2xl border mb-2 font-mono font-bold focus:border-blue-500 ${isDark ? 'bg-black/50 text-white border-white/10 focus:bg-[#18181b]' : 'bg-slate-50 text-slate-900 border-slate-200 focus:bg-white'}`}
            placeholder="Nomor NOP Lama (contoh: 35.17...)"
            placeholderTextColor={isDark ? "#475569" : "#94a3b8"}
            keyboardType="numeric"
            value={form.nopLama}
            onChangeText={(t) => handleUpdate('nopLama', t)}
          />
        </View>

        <View className={`p-6 rounded-3xl border mb-6 ${isDark ? 'bg-[#18181b] border-white/5 shadow-2xl' : 'bg-white border-slate-100 shadow-sm'}`}>
          <Text className={`text-[10px] font-black uppercase tracking-widest mb-3 ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Identitas Pemohon Baru</Text>
          
          <TextInput
            className={`px-5 py-3 rounded-2xl border mb-3 font-medium focus:border-blue-500 ${isDark ? 'bg-black/50 text-white border-white/10 focus:bg-[#18181b]' : 'bg-slate-50 text-slate-900 border-slate-200 focus:bg-white'}`}
            placeholder="Nama Lengkap Pemohon"
            placeholderTextColor={isDark ? "#475569" : "#94a3b8"}
            value={form.namaPemohon}
            onChangeText={(t) => handleUpdate('namaPemohon', t)}
          />
          
          <TextInput
            className={`px-5 py-3 rounded-2xl border mb-3 font-medium focus:border-blue-500 ${isDark ? 'bg-black/50 text-white border-white/10 focus:bg-[#18181b]' : 'bg-slate-50 text-slate-900 border-slate-200 focus:bg-white'}`}
            placeholder="Nomor Induk Kependudukan (NIK)"
            placeholderTextColor={isDark ? "#475569" : "#94a3b8"}
            keyboardType="numeric"
            maxLength={16}
            value={form.nik}
            onChangeText={(t) => handleUpdate('nik', t)}
          />

          <TextInput
            className={`px-5 py-3 rounded-2xl border mb-3 font-medium focus:border-blue-500 ${isDark ? 'bg-black/50 text-white border-white/10 focus:bg-[#18181b]' : 'bg-slate-50 text-slate-900 border-slate-200 focus:bg-white'}`}
            placeholder="Nomor Telepon / WhatsApp"
            placeholderTextColor={isDark ? "#475569" : "#94a3b8"}
            keyboardType="phone-pad"
            value={form.telp}
            onChangeText={(t) => handleUpdate('telp', t)}
          />
        </View>

        <View className={`p-6 rounded-3xl border mb-6 ${isDark ? 'bg-[#18181b] border-white/5 shadow-2xl' : 'bg-white border-slate-100 shadow-sm'}`}>
          <Text className={`text-[10px] font-black uppercase tracking-widest mb-3 ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Keterangan Tambahan</Text>
          <TextInput
            className={`px-5 py-4 rounded-2xl border mb-2 font-medium focus:border-blue-500 min-h-[100px] ${isDark ? 'bg-black/50 text-white border-white/10 focus:bg-[#18181b]' : 'bg-slate-50 text-slate-900 border-slate-200 focus:bg-white'}`}
            placeholder="Jelaskan alasan mutasi (Misal: Jual Beli, Waris, Pemecahan Luas...)"
            placeholderTextColor={isDark ? "#475569" : "#94a3b8"}
            multiline={true}
            textAlignVertical="top"
            value={form.alasan}
            onChangeText={(t) => handleUpdate('alasan', t)}
          />
        </View>

        <TouchableOpacity 
          className={`py-4 rounded-2xl flex-row justify-center items-center shadow-lg ${form.nopLama && form.namaPemohon ? (isDark ? 'bg-blue-600 shadow-blue-500/20' : 'bg-blue-600 shadow-blue-500/30') : (isDark ? 'bg-white/5 border border-white/10 shadow-transparent' : 'bg-slate-200 shadow-transparent')}`}
          disabled={!form.nopLama || !form.namaPemohon || loading}
          onPress={handleSubmit}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text className={`font-black uppercase tracking-widest text-xs ${form.nopLama && form.namaPemohon ? 'text-white' : (isDark ? 'text-slate-500' : 'text-slate-400')}`}>Ajukan Mutasi Sekarang</Text>}
        </TouchableOpacity>
      </ScrollView>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </KeyboardAvoidingView>
  );
}
