import React, { useState, useEffect } from 'react';
import { View, Text, RefreshControl, FlatList, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import type { ScreenProps } from '../types/navigation';
import { authenticatedFetch } from '../utils/server';
import { ScalableButton } from '../components/ScalableButton';
import { AppScreenHeader } from '../components/AppScreenHeader';
import { AppEmptyState } from '../components/AppEmptyState';
import { AppSkeletonCard } from '../components/AppSkeletonCard';
import { appTheme } from '../theme/app-theme';

export default function BillingHistoryScreen({ route, navigation }: ScreenProps<'BillingHistory'>) {
  const { serverUrl, user, villageName } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => { fetchLogs(1); }, []);
  const fetchLogs = async (p: number) => { try { const r = await authenticatedFetch(serverUrl, `/api/mobile/officer/logs?page=${p}&limit=20`); const d = await r.json(); if (d.success) { if (p === 1) setLogs(d.data); else setLogs((prev) => [...prev, ...d.data]); setHasMore(d.hasMore); setPage(p); } } catch (e) {} finally { setLoading(false); setRefreshing(false); } };
  const onRefresh = () => { setRefreshing(true); fetchLogs(1); };

  const renderHeader = () => (<AppScreenHeader title="Riwayat penagihan" subtitle={villageName} onBack={() => navigation.goBack()}><Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500', marginTop: 6 }}>Histori transaksi dan aktivitas lapangan.</Text></AppScreenHeader>);

  const renderItem = ({ item: log, index }: { item: any; index: number }) => {
    const isUnpaid = log.details?.includes('BELUM_LUNAS') || log.details?.includes('TIDAK_TERBIT');
    const date = new Date(log.createdAt);
    return (
      <View style={{ flexDirection: 'row', marginBottom: 14, paddingHorizontal: 24 }}>
        <View style={{ alignItems: 'center', marginRight: 14 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: isUnpaid ? appTheme.colors.dangerSoft : appTheme.colors.successSoft }}>
            <Ionicons name={isUnpaid ? 'close' : 'cash'} size={18} color={isUnpaid ? appTheme.colors.danger : appTheme.colors.success} />
          </View>
          {index < logs.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: appTheme.colors.border, marginVertical: 6 }} />}
        </View>
        <View style={{ flex: 1, backgroundColor: appTheme.colors.surface, borderRadius: 22, padding: 16, ...appTheme.shadow.soft }}>
          <View style={{ alignSelf: 'flex-start', marginBottom: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: isUnpaid ? appTheme.colors.dangerSoft : appTheme.colors.successSoft }}>
            <Text style={{ color: isUnpaid ? appTheme.colors.danger : appTheme.colors.success, fontSize: 10, fontWeight: '700' }}>{isUnpaid ? 'PERUBAHAN' : 'SETORAN'}</Text>
          </View>
          <Text style={{ color: appTheme.colors.text, fontSize: 14, fontWeight: '600', lineHeight: 20 }}>{log.details}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
            <Ionicons name="calendar-outline" size={11} color={appTheme.colors.textSoft} /><Text style={{ color: appTheme.colors.textSoft, fontSize: 11, fontWeight: '500', marginLeft: 4 }}>{date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            <Text style={{ color: appTheme.colors.textSoft, marginHorizontal: 6 }}>•</Text>
            <Ionicons name="time-outline" size={11} color={appTheme.colors.textSoft} /><Text style={{ color: appTheme.colors.textSoft, fontSize: 11, fontWeight: '500', marginLeft: 4 }}>{date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <FlatList data={loading ? [] : logs} keyExtractor={(i) => String(i.id)} renderItem={renderItem} ListHeaderComponent={renderHeader} ListHeaderComponentStyle={{ marginBottom: 18 }}
        ListEmptyComponent={loading ? <View style={{ paddingHorizontal: 24 }}><AppSkeletonCard compact /><AppSkeletonCard compact /></View> : <AppEmptyState icon="archive-outline" title="Belum ada riwayat" />}
        ListFooterComponent={<View style={{ paddingHorizontal: 24, paddingBottom: 60 }}>
          {logs.length > 0 && hasMore && <ScalableButton onPress={() => fetchLogs(page + 1)}><View style={{ backgroundColor: appTheme.colors.surface, borderRadius: 18, paddingVertical: 15, alignItems: 'center', ...appTheme.shadow.soft }}><Text style={{ color: appTheme.colors.primary, fontSize: 13, fontWeight: '700' }}>Muat lebih banyak</Text></View></ScalableButton>}
        </View>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={appTheme.colors.primary} />}
        showsVerticalScrollIndicator={false} initialNumToRender={8} removeClippedSubviews />
      <StatusBar style="light" />
    </View>
  );
}
