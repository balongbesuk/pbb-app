import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import type { ScreenProps } from '../types/navigation';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { joinServerUrl, normalizeServerUrl } from '../utils/server';
import { ScalableButton } from '../components/ScalableButton';
import { AppScreenHeader } from '../components/AppScreenHeader';
import { appTheme } from '../theme/app-theme';
import { Ionicons } from '@expo/vector-icons';
import { useServerHealth } from '../utils/hooks';

export default function GisMapScreen({ route, navigation }: ScreenProps<'GisMap'>) {
  const { serverUrl } = route.params;
  const [loading, setLoading] = useState(true);
  const [mapUrl, setMapUrl] = useState('');
  const webViewRef = useRef<any>(null);
  
  const { health } = useServerHealth(serverUrl);

  useEffect(() => { const base = normalizeServerUrl(serverUrl); setMapUrl(joinServerUrl(base, '/mobile-map.html')); }, []);

  return (
    <View style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <AppScreenHeader title="Peta GIS" subtitle="VISUALISASI WILAYAH" onBack={() => navigation.goBack()} centerTitle={true}
        rightAction={
          <ScalableButton onPress={() => { setLoading(true); webViewRef.current?.reload(); }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
              <Ionicons name="refresh" size={20} color="white" />
            </View>
          </ScalableButton>
        }
        style={{ paddingBottom: 32 }}>
        <Animated.View entering={FadeInUp.delay(100)} style={{ alignItems: 'center', marginTop: 12 }}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>Persebaran objek pajak dan status pembayaran</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: health.server ? appTheme.colors.success : appTheme.colors.danger, marginRight: 6 }} />
            <Text style={{ color: 'white', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
              Status Server: {health.server ? 'Online' : 'Offline'}
            </Text>
          </View>
        </Animated.View>
      </AppScreenHeader>

      <Animated.View entering={FadeInDown.delay(200)} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: appTheme.colors.surface }}>
          {!mapUrl ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={appTheme.colors.primary} />
              <Text style={{ color: appTheme.colors.textSoft, fontSize: 14, fontWeight: '700', marginTop: 16, letterSpacing: 0.5 }}>MENYIAPKAN PETA...</Text>
            </View>
          ) : Platform.OS === 'web' ? (
            <iframe src={mapUrl} style={{ width: '100%', height: '100%', border: 'none' }} onLoad={() => setLoading(false)} />
          ) : (
            <WebView ref={webViewRef} source={{ uri: mapUrl }} style={{ flex: 1 }} onLoad={() => setLoading(false)} javaScriptEnabled domStorageEnabled startInLoadingState={false} originWhitelist={['*']} mixedContentMode="always" allowFileAccess cacheEnabled onError={() => setLoading(false)} />
          )}
          
          {loading && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={appTheme.colors.primary} />
              <Text style={{ color: appTheme.colors.primary, fontSize: 14, fontWeight: '800', marginTop: 16, letterSpacing: 1 }}>MEMUAT DATA PETA</Text>
            </View>
          )}
        </View>
      </Animated.View>
      <StatusBar style="light" />
    </View>
  );
}
