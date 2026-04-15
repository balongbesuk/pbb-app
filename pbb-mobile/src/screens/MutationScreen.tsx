import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScreenProps } from '../types/navigation';

export default function MutationScreen({ route, navigation }: ScreenProps<'Mutation'>) {
  const { serverUrl, isDark, initialDraft } = route.params;

  const [form, setForm] = useState({
    nopLama: '',
    namaPemohon: '',
    nik: '',
    telp: '',
    alasan: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [draftId, setDraftId] = useState('');
  const [drafts, setDrafts] = useState<
    Array<{
      id: string;
      createdAt: string;
      serverUrl: string;
      status: string;
      form: typeof form;
    }>
  >([]);

  const canSubmit = !!form.nopLama && !!form.namaPemohon && form.nik.length === 16;

  useEffect(() => {
    loadDrafts();
  }, []);

  useEffect(() => {
    if (!initialDraft) return;

    setForm((prev) => ({
      ...prev,
      nopLama: initialDraft.nopLama || prev.nopLama,
      namaPemohon: initialDraft.namaPemohon || prev.namaPemohon,
      alasan: initialDraft.alasan || prev.alasan,
    }));
  }, [initialDraft]);

  const loadDrafts = async () => {
    try {
      const existingDrafts = await AsyncStorage.getItem('@mutation_drafts_v1');
      const parsedDrafts = existingDrafts ? JSON.parse(existingDrafts) : [];
      setDrafts(parsedDrafts);
    } catch (error) {
      setDrafts([]);
    }
  };

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
    if (!form.nopLama || !form.namaPemohon || !form.nik) {
      Alert.alert('Perhatian', 'NOP, Nama, dan NIK wajib diisi.');
      return;
    }

    if (form.nopLama.replace(/[^0-9]/g, '').length < 18) {
      Alert.alert('Perhatian', 'NOP lama belum lengkap.');
      return;
    }

    if (form.nik.length !== 16) {
      Alert.alert('Perhatian', 'NIK harus terdiri dari 16 digit.');
      return;
    }

    if (form.telp && form.telp.length < 10) {
      Alert.alert('Perhatian', 'Nomor telepon minimal 10 digit.');
      return;
    }

    setLoading(true);

    try {
      const generatedDraftId = `MUT-${Date.now()}`;
      const draftPayload = {
        id: generatedDraftId,
        createdAt: new Date().toISOString(),
        serverUrl,
        status: 'draft',
        form,
      };

      const existingDrafts = await AsyncStorage.getItem('@mutation_drafts_v1');
      const parsedDrafts = existingDrafts ? JSON.parse(existingDrafts) : [];
      const nextDrafts = [draftPayload, ...parsedDrafts].slice(0, 20);

      await AsyncStorage.setItem('@mutation_drafts_v1', JSON.stringify(nextDrafts));
      setDrafts(nextDrafts);
      setDraftId(generatedDraftId);
      setLoading(false);
      setSuccess(true);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Draft pengajuan gagal disimpan di perangkat.');
    }
  };

  const handleReuseDraft = (draft: (typeof drafts)[number]) => {
    setForm(draft.form);
    Alert.alert('Draft Dimuat', 'Data draft berhasil dimasukkan kembali ke formulir.');
  };

  const handleDeleteDraft = async (draftIdToDelete: string) => {
    try {
      const nextDrafts = drafts.filter((draft) => draft.id !== draftIdToDelete);
      await AsyncStorage.setItem('@mutation_drafts_v1', JSON.stringify(nextDrafts));
      setDrafts(nextDrafts);
    } catch (error) {
      Alert.alert('Error', 'Draft gagal dihapus.');
    }
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
          Draft pengajuan Mutasi / Pemecahan PBB atas nama <Text className={`font-bold ${isDark ? 'text-blue-400' : 'text-slate-900'}`}>{form.namaPemohon}</Text> sudah tersimpan di perangkat dan siap ditunjukkan ke operator Desa.
        </Text>
        <View className={`w-full rounded-2xl px-5 py-4 mb-8 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
          <Text className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Kode Draft</Text>
          <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{draftId}</Text>
          <Text className={`mt-2 text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Pengajuan ini belum terkirim ke server karena endpoint mutasi mobile belum tersedia. Simpan kode ini untuk tindak lanjut di kantor desa atau portal utama.
          </Text>
        </View>
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
        {drafts.length > 0 && (
          <View className={`p-6 rounded-3xl border mb-6 ${isDark ? 'bg-[#18181b] border-white/5 shadow-2xl' : 'bg-white border-slate-100 shadow-sm'}`}>
            <Text className={`text-[10px] font-black uppercase tracking-widest mb-4 ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Draft Tersimpan</Text>
            {drafts.slice(0, 3).map((draft) => (
              <View
                key={draft.id}
                className={`rounded-2xl p-4 mb-3 border ${isDark ? 'bg-black/30 border-white/10' : 'bg-slate-50 border-slate-200'}`}
              >
                <Text className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{draft.form.namaPemohon || 'Tanpa Nama'}</Text>
                <Text className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{draft.id} • {new Date(draft.createdAt).toLocaleString('id-ID')}</Text>
                <Text className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{draft.form.nopLama || 'NOP belum diisi'}</Text>
                <View className="flex-row mt-4">
                  <TouchableOpacity
                    className={`px-4 py-2 rounded-xl mr-2 ${isDark ? 'bg-blue-600' : 'bg-slate-900'}`}
                    onPress={() => handleReuseDraft(draft)}
                  >
                    <Text className="text-white text-[10px] font-black uppercase tracking-widest">Pakai Lagi</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`px-4 py-2 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200'}`}
                    onPress={() => handleDeleteDraft(draft.id)}
                  >
                    <Text className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {drafts.length > 3 && (
              <Text className={`text-[10px] text-center mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Menampilkan 3 draft terbaru dari total {drafts.length} draft.
              </Text>
            )}
          </View>
        )}

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
          className={`py-4 rounded-2xl flex-row justify-center items-center shadow-lg ${canSubmit ? (isDark ? 'bg-blue-600 shadow-blue-500/20' : 'bg-blue-600 shadow-blue-500/30') : (isDark ? 'bg-white/5 border border-white/10 shadow-transparent' : 'bg-slate-200 shadow-transparent')}`}
          disabled={!canSubmit || loading}
          onPress={handleSubmit}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text className={`font-black uppercase tracking-widest text-xs ${canSubmit ? 'text-white' : (isDark ? 'text-slate-500' : 'text-slate-400')}`}>Simpan Draft Mutasi</Text>}
        </TouchableOpacity>
        <Text className={`text-center text-[10px] mt-3 px-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Draft tersimpan di perangkat ini. Pengiriman ke server akan diaktifkan setelah endpoint mobile mutasi tersedia.
        </Text>
      </ScrollView>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </KeyboardAvoidingView>
  );
}
