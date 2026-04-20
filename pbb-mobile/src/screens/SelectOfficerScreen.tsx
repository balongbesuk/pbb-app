import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl } from '../utils/server';
import { ScalableButton } from '../components/ScalableButton';
import { AppScreenHeader } from '../components/AppScreenHeader';
import { AppModalCard } from '../components/AppModalCard';
import { appTheme } from '../theme/app-theme';

export default function SelectOfficerScreen({ route, navigation }: ScreenProps<'SelectOfficer'>) {
  const { serverUrl, senderId, senderRole, taxId, taxName } = route.params;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [officers, setOfficers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ visible: boolean; officerId: string; officerName: string }>({ visible: false, officerId: '', officerName: '' });
  const [resultModal, setResultModal] = useState<{ visible: boolean; type: 'success' | 'error'; title: string; message: string }>({ visible: false, type: 'success', title: '', message: '' });

  useEffect(() => { fetchOfficers(); }, []);
  const fetchOfficers = async () => { try { const r = await fetch(joinServerUrl(serverUrl, '/api/mobile/officers')); const d = await r.json(); if (d.success) setOfficers(d.data.filter((o: any) => o.id !== senderId)); } catch (e) {} finally { setLoading(false); } };

  const executeTransfer = async () => {
    setSubmitting(true);
    try {
      const r = await fetch(joinServerUrl(serverUrl, '/api/mobile/officer/taxpayers/transfer'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taxId, senderId, receiverId: confirmModal.officerId, type: 'GIVE', message: `Pemindahan dari mobile oleh ${senderRole}` }) });
      const d = await r.json();
      if (d.success) { setConfirmModal({ ...confirmModal, visible: false }); setResultModal({ visible: true, type: 'success', title: 'Berhasil', message: d.message || 'Dialokasikan.' }); }
      else setResultModal({ visible: true, type: 'error', title: 'Gagal', message: d.error || 'Error' });
    } catch (e) { setResultModal({ visible: true, type: 'error', title: 'Koneksi error', message: 'Gagal terhubung.' }); }
    finally { setSubmitting(false); }
  };

  const onResultClose = () => { setResultModal({ ...resultModal, visible: false }); if (resultModal.type === 'success') navigation.pop(2); };
  const filtered = officers.filter((o) => o.name?.toLowerCase().includes(search.toLowerCase()) || o.dusun?.toLowerCase().includes(search.toLowerCase()));

  const colors = [appTheme.colors.primary, appTheme.colors.accent, appTheme.colors.info, appTheme.colors.success, appTheme.colors.warning];

  return (
    <View style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <AppScreenHeader title="Pilih petugas" subtitle="Alokasi WP" onBack={() => navigation.goBack()}>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 18, padding: 14, marginTop: 10 }}>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' }}>Data dipindahkan</Text>
          <Text style={{ color: 'white', fontSize: 15, fontWeight: '700', marginTop: 3 }}>{taxName}</Text>
        </View>
        <View style={{ marginTop: 14, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 18, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
          <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.6)" />
          <TextInput style={{ flex: 1, paddingVertical: 14, paddingLeft: 12, color: 'white', fontSize: 15, fontWeight: '600' }} placeholder="Cari nama atau wilayah" placeholderTextColor="rgba(255,255,255,0.4)" value={search} onChangeText={setSearch} />
        </View>
      </AppScreenHeader>

      <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 18 }} contentContainerStyle={{ paddingBottom: 60 }}>
        {loading ? <View style={{ paddingVertical: 80, alignItems: 'center' }}><ActivityIndicator size="large" color={appTheme.colors.primary} /></View>
        : filtered.length > 0 ? filtered.map((o, i) => (
          <ScalableButton key={o.id} onPress={() => setConfirmModal({ visible: true, officerId: o.id, officerName: o.name })} style={{ marginBottom: 12 }}>
            <View style={{ backgroundColor: appTheme.colors.surface, borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', ...appTheme.shadow.card }}>
              <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: `${colors[i % colors.length]}15`, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: colors[i % colors.length], fontSize: 18, fontWeight: '800' }}>{o.name?.charAt(0) || 'P'}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ color: appTheme.colors.text, fontSize: 16, fontWeight: '700' }}>{o.name}</Text>
                <Text style={{ color: appTheme.colors.textMuted, fontSize: 12, fontWeight: '500', marginTop: 3 }}>Wilayah: {o.dusun || 'Semua'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={appTheme.colors.textSoft} />
            </View>
          </ScalableButton>
        )) : <View style={{ paddingVertical: 80, alignItems: 'center' }}><Ionicons name="people-outline" size={50} color={appTheme.colors.textSoft} /><Text style={{ color: appTheme.colors.text, fontSize: 16, fontWeight: '700', marginTop: 14 }}>Tidak ada petugas lain</Text></View>}
      </ScrollView>

      <AppModalCard visible={confirmModal.visible} title="Konfirmasi alokasi" message={`Pindahkan ${taxName} ke ${confirmModal.officerName}?`} icon="swap-horizontal" iconColor={appTheme.colors.info} iconBg={appTheme.colors.infoSoft} onRequestClose={() => setConfirmModal({ ...confirmModal, visible: false })}>
        <ScalableButton onPress={executeTransfer} disabled={submitting} style={{ marginTop: 20 }}>
          <LinearGradient colors={[appTheme.colors.primary, appTheme.colors.primaryDark]} style={{ borderRadius: 18, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
            {submitting ? <ActivityIndicator color="white" /> : <><Ionicons name="checkmark-circle-outline" size={18} color="white" /><Text style={{ color: 'white', fontSize: 14, fontWeight: '700', marginLeft: 8 }}>Ya, pindahkan</Text></>}
          </LinearGradient>
        </ScalableButton>
        <ScalableButton onPress={() => !submitting && setConfirmModal({ ...confirmModal, visible: false })} style={{ marginTop: 10 }}>
          <View style={{ backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 18, paddingVertical: 15, alignItems: 'center' }}><Text style={{ color: appTheme.colors.textMuted, fontSize: 14, fontWeight: '600' }}>Batal</Text></View>
        </ScalableButton>
      </AppModalCard>

      <AppModalCard visible={resultModal.visible} title={resultModal.title} message={resultModal.message} icon={resultModal.type === 'success' ? 'checkmark-circle' : 'alert-circle'} iconColor={resultModal.type === 'success' ? appTheme.colors.success : appTheme.colors.danger} iconBg={resultModal.type === 'success' ? appTheme.colors.successSoft : appTheme.colors.dangerSoft} onRequestClose={onResultClose}>
        <ScalableButton onPress={onResultClose} style={{ marginTop: 18 }}><LinearGradient colors={resultModal.type === 'success' ? [appTheme.colors.primary, appTheme.colors.primaryDark] : [appTheme.colors.danger, '#b91c1c']} style={{ borderRadius: 18, paddingVertical: 15, alignItems: 'center' }}><Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>Tutup</Text></LinearGradient></ScalableButton>
      </AppModalCard>
      <StatusBar style="light" />
    </View>
  );
}
