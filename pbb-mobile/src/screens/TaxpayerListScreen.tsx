import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl, formatCurrency } from '../utils/server';
import { ScalableButton } from '../components/ScalableButton';
import { AppScreenHeader } from '../components/AppScreenHeader';
import { AppEmptyState } from '../components/AppEmptyState';
import { AppSkeletonCard } from '../components/AppSkeletonCard';
import { appTheme, statusTone } from '../theme/app-theme';

export default function TaxpayerListScreen({ route, navigation }: ScreenProps<'TaxpayerList'>) {
  const { serverUrl, user, tahun, villageName, bapendaConfig } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [taxpayers, setTaxpayers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => { setPage(1); fetchTaxpayers(1, search); }, [search]);

  const fetchTaxpayers = async (pageNum: number, q: string) => {
    if (pageNum > 1) setLoadingMore(true); else setLoading(true);
    try {
      const params = new URLSearchParams({ userId: user.id, tahun: tahun.toString(), search: q, page: pageNum.toString(), limit: '20' });
      const res = await fetch(joinServerUrl(serverUrl, `/api/mobile/officer/taxpayers?${params.toString()}`));
      const data = await res.json();
      if (data.success) { if (pageNum === 1) setTaxpayers(data.data); else setTaxpayers((p) => [...p, ...data.data]); setHasMore(data.hasMore); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
  };

  const onRefresh = () => { setRefreshing(true); setPage(1); fetchTaxpayers(1, search); };
  const loadMore = () => { if (hasMore && !loadingMore) { const n = page + 1; setPage(n); fetchTaxpayers(n, search); } };

  const renderHeader = () => (
    <AppScreenHeader title="Data wajib pajak" subtitle={villageName} onBack={() => navigation.goBack()}>
      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500', lineHeight: 20, marginTop: 6 }}>Daftar objek pajak, status pembayaran, dan detail lanjutan.</Text>
      <View style={{ marginTop: 16, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
        <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.6)" />
        <TextInput style={{ flex: 1, paddingVertical: 15, paddingLeft: 12, color: 'white', fontSize: 15, fontWeight: '600' }} placeholder="Cari nama atau NOP" placeholderTextColor="rgba(255,255,255,0.4)" value={search} onChangeText={setSearch} />
      </View>
    </AppScreenHeader>
  );

  const renderItem = ({ item: wp }: { item: any }) => {
    const t = wp.paymentStatus === 'LUNAS' ? statusTone.LUNAS : statusTone.PIUTANG;
    return (
      <ScalableButton onPress={() => navigation.navigate('TaxpayerDetail', { serverUrl, taxpayer: wp, user, villageName, bapendaConfig, onUpdate: (u: any) => setTaxpayers((p) => p.map((x) => x.id === u.id ? u : x)) })} style={{ marginBottom: 12, paddingHorizontal: 24 }}>
        <View style={{ backgroundColor: appTheme.colors.surface, borderRadius: 24, padding: 18, ...appTheme.shadow.card }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ color: appTheme.colors.text, fontSize: 16, fontWeight: '700' }} numberOfLines={1}>{wp.namaWp}</Text>
              <Text style={{ color: appTheme.colors.textSoft, fontSize: 12, fontWeight: '500', marginTop: 3 }}>{wp.nop}</Text>
            </View>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: t.bg }}>
              <Text style={{ color: t.text, fontSize: 10, fontWeight: '700' }}>{wp.paymentStatus === 'LUNAS' ? 'Lunas' : 'Belum Lunas'}</Text>
            </View>
          </View>
          <View style={{ marginTop: 14, flexDirection: 'row' }}>
            <View style={{ flex: 1, backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 16, padding: 12, marginRight: 8 }}>
              <Text style={{ color: appTheme.colors.textSoft, fontSize: 10, fontWeight: '600' }}>Wilayah</Text>
              <Text style={{ color: appTheme.colors.text, fontSize: 12, fontWeight: '600', marginTop: 4 }}>Dsn {wp.dusun || '-'} RT {wp.rt || '-'}/{wp.rw || '-'}</Text>
            </View>
            <View style={{ width: 90, backgroundColor: appTheme.colors.primaryLight, borderRadius: 16, padding: 12, alignItems: 'center' }}>
              <Text style={{ color: appTheme.colors.textSoft, fontSize: 10, fontWeight: '600' }}>Tahun</Text>
              <Text style={{ color: appTheme.colors.primary, fontSize: 16, fontWeight: '800', marginTop: 4 }}>{tahun}</Text>
            </View>
          </View>
          <View style={{ marginTop: 12, backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 16, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: appTheme.colors.textMuted, fontSize: 12, fontWeight: '600' }}>Ketetapan</Text>
            <Text style={{ color: appTheme.colors.text, fontSize: 14, fontWeight: '800' }}>{formatCurrency(wp.ketetapan)}</Text>
          </View>
        </View>
      </ScalableButton>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <FlatList data={loading && page === 1 ? [] : taxpayers} keyExtractor={(i) => String(i.id)} renderItem={renderItem}
        ListHeaderComponent={renderHeader} ListHeaderComponentStyle={{ marginBottom: 18 }}
        ListEmptyComponent={loading ? <View style={{ paddingHorizontal: 24 }}><AppSkeletonCard lines={3} /><AppSkeletonCard lines={3} /></View> : <View style={{ paddingHorizontal: 24 }}><AppEmptyState icon="documents-outline" title="Tidak ditemukan" description="Coba kata kunci lain." /></View>}
        ListFooterComponent={<View style={{ paddingHorizontal: 24, paddingBottom: 60 }}>
          {taxpayers.length > 0 && hasMore && <ScalableButton onPress={loadMore}><View style={{ backgroundColor: appTheme.colors.surface, borderRadius: 18, paddingVertical: 15, alignItems: 'center', ...appTheme.shadow.soft }}><Text style={{ color: appTheme.colors.primary, fontSize: 13, fontWeight: '700' }}>Muat lebih banyak</Text></View></ScalableButton>}
          {loadingMore && <ActivityIndicator color={appTheme.colors.primary} style={{ marginTop: 14 }} />}
        </View>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={appTheme.colors.primary} />}
        showsVerticalScrollIndicator={false} initialNumToRender={8} windowSize={7} maxToRenderPerBatch={10} removeClippedSubviews
        onEndReachedThreshold={0.4} onEndReached={() => { if (hasMore && !loadingMore) loadMore(); }} />
      <StatusBar style="light" />
    </View>
  );
}
