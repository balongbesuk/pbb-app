import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl } from '../utils/server';
import { ScalableButton } from '../components/ScalableButton';
import { AppScreenHeader } from '../components/AppScreenHeader';
import { AppModalCard } from '../components/AppModalCard';
import { appTheme, statusTone } from '../theme/app-theme';

export default function PaymentCheckScreen({ route, navigation }: ScreenProps<'PaymentCheck'>) {
  const { serverUrl } = route.params;
  const [nop, setNop] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [pinnedList, setPinnedList] = useState<{ nop: string; name: string; status?: string }[]>([]);
  const [bapendaConfig, setBapendaConfig] = useState<any>(null);
  const [syncModal, setSyncModal] = useState<{
    visible: boolean;
    type: 'success' | 'unpaid' | 'error';
    message: string;
    wpData?: any;
  }>({
    visible: false,
    type: 'success',
    message: '',
  });

  useEffect(() => {
    loadPinnedNopes();
  }, []);

  const loadPinnedNopes = async () => {
    try {
      const saved = await AsyncStorage.getItem('@pinned_nops_v2');
      if (saved) setPinnedList(JSON.parse(saved));
    } catch (e) {
      console.log('Gagal muat pin', e);
    }
  };

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

  const fetchTaxData = async (targetNop: string) => {
    if (!targetNop.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setResults([]);
    try {
      const response = await fetch(`${joinServerUrl(serverUrl, '/api/mobile/tax')}?nop=${encodeURIComponent(targetNop.trim())}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setResults(data.data);

        const updatedList = pinnedList.map((p) => {
          const match = data.data.find((d: any) => d.nop === p.nop);
          return match ? { ...p, status: match.status } : p;
        });

        if (updatedList.length > 0) {
          setPinnedList(updatedList);
          AsyncStorage.setItem('@pinned_nops_v2', JSON.stringify(updatedList));
        }

        if (data.villageConfig) {
          setBapendaConfig(data.villageConfig);
        }
      } else {
        setErrorMsg(data.error || 'Terjadi kesalahan sistem.');
      }
    } catch (err) {
      setErrorMsg('Gagal mengambil data.');
    } finally {
      setLoading(false);
    }
  };

  const isPinned = (item: any) => pinnedList.some((p) => p.nop === item.nop);

  const togglePin = async (item: any) => {
    if (!item) return;
    try {
      let newList;
      if (isPinned(item)) {
        newList = pinnedList.filter((p) => p.nop !== item.nop);
      } else {
        newList = [...pinnedList, { nop: item.nop, name: item.namaWp, status: item.status }];
      }
      await AsyncStorage.setItem('@pinned_nops_v2', JSON.stringify(newList));
      setPinnedList(newList);
    } catch (e) {
      console.log('Gagal simpan pin', e);
    }
  };

  const modalTone =
    syncModal.type === 'success'
      ? { bg: appTheme.colors.successSoft, color: appTheme.colors.success, icon: 'checkmark-circle' as const, title: 'Pembayaran terdeteksi' }
      : syncModal.type === 'unpaid'
        ? { bg: appTheme.colors.accentSoft, color: appTheme.colors.accent, icon: 'wallet-outline' as const, title: 'Tagihan belum lunas' }
        : { bg: appTheme.colors.dangerSoft, color: appTheme.colors.danger, icon: 'alert-circle' as const, title: 'Gangguan sistem' };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <AppScreenHeader
          title="Cek tagihan PBB"
          subtitle="Pembayaran warga"
          onBack={() => navigation.goBack()}
          style={{ paddingBottom: 28 }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 20, marginTop: 6 }}>
            Cari berdasarkan NOP atau nama wajib pajak, lalu lanjutkan ke sinkronisasi atau portal pembayaran resmi.
          </Text>

          <View
            style={{
              marginTop: 20,
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderRadius: 28,
              padding: 22,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)' }}>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }}>QUICK ACCESS</Text>
              </View>
              <View style={{ marginLeft: 10, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(238,138,91,0.18)' }}>
                <Text style={{ color: '#ffd9c8', fontSize: 10, fontWeight: '800' }}>Satu layar, satu keputusan</Text>
              </View>
            </View>

            <TextInput
              style={{
                backgroundColor: 'rgba(255,255,255,0.96)',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.18)',
                paddingHorizontal: 18,
                paddingVertical: 17,
                fontSize: 15,
                color: appTheme.colors.text,
                fontWeight: '800',
                marginBottom: 14,
              }}
              placeholder="Ketik NOP atau nama wajib pajak"
              placeholderTextColor={appTheme.colors.textSoft}
              value={nop}
              onChangeText={handleNopChange}
            />

            <ScalableButton onPress={() => fetchTaxData(nop)} disabled={loading || !nop}>
              <View style={{ backgroundColor: nop ? 'white' : 'rgba(255,255,255,0.12)', borderRadius: 20, paddingVertical: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                {loading ? (
                  <ActivityIndicator color={appTheme.colors.primaryDark} />
                ) : (
                  <>
                    <Ionicons name="search-outline" size={18} color={nop ? appTheme.colors.primaryDark : 'rgba(255,255,255,0.56)'} />
                    <Text style={{ color: nop ? appTheme.colors.primaryDark : 'rgba(255,255,255,0.56)', fontSize: 13, fontWeight: '900', marginLeft: 8 }}>
                      Cari tagihan
                    </Text>
                  </>
                )}
              </View>
            </ScalableButton>

            {errorMsg ? (
              <View style={{ marginTop: 14, backgroundColor: appTheme.colors.dangerSoft, borderWidth: 1, borderColor: '#f0caca', borderRadius: 18, padding: 12 }}>
                <Text style={{ color: appTheme.colors.danger, fontSize: 12, fontWeight: '700' }}>{errorMsg}</Text>
              </View>
            ) : null}
          </View>
        </AppScreenHeader>

        <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
          {pinnedList.length > 0 && results.length === 0 ? (
            <View>
              <Text style={{ color: appTheme.colors.textMuted, fontSize: 13, fontWeight: '800', marginBottom: 10 }}>Tersimpan</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {pinnedList.map((p, idx) => {
                  const tone = p.status === 'LUNAS' ? statusTone.LUNAS : statusTone.PIUTANG;
                  return (
                    <ScalableButton
                      key={idx}
                      onPress={() => {
                        setNop(p.nop);
                        fetchTaxData(p.nop);
                      }}
                      style={{ marginRight: 10 }}
                    >
                      <View style={{ width: 188, backgroundColor: appTheme.colors.surface, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: appTheme.colors.border, ...appTheme.shadow.card }}>
                        <Text style={{ color: appTheme.colors.text, fontSize: 14, fontWeight: '800' }} numberOfLines={1}>{p.name}</Text>
                        <Text style={{ color: appTheme.colors.textSoft, fontSize: 11, marginTop: 4 }}>{p.nop}</Text>
                        {p.status ? (
                          <View style={{ alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: tone.bg }}>
                            <Text style={{ color: tone.text, fontSize: 10, fontWeight: '800' }}>{p.status === 'LUNAS' ? 'Lunas' : 'Belum lunas'}</Text>
                          </View>
                        ) : null}
                      </View>
                    </ScalableButton>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {results.length > 0 ? (
            <View>
              {results.map((item, index) => {
                const tone = item.status === 'LUNAS' ? statusTone.LUNAS : statusTone.PIUTANG;
                return (
                  <View
                    key={index}
                    style={{
                      backgroundColor: appTheme.colors.surface,
                      borderRadius: 28,
                      padding: 20,
                      borderWidth: 1,
                      borderColor: appTheme.colors.border,
                      marginBottom: 16,
                      ...appTheme.shadow.card,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: tone.bg, marginBottom: 10 }}>
                          <Text style={{ color: tone.text, fontSize: 10, fontWeight: '800' }}>
                            {item.status === 'LUNAS' ? 'Lunas' : 'Belum lunas'}
                          </Text>
                        </View>
                        <Text style={{ color: appTheme.colors.text, fontSize: 19, fontWeight: '900' }} numberOfLines={2}>{item.namaWp}</Text>
                        <Text style={{ color: appTheme.colors.textSoft, fontSize: 12, marginTop: 4 }}>{item.nop}</Text>
                      </View>

                      <ScalableButton onPress={() => togglePin(item)}>
                        <View style={{ width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: isPinned(item) ? appTheme.colors.primarySoft : appTheme.colors.surfaceMuted, borderWidth: 1, borderColor: isPinned(item) ? '#c9e6d5' : appTheme.colors.border }}>
                          <Ionicons name={isPinned(item) ? 'bookmark' : 'bookmark-outline'} size={20} color={isPinned(item) ? appTheme.colors.primary : appTheme.colors.textMuted} />
                        </View>
                      </ScalableButton>
                    </View>

                    <View style={{ marginTop: 16, flexDirection: 'row' }}>
                      <View style={{ flex: 1, backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 20, padding: 15, marginRight: 8 }}>
                        <Text style={{ color: appTheme.colors.textMuted, fontSize: 11, fontWeight: '700' }}>Objek pajak</Text>
                        <Text style={{ color: appTheme.colors.text, fontSize: 13, fontWeight: '700', marginTop: 6 }} numberOfLines={2}>
                          {item.alamatObjek || '-'}
                        </Text>
                      </View>
                      <View style={{ width: 108, backgroundColor: appTheme.colors.primarySoft, borderRadius: 20, padding: 15 }}>
                        <Text style={{ color: appTheme.colors.textMuted, fontSize: 11, fontWeight: '700' }}>Tahun</Text>
                        <Text style={{ color: appTheme.colors.primaryDark, fontSize: 18, fontWeight: '900', marginTop: 6 }}>
                          {item.tahun}
                        </Text>
                      </View>
                    </View>

                    <View style={{ marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View>
                        <Text style={{ color: appTheme.colors.textMuted, fontSize: 11, fontWeight: '700' }}>Total tagihan</Text>
                        <Text style={{ color: tone.text, fontSize: 28, fontWeight: '900', marginTop: 4 }}>
                          Rp {item.tagihanPajak.toLocaleString('id-ID')}
                        </Text>
                      </View>
                      {item.status === 'LUNAS' ? (
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: appTheme.colors.successSoft, alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="checkmark" size={24} color={appTheme.colors.success} />
                        </View>
                      ) : null}
                    </View>

                    {item.status !== 'LUNAS' && bapendaConfig?.isJombangBapenda && (bapendaConfig?.enableBapendaPayment ? bapendaConfig?.bapendaPaymentUrl : (bapendaConfig?.enableBapendaSync && bapendaConfig?.bapendaUrl)) ? (
                      <ScalableButton
                        onPress={async () => {
                          try {
                            setLoading(true);
                            const res = await fetch(joinServerUrl(serverUrl, '/api/check-bapenda'), {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ nop: item.nop, tahun: item.tahun }),
                            });
                            const data = await res.json();
                            if (res.ok && data?.isPaid) {
                              fetchTaxData(item.nop);
                              setSyncModal({
                                visible: true,
                                type: 'success',
                                message: 'Pembayaran terdeteksi lunas di server pusat.',
                                wpData: item,
                              });
                            } else {
                              setSyncModal({
                                visible: true,
                                type: 'unpaid',
                                message: `Tagihan atas nama ${item.namaWp} masih tercatat belum lunas.`,
                                wpData: item,
                              });
                              setLoading(false);
                            }
                          } catch (e) {
                            setSyncModal({
                              visible: true,
                              type: 'error',
                              message: 'Gagal menghubungkan ke server Bapenda. Pastikan koneksi internet Anda stabil.',
                            });
                            setLoading(false);
                          }
                        }}
                        style={{ marginTop: 16 }}
                      >
                        <View style={{ backgroundColor: bapendaConfig?.enableBapendaPayment ? appTheme.colors.primary : appTheme.colors.info, borderRadius: 20, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                          <Ionicons name={bapendaConfig?.enableBapendaPayment ? 'card-outline' : 'sync-outline'} size={18} color="white" />
                          <Text style={{ color: 'white', fontSize: 12, fontWeight: '900', marginLeft: 8 }}>
                            {bapendaConfig?.enableBapendaPayment ? 'Bayar online sekarang' : 'Cek status Bapenda'}
                          </Text>
                        </View>
                      </ScalableButton>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <AppModalCard
        visible={syncModal.visible}
        title={modalTone.title}
        message={syncModal.message}
        icon={modalTone.icon}
        iconColor={modalTone.color}
        iconBg={modalTone.bg}
        onRequestClose={() => setSyncModal({ ...syncModal, visible: false })}
      >
        {syncModal.wpData ? (
          <View style={{ marginTop: 16, backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 20, padding: 14 }}>
            <Text style={{ color: appTheme.colors.textMuted, fontSize: 11, fontWeight: '700' }}>Objek pajak</Text>
            <Text style={{ color: appTheme.colors.text, fontSize: 14, fontWeight: '800', marginTop: 4 }}>{syncModal.wpData.namaWp}</Text>
            <Text style={{ color: appTheme.colors.textSoft, fontSize: 12, marginTop: 2 }}>{syncModal.wpData.nop}</Text>
          </View>
        ) : null}

        {syncModal.type === 'unpaid' && bapendaConfig?.isJombangBapenda && (bapendaConfig?.enableBapendaPayment ? bapendaConfig?.bapendaPaymentUrl : (bapendaConfig?.enableBapendaSync && bapendaConfig?.bapendaUrl)) ? (
          <ScalableButton
            onPress={async () => {
              setSyncModal({ ...syncModal, visible: false });
              try {
                const cleanNop = syncModal.wpData.nop.replace(/\D/g, '');
                const isPayment = bapendaConfig.enableBapendaPayment;
                const configUrl = isPayment ? bapendaConfig.bapendaPaymentUrl : bapendaConfig.bapendaUrl;

                let targetUrl = configUrl;
                if (!isPayment && bapendaConfig.isJombangBapenda && cleanNop.length === 18) {
                  const k0 = cleanNop.substring(0, 2);
                  const k1 = cleanNop.substring(2, 4);
                  const k2 = cleanNop.substring(4, 7);
                  const k3 = cleanNop.substring(7, 10);
                  const k4 = cleanNop.substring(10, 13);
                  const k5 = cleanNop.substring(13, 17);
                  const k6 = cleanNop.substring(17, 18);
                  const baseUrl = configUrl.split('?')[0];
                  targetUrl = `${baseUrl}?module=pbb&kata=${k0}&kata1=${k1}&kata2=${k2}&kata3=${k3}&kata4=${k4}&kata5=${k5}&kata6=${k6}&viewpbb=`;
                } else {
                  targetUrl = configUrl.replace(/\{nop\}/gi, cleanNop);
                }

                await Linking.openURL(targetUrl);
              } catch (e) {
                Alert.alert('Error', 'Gagal membuka halaman Bapenda.');
              }
            }}
            style={{ marginTop: 20 }}
          >
            <View style={{ backgroundColor: appTheme.colors.primary, borderRadius: 18, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: 'white', fontSize: 13, fontWeight: '900' }}>
                {bapendaConfig?.enableBapendaPayment ? 'Lanjut bayar di Bapenda' : 'Buka website Bapenda'}
              </Text>
            </View>
          </ScalableButton>
        ) : null}

        <ScalableButton onPress={() => setSyncModal({ ...syncModal, visible: false })} style={{ marginTop: 12 }}>
          <View style={{ backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 18, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: appTheme.colors.textMuted, fontSize: 13, fontWeight: '800' }}>Tutup</Text>
          </View>
        </ScalableButton>
      </AppModalCard>

      <StatusBar style="light" />
    </KeyboardAvoidingView>
  );
}
