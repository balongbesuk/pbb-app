import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Modal, ActivityIndicator, Linking, Alert, Platform, TouchableWithoutFeedback } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl, formatCurrency } from '../utils/server';
import { ScalableButton } from '../components/ScalableButton';
import { AppScreenHeader } from '../components/AppScreenHeader';
import { AppActionCard } from '../components/AppActionCard';
import { AppModalCard } from '../components/AppModalCard';
import { appTheme, statusTone } from '../theme/app-theme';

export default function TaxpayerDetailScreen({ route, navigation }: ScreenProps<'TaxpayerDetail'>) {
  if (!route.params?.taxpayer) {
    return (
      <View style={{ flex: 1, backgroundColor: appTheme.colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: appTheme.colors.textSoft, ...appTheme.typo.body }}>Data tidak ditemukan</Text>
        <ScalableButton onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: appTheme.colors.primary, ...appTheme.typo.bodyBold }}>Kembali</Text>
        </ScalableButton>
      </View>
    );
  }

  const { serverUrl, taxpayer: init, user, villageName, bapendaConfig: initConfig } = route.params as any;
  const [taxpayer, setTaxpayer] = useState(init);
  const [updating, setUpdating] = useState(false);
  const [bapendaConfig, setBapendaConfig] = useState(initConfig || null);
  const [statusModal, setStatusModal] = useState({ visible: false, type: 'success' as 'success' | 'error', message: '' });
  const [syncModal, setSyncModal] = useState<{ visible: boolean; type: 'success' | 'unpaid' | 'error'; message: string }>({ visible: false, type: 'success', message: '' });
  const [actionSheetVisible, setActionSheetVisible] = useState(false);

  useEffect(() => { fetchConfig(); }, []);
  const fetchConfig = async () => { try { const r = await fetch(joinServerUrl(serverUrl, `/api/mobile/tax?nop=${encodeURIComponent(taxpayer.nop)}`)); const d = await r.json(); if (d.success && d.villageConfig) setBapendaConfig(d.villageConfig); } catch (e) { } };

  const isLunas = taxpayer.paymentStatus === 'LUNAS';
  const tone = statusTone[taxpayer.paymentStatus as keyof typeof statusTone] || statusTone.PIUTANG;

  const handleStatusUpdate = async (s: string) => {
    setActionSheetVisible(false); setUpdating(true);
    try {
      const r = await fetch(joinServerUrl(serverUrl, '/api/mobile/officer/taxpayers/status'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxId: taxpayer.id, status: s, userId: user.id })
      });
      const d = await r.json();
      if (d.success) {
        setTaxpayer(d.data);
        if (route.params.onUpdate) route.params.onUpdate(d.data);
        setStatusModal({ visible: true, type: 'success', message: d.message });
      }
      else setStatusModal({ visible: true, type: 'error', message: d.error || 'Gagal menyimpan perubahan.' });
    } catch (e) { setStatusModal({ visible: true, type: 'error', message: 'Terjadi kesalahan koneksi ke server.' }); }
    finally { setUpdating(false); }
  };

  const handlePaymentCheck = async () => {
    setUpdating(true);
    try {
      const r = await fetch(joinServerUrl(serverUrl, '/api/check-bapenda'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nop: taxpayer.nop, tahun: taxpayer.tahun || bapendaConfig?.tahunPajak || 2026 })
      });
      const d = await r.json();
      if (!r.ok) { setSyncModal({ visible: true, type: 'error', message: d?.error || 'Gagal sinkronisasi data.' }); return; }
      if (d?.isPaid) {
        try {
          const rr = await fetch(`${joinServerUrl(serverUrl, '/api/mobile/tax')}?nop=${encodeURIComponent(taxpayer.nop)}`);
          const dd = await rr.json();
          if (dd.success && dd.data?.[0]) {
            const ref = dd.data[0];
            if (ref.status && !ref.paymentStatus) ref.paymentStatus = ref.status;
            const merged = { ...taxpayer, ...ref };
            setTaxpayer(merged);
            if (route.params.onUpdate) route.params.onUpdate(merged);
          }
          else {
            const u = { ...taxpayer, paymentStatus: 'LUNAS' };
            setTaxpayer(u);
            if (route.params.onUpdate) route.params.onUpdate(u);
          }
        } catch (e) {
          const u = { ...taxpayer, paymentStatus: 'LUNAS' };
          setTaxpayer(u);
          if (route.params.onUpdate) route.params.onUpdate(u);
        }
        setSyncModal({ visible: true, type: 'success', message: `Tagihan ${taxpayer.namaWp} sudah terdeteksi lunas di Bapenda.` });
      } else {
        setSyncModal({ visible: true, type: 'unpaid', message: `Tagihan ${taxpayer.namaWp} masih terdeteksi belum lunas.` });
      }
    } catch (e) { setSyncModal({ visible: true, type: 'error', message: 'Gagal terhubung ke portal Bapenda.' }); }
    finally { setUpdating(false); }
  };

  const handleGoToPortal = async () => {
    setSyncModal({ ...syncModal, visible: false });
    try {
      const cn = taxpayer.nop.replace(/\D/g, ''); const isP = bapendaConfig?.enableBapendaPayment; const cu = isP ? bapendaConfig?.bapendaPaymentUrl : bapendaConfig?.bapendaUrl;
      if (!cu) { Alert.alert('Error', 'Konfigurasi Bapenda belum lengkap.'); return; }
      let tu = cu;
      if (!isP && bapendaConfig?.isJombangBapenda && cn.length === 18) {
        const [k0, k1, k2, k3, k4, k5, k6] = [cn.substring(0, 2), cn.substring(2, 4), cn.substring(4, 7), cn.substring(7, 10), cn.substring(10, 13), cn.substring(13, 17), cn.substring(17, 18)];
        tu = `${cu.split('?')[0]}?module=pbb&kata=${k0}&kata1=${k1}&kata2=${k2}&kata3=${k3}&kata4=${k4}&kata5=${k5}&kata6=${k6}&viewpbb=`;
      } else { tu = cu.replace(/\{nop\}/gi, cn); }
      await Linking.openURL(tu);
    } catch (e) { Alert.alert('Error', 'Gagal membuka portal eksternal.'); }
  };

  const Info = ({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) => (
    <View style={{ backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' }}>
      <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: appTheme.colors.surface, alignItems: 'center', justifyContent: 'center', ...appTheme.shadow.soft }}>
        <Ionicons name={icon} size={18} color={appTheme.colors.primary} />
      </View>
      <View style={{ marginLeft: 16, flex: 1 }}>
        <Text style={{ color: appTheme.colors.textSoft, ...appTheme.typo.label }}>{label}</Text>
        <Text style={{ color: appTheme.colors.text, ...appTheme.typo.bodyBold, marginTop: 4 }}>{value || '-'}</Text>
      </View>
    </View>
  );

  const syncTone = syncModal.type === 'success' ? { bg: appTheme.colors.successSoft, color: appTheme.colors.success, icon: 'checkmark-circle' as const, title: 'SINKRON BERHASIL' }
    : syncModal.type === 'unpaid' ? { bg: appTheme.colors.accentSoft, color: appTheme.colors.accent, icon: 'wallet-outline' as const, title: 'BELUM LUNAS' }
      : { bg: appTheme.colors.dangerSoft, color: appTheme.colors.danger, icon: 'alert-circle' as const, title: 'GANGGUAN SYSTEM' };

  return (
    <View style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        <AppScreenHeader title={taxpayer.namaWp} subtitle="DETAIL OBJEK PAJAK" onBack={() => navigation.goBack()} centerTitle={true} style={{ paddingBottom: 48 }}>
          <Animated.View entering={FadeInUp.delay(100)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14 }}>
              <View style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, backgroundColor: taxpayer.paymentStatus === 'LUNAS' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', borderWidth: 1, borderColor: taxpayer.paymentStatus === 'LUNAS' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)' }}>
                <Text style={{ color: taxpayer.paymentStatus === 'LUNAS' ? '#10b981' : '#f87171', ...appTheme.typo.badge, fontWeight: '900' }}>{tone.label.toUpperCase()}</Text>
              </View>
              <View style={{ width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 12 }} />
              <Text style={{ color: 'rgba(255,255,255,0.6)', ...appTheme.typo.mono, fontSize: 13, fontWeight: '600' }}>{taxpayer.nop}</Text>
            </View>

            <View style={{ marginTop: 24, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', ...appTheme.typo.label }}>KETETAPAN PAJAK</Text>
              <Text style={{ color: 'white', ...appTheme.typo.hero, fontSize: 34, marginTop: 8 }}>{formatCurrency(taxpayer.ketetapan)}</Text>
              <View style={{ flexDirection: 'row', marginTop: 16 }}>
                <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)', marginRight: 10 }}>
                  <Text style={{ color: 'white', ...appTheme.typo.badge }}>TAHUN {taxpayer.tahun || new Date().getFullYear()}</Text>
                </View>
                <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                  <Text style={{ color: '#10b981', ...appTheme.typo.badge }}>{villageName.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </AppScreenHeader>

        <Animated.View entering={FadeInDown.delay(200)} style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <View style={{ backgroundColor: appTheme.colors.surface, borderRadius: 36, padding: 28, ...appTheme.shadow.card, borderWidth: 1, borderColor: appTheme.colors.borderLight }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
               <Text style={{ color: appTheme.colors.text, ...appTheme.typo.title }}>Informasi Lapangan</Text>
               <Ionicons name="analytics" size={20} color={appTheme.colors.primary} />
            </View>

            {/* Flexible Status & Officer Section */}
            <View style={{ backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 24, padding: 8, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)', flexDirection: 'row' }}>
              <View style={{ flex: 1, backgroundColor: tone.bg, borderRadius: 18, padding: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' }}>
                <Text style={{ color: 'rgba(0,0,0,0.35)', ...appTheme.typo.label, fontSize: 9, letterSpacing: 1 }}>STATUS</Text>
                <Text style={{ color: tone.text, ...appTheme.typo.bodyBold, fontSize: 16, marginTop: 4 }}>{tone.label.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1.5, padding: 16, justifyContent: 'center', paddingLeft: 16 }}>
                <Text style={{ color: 'rgba(0,0,0,0.35)', ...appTheme.typo.label, fontSize: 9, letterSpacing: 1 }}>PETUGAS</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 }}>
                  <Ionicons name="person-circle" size={20} color={appTheme.colors.primary} style={{ marginTop: 2, marginRight: 8 }} />
                  <Text style={{ color: appTheme.colors.text, ...appTheme.typo.bodyBold, fontSize: 15, flex: 1, lineHeight: 20 }}>{user?.name || 'Petugas'}</Text>
                </View>
              </View>
            </View>

            <View style={{ gap: 12 }}>
              <Info label="Lokasi Objek" value={taxpayer.alamatObjek || `Wilayah ${villageName}`} icon="location" />
              <Info label="Lingkungan / Dusun" value={taxpayer.dusun || '-'} icon="business" />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}><Info label="RT" value={taxpayer.rt || '0'} icon="grid-outline" /></View>
                <View style={{ flex: 1 }}><Info label="RW" value={taxpayer.rw || '0'} icon="grid-outline" /></View>
              </View>
            </View>
          </View>

          <Animated.View entering={FadeInDown.delay(300)}>
            <AppActionCard title="Pindahkan Alokasi" subtitle="Alihkan target ke petugas lapangan lain" icon="swap-horizontal-outline" iconColor={appTheme.colors.info} iconBg={appTheme.colors.infoSoft}
              onPress={() => navigation.navigate('SelectOfficer', { serverUrl, senderId: user.id, senderRole: user.role || 'PENARIK', taxId: taxpayer.id, taxName: taxpayer.namaWp })} style={{ marginTop: 16 }} />
          </Animated.View>

          {!isLunas && bapendaConfig?.enableBapendaSync && bapendaConfig?.isJombangBapenda && (
            <Animated.View entering={FadeInDown.delay(400)} style={{ marginTop: 14 }}>
              <ScalableButton onPress={handlePaymentCheck}>
                <LinearGradient colors={bapendaConfig.enableBapendaPayment ? [appTheme.colors.primary, appTheme.colors.primaryDark] : [appTheme.colors.accent, '#4338ca']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', ...appTheme.shadow.floating }}>
                  <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={bapendaConfig.enableBapendaPayment ? 'card-outline' : 'sync-outline'} size={22} color="white" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={{ color: 'white', ...appTheme.typo.bodyBold }}>{bapendaConfig.enableBapendaPayment ? 'Bayar Online' : 'Sinkron Bapenda'}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', ...appTheme.typo.caption, marginTop: 3 }}>{bapendaConfig.enableBapendaPayment ? 'Portal pembayaran resmi' : 'Validasi ke server pusat'}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </LinearGradient>
              </ScalableButton>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Modern Floating Action Bar */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 44 : 32, backgroundColor: appTheme.colors.surface, borderTopWidth: 1, borderTopColor: appTheme.colors.borderLight, ...appTheme.shadow.floating }}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <ScalableButton disabled={updating} onPress={() => handleStatusUpdate(isLunas ? 'BELUM_LUNAS' : 'LUNAS')}>
              <LinearGradient colors={isLunas ? [appTheme.colors.accent, '#4338ca'] : [appTheme.colors.primary, appTheme.colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ borderRadius: 20, paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', ...appTheme.shadow.floating }}>
                <Ionicons name={isLunas ? 'refresh-outline' : 'checkmark-circle-outline'} size={22} color="white" />
                <Text style={{ color: 'white', ...appTheme.typo.bodyBold, marginLeft: 10 }}>{isLunas ? 'Batalkan Lunas' : 'Tandai Lunas'}</Text>
              </LinearGradient>
            </ScalableButton>
          </View>
          <ScalableButton disabled={updating} onPress={() => setActionSheetVisible(true)}>
            <View style={{ width: 62, height: 62, backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: appTheme.colors.borderLight }}>
              <Ionicons name="ellipsis-horizontal" size={24} color={appTheme.colors.textMuted} />
            </View>
          </ScalableButton>
        </View>
      </View>

      {updating && <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}><ActivityIndicator size="large" color={appTheme.colors.primary} /></View>}

      <Modal animationType="slide" transparent visible={actionSheetVisible} onRequestClose={() => setActionSheetVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: appTheme.colors.overlay }}>
          <TouchableWithoutFeedback onPress={() => setActionSheetVisible(false)}><View style={{ flex: 1 }} /></TouchableWithoutFeedback>
          <Animated.View entering={FadeInDown} style={{ backgroundColor: appTheme.colors.surface, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 32, paddingBottom: Platform.OS === 'ios' ? 48 : 32 }}>
            <View style={{ width: 48, height: 5, backgroundColor: appTheme.colors.surfaceStrong, borderRadius: 3, alignSelf: 'center', marginBottom: 24 }} />
            <Text style={{ color: appTheme.colors.text, ...appTheme.typo.heading, marginBottom: 6 }}>Aksi Lanjutan</Text>
            <Text style={{ color: appTheme.colors.textMuted, ...appTheme.typo.body, marginBottom: 28 }}>Opsi alternatif untuk penanganan kasus khusus.</Text>

            <ScalableButton onPress={() => handleStatusUpdate('SUSPEND')} style={{ marginBottom: 12 }}>
              <View style={{ backgroundColor: appTheme.colors.warningSoft, borderRadius: 24, padding: 22, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.1)' }}>
                <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(245, 158, 11, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="shield-outline" size={20} color={appTheme.colors.warning} />
                </View>
                <View style={{ marginLeft: 16 }}><Text style={{ color: appTheme.colors.text, ...appTheme.typo.bodyBold }}>Tandai Sengketa</Text><Text style={{ color: appTheme.colors.textMuted, ...appTheme.typo.caption, marginTop: 2 }}>Objek pajak diperselisihkan</Text></View>
              </View>
            </ScalableButton>

            <ScalableButton onPress={() => handleStatusUpdate('TIDAK_TERBIT')} style={{ marginBottom: 24 }}>
              <View style={{ backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 24, padding: 22, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: appTheme.colors.borderLight }}>
                <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="document-text-outline" size={20} color={appTheme.colors.textMuted} />
                </View>
                <View style={{ marginLeft: 16 }}><Text style={{ color: appTheme.colors.text, ...appTheme.typo.bodyBold }}>Tidak Terbit</Text><Text style={{ color: appTheme.colors.textMuted, ...appTheme.typo.caption, marginTop: 2 }}>SPPT belum/tidak diterbitkan</Text></View>
              </View>
            </ScalableButton>

            <ScalableButton onPress={() => setActionSheetVisible(false)}>
              <View style={{ backgroundColor: appTheme.colors.surfaceStrong, borderRadius: 20, paddingVertical: 18, alignItems: 'center' }}><Text style={{ color: appTheme.colors.textMuted, ...appTheme.typo.bodyBold }}>Tutup</Text></View>
            </ScalableButton>
          </Animated.View>
        </View>
      </Modal>

      <AppModalCard visible={syncModal.visible} title={syncTone.title} message={syncModal.message} icon={syncTone.icon} iconColor={syncTone.color} iconBg={syncTone.bg} onRequestClose={() => setSyncModal({ ...syncModal, visible: false })}>
        <View style={{ marginTop: 20 }}>
          {syncModal.type === 'unpaid' && (
            <ScalableButton onPress={handleGoToPortal} style={{ marginBottom: 12 }}>
              <LinearGradient colors={[appTheme.colors.primary, appTheme.colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 20, paddingVertical: 18, alignItems: 'center', ...appTheme.shadow.floating }}>
                <Text style={{ color: 'white', ...appTheme.typo.bodyBold }}>Buka Portal Bapenda</Text>
              </LinearGradient>
            </ScalableButton>
          )}
          <ScalableButton onPress={() => setSyncModal({ ...syncModal, visible: false })}>
            <View style={{ backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 20, paddingVertical: 18, alignItems: 'center' }}>
              <Text style={{ color: appTheme.colors.textMuted, ...appTheme.typo.bodyBold }}>Tutup</Text>
            </View>
          </ScalableButton>
        </View>
      </AppModalCard>

      <AppModalCard visible={statusModal.visible} title={statusModal.type === 'success' ? 'BERHASIL' : 'GAGAL'} message={statusModal.message} icon={statusModal.type === 'success' ? 'checkmark-circle' : 'close-circle'} iconColor={statusModal.type === 'success' ? appTheme.colors.success : appTheme.colors.danger} iconBg={statusModal.type === 'success' ? appTheme.colors.successSoft : appTheme.colors.dangerSoft} onRequestClose={() => setStatusModal({ ...statusModal, visible: false })}>
        <ScalableButton onPress={() => setStatusModal({ ...statusModal, visible: false })} style={{ marginTop: 24 }}>
          <LinearGradient colors={statusModal.type === 'success' ? [appTheme.colors.primary, appTheme.colors.primaryDark] : [appTheme.colors.danger, '#b91c1c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 20, paddingVertical: 18, alignItems: 'center', ...appTheme.shadow.floating }}>
            <Text style={{ color: 'white', ...appTheme.typo.bodyBold }}>Selesai</Text>
          </LinearGradient>
        </ScalableButton>
      </AppModalCard>

      <StatusBar style="light" />
    </View>
  );
}
