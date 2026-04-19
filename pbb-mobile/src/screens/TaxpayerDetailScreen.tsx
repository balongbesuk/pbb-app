import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Modal, ActivityIndicator, Linking, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl, formatCurrency } from '../utils/server';
import { ScalableButton } from '../components/ScalableButton';
import { AppScreenHeader } from '../components/AppScreenHeader';
import { AppActionCard } from '../components/AppActionCard';
import { AppModalCard } from '../components/AppModalCard';
import { appTheme, statusTone } from '../theme/app-theme';

export default function TaxpayerDetailScreen({ route, navigation }: ScreenProps<'TaxpayerDetail'>) {
  const { serverUrl, taxpayer: initialTaxpayer, user, villageName, bapendaConfig: initialConfig } = route.params as any;
  const [taxpayer, setTaxpayer] = useState(initialTaxpayer);
  const [updating, setUpdating] = useState(false);
  const [bapendaConfig, setBapendaConfig] = useState(initialConfig || null);
  const [statusModal, setStatusModal] = useState({
    visible: false,
    type: 'success' as 'success' | 'error',
    message: '',
  });
  const [syncModal, setSyncModal] = useState<{
    visible: boolean;
    type: 'success' | 'unpaid' | 'error';
    message: string;
  }>({
    visible: false,
    type: 'success',
    message: '',
  });
  const [actionSheetVisible, setActionSheetVisible] = useState(false);

  useEffect(() => {
    fetchLatestConfig();
  }, []);

  const fetchLatestConfig = async () => {
    try {
      const url = joinServerUrl(serverUrl, `/api/mobile/tax?nop=${encodeURIComponent(taxpayer.nop)}`);
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.villageConfig) {
        setBapendaConfig(data.villageConfig);
      }
    } catch (e) {
      console.log('Fetch config error:', e);
    }
  };

  const isLunas = taxpayer.paymentStatus === 'LUNAS';
  const tone = statusTone[taxpayer.paymentStatus as keyof typeof statusTone] || statusTone.PIUTANG;

  const handleStatusUpdate = async (newStatus: string) => {
    setActionSheetVisible(false);
    setUpdating(true);
    try {
      const url = joinServerUrl(serverUrl, '/api/mobile/officer/taxpayers/status');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxId: taxpayer.id,
          status: newStatus,
          userId: user.id,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setTaxpayer(data.data);
        if (route.params.onUpdate) route.params.onUpdate(data.data);
        setStatusModal({
          visible: true,
          type: 'success',
          message: data.message,
        });
      } else {
        setStatusModal({
          visible: true,
          type: 'error',
          message: data.error || 'Gagal memperbarui status',
        });
      }
    } catch (err) {
      setStatusModal({
        visible: true,
        type: 'error',
        message: 'Terjadi kesalahan koneksi',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentCheck = async () => {
    setUpdating(true);
    try {
      const url = joinServerUrl(serverUrl, '/api/check-bapenda');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nop: taxpayer.nop,
          tahun: taxpayer.tahun || bapendaConfig?.tahunPajak || 2026,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSyncModal({
          visible: true,
          type: 'error',
          message: data?.error || 'Gagal sinkronisasi dengan server Bapenda.',
        });
        return;
      }

      if (data?.isPaid) {
        try {
          const refreshUrl = `${joinServerUrl(serverUrl, '/api/mobile/tax')}?nop=${encodeURIComponent(taxpayer.nop)}`;
          const refreshRes = await fetch(refreshUrl);
          const refreshData = await refreshRes.json();
          if (refreshData.success && refreshData.data?.[0]) {
            const refreshed = refreshData.data[0];
            if (refreshed.status && !refreshed.paymentStatus) {
              refreshed.paymentStatus = refreshed.status;
            }
            const mergedTaxpayer = { ...taxpayer, ...refreshed };
            setTaxpayer(mergedTaxpayer);
            if (route.params.onUpdate) route.params.onUpdate(mergedTaxpayer);
          } else {
            const updatedTaxpayer = { ...taxpayer, paymentStatus: 'LUNAS' };
            setTaxpayer(updatedTaxpayer);
            if (route.params.onUpdate) route.params.onUpdate(updatedTaxpayer);
          }
        } catch (e) {
          const updatedTaxpayer = { ...taxpayer, paymentStatus: 'LUNAS' };
          setTaxpayer(updatedTaxpayer);
          if (route.params.onUpdate) route.params.onUpdate(updatedTaxpayer);
        }

        setSyncModal({
          visible: true,
          type: 'success',
          message: `Tagihan atas nama ${taxpayer.namaWp} telah terdeteksi lunas di server Bapenda.`,
        });
      } else {
        setSyncModal({
          visible: true,
          type: 'unpaid',
          message: `Tagihan atas nama ${taxpayer.namaWp} masih tercatat belum lunas.`,
        });
      }
    } catch (err) {
      setSyncModal({
        visible: true,
        type: 'error',
        message: 'Gagal menghubungkan ke server Bapenda. Pastikan koneksi internet Anda stabil.',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleGoToPortal = async () => {
    setSyncModal({ ...syncModal, visible: false });
    try {
      const cleanNop = taxpayer.nop.replace(/\D/g, '');
      const isPayment = bapendaConfig?.enableBapendaPayment;
      const configUrl = isPayment ? bapendaConfig?.bapendaPaymentUrl : bapendaConfig?.bapendaUrl;

      if (!configUrl) {
        Alert.alert('Error', 'Konfigurasi portal Bapenda tidak ditemukan.');
        return;
      }

      let targetUrl = configUrl;
      const baseUrl = configUrl.split('?')[0];
      if (!isPayment && bapendaConfig?.isJombangBapenda && cleanNop.length === 18) {
        const k0 = cleanNop.substring(0, 2);
        const k1 = cleanNop.substring(2, 4);
        const k2 = cleanNop.substring(4, 7);
        const k3 = cleanNop.substring(7, 10);
        const k4 = cleanNop.substring(10, 13);
        const k5 = cleanNop.substring(13, 17);
        const k6 = cleanNop.substring(17, 18);
        targetUrl = `${baseUrl}?module=pbb&kata=${k0}&kata1=${k1}&kata2=${k2}&kata3=${k3}&kata4=${k4}&kata5=${k5}&kata6=${k6}&viewpbb=`;
      } else {
        targetUrl = configUrl.replace(/\{nop\}/gi, cleanNop);
      }

      await Linking.openURL(targetUrl);
    } catch (e) {
      Alert.alert('Error', 'Gagal membuka halaman Bapenda.');
    }
  };

  const InfoCard = ({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) => (
    <View style={{ backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <View style={{ width: 42, height: 42, borderRadius: 16, backgroundColor: appTheme.colors.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={18} color={appTheme.colors.info} />
      </View>
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ color: appTheme.colors.textMuted, fontSize: 11, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: appTheme.colors.text, fontSize: 14, fontWeight: '800', marginTop: 4 }}>{value || '-'}</Text>
      </View>
    </View>
  );

  const statusToneModal =
    syncModal.type === 'success'
      ? { bg: appTheme.colors.successSoft, color: appTheme.colors.success, icon: 'checkmark-circle' as const, title: 'Sinkron berhasil' }
      : syncModal.type === 'unpaid'
        ? { bg: appTheme.colors.accentSoft, color: appTheme.colors.accent, icon: 'wallet-outline' as const, title: 'Belum lunas' }
        : { bg: appTheme.colors.dangerSoft, color: appTheme.colors.danger, icon: 'alert-circle' as const, title: 'Gangguan sistem' };

  return (
    <View style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
        <AppScreenHeader
          title={taxpayer.namaWp}
          subtitle="Detail wajib pajak"
          onBack={() => navigation.goBack()}
          style={{ paddingBottom: 28 }}
        >
          <View style={{ marginTop: 6 }}>
            <View style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: tone.bg }}>
              <Text style={{ color: tone.text, fontSize: 11, fontWeight: '800' }}>
                {taxpayer.paymentStatus === 'LUNAS' ? 'Lunas' : taxpayer.paymentStatus === 'SUSPEND' ? 'Sengketa' : taxpayer.paymentStatus === 'TIDAK_TERBIT' ? 'Tidak terbit' : 'Piutang'}
              </Text>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.74)', fontSize: 13, marginTop: 12 }}>{taxpayer.nop}</Text>

            <View
              style={{
                marginTop: 18,
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: 28,
                padding: 20,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '700' }}>Ketetapan pajak</Text>
              <Text style={{ color: 'white', fontSize: 30, fontWeight: '900', marginTop: 6 }}>
                {formatCurrency(taxpayer.ketetapan)}
              </Text>
              <View style={{ flexDirection: 'row', marginTop: 14 }}>
                <View style={{ marginRight: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' }}>
                  <Text style={{ color: 'white', fontSize: 11, fontWeight: '800' }}>Tahun {taxpayer.tahun || new Date().getFullYear()}</Text>
                </View>
                <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(238,138,91,0.18)' }}>
                  <Text style={{ color: '#ffd9c8', fontSize: 11, fontWeight: '800' }}>{villageName}</Text>
                </View>
              </View>
            </View>
          </View>
        </AppScreenHeader>

        <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
          <View style={{ backgroundColor: appTheme.colors.surface, borderRadius: 28, padding: 22, borderWidth: 1, borderColor: appTheme.colors.border, ...appTheme.shadow.card }}>
            <Text style={{ color: appTheme.colors.text, fontSize: 20, fontWeight: '900', marginBottom: 14 }}>Informasi lapangan</Text>

            <View style={{ flexDirection: 'row', marginBottom: 14 }}>
              <View style={{ flex: 1, backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 22, padding: 16, marginRight: 8 }}>
                <Text style={{ color: appTheme.colors.textMuted, fontSize: 11, fontWeight: '700' }}>Status aktif</Text>
                <Text style={{ color: tone.text, fontSize: 17, fontWeight: '900', marginTop: 6 }}>
                  {taxpayer.paymentStatus === 'LUNAS' ? 'Sudah lunas' : taxpayer.paymentStatus === 'SUSPEND' ? 'Sengketa' : taxpayer.paymentStatus === 'TIDAK_TERBIT' ? 'Tidak terbit' : 'Masih piutang'}
                </Text>
              </View>
              <View style={{ width: 120, backgroundColor: appTheme.colors.primarySoft, borderRadius: 22, padding: 16 }}>
                <Text style={{ color: appTheme.colors.textMuted, fontSize: 11, fontWeight: '700' }}>Petugas</Text>
                <Text style={{ color: appTheme.colors.primaryDark, fontSize: 15, fontWeight: '900', marginTop: 6 }} numberOfLines={2}>
                  {user?.name || 'Petugas'}
                </Text>
              </View>
            </View>

            <InfoCard label="Alamat objek" value={taxpayer.alamatObjek || `Wilayah ${villageName}`} icon="location-outline" />
            <InfoCard label="Dusun" value={taxpayer.dusun || '-'} icon="home-outline" />
            <InfoCard label="RT / RW" value={`${taxpayer.rt || '0'} / ${taxpayer.rw || '0'}`} icon="grid-outline" />
          </View>

          <AppActionCard
            title="Pindahkan alokasi"
            subtitle="Alihkan objek pajak ke petugas lain"
            icon="swap-horizontal-outline"
            iconColor={appTheme.colors.info}
            iconBg={appTheme.colors.infoSoft}
            onPress={() =>
              navigation.navigate('SelectOfficer', {
                serverUrl,
                senderId: user.id,
                senderRole: user.role || 'PENARIK',
                taxId: taxpayer.id,
                taxName: taxpayer.namaWp,
              })
            }
            style={{ marginTop: 16 }}
          />

          {!isLunas && bapendaConfig?.enableBapendaSync && bapendaConfig?.isJombangBapenda ? (
            <ScalableButton onPress={handlePaymentCheck} style={{ marginTop: 12 }}>
              <View style={{ backgroundColor: bapendaConfig.enableBapendaPayment ? appTheme.colors.primary : appTheme.colors.info, borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', ...appTheme.shadow.card }}>
                <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={bapendaConfig.enableBapendaPayment ? 'card-outline' : 'sync-outline'} size={22} color="white" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '800' }}>
                    {bapendaConfig.enableBapendaPayment ? 'Bayar online sekarang' : 'Cek status Bapenda'}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 12, marginTop: 4 }}>
                    {bapendaConfig.enableBapendaPayment ? 'Lanjut ke portal pembayaran resmi' : 'Sinkronkan status dari server pusat'}
                  </Text>
                </View>
              </View>
            </ScalableButton>
          ) : null}
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, backgroundColor: appTheme.colors.surface, borderTopWidth: 1, borderTopColor: appTheme.colors.border }}>
        <ScalableButton disabled={updating} onPress={() => handleStatusUpdate(isLunas ? 'BELUM_LUNAS' : 'LUNAS')}>
          <View style={{ backgroundColor: isLunas ? appTheme.colors.accent : appTheme.colors.primary, borderRadius: 22, paddingVertical: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
            <Ionicons name={isLunas ? 'refresh-outline' : 'checkmark-circle-outline'} size={20} color="white" />
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '900', marginLeft: 8 }}>
              {isLunas ? 'Batalkan status lunas' : 'Tandai sebagai lunas'}
            </Text>
          </View>
        </ScalableButton>

        <ScalableButton disabled={updating} onPress={() => setActionSheetVisible(true)} style={{ marginTop: 10 }}>
          <View style={{ backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 20, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
            <Ionicons name="ellipsis-horizontal-circle-outline" size={20} color={appTheme.colors.textMuted} />
            <Text style={{ color: appTheme.colors.textMuted, fontSize: 13, fontWeight: '800', marginLeft: 8 }}>Aksi lainnya</Text>
          </View>
        </ScalableButton>
      </View>

      {updating ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={appTheme.colors.primary} />
        </View>
      ) : null}

      <Modal animationType="slide" transparent visible={actionSheetVisible} onRequestClose={() => setActionSheetVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: appTheme.colors.overlay }}>
          <View style={{ backgroundColor: appTheme.colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 }}>
            <Text style={{ color: appTheme.colors.text, fontSize: 20, fontWeight: '900', marginBottom: 6 }}>Aksi lanjutan</Text>
            <Text style={{ color: appTheme.colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 18 }}>
              Gunakan opsi berikut untuk kasus khusus yang membutuhkan penanganan berbeda.
            </Text>

            <ScalableButton onPress={() => handleStatusUpdate('SUSPEND')} style={{ marginBottom: 12 }}>
              <View style={{ backgroundColor: appTheme.colors.accentSoft, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="shield-outline" size={20} color={appTheme.colors.accent} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ color: appTheme.colors.text, fontSize: 15, fontWeight: '800' }}>Tandai sengketa</Text>
                  <Text style={{ color: appTheme.colors.textMuted, fontSize: 12, marginTop: 2 }}>Untuk objek pajak yang sedang diperselisihkan</Text>
                </View>
              </View>
            </ScalableButton>

            <ScalableButton onPress={() => handleStatusUpdate('TIDAK_TERBIT')} style={{ marginBottom: 12 }}>
              <View style={{ backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="document-text-outline" size={20} color={appTheme.colors.textMuted} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ color: appTheme.colors.text, fontSize: 15, fontWeight: '800' }}>Tandai tidak terbit</Text>
                  <Text style={{ color: appTheme.colors.textMuted, fontSize: 12, marginTop: 2 }}>Untuk SPPT yang tidak diterbitkan pada periode berjalan</Text>
                </View>
              </View>
            </ScalableButton>

            <ScalableButton onPress={() => setActionSheetVisible(false)}>
              <View style={{ backgroundColor: appTheme.colors.surfaceStrong, borderRadius: 20, paddingVertical: 15, alignItems: 'center' }}>
                <Text style={{ color: appTheme.colors.textMuted, fontSize: 13, fontWeight: '800' }}>Tutup</Text>
              </View>
            </ScalableButton>
          </View>
        </View>
      </Modal>

      <AppModalCard
        visible={syncModal.visible}
        title={statusToneModal.title}
        message={syncModal.message}
        icon={statusToneModal.icon}
        iconColor={statusToneModal.color}
        iconBg={statusToneModal.bg}
        onRequestClose={() => setSyncModal({ ...syncModal, visible: false })}
      >
        {syncModal.type === 'unpaid' ? (
          <ScalableButton onPress={handleGoToPortal} style={{ marginTop: 20 }}>
            <View style={{ backgroundColor: appTheme.colors.primary, borderRadius: 18, paddingVertical: 15, alignItems: 'center' }}>
              <Text style={{ color: 'white', fontSize: 13, fontWeight: '900' }}>
                {bapendaConfig?.enableBapendaPayment ? 'Lanjut bayar di Bapenda' : 'Buka website Bapenda'}
              </Text>
            </View>
          </ScalableButton>
        ) : null}

        <ScalableButton onPress={() => setSyncModal({ ...syncModal, visible: false })} style={{ marginTop: 12 }}>
          <View style={{ backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 18, paddingVertical: 15, alignItems: 'center' }}>
            <Text style={{ color: appTheme.colors.textMuted, fontSize: 13, fontWeight: '800' }}>Tutup</Text>
          </View>
        </ScalableButton>
      </AppModalCard>

      <AppModalCard
        visible={statusModal.visible}
        title={statusModal.type === 'success' ? 'Perubahan tersimpan' : 'Perubahan gagal'}
        message={statusModal.message}
        icon={statusModal.type === 'success' ? 'checkmark-circle' : 'close-circle'}
        iconColor={statusModal.type === 'success' ? appTheme.colors.success : appTheme.colors.danger}
        iconBg={statusModal.type === 'success' ? appTheme.colors.successSoft : appTheme.colors.dangerSoft}
        onRequestClose={() => setStatusModal({ ...statusModal, visible: false })}
      >
        <ScalableButton onPress={() => setStatusModal({ ...statusModal, visible: false })} style={{ marginTop: 18 }}>
          <View style={{ backgroundColor: statusModal.type === 'success' ? appTheme.colors.primary : appTheme.colors.danger, borderRadius: 18, paddingVertical: 15, alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 13, fontWeight: '900' }}>Tutup</Text>
          </View>
        </ScalableButton>
      </AppModalCard>

      <StatusBar style="light" />
    </View>
  );
}
