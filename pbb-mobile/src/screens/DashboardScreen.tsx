import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableWithoutFeedback, ImageBackground, Platform, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl } from '../utils/server';
import { ScalableButton } from '../components/ScalableButton';
import { AppActionCard } from '../components/AppActionCard';
import { useServerHealth } from '../utils/hooks';
import { appTheme } from '../theme/app-theme';

export default function DashboardScreen({ route, navigation }: ScreenProps<'Dashboard'>) {
  const { villageName, serverUrl, stats = {}, villageLogo } = route.params || {};
  const [menuVisible, setMenuVisible] = useState(false);
  const [authType, setAuthType] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [personalStats, setPersonalStats] = useState({ total: 0, lunas: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [displayStats, setDisplayStats] = useState(stats);
  const [currentVillageName, setCurrentVillageName] = useState(villageName);
  const [currentVillageLogo, setCurrentVillageLogo] = useState(villageLogo);
  const { health, checkHealth } = useServerHealth(serverUrl);

  React.useEffect(() => {
    AsyncStorage.getItem('@auth_type').then(setAuthType);
    AsyncStorage.getItem('@auth_user').then((val) => setIsAdmin(!!val));
    loadPersonalStats();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // 1. Reload Personal Stats
      await loadPersonalStats();
      
      // 2. Reload Village Stats from Server
      if (serverUrl) {
        const response = await fetch(joinServerUrl(serverUrl, '/api/mobile/connect'));
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            if (data.stats) setDisplayStats(data.stats);
            if (data.village) {
              setCurrentVillageName(data.village.namaDesa);
              setCurrentVillageLogo(data.village.logoUrl);
            }
          }
        }
      }
      
      // 3. Update Auth & Admin Status
      const type = await AsyncStorage.getItem('@auth_type');
      const authUser = await AsyncStorage.getItem('@auth_user');
      setAuthType(type);
      setIsAdmin(!!authUser);

      // 4. Refresh Health
      await checkHealth();
    } catch (e) {
      console.error('Refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  }, [serverUrl, checkHealth]);

  const loadPersonalStats = async () => {
    try {
      const saved = await AsyncStorage.getItem('@pinned_nops_v2');
      if (saved) {
        const list = JSON.parse(saved);
        const total = list.length;
        const lunas = list.filter((item: any) => item.status === 'LUNAS').length;
        setPersonalStats({ total, lunas });
      }
    } catch (e) {}
  };

  const totalSppt = isAdmin ? (displayStats.totalSppt || 0) : personalStats.total;
  const lunasSppt = isAdmin ? (displayStats.lunasSppt || 0) : personalStats.lunas;

  const getLogoSource = () => {
    if (currentVillageLogo) {
      if (currentVillageLogo.startsWith('http')) return { uri: currentVillageLogo };
      if (serverUrl) return { uri: joinServerUrl(serverUrl, currentVillageLogo) };
    }
    return require('../../assets/icon.png');
  };

  const serviceCards = [
    { title: 'Cek Tagihan PBB', subtitle: 'Cari tagihan warga dan status pembayaran', icon: 'card-outline' as const, tone: appTheme.colors.primarySoft, iconColor: appTheme.colors.primary, onPress: () => navigation.navigate('PaymentCheck', { serverUrl }) },
    { title: 'Peta GIS Desa', subtitle: 'Lihat persebaran objek pajak secara visual', icon: 'map-outline' as const, tone: appTheme.colors.infoSoft, iconColor: appTheme.colors.info, onPress: () => navigation.navigate('GisMap', { serverUrl }) },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[appTheme.colors.primary]} 
            tintColor={appTheme.colors.primary}
          />
        }
      >
        {/* Immersive Header */}
        <Animated.View entering={FadeInUp.duration(600)}>
          <ImageBackground source={require('../../assets/village-bg.png')}
            style={{ paddingTop: 58, paddingBottom: 32, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden', ...appTheme.shadow.header }}>
            <LinearGradient colors={['rgba(15,23,42,0.65)', 'rgba(15,23,42,0.95)']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

            <View style={{ paddingHorizontal: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                    <Image 
                      key={`logo-${currentVillageLogo}-${health.server}`}
                      source={getLogoSource()} 
                      style={{ width: '100%', height: '100%' }} 
                      resizeMode="contain" 
                    />
                  </View>
                  <View style={{ marginLeft: 16, flex: 1 }}>
                    <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>PBB Mobile</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: health.server ? appTheme.colors.success : appTheme.colors.danger, marginRight: 6 }} />
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' }} numberOfLines={1}>Desa {currentVillageName || 'Nama Desa'}</Text>
                    </View>
                  </View>
                </View>
                <ScalableButton onPress={() => setMenuVisible(true)}>
                  <BlurView intensity={30} tint="light" style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                    <Ionicons name="settings-outline" size={22} color="white" />
                  </BlurView>
                </ScalableButton>
              </View>

              {/* Server/Data Source Status Banner */}
              {(!health.server || !health.bapenda) && (
                <Animated.View entering={FadeInUp} style={{ marginBottom: 16 }}>
                  <BlurView intensity={40} tint="dark" style={{ borderRadius: 20, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: health.server ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <View style={{ width: 32, height: 32, borderRadius: 12, backgroundColor: health.server ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name="cloud-offline" size={16} color={health.server ? '#f59e0b' : '#ef4444'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: 'white', fontSize: 12, fontWeight: '800' }}>
                        {!health.server ? 'Koneksi Server Terputus' : 'Sumber Data Bapenda Down'}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '500' }}>
                        {!health.server ? 'Pastikan koneksi internet Anda stabil atau server desa sedang aktif.' : 'Beberapa fitur sinkronisasi data pusat mungkin tidak tersedia.'}
                      </Text>
                    </View>
                  </BlurView>
                </Animated.View>
              )}

              {/* Glass Hero Card */}
              <BlurView intensity={50} tint="dark" style={{ borderRadius: 32, padding: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                <Text style={{ color: 'white', fontSize: 24, fontWeight: '900', lineHeight: 32, letterSpacing: -0.5 }}>Layanan PBB{'\n'}Untuk Warga Desa</Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500', marginTop: 4 }}>Cari data berdasarkan NOP atau nama wajib pajak</Text>

                {/* Stats Row - Shows personal stats for taxpayers, or village stats for admin */}
                <View style={{ flexDirection: 'row', marginTop: 24 }}>
                  <View style={{ flex: 1, marginRight: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', ...appTheme.typo.badge }}>{isAdmin ? 'TOTAL SPPT DESA' : 'NOP TERSIMPAN'}</Text>
                    <Text style={{ color: 'white', ...appTheme.typo.heading, marginTop: 4 }}>{totalSppt}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10, backgroundColor: lunasSppt > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: lunasSppt > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)' }}>
                    <Text style={{ color: lunasSppt > 0 ? '#6ee7b7' : 'rgba(255,255,255,0.5)', ...appTheme.typo.badge }}>SUDAH LUNAS</Text>
                    <Text style={{ color: lunasSppt > 0 ? '#10b981' : 'rgba(255,255,255,0.3)', ...appTheme.typo.heading, marginTop: 4 }}>{lunasSppt}</Text>
                  </View>
                </View>
              </BlurView>
            </View>
          </ImageBackground>
        </Animated.View>

        {/* Action Section */}
        <Animated.View entering={FadeInDown.delay(100)} style={{ paddingHorizontal: 24, marginTop: 32 }}>
          <Text style={{ color: appTheme.colors.text, ...appTheme.typo.title, marginBottom: 16 }}>Layanan Utama</Text>
          {serviceCards.map((card, idx) => (
            <Animated.View key={card.title} entering={FadeInDown.delay(200 + (idx * 100))}>
              <AppActionCard title={card.title} subtitle={card.subtitle} icon={card.icon} iconBg={card.tone} iconColor={card.iconColor} onPress={card.onPress} style={{ marginBottom: 14 }} />
            </Animated.View>
          ))}

          {/* Premium Officer CTA */}
          <Animated.View entering={FadeInDown.delay(400)} style={{ marginTop: 12, backgroundColor: appTheme.colors.surface, borderRadius: 28, padding: 24, ...appTheme.shadow.card, borderWidth: 1, borderColor: appTheme.colors.borderLight }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: appTheme.colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="shield-checkmark" size={22} color={appTheme.colors.primary} />
              </View>
              <Text style={{ color: appTheme.colors.text, ...appTheme.typo.title, marginLeft: 14 }}>Akses Petugas</Text>
            </View>
            <Text style={{ color: appTheme.colors.textMuted, ...appTheme.typo.body, marginBottom: 20 }}>Kelola penagihan, validasi pembayaran warga, dan pantau data lapangan secara real-time.</Text>
            <ScalableButton onPress={() => navigation.navigate('Login', { serverUrl, villageName })}>
              <LinearGradient colors={[appTheme.colors.accent, '#4338ca']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 20, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', ...appTheme.shadow.floating }}>
                <Text style={{ color: 'white', ...appTheme.typo.bodyBold, marginRight: 8 }}>Buka Panel Petugas</Text>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </LinearGradient>
            </ScalableButton>
          </Animated.View>
        </Animated.View>
      </ScrollView>

      {/* Modern Bottom Sheet */}
      {menuVisible && (
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: appTheme.colors.overlay, justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback>
              <Animated.View entering={FadeInDown} style={{ backgroundColor: appTheme.colors.surface, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 32, ...appTheme.shadow.floating, paddingBottom: Platform.OS === 'ios' ? 48 : 32 }}>
                <View style={{ width: 48, height: 5, backgroundColor: appTheme.colors.surfaceStrong, borderRadius: 3, alignSelf: 'center', marginBottom: 24 }} />
                <Text style={{ color: appTheme.colors.text, ...appTheme.typo.heading, marginBottom: 6 }}>Pengaturan</Text>
                <Text style={{ color: appTheme.colors.textMuted, ...appTheme.typo.body, marginBottom: 28 }}>Konfigurasi akses dan konektivitas server desa.</Text>

                <ScalableButton onPress={() => { setMenuVisible(false); navigation.navigate('Login', { serverUrl, villageName }); }} style={{ marginBottom: 12 }}>
                  <View style={{ backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: appTheme.colors.borderLight }}>
                    <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: appTheme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="person-circle-outline" size={24} color={appTheme.colors.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <Text style={{ color: appTheme.colors.text, ...appTheme.typo.bodyBold }}>Masuk sebagai petugas</Text>
                      <Text style={{ color: appTheme.colors.textSoft, ...appTheme.typo.caption, marginTop: 2 }}>Panel operasional khusus</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={appTheme.colors.textSoft} />
                  </View>
                </ScalableButton>

                <ScalableButton onPress={() => { setMenuVisible(false); navigation.replace('Onboarding'); }} style={{ marginBottom: 12 }}>
                  <View style={{ backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: appTheme.colors.borderLight }}>
                    <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: appTheme.colors.infoSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="swap-horizontal" size={24} color={appTheme.colors.info} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <Text style={{ color: appTheme.colors.text, ...appTheme.typo.bodyBold }}>Ganti koneksi desa</Text>
                      <Text style={{ color: appTheme.colors.textSoft, ...appTheme.typo.caption, marginTop: 2 }}>Sambungkan ke server pusat lain</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={appTheme.colors.textSoft} />
                  </View>
                </ScalableButton>


              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}
      <StatusBar style="light" />
    </View>
  );
}
