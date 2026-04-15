import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl, normalizeServerUrl } from '../utils/server';

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
      // Clean baseUrl
      const baseUrl = normalizeServerUrl(serverUrl);

      // Use the lightweight standalone map page - no auth needed, 
      // it just fetches public JSON data from the same server
      const url = joinServerUrl(baseUrl, '/mobile-map.html');
      console.log('Map URL:', url);
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
    <View className="flex-1 bg-slate-900">
      <View className="pt-14 pb-4 px-6 flex-row items-center bg-slate-900 z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 p-2 bg-slate-800 rounded-full w-10 h-10 items-center justify-center">
           <Text className="text-white font-bold text-sm">←</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-black text-white uppercase tracking-tighter">Peta GIS</Text>
          <Text className="text-slate-400 font-medium text-[10px] tracking-widest uppercase">Peta Persebaran PBB (Live)</Text>
        </View>
        <TouchableOpacity onPress={handleReload} className="p-2 bg-blue-600 rounded-full w-10 h-10 items-center justify-center shadow-lg shadow-blue-500/50">
           <Text className="text-white font-bold text-sm">↻</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 rounded-t-3xl overflow-hidden bg-slate-800 relative">
        {!mapUrl ? (
          <View className="flex-1 items-center justify-center p-10">
             <ActivityIndicator size="large" color="#3b82f6" />
             <Text className="text-blue-400 font-bold mt-4">Menyiapkan Koneksi...</Text>
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
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            originWhitelist={['*']}
            mixedContentMode="always"
            allowFileAccess={true}
            cacheEnabled={true}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
              setLoading(false);
            }}
          />
        )}

        {loading && (
          <View className="absolute inset-0 bg-slate-900 items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-blue-400 font-black tracking-widest uppercase text-[10px] mt-6">
               Memuat Peta...
            </Text>
          </View>
        )}
      </View>
      
      <StatusBar style="light" />
    </View>
  );
}
