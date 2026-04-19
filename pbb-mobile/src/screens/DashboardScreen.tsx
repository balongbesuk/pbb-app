import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableWithoutFeedback } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
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
    if (villageLogo) {
      if (villageLogo.startsWith('http')) {
        return { uri: villageLogo };
      }
      return { uri: joinServerUrl(serverUrl, villageLogo) };
    }
    return require('../../assets/icon.png');
  };

  const serviceCards = [
    {
      title: 'Cek Tagihan PBB',
      subtitle: 'Cari tagihan warga dan status pembayaran',
      icon: 'card-outline' as const,
      tone: appTheme.colors.primarySoft,
      iconColor: appTheme.colors.primary,
      onPress: () => navigation.navigate('PaymentCheck', { serverUrl }),
    },
    {
      title: 'Peta GIS Desa',
      subtitle: 'Lihat persebaran objek pajak secara visual',
      icon: 'map-outline' as const,
      tone: appTheme.colors.infoSoft,
      iconColor: appTheme.colors.info,
      onPress: () => navigation.navigate('GisMap', { serverUrl }),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 58,
            paddingBottom: 32,
            backgroundColor: appTheme.colors.primaryDark,
            borderBottomLeftRadius: 36,
            borderBottomRightRadius: 36,
            overflow: 'hidden',
          }}
        >
          <View style={{ position: 'absolute', top: -40, right: -28, width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <View style={{ position: 'absolute', top: 110, right: 80, width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(238,138,91,0.22)' }} />
          <View style={{ position: 'absolute', bottom: -34, left: -18, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.05)' }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 10,
                }}
              >
                <Image source={getLogoSource()} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              </View>
              <View style={{ marginLeft: 14, flex: 1 }}>
                <Text style={{ color: 'rgba(255,244,232,0.76)', fontSize: 11, fontWeight: '800', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>
                  Portal Layanan PBB
                </Text>
                <Text style={{ color: 'white', fontSize: 28, fontWeight: '900' }} numberOfLines={1}>
                  {villageName || 'Desa Aktif'}
                </Text>
              </View>
            </View>

            <ScalableButton onPress={() => setMenuVisible(true)}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
              >
                <Ionicons name="settings-outline" size={22} color="white" />
              </View>
            </ScalableButton>
          </View>

          <View
            style={{
              marginTop: 22,
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderRadius: appTheme.radius.lg,
              padding: 22,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <View style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', marginBottom: 14 }}>
              <Text style={{ color: 'white', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 }}>SMART VILLAGE SERVICE</Text>
            </View>
            <Text style={{ color: 'white', fontSize: 30, fontWeight: '900', lineHeight: 38 }}>
              Layanan pajak desa yang cepat, jelas, dan terasa modern.
            </Text>
            <Text style={{ color: 'rgba(255,248,240,0.8)', fontSize: 14, lineHeight: 21, marginTop: 10 }}>
              Cek tagihan, lihat status pembayaran, dan buka peta wilayah dari satu alur yang rapi.
            </Text>

            <View style={{ flexDirection: 'row', marginTop: 18 }}>
              <View
                style={{
                  flex: 1,
                  marginRight: 8,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  borderRadius: 20,
                  padding: 14,
                }}
              >
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700' }}>Total SPPT</Text>
                <Text style={{ color: 'white', fontSize: 22, fontWeight: '900', marginTop: 4 }}>{totalSppt}</Text>
              </View>
              <View
                style={{
                  flex: 1,
                  marginLeft: 8,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  borderRadius: 20,
                  padding: 14,
                }}
              >
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700' }}>Sudah Lunas</Text>
                <Text style={{ color: 'white', fontSize: 22, fontWeight: '900', marginTop: 4 }}>{lunasSppt}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <Text style={{ color: appTheme.colors.textMuted, fontSize: 13, fontWeight: '800', marginBottom: 14 }}>
            Layanan utama
          </Text>

          {serviceCards.map((card) => (
            <AppActionCard
              key={card.title}
              title={card.title}
              subtitle={card.subtitle}
              icon={card.icon}
              iconBg={card.tone}
              iconColor={card.iconColor}
              onPress={card.onPress}
              style={{ marginBottom: 14 }}
            />
          ))}

          <View
            style={{
              marginTop: 12,
              backgroundColor: appTheme.colors.accentSoft,
              borderRadius: appTheme.radius.lg,
              padding: 18,
              borderWidth: 1,
              borderColor: '#f1cdb8',
              overflow: 'hidden',
            }}
          >
            <View style={{ position: 'absolute', top: -20, right: -8, width: 92, height: 92, borderRadius: 46, backgroundColor: 'rgba(255,255,255,0.38)' }} />
            <Text style={{ color: appTheme.colors.text, fontSize: 16, fontWeight: '900', marginBottom: 6 }}>
              Butuh akses petugas?
            </Text>
            <Text style={{ color: appTheme.colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 14 }}>
              Masuk ke panel petugas untuk mengelola penagihan, status pembayaran, dan pembagian data lapangan.
            </Text>
            <ScalableButton onPress={() => navigation.navigate('Login', { serverUrl, villageName })}>
              <View
                style={{
                  backgroundColor: appTheme.colors.primary,
                  borderRadius: 18,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                }}
              >
                <Ionicons name="shield-checkmark-outline" size={18} color="white" />
                <Text style={{ color: 'white', fontSize: 13, fontWeight: '900', marginLeft: 8 }}>
                  Buka Panel Petugas
                </Text>
              </View>
            </ScalableButton>
          </View>
        </View>
      </ScrollView>

      {menuVisible && (
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: appTheme.colors.overlay,
              justifyContent: 'flex-end',
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: appTheme.colors.surface,
                  borderTopLeftRadius: 30,
                  borderTopRightRadius: 30,
                  padding: 24,
                  borderWidth: 1,
                  borderColor: appTheme.colors.border,
                }}
              >
                <Text style={{ color: appTheme.colors.text, fontSize: 20, fontWeight: '900', marginBottom: 6 }}>
                  Pengaturan
                </Text>
                <Text style={{ color: appTheme.colors.textMuted, fontSize: 13, lineHeight: 18, marginBottom: 18 }}>
                  Atur koneksi aplikasi atau masuk ke panel petugas.
                </Text>

                <ScalableButton
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate('Login', { serverUrl, villageName });
                  }}
                  style={{ marginBottom: 12 }}
                >
                  <View
                    style={{
                      backgroundColor: appTheme.colors.surfaceMuted,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: appTheme.colors.border,
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: appTheme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="shield-checkmark-outline" size={20} color={appTheme.colors.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: appTheme.colors.text, fontSize: 15, fontWeight: '800' }}>Masuk sebagai petugas</Text>
                      <Text style={{ color: appTheme.colors.textMuted, fontSize: 12, marginTop: 2 }}>Buka panel operasional lapangan</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={appTheme.colors.textSoft} />
                  </View>
                </ScalableButton>

                <ScalableButton
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.replace('Onboarding');
                  }}
                >
                  <View
                    style={{
                      backgroundColor: appTheme.colors.surfaceMuted,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: appTheme.colors.border,
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: appTheme.colors.infoSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="link-outline" size={20} color={appTheme.colors.info} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: appTheme.colors.text, fontSize: 15, fontWeight: '800' }}>Ganti koneksi server</Text>
                      <Text style={{ color: appTheme.colors.textMuted, fontSize: 12, marginTop: 2 }}>Pilih atau sambungkan ke desa lain</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={appTheme.colors.textSoft} />
                  </View>
                </ScalableButton>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      <StatusBar style="light" />
    </View>
  );
}
