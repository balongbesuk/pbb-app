import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

export default function GisMapScreen({ route, navigation }: any) {
  const { serverUrl } = route.params;
  const [loading, setLoading] = useState(true);

  // We point the webview to the Next.js map page.
  // Assuming the user has a public map or we append a mobile flag.
  // Let's assume the map can be accessed at /peta for this demo.
  const mapUrl = `${serverUrl}/peta`;

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
        <TouchableOpacity onPress={() => setLoading(true)} className="p-2 bg-blue-600 rounded-full w-10 h-10 items-center justify-center shadow-lg shadow-blue-500/50">
           <Text className="text-white font-bold text-sm">↻</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 rounded-t-3xl overflow-hidden bg-slate-800 relative">
        {Platform.OS === 'web' ? (
          <iframe 
            src={mapUrl} 
            style={{ width: '100%', height: '100%', border: 'none' }}
            onLoad={() => setLoading(false)}
          />
        ) : (
          <WebView
            source={{ uri: mapUrl }}
            style={{ flex: 1 }}
            onLoad={() => setLoading(false)}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        )}
        
        {loading && (
          <View className="absolute inset-0 bg-slate-800/80 items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-blue-400 font-black tracking-widest uppercase text-xs mt-4">Memuat Peta...</Text>
          </View>
        )}
      </View>
      
      <StatusBar style="light" />
    </View>
  );
}
