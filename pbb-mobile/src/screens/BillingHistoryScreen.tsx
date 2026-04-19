import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl } from '../utils/server';
import { ScalableButton } from '../components/ScalableButton';
import { AppScreenHeader } from '../components/AppScreenHeader';
import { AppEmptyState } from '../components/AppEmptyState';
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

  return (
    <View style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <AppScreenHeader title="Riwayat penagihan" subtitle={villageName} onBack={() => navigation.goBack()} />

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 24, paddingTop: 18 }}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={appTheme.colors.primary} />}
      >
        {logs.length > 0 ? (
          logs.map((log, i) => {
            const isUnpaid = log.details?.includes('BELUM_LUNAS') || log.details?.includes('TIDAK_TERBIT');
            const date = new Date(log.createdAt);
            return (
              <View key={log.id} style={{ flexDirection: 'row', marginBottom: 16 }}>
                <View style={{ alignItems: 'center', marginRight: 14 }}>
                  <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: isUnpaid ? appTheme.colors.dangerSoft : appTheme.colors.successSoft }}>
                    <Ionicons name={isUnpaid ? 'close' : 'cash'} size={20} color={isUnpaid ? appTheme.colors.danger : appTheme.colors.success} />
                  </View>
                  {i < logs.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: appTheme.colors.border, marginVertical: 8 }} />}
                </View>

                <View style={{ flex: 1, backgroundColor: appTheme.colors.surface, borderRadius: appTheme.radius.lg, padding: 16, borderWidth: 1, borderColor: appTheme.colors.border, ...appTheme.shadow.card }}>
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
                  {log.entityId && (
                    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: appTheme.colors.surfaceStrong }}>
                      <Text style={{ color: appTheme.colors.textMuted, fontSize: 11, fontWeight: '700' }}>
                        Objek pajak ID: <Text style={{ color: appTheme.colors.text, fontWeight: '900' }}>{log.entityId}</Text>
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        ) : loading ? (
          <View style={{ paddingVertical: 90, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={appTheme.colors.primary} />
          </View>
        ) : (
          <AppEmptyState icon="archive-outline" title="Belum ada riwayat transaksi" />
        )}

        {hasMore && !loading && (
          <ScalableButton onPress={loadMore}>
            <View style={{ backgroundColor: appTheme.colors.surface, borderRadius: 18, borderWidth: 1, borderColor: appTheme.colors.border, paddingVertical: 15, alignItems: 'center', marginTop: 4, ...appTheme.shadow.card }}>
              <Text style={{ color: appTheme.colors.primary, fontSize: 13, fontWeight: '900' }}>Muat lebih banyak</Text>
            </View>
          </ScalableButton>
        )}
      </ScrollView>
      <StatusBar style="light" />
    </View>
  );
}
