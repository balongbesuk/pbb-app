import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl, normalizeServerUrl } from '../utils/server';
import { ScalableButton } from '../components/ScalableButton';
import { AppScreenHeader } from '../components/AppScreenHeader';
import { appTheme } from '../theme/app-theme';
import { Ionicons } from '@expo/vector-icons';

export default function GisMapScreen({ route, navigation }: ScreenProps<'GisMap'>) {
  const { serverUrl } = route.params;
  const [loading, setLoading] = useState(true);
  const [mapUrl, setMapUrl] = useState('');
  const webViewRef = useRef<any>(null);

  useEffect(() => {
    prepareMapUrl();
  }, []);

  const prepareMapUrl = async () => {
    try {
      const baseUrl = normalizeServerUrl(serverUrl);
      const url = joinServerUrl(baseUrl, '/mobile-map.html');
      setMapUrl(url);
    } catch (e) {
      console.error('Failed to prepare map URL:', e);
    }
  };

  const handleReload = () => {
    setLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <AppScreenHeader
        title="Peta GIS"
        subtitle="Visualisasi wilayah"
        onBack={() => navigation.goBack()}
        rightAction={
          <ScalableButton onPress={handleReload}>
            <View style={{ width: 52, height: 52, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
              <Ionicons name="refresh-outline" size={22} color="white" />
            </View>
          </ScalableButton>
        }
        style={{ paddingBottom: 24 }}
      >
        <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 13, lineHeight: 19, marginTop: 6 }}>
          Lihat persebaran objek pajak dan status pembayaran langsung dari server desa.
        </Text>
        <View style={{ marginTop: 18, flexDirection: 'row' }}>
          <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)', marginRight: 10 }}>
            <Text style={{ color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }}>LIVE MAP</Text>
          </View>
          <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(238,138,91,0.18)' }}>
            <Text style={{ color: '#ffd9c8', fontSize: 10, fontWeight: '800' }}>Reload tanpa keluar layar</Text>
          </View>
        </View>
      </AppScreenHeader>

      <View style={{ flex: 1, margin: 16, marginTop: 16, borderRadius: 30, overflow: 'hidden', backgroundColor: appTheme.colors.surface, borderWidth: 1, borderColor: appTheme.colors.border, ...appTheme.shadow.card }}>
        {!mapUrl ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <ActivityIndicator size="large" color={appTheme.colors.primary} />
            <Text style={{ color: appTheme.colors.textMuted, fontSize: 13, fontWeight: '700', marginTop: 14 }}>Menyiapkan koneksi peta</Text>
          </View>
        ) : Platform.OS === 'web' ? (
          <iframe
            src={mapUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            onLoad={() => setLoading(false)}
          />
        ) : (
          <WebView
            ref={webViewRef}
            source={{ uri: mapUrl }}
            style={{ flex: 1 }}
            onLoad={() => setLoading(false)}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
            originWhitelist={['*']}
            mixedContentMode="always"
            allowFileAccess
            cacheEnabled
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
              setLoading(false);
            }}
          />
        )}

        {loading ? (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(246,239,230,0.9)', alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={appTheme.colors.primary} />
            <Text style={{ color: appTheme.colors.textMuted, fontSize: 13, fontWeight: '700', marginTop: 14 }}>Memuat peta</Text>
          </View>
        ) : null}
      </View>

      <StatusBar style="light" />
    </View>
  );
}
