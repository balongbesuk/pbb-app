import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl, formatCurrency } from '../utils/server';
import { ScalableButton } from '../components/ScalableButton';
import { AppScreenHeader } from '../components/AppScreenHeader';
import { AppActionCard } from '../components/AppActionCard';
import { AppModalCard } from '../components/AppModalCard';
import { AppSectionTitle } from '../components/AppSectionTitle';
import { AppStatCard } from '../components/AppStatCard';
import { AppEmptyState } from '../components/AppEmptyState';
import { AppSkeletonCard } from '../components/AppSkeletonCard';
import { appTheme } from '../theme/app-theme';

export default function AdminDashboardScreen({ route, navigation }: ScreenProps<'AdminDashboard'>) {
  const { serverUrl, user, villageName } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [bapendaConfig, setBapendaConfig] = useState<any>(null);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const firstName = user?.name?.trim()?.split(/\s+/)[0] || 'Petugas';
  const currentYear = dashboardData?.tahunPajak || new Date().getFullYear();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const url = joinServerUrl(serverUrl, `/api/mobile/officer/dashboard?userId=${user.id}&tahun=${new Date().getFullYear()}`);
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setDashboardData(data);
        if (data.villageConfig) {
          setBapendaConfig(data.villageConfig);
        }
      }
    } catch (err) {
      console.error('Fetch Dashboard Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const handleLogout = async () => {
    setLogoutModalVisible(false);
    try {
      await AsyncStorage.removeItem('@admin_magic_token');
      await AsyncStorage.removeItem('@auth_user');
      navigation.replace('Dashboard', {
        serverUrl,
        villageName,
        stats: { totalSppt: dashboardData?.stats?.totalWp || 0, lunasSppt: dashboardData?.stats?.wpLunas || 0 },
      });
    } catch (e) {
      navigation.replace('Dashboard', { serverUrl, villageName });
    }
  };

  const stats = dashboardData?.stats || {
    totalTarget: 0,
    totalWp: 0,
    totalLunas: 0,
    wpLunas: 0,
    wpSengketa: 0,
    wpTdkTerbit: 0,
  };

  const progress = stats.totalTarget > 0 ? (stats.totalLunas / stats.totalTarget) : 0;
  const progressPercent = (progress * 100).toFixed(1);

  const actionCards = [
    {
      title: 'Terima Setoran',
      subtitle: 'Validasi pembayaran dan lanjutkan tindak lanjut',
      icon: 'cash-outline' as const,
      bg: appTheme.colors.primarySoft,
      color: appTheme.colors.primary,
      onPress: () => navigation.navigate('PaymentCheck', { serverUrl }),
    },
    {
      title: 'Peta GIS Wilayah',
      subtitle: 'Pantau persebaran target, lunas, dan piutang',
      icon: 'map-outline' as const,
      bg: appTheme.colors.infoSoft,
      color: appTheme.colors.info,
      onPress: () => navigation.navigate('GisMap', { serverUrl }),
    },
    {
      title: 'Data Wajib Pajak',
      subtitle: 'Buka daftar objek pajak dan status terkini',
      icon: 'people-outline' as const,
      bg: appTheme.colors.surfaceStrong,
      color: appTheme.colors.primaryDark,
      onPress: () => navigation.navigate('TaxpayerList', { serverUrl, user, tahun: currentYear, villageName, bapendaConfig }),
    },
    {
      title: 'Riwayat Penagihan',
      subtitle: 'Tinjau histori transaksi dan aktivitas lapangan',
      icon: 'receipt-outline' as const,
      bg: appTheme.colors.accentSoft,
      color: appTheme.colors.accent,
      onPress: () => navigation.navigate('BillingHistory', { serverUrl, user, villageName }),
    },
  ];

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
        <AppScreenHeader title="Panel Petugas" subtitle="Memuat dashboard" style={{ paddingBottom: 26 }}>
          <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 13, marginTop: 6 }}>
            Menyiapkan ringkasan target dan layanan operasional.
          </Text>
        </AppScreenHeader>
        <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
          <AppSkeletonCard lines={3} />
          <AppSkeletonCard compact />
          <AppSkeletonCard compact />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={appTheme.colors.primary} />}
      >
        <AppScreenHeader
          title={`Halo, ${firstName}`}
          subtitle="Panel Petugas"
          rightAction={
            <ScalableButton onPress={() => navigation.navigate('Notification', { serverUrl, user })}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 24,
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.12)',
                }}
              >
                <Ionicons name="notifications-outline" size={24} color="white" />
                {dashboardData?.unreadNotificationsCount > 0 && (
                  <View style={{ position: 'absolute', top: -2, right: -2, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: appTheme.colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: '900' }}>{dashboardData.unreadNotificationsCount}</Text>
                  </View>
                )}
              </View>
            </ScalableButton>
          }
          style={{ paddingBottom: 30 }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 13, marginTop: 6 }}>
            {villageName} • Tahun {currentYear}
          </Text>
          <View
            style={{
              marginTop: 22,
              backgroundColor: 'rgba(255,255,255,0.07)',
              borderRadius: 30,
              padding: 24,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)' }}>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }}>COMMAND CENTER</Text>
              </View>
              <View style={{ marginLeft: 10, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(238,138,91,0.18)' }}>
                <Text style={{ color: '#ffd9c8', fontSize: 10, fontWeight: '800' }}>{stats.totalWp} objek aktif</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '700' }}>Realisasi terkumpul</Text>
                <Text style={{ color: 'white', fontSize: 28, fontWeight: '900', marginTop: 6 }}>{formatCurrency(stats.totalLunas)}</Text>
                <Text style={{ color: '#cbe8d7', fontSize: 12, fontWeight: '700', marginTop: 6, lineHeight: 18 }}>
                  {stats.wpLunas} wajib pajak sudah lunas dan siap direkap hari ini
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 }}>
                  <Text style={{ color: 'white', fontSize: 13, fontWeight: '900' }}>{progressPercent}%</Text>
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '700', marginTop: 8 }}>
                  dari {formatCurrency(stats.totalTarget)}
                </Text>
              </View>
            </View>

            <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, overflow: 'hidden', marginTop: 18 }}>
              <View style={{ width: `${Math.min(parseFloat(progressPercent), 100)}%`, height: '100%', backgroundColor: '#ffffff' }} />
            </View>

            <View style={{ flexDirection: 'row', marginTop: 18 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <AppStatCard label="Piutang" value={formatCurrency(Math.max(stats.totalTarget - stats.totalLunas, 0))} compact />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <AppStatCard label="Kasus khusus" value={`${stats.wpSengketa + stats.wpTdkTerbit} data`} compact />
              </View>
            </View>
          </View>
        </AppScreenHeader>

        <View style={{ paddingHorizontal: 24, marginTop: 22 }}>
          <AppSectionTitle title="Layanan operasional" />

          {actionCards.map((card) => (
            <AppActionCard
              key={card.title}
              title={card.title}
              subtitle={card.subtitle}
              icon={card.icon}
              iconBg={card.bg}
              iconColor={card.color}
              onPress={card.onPress}
              style={{ marginBottom: 14 }}
            />
          ))}

          <AppSectionTitle title="Aktivitas terakhir" subtitle="Update singkat dari transaksi petugas terbaru" icon="time-outline" />

          <View style={{ backgroundColor: appTheme.colors.surface, borderRadius: 28, borderWidth: 1, borderColor: appTheme.colors.border, overflow: 'hidden', ...appTheme.shadow.card }}>
            {dashboardData?.logs?.length > 0 ? (
              dashboardData.logs.map((log: any, i: number) => {
                const isUnpaid = log.details?.includes('BELUM_LUNAS') || log.details?.includes('TIDAK_TERBIT');
                const date = new Date(log.createdAt);
                return (
                  <View key={log.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: i < dashboardData.logs.length - 1 ? 1 : 0, borderBottomColor: appTheme.colors.surfaceStrong }}>
                    <View style={{ width: 44, height: 44, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: isUnpaid ? appTheme.colors.dangerSoft : appTheme.colors.successSoft }}>
                      <Ionicons name={isUnpaid ? 'close-circle' : 'checkmark-circle'} size={20} color={isUnpaid ? appTheme.colors.danger : appTheme.colors.success} />
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ color: appTheme.colors.text, fontSize: 13, fontWeight: '800', lineHeight: 19 }} numberOfLines={2}>
                        {log.details}
                      </Text>
                      <Text style={{ color: appTheme.colors.textSoft, fontSize: 11, marginTop: 5 }}>
                        {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <AppEmptyState icon="time-outline" title="Belum ada aktivitas" />
            )}
          </View>

          <ScalableButton onPress={() => setLogoutModalVisible(true)} style={{ marginTop: 16 }}>
            <View style={{ backgroundColor: appTheme.colors.surface, borderRadius: 22, paddingVertical: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderWidth: 1, borderColor: '#efcccc', ...appTheme.shadow.card }}>
              <Ionicons name="log-out-outline" size={18} color={appTheme.colors.danger} />
              <Text style={{ color: appTheme.colors.danger, fontSize: 13, fontWeight: '900', marginLeft: 8 }}>Keluar sesi petugas</Text>
            </View>
          </ScalableButton>
        </View>
      </ScrollView>

      <AppModalCard
        visible={logoutModalVisible}
        title="Keluar dari sesi"
        message="Anda akan kembali ke layanan warga dan perlu login lagi untuk mengakses panel petugas."
        icon="log-out-outline"
        iconColor={appTheme.colors.danger}
        iconBg={appTheme.colors.dangerSoft}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <ScalableButton onPress={handleLogout} style={{ marginTop: 20 }}>
          <View style={{ backgroundColor: appTheme.colors.danger, borderRadius: 18, paddingVertical: 15, alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 13, fontWeight: '900' }}>Ya, keluar sesi</Text>
          </View>
        </ScalableButton>
        <ScalableButton onPress={() => setLogoutModalVisible(false)} style={{ marginTop: 10 }}>
          <View style={{ backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 18, paddingVertical: 15, alignItems: 'center' }}>
            <Text style={{ color: appTheme.colors.textMuted, fontSize: 13, fontWeight: '800' }}>Tetap di sini</Text>
          </View>
        </ScalableButton>
      </AppModalCard>

      <StatusBar style="light" />
    </View>
  );
}
