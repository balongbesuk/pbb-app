import React, { useState } from 'react';
import { View, Text, Image, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScreenProps } from '../types/navigation';
import { ScalableButton } from '../components/ScalableButton';
import { appTheme } from '../theme/app-theme';

export default function UserAuthScreen({ route, navigation }: ScreenProps<'UserAuth'>) {
  const { serverUrl, villageName, villageLogo } = route.params || {};
  const [loading, setLoading] = useState<string | null>(null);

  const handleModeSelection = async (mode: 'guest' | 'email') => {
    setLoading(mode);
    try {
      await AsyncStorage.setItem('@auth_type', mode);
      
      if (mode === 'email') {
        // Simulated email login delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        // In a real app, we would trigger Google/Email Auth here
      }

      navigation.replace('Dashboard', { 
        serverUrl, 
        villageName, 
        villageLogo,
        stats: {} 
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
        
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(600)} style={{ alignItems: 'center', marginBottom: 48 }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: appTheme.colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            {villageLogo ? (
              <Image source={{ uri: villageLogo }} style={{ width: 50, height: 50 }} resizeMode="contain" />
            ) : (
              <Ionicons name="person-circle" size={48} color={appTheme.colors.primary} />
            )}
          </View>
          <Text style={{ color: appTheme.colors.text, ...appTheme.typo.heading, textAlign: 'center' }}>Pilih Metode Akses</Text>
          <Text style={{ color: appTheme.colors.textMuted, ...appTheme.typo.body, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 }}>
            Tentukan bagaimana Anda ingin menyimpan data SPPT dan riwayat pencarian Anda.
          </Text>
        </Animated.View>

        {/* Options */}
        <View>
          {/* Email Option */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <ScalableButton onPress={() => handleModeSelection('email')} disabled={!!loading}>
              <View style={{ 
                backgroundColor: appTheme.colors.surface, 
                borderRadius: 28, 
                padding: 24, 
                borderWidth: 2, 
                borderColor: loading === 'email' ? appTheme.colors.primary : appTheme.colors.borderLight,
                ...appTheme.shadow.card,
                marginBottom: 20
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: appTheme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="mail-outline" size={22} color={appTheme.colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={{ color: appTheme.colors.text, ...appTheme.typo.title }}>Masuk dengan Email</Text>
                    <Text style={{ color: appTheme.colors.success, ...appTheme.typo.badge, marginTop: 2 }}>DIREKOMENDASIKAN</Text>
                  </View>
                </View>
                <Text style={{ color: appTheme.colors.textMuted, ...appTheme.typo.body, fontSize: 13, lineHeight: 18 }}>
                  Data Anda akan disinkronkan ke cloud. Anda dapat mengakses data SPPT yang tersimpan dari perangkat mana saja.
                </Text>
                
                <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                  {loading === 'email' ? (
                    <ActivityIndicator color={appTheme.colors.primary} />
                  ) : (
                    <>
                      <Text style={{ color: appTheme.colors.primary, ...appTheme.typo.bodyBold, marginRight: 8 }}>Pilih & Lanjut</Text>
                      <Ionicons name="arrow-forward" size={18} color={appTheme.colors.primary} />
                    </>
                  )}
                </View>
              </View>
            </ScalableButton>
          </Animated.View>

          {/* Guest Option */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <ScalableButton onPress={() => handleModeSelection('guest')} disabled={!!loading}>
              <View style={{ 
                backgroundColor: appTheme.colors.surfaceMuted, 
                borderRadius: 28, 
                padding: 24, 
                borderWidth: 1, 
                borderColor: appTheme.colors.borderLight,
                marginBottom: 40
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="phone-portrait-outline" size={22} color={appTheme.colors.textSoft} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={{ color: appTheme.colors.text, ...appTheme.typo.title }}>Gunakan Mode Tamu</Text>
                  </View>
                </View>
                <Text style={{ color: appTheme.colors.textMuted, ...appTheme.typo.body, fontSize: 13, lineHeight: 18 }}>
                  Data hanya disimpan di memori HP ini. Data akan hilang jika aplikasi dihapus atau Anda berganti perangkat.
                </Text>
                
                <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                  {loading === 'guest' ? (
                    <ActivityIndicator color={appTheme.colors.textSoft} />
                  ) : (
                    <>
                      <Text style={{ color: appTheme.colors.textSoft, ...appTheme.typo.bodyBold, marginRight: 8 }}>Gunakan Lokal</Text>
                      <Ionicons name="chevron-forward" size={18} color={appTheme.colors.textSoft} />
                    </>
                  )}
                </View>
              </View>
            </ScalableButton>
          </Animated.View>
        </View>

        <Text style={{ color: appTheme.colors.textSoft, ...appTheme.typo.caption, textAlign: 'center' }}>
          Anda dapat mengubah pilihan ini kapan saja melalui menu Pengaturan.
        </Text>
      </ScrollView>
      <StatusBar style="dark" />
    </View>
  );
}
