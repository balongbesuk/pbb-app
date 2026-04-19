import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl } from '../utils/server';
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

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const fetchLogs = async (pageNum: number) => {
    try {
      const url = joinServerUrl(serverUrl, `/api/mobile/officer/logs?userId=${user.id}&page=${pageNum}&limit=20`);
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        if (pageNum === 1) {
          setLogs(data.data);
        } else {
          setLogs((prev) => [...prev, ...data.data]);
        }
        setHasMore(data.hasMore);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Fetch Logs Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs(1);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchLogs(page + 1);
    }
  };

  const renderHeader = () => (
    <AppScreenHeader title="Riwayat penagihan" subtitle={villageName} onBack={() => navigation.goBack()}>
      <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 13, lineHeight: 20, marginTop: 6 }}>
        Tinjau jejak transaksi dan aktivitas lapangan untuk memudahkan rekap dan pengecekan ulang.
      </Text>
    </AppScreenHeader>
  );

  const renderItem = ({ item: log, index }: { item: any; index: number }) => {
    const isUnpaid = log.details?.includes('BELUM_LUNAS') || log.details?.includes('TIDAK_TERBIT');
    const date = new Date(log.createdAt);
    return (
      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        <View style={{ alignItems: 'center', marginRight: 14 }}>
          <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: isUnpaid ? appTheme.colors.dangerSoft : appTheme.colors.successSoft }}>
            <Ionicons name={isUnpaid ? 'close' : 'cash'} size={20} color={isUnpaid ? appTheme.colors.danger : appTheme.colors.success} />
          </View>
          {index < logs.length - 1 ? <View style={{ width: 2, flex: 1, backgroundColor: appTheme.colors.border, marginVertical: 8 }} /> : null}
        </View>

        <View style={{ flex: 1, backgroundColor: appTheme.colors.surface, borderRadius: 26, padding: 16, borderWidth: 1, borderColor: appTheme.colors.border, ...appTheme.shadow.card }}>
          <View style={{ alignSelf: 'flex-start', marginBottom: 10, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: isUnpaid ? appTheme.colors.dangerSoft : appTheme.colors.successSoft }}>
            <Text style={{ color: isUnpaid ? appTheme.colors.danger : appTheme.colors.success, fontSize: 10, fontWeight: '900' }}>
              {isUnpaid ? 'PERUBAHAN STATUS' : 'SETORAN MASUK'}
            </Text>
          </View>
          <Text style={{ color: appTheme.colors.text, fontSize: 14, fontWeight: '800', lineHeight: 20 }}>{log.details}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
            <Ionicons name="calendar-outline" size={12} color={appTheme.colors.textSoft} />
            <Text style={{ color: appTheme.colors.textSoft, fontSize: 11, fontWeight: '700', marginLeft: 4 }}>
              {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
            <Text style={{ color: appTheme.colors.textSoft, marginHorizontal: 8 }}>•</Text>
            <Ionicons name="time-outline" size={12} color={appTheme.colors.textSoft} />
            <Text style={{ color: appTheme.colors.textSoft, fontSize: 11, fontWeight: '700', marginLeft: 4 }}>
              {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </Text>
          </View>
          {log.entityId ? (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: appTheme.colors.surfaceStrong }}>
              <Text style={{ color: appTheme.colors.textMuted, fontSize: 11, fontWeight: '700' }}>
                Objek pajak ID: <Text style={{ color: appTheme.colors.text, fontWeight: '900' }}>{log.entityId}</Text>
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMore || loading) return <View style={{ height: 8 }} />;

    return (
      <ScalableButton onPress={loadMore}>
        <View style={{ backgroundColor: appTheme.colors.surface, borderRadius: 18, borderWidth: 1, borderColor: appTheme.colors.border, paddingVertical: 15, alignItems: 'center', marginTop: 4, ...appTheme.shadow.card }}>
          <Text style={{ color: appTheme.colors.primary, fontSize: 13, fontWeight: '900' }}>Muat lebih banyak</Text>
        </View>
      </ScalableButton>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <FlatList
        data={loading ? [] : logs}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListHeaderComponentStyle={{ marginBottom: 18 }}
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingHorizontal: 24 }}>
              <AppSkeletonCard compact />
              <AppSkeletonCard compact />
              <AppSkeletonCard compact />
            </View>
          ) : (
            <View style={{ paddingHorizontal: 24 }}>
              <AppEmptyState icon="archive-outline" title="Belum ada riwayat transaksi" />
            </View>
          )
        }
        ListFooterComponent={<View style={{ paddingHorizontal: 24, paddingBottom: 60 }}>{logs.length > 0 ? renderFooter() : null}</View>}
        style={{ flex: 1 }}
        contentContainerStyle={{}}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={appTheme.colors.primary} />}
        initialNumToRender={8}
        windowSize={7}
        maxToRenderPerBatch={10}
        removeClippedSubviews
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasMore && !loading) loadMore();
        }}
      />
      <StatusBar style="light" />
    </View>
  );
}
