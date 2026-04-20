import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableWithoutFeedback, ImageBackground, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl } from '../utils/server';
import { ScalableButton } from '../components/ScalableButton';
import { AppActionCard } from '../components/AppActionCard';
import { appTheme } from '../theme/app-theme';

export default function DashboardScreen({ route, navigation }: ScreenProps<'Dashboard'>) {
  const { villageName, serverUrl, stats = {}, villageLogo } = route.params || {};
  const [menuVisible, setMenuVisible] = useState(false);
  const totalSppt = stats.totalSppt || 0;
  const lunasSppt = stats.lunasSppt || 0;

  const getLogoSource = () => {
    if (villageLogo) return villageLogo.startsWith('http') ? { uri: villageLogo } : { uri: joinServerUrl(serverUrl, villageLogo) };
    return require('../../assets/icon.png');
  };

  const serviceCards = [
    { title: 'Cek Tagihan PBB', subtitle: 'Cari tagihan warga dan status pembayaran', icon: 'card-outline' as const, tone: appTheme.colors.primarySoft, iconColor: appTheme.colors.primary, onPress: () => navigation.navigate('PaymentCheck', { serverUrl }) },
    { title: 'Peta GIS Desa', subtitle: 'Lihat persebaran objek pajak secara visual', icon: 'map-outline' as const, tone: appTheme.colors.infoSoft, iconColor: appTheme.colors.info, onPress: () => navigation.navigate('GisMap', { serverUrl }) },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Immersive Header */}
        <Animated.View entering={FadeInUp.duration(600)}>
          <ImageBackground source={require('../../assets/village-bg.png')}
            style={{ paddingTop: 58, paddingBottom: 32, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden', ...appTheme.shadow.header }}>
            <LinearGradient colors={['rgba(15,23,42,0.65)', 'rgba(15,23,42,0.95)']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

            <View style={{ paddingHorizontal: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                    <Image source={getLogoSource()} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                  </View>
                  <View style={{ marginLeft: 16, flex: 1 }}>
                    <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>PBB Mobile</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600', marginTop: 2 }} numberOfLines={1}>Desa {villageName || 'Nama Desa'}</Text>
                  </View>
                </View>
                <ScalableButton onPress={() => setMenuVisible(true)}>
                  <BlurView intensity={30} tint="light" style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                    <Ionicons name="settings-outline" size={22} color="white" />
                  </BlurView>
                </ScalableButton>
              </View>

              {/* Glass Hero Card */}
              <BlurView intensity={50} tint="dark" style={{ borderRadius: 32, padding: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                <Text style={{ color: 'white', fontSize: 24, fontWeight: '900', lineHeight: 32, letterSpacing: -0.5 }}>Layanan PBB{'\n'}Untuk Warga Desa</Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500', marginTop: 4 }}>Cari data berdasarkan NOP atau nama wajib pajak</Text>

                <View style={{ flexDirection: 'row', marginTop: 24 }}>
                  <View style={{ flex: 1, marginRight: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', ...appTheme.typo.badge }}>TOTAL SPPT</Text>
                    <Text style={{ color: 'white', ...appTheme.typo.heading, marginTop: 4 }}>{totalSppt}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10, backgroundColor: 'rgba(16, 185, 129, 0.12)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                    <Text style={{ color: '#6ee7b7', ...appTheme.typo.badge }}>SUDAH LUNAS</Text>
                    <Text style={{ color: '#10b981', ...appTheme.typo.heading, marginTop: 4 }}>{lunasSppt}</Text>
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

                <ScalableButton onPress={() => { setMenuVisible(false); navigation.replace('Onboarding'); }}>
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
