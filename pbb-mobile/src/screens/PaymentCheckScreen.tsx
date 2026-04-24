import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Linking, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl } from '../utils/server';
import { ScalableButton } from '../components/ScalableButton';
import { AppScreenHeader } from '../components/AppScreenHeader';
import { AppModalCard } from '../components/AppModalCard';
import { useServerHealth } from '../utils/hooks';
import { appTheme, statusTone } from '../theme/app-theme';

export default function PaymentCheckScreen({ route, navigation }: ScreenProps<'PaymentCheck'>) {
  const { serverUrl } = route.params;
  const [nop, setNop] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [pinnedList, setPinnedList] = useState<{ nop: string; name: string; status?: string }[]>([]);
  const [bapendaConfig, setBapendaConfig] = useState<any>(null);
  const [syncModal, setSyncModal] = useState<{ visible: boolean; type: 'success' | 'unpaid' | 'error'; message: string; wpData?: any }>({ visible: false, type: 'success', message: '' });
  
  const { health, checkHealth } = useServerHealth(serverUrl);

  useEffect(() => { loadPinnedNopes(); }, []);

  const loadPinnedNopes = async () => { try { const s = await AsyncStorage.getItem('@pinned_nops_v2'); if (s) setPinnedList(JSON.parse(s)); } catch (e) {} };

  const handleNopChange = (text: string) => {
    if (/[a-zA-Z]/.test(text)) { setNop(text); return; }
    const cleaned = text.replace(/[^0-9]/g, '');
    let f = '';
    for (let i = 0; i < cleaned.length; i++) { if (i === 2 || i === 4 || i === 7 || i === 10) f += '.'; else if (i === 13) f += '-'; else if (i === 17) f += '.'; f += cleaned[i]; }
    setNop(f.substring(0, 24));
  };

  const fetchTaxData = async (targetNop: string) => {
    if (!targetNop.trim()) return;
    setLoading(true); setErrorMsg(''); setResults([]);
    try {
      const response = await fetch(`${joinServerUrl(serverUrl, '/api/mobile/tax')}?nop=${encodeURIComponent(targetNop.trim())}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setResults(data.data);
          const updated = pinnedList.map((p) => { const m = data.data.find((d: any) => d.nop === p.nop); return m ? { ...p, status: m.status } : p; });
          if (updated.length > 0) { setPinnedList(updated); AsyncStorage.setItem('@pinned_nops_v2', JSON.stringify(updated)); }
          if (data.villageConfig) setBapendaConfig(data.villageConfig);
        } else { setErrorMsg(data.error || 'Terjadi kesalahan.'); }
      } else {
        setErrorMsg(`Gagal mengambil data (Status: ${response.status})`);
      }
      
      // Also refresh health on search
      checkHealth();
    } catch (err) { setErrorMsg('Gagal mengambil data. Pastikan server aktif.'); } finally { setLoading(false); }
  };

  const isPinned = (item: any) => pinnedList.some((p) => p.nop === item.nop);
  const togglePin = async (item: any) => {
    if (!item) return;
    try {
      const newList = isPinned(item) ? pinnedList.filter((p) => p.nop !== item.nop) : [...pinnedList, { nop: item.nop, name: item.namaWp, status: item.status }];
      await AsyncStorage.setItem('@pinned_nops_v2', JSON.stringify(newList)); setPinnedList(newList);
    } catch (e) {}
  };

  const modalTone = syncModal.type === 'success' ? { bg: appTheme.colors.successSoft, color: appTheme.colors.success, icon: 'checkmark-circle' as const, title: 'Pembayaran terdeteksi' }
    : syncModal.type === 'unpaid' ? { bg: appTheme.colors.accentSoft, color: appTheme.colors.accent, icon: 'wallet-outline' as const, title: 'Tagihan belum lunas' }
    : { bg: appTheme.colors.dangerSoft, color: appTheme.colors.danger, icon: 'alert-circle' as const, title: 'Gangguan sistem' };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <AppScreenHeader title="Cek tagihan PBB" subtitle="Pembayaran warga" onBack={() => navigation.goBack()} style={{ paddingBottom: 28 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500', lineHeight: 20, marginTop: 6 }}>
            Cari berdasarkan NOP atau nama wajib pajak.
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: health.bapenda ? appTheme.colors.success : appTheme.colors.danger, marginRight: 8 }} />
            <Text style={{ color: 'white', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Sumber Data: {health.bapenda ? 'Terhubung (Online)' : 'Down (Offline)'}
            </Text>
          </View>
          <View style={{ marginTop: 18, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <TextInput
              style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 18, paddingHorizontal: 18, paddingVertical: 16, fontSize: 15, color: appTheme.colors.text, fontWeight: '600', marginBottom: 12 }}
              placeholder="Ketik NOP atau nama wajib pajak"
              placeholderTextColor={appTheme.colors.textSoft}
              value={nop} onChangeText={handleNopChange} />
            <ScalableButton onPress={() => fetchTaxData(nop)} disabled={loading || !nop || !health.server}>
              <View style={{ backgroundColor: (nop && health.server) ? 'white' : 'rgba(255,255,255,0.2)', borderRadius: 18, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
                {loading ? <ActivityIndicator color={appTheme.colors.primary} /> : (
                  <><Ionicons name="search-outline" size={18} color={(nop && health.server) ? appTheme.colors.primary : 'rgba(255,255,255,0.5)'} />
                  <Text style={{ color: (nop && health.server) ? appTheme.colors.primary : 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '700', marginLeft: 8 }}>Cari tagihan</Text></>
                )}
              </View>
            </ScalableButton>
            {!health.server && <View style={{ marginTop: 12, backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <Text style={{ color: '#fca5a5', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>Server sedang offline. Tidak dapat melakukan pencarian.</Text>
            </View>}
            {errorMsg ? <View style={{ marginTop: 12, backgroundColor: 'rgba(224,49,49,0.15)', borderRadius: 14, padding: 12 }}>
              <Text style={{ color: '#fca5a5', fontSize: 12, fontWeight: '600' }}>{errorMsg}</Text>
            </View> : null}
          </View>
        </AppScreenHeader>

        <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
          {pinnedList.length > 0 && results.length === 0 && (
            <View>
              <Text style={{ color: appTheme.colors.text, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>Tersimpan</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {pinnedList.map((p, idx) => {
                  const t = p.status === 'LUNAS' ? statusTone.LUNAS : statusTone.PIUTANG;
                  return (
                    <ScalableButton key={idx} onPress={() => { setNop(p.nop); fetchTaxData(p.nop); }} style={{ marginRight: 10 }}>
                      <View style={{ width: 180, backgroundColor: appTheme.colors.surface, borderRadius: 22, padding: 16, ...appTheme.shadow.soft }}>
                        <Text style={{ color: appTheme.colors.text, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>{p.name}</Text>
                        <Text style={{ color: appTheme.colors.textSoft, fontSize: 11, fontWeight: '500', marginTop: 3 }}>{p.nop}</Text>
                        {p.status && <View style={{ alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: t.bg }}>
                          <Text style={{ color: t.text, fontSize: 10, fontWeight: '700' }}>{p.status === 'LUNAS' ? 'Lunas' : 'Belum Lunas'}</Text>
                        </View>}
                      </View>
                    </ScalableButton>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {results.map((item, index) => {
            const t = item.status === 'LUNAS' ? statusTone.LUNAS : statusTone.PIUTANG;
            return (
              <View key={index} style={{ backgroundColor: appTheme.colors.surface, borderRadius: 26, padding: 20, marginBottom: 14, ...appTheme.shadow.card }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: t.bg, marginBottom: 10 }}>
                      <Text style={{ color: t.text, fontSize: 10, fontWeight: '700' }}>{item.status === 'LUNAS' ? 'Lunas' : 'Belum Lunas'}</Text>
                    </View>
                    <Text style={{ color: appTheme.colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 }} numberOfLines={2}>{item.namaWp}</Text>
                    <Text style={{ color: appTheme.colors.textSoft, fontSize: 12, fontWeight: '500', marginTop: 3 }}>{item.nop}</Text>
                  </View>
                  <ScalableButton onPress={() => togglePin(item)}>
                    <View style={{ width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: isPinned(item) ? appTheme.colors.primarySoft : appTheme.colors.surfaceMuted }}>
                      <Ionicons name={isPinned(item) ? 'bookmark' : 'bookmark-outline'} size={18} color={isPinned(item) ? appTheme.colors.primary : appTheme.colors.textMuted} />
                    </View>
                  </ScalableButton>
                </View>
                <View style={{ marginTop: 16, flexDirection: 'row' }}>
                  <View style={{ flex: 1, backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 18, padding: 14, marginRight: 8 }}>
                    <Text style={{ color: appTheme.colors.textMuted, fontSize: 11, fontWeight: '600' }}>Objek pajak</Text>
                    <Text style={{ color: appTheme.colors.text, fontSize: 13, fontWeight: '600', marginTop: 5 }} numberOfLines={2}>{item.alamatObjek || '-'}</Text>
                  </View>
                  <View style={{ width: 100, backgroundColor: appTheme.colors.primaryLight, borderRadius: 18, padding: 14 }}>
                    <Text style={{ color: appTheme.colors.textMuted, fontSize: 11, fontWeight: '600' }}>Tahun</Text>
                    <Text style={{ color: appTheme.colors.primary, fontSize: 18, fontWeight: '800', marginTop: 5 }}>{item.tahun}</Text>
                  </View>
                </View>
                <View style={{ marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ color: appTheme.colors.textMuted, fontSize: 11, fontWeight: '600' }}>Total tagihan</Text>
                    <Text style={{ color: t.text, fontSize: 24, fontWeight: '800', marginTop: 3, letterSpacing: -0.3 }}>Rp {item.tagihanPajak.toLocaleString('id-ID')}</Text>
                  </View>
                  {item.status === 'LUNAS' && <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: appTheme.colors.successSoft, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="checkmark" size={22} color={appTheme.colors.success} /></View>}
                </View>
                {item.status !== 'LUNAS' && bapendaConfig?.isJombangBapenda && (bapendaConfig?.enableBapendaPayment ? bapendaConfig?.bapendaPaymentUrl : (bapendaConfig?.enableBapendaSync && bapendaConfig?.bapendaUrl)) ? (
                  <ScalableButton onPress={async () => {
                    try {
                      setLoading(true);
                      const res = await fetch(joinServerUrl(serverUrl, '/api/check-bapenda'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nop: item.nop, tahun: item.tahun }) });
                      const data = await res.json();
                      if (res.ok && data?.isPaid) { fetchTaxData(item.nop); setSyncModal({ visible: true, type: 'success', message: 'Pembayaran terdeteksi lunas.', wpData: item }); }
                      else { setSyncModal({ visible: true, type: 'unpaid', message: `Tagihan ${item.namaWp} masih belum lunas.`, wpData: item }); setLoading(false); }
                    } catch (e) { setSyncModal({ visible: true, type: 'error', message: 'Gagal sinkronisasi.' }); setLoading(false); }
                  }} style={{ marginTop: 16 }}>
                    <LinearGradient colors={bapendaConfig?.enableBapendaPayment ? [appTheme.colors.primary, appTheme.colors.primaryDark] : [appTheme.colors.info, '#0e7490']}
                      style={{ borderRadius: 18, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                      <Ionicons name={bapendaConfig?.enableBapendaPayment ? 'card-outline' : 'sync-outline'} size={18} color="white" />
                      <Text style={{ color: 'white', fontSize: 13, fontWeight: '700', marginLeft: 8 }}>{bapendaConfig?.enableBapendaPayment ? 'Bayar online' : 'Cek status Bapenda'}</Text>
                    </LinearGradient>
                  </ScalableButton>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <AppModalCard visible={syncModal.visible} title={modalTone.title} message={syncModal.message} icon={modalTone.icon} iconColor={modalTone.color} iconBg={modalTone.bg} onRequestClose={() => setSyncModal({ ...syncModal, visible: false })}>
        {syncModal.wpData && <View style={{ marginTop: 14, backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 18, padding: 14 }}>
          <Text style={{ color: appTheme.colors.textMuted, fontSize: 11, fontWeight: '600' }}>Objek pajak</Text>
          <Text style={{ color: appTheme.colors.text, fontSize: 14, fontWeight: '700', marginTop: 3 }}>{syncModal.wpData.namaWp}</Text>
          <Text style={{ color: appTheme.colors.textSoft, fontSize: 12, fontWeight: '500', marginTop: 2 }}>{syncModal.wpData.nop}</Text>
        </View>}
        {syncModal.type === 'unpaid' && bapendaConfig?.isJombangBapenda && (bapendaConfig?.enableBapendaPayment ? bapendaConfig?.bapendaPaymentUrl : (bapendaConfig?.enableBapendaSync && bapendaConfig?.bapendaUrl)) ? (
          <ScalableButton onPress={async () => {
            setSyncModal({ ...syncModal, visible: false });
            try {
              const cleanNop = syncModal.wpData.nop.replace(/\D/g, '');
              const isPayment = bapendaConfig.enableBapendaPayment;
              const configUrl = isPayment ? bapendaConfig.bapendaPaymentUrl : bapendaConfig.bapendaUrl;
              let targetUrl = configUrl;
              if (!isPayment && bapendaConfig.isJombangBapenda && cleanNop.length === 18) {
                const [k0,k1,k2,k3,k4,k5,k6] = [cleanNop.substring(0,2),cleanNop.substring(2,4),cleanNop.substring(4,7),cleanNop.substring(7,10),cleanNop.substring(10,13),cleanNop.substring(13,17),cleanNop.substring(17,18)];
                targetUrl = `${configUrl.split('?')[0]}?module=pbb&kata=${k0}&kata1=${k1}&kata2=${k2}&kata3=${k3}&kata4=${k4}&kata5=${k5}&kata6=${k6}&viewpbb=`;
              } else { targetUrl = configUrl.replace(/\{nop\}/gi, cleanNop); }
              await Linking.openURL(targetUrl);
            } catch (e) { Alert.alert('Error', 'Gagal membuka Bapenda.'); }
          }} style={{ marginTop: 18 }}>
            <LinearGradient colors={[appTheme.colors.primary, appTheme.colors.primaryDark]} style={{ borderRadius: 18, paddingVertical: 15, alignItems: 'center' }}>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>{bapendaConfig?.enableBapendaPayment ? 'Lanjut bayar' : 'Buka Bapenda'}</Text>
            </LinearGradient>
          </ScalableButton>
        ) : null}
        <ScalableButton onPress={() => setSyncModal({ ...syncModal, visible: false })} style={{ marginTop: 10 }}>
          <View style={{ backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 18, paddingVertical: 15, alignItems: 'center' }}><Text style={{ color: appTheme.colors.textMuted, fontSize: 14, fontWeight: '600' }}>Tutup</Text></View>
        </ScalableButton>
      </AppModalCard>
      <StatusBar style="light" />
    </KeyboardAvoidingView>
  );
}
