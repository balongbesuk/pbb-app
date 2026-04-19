import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TextInput, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
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
  const [confirmModal, setConfirmModal] = useState<{ visible: boolean; officerId: string; officerName: string }>({
    visible: false,
    officerId: '',
    officerName: '',
  });
  const [resultModal, setResultModal] = useState<{ visible: boolean; type: 'success' | 'error'; title: string; message: string }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
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

  const executeTransfer = async () => {
    setSubmitting(true);
    const { officerId } = confirmModal;

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
          message: `Pemindahan dari mobile oleh ${senderRole}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConfirmModal({ ...confirmModal, visible: false });
        setResultModal({
          visible: true,
          type: 'success',
          title: 'Alokasi berhasil',
          message: data.message || 'Data wajib pajak telah berhasil dialokasikan.',
        });
      } else {
        setResultModal({
          visible: true,
          type: 'error',
          title: 'Alokasi gagal',
          message: data.error || 'Terjadi kesalahan sistem.',
        });
      }
    } catch (err) {
      setResultModal({
        visible: true,
        type: 'error',
        title: 'Koneksi bermasalah',
        message: 'Gagal terhubung ke server.',
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

  const filteredOfficers = officers.filter(
    (o) => o.name?.toLowerCase().includes(search.toLowerCase()) || o.dusun?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <AppScreenHeader title="Pilih petugas" subtitle="Alokasi WP" onBack={() => navigation.goBack()}>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: 14, marginBottom: 14 }}>
          <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '700' }}>Data yang akan dipindahkan</Text>
          <Text style={{ color: 'white', fontSize: 15, fontWeight: '800', marginTop: 4 }}>{taxName}</Text>
        </View>

        <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 22, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
          <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.72)" />
          <TextInput
            style={{ flex: 1, paddingVertical: 15, paddingLeft: 12, color: 'white', fontSize: 15, fontWeight: '700' }}
            placeholder="Cari nama atau wilayah"
            placeholderTextColor="rgba(255,255,255,0.45)"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </AppScreenHeader>

      <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 18 }} contentContainerStyle={{ paddingBottom: 60 }}>
        {loading ? (
          <View style={{ paddingVertical: 90, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={appTheme.colors.primary} />
          </View>
        ) : filteredOfficers.length > 0 ? (
          filteredOfficers.map((officer) => (
            <ScalableButton
              key={officer.id}
              onPress={() => setConfirmModal({ visible: true, officerId: officer.id, officerName: officer.name })}
              style={{ marginBottom: 14 }}
            >
              <View style={{ backgroundColor: appTheme.colors.surface, borderRadius: appTheme.radius.lg, padding: 18, borderWidth: 1, borderColor: appTheme.colors.border, flexDirection: 'row', alignItems: 'center', ...appTheme.shadow.card }}>
                <View style={{ width: 48, height: 48, borderRadius: 18, backgroundColor: appTheme.colors.infoSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: appTheme.colors.info, fontSize: 18, fontWeight: '900' }}>{officer.name?.charAt(0) || 'P'}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ color: appTheme.colors.text, fontSize: 16, fontWeight: '800' }}>{officer.name}</Text>
                  <Text style={{ color: appTheme.colors.textMuted, fontSize: 12, marginTop: 4 }}>Wilayah: {officer.dusun || 'Semua'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={appTheme.colors.textSoft} />
              </View>
            </ScalableButton>
          ))
        ) : (
          <View style={{ paddingVertical: 90, alignItems: 'center' }}>
            <Ionicons name="people-outline" size={60} color={appTheme.colors.border} />
            <Text style={{ color: appTheme.colors.text, fontSize: 16, fontWeight: '800', marginTop: 14 }}>Tidak ada petugas lain</Text>
          </View>
        )}
      </ScrollView>

      <AppModalCard
        visible={confirmModal.visible}
        title="Konfirmasi alokasi"
        message={`Anda akan memindahkan data wajib pajak ${taxName} kepada ${confirmModal.officerName}.`}
        icon="swap-horizontal"
        iconColor={appTheme.colors.info}
        iconBg={appTheme.colors.infoSoft}
        onRequestClose={() => setConfirmModal({ ...confirmModal, visible: false })}
      >
        <ScalableButton onPress={executeTransfer} disabled={submitting} style={{ marginTop: 20 }}>
          <View style={{ backgroundColor: appTheme.colors.primary, borderRadius: 18, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
            {submitting ? <ActivityIndicator color="white" /> : <>
              <Ionicons name="checkmark-circle-outline" size={18} color="white" />
              <Text style={{ color: 'white', fontSize: 13, fontWeight: '900', marginLeft: 8 }}>Ya, pindahkan data</Text>
            </>}
          </View>
        </ScalableButton>
        <ScalableButton onPress={() => !submitting && setConfirmModal({ ...confirmModal, visible: false })} style={{ marginTop: 10 }}>
          <View style={{ backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 18, paddingVertical: 15, alignItems: 'center' }}>
            <Text style={{ color: appTheme.colors.textMuted, fontSize: 13, fontWeight: '800' }}>Batalkan</Text>
          </View>
        </ScalableButton>
      </AppModalCard>

      <AppModalCard
        visible={resultModal.visible}
        title={resultModal.title}
        message={resultModal.message}
        icon={resultModal.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
        iconColor={resultModal.type === 'success' ? appTheme.colors.success : appTheme.colors.danger}
        iconBg={resultModal.type === 'success' ? appTheme.colors.successSoft : appTheme.colors.dangerSoft}
        onRequestClose={onResultClose}
      >
        <ScalableButton onPress={onResultClose} style={{ marginTop: 18 }}>
          <View style={{ backgroundColor: resultModal.type === 'success' ? appTheme.colors.primary : appTheme.colors.danger, borderRadius: 18, paddingVertical: 15, alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 13, fontWeight: '900' }}>Tutup</Text>
          </View>
        </ScalableButton>
      </AppModalCard>

      <StatusBar style="light" />
    </View>
  );
}
