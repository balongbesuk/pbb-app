import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl, formatCurrency } from '../utils/server';
import { ScalableButton } from '../components/ScalableButton';
import { AppScreenHeader } from '../components/AppScreenHeader';
import { AppEmptyState } from '../components/AppEmptyState';
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

  useEffect(() => {
    setPage(1);
    fetchTaxpayers(1, search);
  }, [search]);

  const fetchTaxpayers = async (pageNum: number, searchQuery: string) => {
    if (pageNum > 1) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({
        userId: user.id,
        tahun: tahun.toString(),
        search: searchQuery,
        page: pageNum.toString(),
        limit: '20',
      });
      const url = joinServerUrl(serverUrl, `/api/mobile/officer/taxpayers?${params.toString()}`);
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        if (pageNum === 1) {
          setTaxpayers(data.data);
        } else {
          setTaxpayers((prev) => [...prev, ...data.data]);
        }
        setHasMore(data.hasMore);
      }
    } catch (err) {
      console.error('Fetch Taxpayers Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchTaxpayers(1, search);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTaxpayers(nextPage, search);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <AppScreenHeader title="Data wajib pajak" subtitle={`Wilayah ${villageName}`} onBack={() => navigation.goBack()}>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 22, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
          <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.72)" />
          <TextInput
            style={{ flex: 1, paddingVertical: 15, paddingLeft: 12, color: 'white', fontSize: 15, fontWeight: '700' }}
            placeholder="Cari nama atau NOP"
            placeholderTextColor="rgba(255,255,255,0.45)"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </AppScreenHeader>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 24, paddingTop: 18 }}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={appTheme.colors.primary} />}
      >
        {loading && page === 1 ? (
          <View style={{ paddingVertical: 90, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={appTheme.colors.primary} />
          </View>
        ) : taxpayers.length > 0 ? (
          <>
            {taxpayers.map((wp) => {
              const tone = wp.paymentStatus === 'LUNAS' ? statusTone.LUNAS : statusTone.PIUTANG;
              return (
                <ScalableButton
                  key={wp.id}
                  onPress={() =>
                    navigation.navigate('TaxpayerDetail', {
                      serverUrl,
                      taxpayer: wp,
                      user,
                      villageName,
                      bapendaConfig,
                      onUpdate: (updatedWp: any) => {
                        setTaxpayers((prev) => prev.map((t) => (t.id === updatedWp.id ? updatedWp : t)));
                      },
                    })
                  }
                  style={{ marginBottom: 14 }}
                >
                  <View style={{ backgroundColor: appTheme.colors.surface, borderRadius: appTheme.radius.lg, padding: 18, borderWidth: 1, borderColor: appTheme.colors.border, ...appTheme.shadow.card }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={{ color: appTheme.colors.text, fontSize: 16, fontWeight: '900' }} numberOfLines={1}>
                          {wp.namaWp}
                        </Text>
                        <Text style={{ color: appTheme.colors.textSoft, fontSize: 12, marginTop: 4 }}>{wp.nop}</Text>
                      </View>
                      <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: tone.bg }}>
                        <Text style={{ color: tone.text, fontSize: 10, fontWeight: '800' }}>
                          {wp.paymentStatus === 'LUNAS' ? 'Lunas' : 'Piutang'}
                        </Text>
                      </View>
                    </View>

                    <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="location-outline" size={14} color={appTheme.colors.textSoft} />
                      <Text style={{ color: appTheme.colors.textMuted, fontSize: 12, marginLeft: 6 }}>
                        Dusun {wp.dusun || '-'} • RT {wp.rt || '-'} / RW {wp.rw || '-'}
                      </Text>
                    </View>

                    <View style={{ marginTop: 14, backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 18, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: appTheme.colors.textMuted, fontSize: 12, fontWeight: '700' }}>Ketetapan</Text>
                      <Text style={{ color: appTheme.colors.text, fontSize: 14, fontWeight: '900' }}>{formatCurrency(wp.ketetapan)}</Text>
                    </View>
                  </View>
                </ScalableButton>
              );
            })}

            {hasMore && (
              <ScalableButton onPress={loadMore} disabled={loadingMore}>
                <View style={{ backgroundColor: appTheme.colors.surface, borderRadius: 18, borderWidth: 1, borderColor: appTheme.colors.border, paddingVertical: 15, alignItems: 'center', ...appTheme.shadow.card }}>
                  {loadingMore ? (
                    <ActivityIndicator color={appTheme.colors.primary} />
                  ) : (
                    <Text style={{ color: appTheme.colors.primary, fontSize: 13, fontWeight: '900' }}>Muat lebih banyak</Text>
                  )}
                </View>
              </ScalableButton>
            )}
          </>
        ) : (
          <AppEmptyState icon="documents-outline" title="Data tidak ditemukan" description="Coba kata kunci lain untuk pencarian." />
        )}
      </ScrollView>
      <StatusBar style="light" />
    </View>
  );
}
