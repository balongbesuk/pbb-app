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
      // Run storage operations in parallel for better performance
      await Promise.all([
        AsyncStorage.setItem('@auth_type', mode),
        serverUrl ? AsyncStorage.setItem('serverUrl', serverUrl) : Promise.resolve(),
        villageName ? AsyncStorage.setItem('villageName', villageName) : Promise.resolve(),
        villageLogo ? AsyncStorage.setItem('villageLogo', villageLogo) : Promise.resolve(),
      ]);
      
      // Navigate immediately to Dashboard
      navigation.replace('Dashboard', { 
        serverUrl, 
        villageName, 
        villageLogo, 
        stats: {} 
      });
    } catch (e) {
      console.error('Failed to save session:', e);
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
          <Text style={{ color: appTheme.colors.text, ...appTheme.typo.heading, textAlign: 'center' }}>Konfirmasi Akses</Text>
          <Text style={{ color: appTheme.colors.textMuted, ...appTheme.typo.body, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 }}>
            Silakan klik tombol di bawah untuk mulai mengakses layanan PBB Desa {villageName || ''}.
          </Text>
        </Animated.View>

        {/* Options */}
        <View>
          <Animated.View entering={FadeInDown.duration(600)}>
            <ScalableButton onPress={() => handleModeSelection('guest')} disabled={!!loading}>
              <LinearGradient 
                colors={[appTheme.colors.primary, appTheme.colors.primaryDark]} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 0 }}
                style={{ 
                  borderRadius: 24, 
                  paddingVertical: 20, 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'row',
                  ...appTheme.shadow.floating,
                  marginBottom: 32
                }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={{ color: 'white', ...appTheme.typo.bodyBold, fontSize: 16, marginRight: 8 }}>Masuk ke Dashboard</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </>
                )}
              </LinearGradient>
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
