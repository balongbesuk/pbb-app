import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
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

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const url = joinServerUrl(serverUrl, `/api/mobile/officer/dashboard?userId=${user.id}&tahun=${new Date().getFullYear()}`);
      const res = await fetch(url); const data = await res.json();
      if (data.success) { setDashboardData(data); if (data.villageConfig) setBapendaConfig(data.villageConfig); }
    } catch (err) { console.error('Fetch Dashboard Error:', err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); fetchDashboard(); };

  const handleLogout = async () => {
    setLogoutModalVisible(false);
    try { await AsyncStorage.removeItem('@admin_magic_token'); await AsyncStorage.removeItem('@auth_user');
      navigation.replace('Dashboard', { serverUrl, villageName, stats: { totalSppt: dashboardData?.stats?.totalWp || 0, lunasSppt: dashboardData?.stats?.wpLunas || 0 } });
    } catch (e) { navigation.replace('Dashboard', { serverUrl, villageName }); }
  };

  const stats = dashboardData?.stats || { totalTarget: 0, totalWp: 0, totalLunas: 0, wpLunas: 0, wpSengketa: 0, wpTdkTerbit: 0 };
  const progress = stats.totalTarget > 0 ? (stats.totalLunas / stats.totalTarget) : 0;
  const progressPercent = (progress * 100).toFixed(1);

  const actionCards = [
    { title: 'Terima Setoran', subtitle: 'Validasi pembayaran & setor kas', icon: 'cash-outline' as const, bg: appTheme.colors.primarySoft, color: appTheme.colors.primary, onPress: () => navigation.navigate('PaymentCheck', { serverUrl }) },
    { title: 'Peta GIS Wilayah', subtitle: 'Pantau persebaran & status objek', icon: 'map-outline' as const, bg: appTheme.colors.infoSoft, color: appTheme.colors.info, onPress: () => navigation.navigate('GisMap', { serverUrl }) },
    { title: 'Data Wajib Pajak', subtitle: 'Daftar objek & wajib pajak terkini', icon: 'people-outline' as const, bg: appTheme.colors.accentSoft, color: appTheme.colors.accent, onPress: () => navigation.navigate('TaxpayerList', { serverUrl, user, tahun: currentYear, villageName, bapendaConfig }) },
    { title: 'Riwayat Penagihan', subtitle: 'Histori transaksi & log petugas', icon: 'receipt-outline' as const, bg: appTheme.colors.dangerSoft, color: appTheme.colors.danger, onPress: () => navigation.navigate('BillingHistory', { serverUrl, user, villageName }) },
  ];

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
        <AppScreenHeader title="Panel Petugas" subtitle="Memuat" style={{ paddingBottom: 26 }}>
          <Text style={{ color: 'rgba(255,255,255,0.6)', ...appTheme.typo.body, marginTop: 8 }}>Mempersiapkan data realisasi...</Text>
        </AppScreenHeader>
        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}><AppSkeletonCard lines={3} /><AppSkeletonCard compact /><AppSkeletonCard compact /></View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={appTheme.colors.primary} />}>

        <AppScreenHeader title={`Halo, ${firstName}`} subtitle="Panel Petugas"
          rightAction={
            <ScalableButton onPress={() => navigation.navigate('Notification', { serverUrl, user })}>
              <View>
                <BlurView intensity={20} tint="light" style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                  <Ionicons name="notifications-outline" size={22} color="white" />
                </BlurView>
                {dashboardData?.unreadNotificationsCount > 0 && (
                  <View style={{ 
                    position: 'absolute', 
                    top: -2, 
                    right: -2, 
                    minWidth: 20, 
                    height: 20, 
                    borderRadius: 10, 
                    backgroundColor: appTheme.colors.danger, 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    paddingHorizontal: 4, 
                    borderWidth: 2, 
                    borderColor: '#0f172a',
                    zIndex: 10
                  }}>
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: '900' }}>{dashboardData.unreadNotificationsCount}</Text>
                  </View>
                )}
              </View>
            </ScalableButton>
          }
          style={{ paddingBottom: 32 }}>

          <Text style={{ color: 'rgba(255,255,255,0.6)', ...appTheme.typo.label, marginTop: 8 }}>{villageName} • TAHUN {currentYear}</Text>
          
          {/* Pro Command Center Card */}
          <Animated.View entering={FadeInUp.delay(100)} style={{ marginTop: 24, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 8 }} />
                <Text style={{ color: 'rgba(255,255,255,0.9)', ...appTheme.typo.badge }}>LIVE COMMAND CENTER</Text>
              </View>
              <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                <Text style={{ color: '#10b981', ...appTheme.typo.badge }}>{stats.totalWp} OBJEK</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', ...appTheme.typo.caption, marginBottom: 4 }}>REALISASI TERKUMPUL</Text>
                <Text style={{ color: 'white', ...appTheme.typo.hero, fontSize: 26 }}>{formatCurrency(stats.totalLunas)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#10b981', ...appTheme.typo.heading, fontSize: 22 }}>{progressPercent}%</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', ...appTheme.typo.badge, marginTop: 2 }}>DARI {formatCurrency(stats.totalTarget)}</Text>
              </View>
            </View>

            <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden', marginBottom: 20 }}>
              <LinearGradient colors={['#10b981', '#059669']} start={{x:0, y:0}} end={{x:1, y:0}} style={{ width: `${Math.min(parseFloat(progressPercent), 100)}%`, height: '100%', borderRadius: 999 }} />
            </View>

            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, marginRight: 8 }}><AppStatCard label="Tunggakan" value={formatCurrency(Math.max(stats.totalTarget - stats.totalLunas, 0))} compact /></View>
              <View style={{ flex: 1, marginLeft: 8 }}><AppStatCard label="Lunas WP" value={`${stats.wpLunas} data`} compact /></View>
            </View>
          </Animated.View>
        </AppScreenHeader>

        <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
          <Animated.View entering={FadeInDown.delay(200)}>
            <AppSectionTitle title="Layanan Operasional" />
            {actionCards.map((c, idx) => (
              <Animated.View key={c.title} entering={FadeInDown.delay(300 + (idx * 100))}>
                <AppActionCard title={c.title} subtitle={c.subtitle} icon={c.icon} iconBg={c.bg} iconColor={c.color} onPress={c.onPress} style={{ marginBottom: 14 }} />
              </Animated.View>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600)} style={{ marginTop: 12 }}>
            <AppSectionTitle title="Aktivitas Terakhir" subtitle="Update transaksi real-time di lapangan" icon="time-outline" />
            <View style={{ backgroundColor: appTheme.colors.surface, borderRadius: 28, ...appTheme.shadow.card, overflow: 'hidden', borderWidth: 1, borderColor: appTheme.colors.borderLight }}>
              {dashboardData?.logs?.length > 0 ? dashboardData.logs.map((log: any, i: number) => {
                const isUnpaid = log.details?.includes('BELUM_LUNAS') || log.details?.includes('TIDAK_TERBIT');
                const date = new Date(log.createdAt);
                return (
                  <View key={log.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: i < dashboardData.logs.length - 1 ? 1 : 0, borderBottomColor: appTheme.colors.borderLight }}>
                    <View style={{ width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: isUnpaid ? appTheme.colors.dangerSoft : appTheme.colors.successSoft }}>
                      <Ionicons name={isUnpaid ? 'alert-circle' : 'checkmark-circle'} size={20} color={isUnpaid ? appTheme.colors.danger : appTheme.colors.success} />
                    </View>
                    <View style={{ marginLeft: 16, flex: 1 }}>
                      <Text style={{ color: appTheme.colors.text, ...appTheme.typo.bodyBold }} numberOfLines={2}>{log.details}</Text>
                      <Text style={{ color: appTheme.colors.textSoft, ...appTheme.typo.caption, marginTop: 4 }}>
                        {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                );
              }) : <AppEmptyState icon="time-outline" title="Belum ada aktivitas" />}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(800)} style={{ marginTop: 24 }}>
            <ScalableButton onPress={() => setLogoutModalVisible(true)}>
              <View style={{ backgroundColor: appTheme.colors.surface, borderRadius: 24, paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', ...appTheme.shadow.soft, borderWidth: 1, borderColor: appTheme.colors.borderLight }}>
                <Ionicons name="log-out-outline" size={20} color={appTheme.colors.danger} />
                <Text style={{ color: appTheme.colors.danger, ...appTheme.typo.bodyBold, marginLeft: 10 }}>Keluar Sesi</Text>
              </View>
            </ScalableButton>
          </Animated.View>
        </View>
      </ScrollView>

      <AppModalCard visible={logoutModalVisible} title="Keluar sesi?" message="Anda akan kembali ke layanan warga. Sesi aktif akan dihentikan." icon="log-out-outline" iconColor={appTheme.colors.danger} iconBg={appTheme.colors.dangerSoft} onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={{ marginTop: 24 }}>
          <ScalableButton onPress={handleLogout}>
            <View style={{ backgroundColor: appTheme.colors.danger, borderRadius: 20, paddingVertical: 17, alignItems: 'center', ...appTheme.shadow.floating }}>
              <Text style={{ color: 'white', ...appTheme.typo.bodyBold }}>Ya, Keluar</Text>
            </View>
          </ScalableButton>
          <ScalableButton onPress={() => setLogoutModalVisible(false)} style={{ marginTop: 12 }}>
            <View style={{ backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 20, paddingVertical: 17, alignItems: 'center' }}>
              <Text style={{ color: appTheme.colors.textMuted, ...appTheme.typo.bodyBold }}>Batal</Text>
            </View>
          </ScalableButton>
        </View>
      </AppModalCard>
      <StatusBar style="light" />
    </View>
  );
}
