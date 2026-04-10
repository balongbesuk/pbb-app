import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function OnboardingScreen({ navigation }: any) {
  const [serverUrl, setServerUrl] = useState('http://localhost:3000');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleConnect = async () => {
    let cleanUrl = serverUrl.trim();
    if(!cleanUrl) return;
    
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) cleanUrl = 'http://' + cleanUrl;
    if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
    
    setServerUrl(cleanUrl);
    setLoading(true);
    setErrorMsg('');
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`${cleanUrl}/api/mobile/connect`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data.success) {
        navigation.replace('Dashboard', { 
          serverUrl: cleanUrl, 
          stats: data.stats, 
          villageName: data.village.namaDesa 
        });
      } else {
        setErrorMsg(data.error || 'Terjadi kesalahan server');
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung. Pastikan URL server benar dan aktif (API belum tersedia).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-slate-900">
      <View className="flex-1 justify-center p-8">
        <View className="mb-12">
          <Text className="text-white text-4xl font-black mb-2 uppercase tracking-tighter">PBB Mobile</Text>
          <Text className="text-slate-400 text-base leading-relaxed">Masukkan Alamat Website Pemda atau Kode Desa Anda untuk terhubung ke dalam sistem PBB.</Text>
        </View>

        <View className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl">
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 ml-1">URL Server Pemda</Text>
          <TextInput
            className={`bg-slate-900/50 text-white px-5 py-4 rounded-2xl border mb-2 font-medium focus:bg-slate-900 ${errorMsg ? 'border-red-500' : 'border-slate-700 focus:border-blue-500'}`}
            placeholder="contoh: localhost:3000"
            placeholderTextColor="#475569"
            value={serverUrl}
            onChangeText={setServerUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {errorMsg ? <Text className="text-red-400 text-[10px] font-bold mb-4 ml-1">{errorMsg}</Text> : <View className="mb-6" />}

          <TouchableOpacity 
            className={`py-4 rounded-2xl flex-row justify-center items-center ${serverUrl ? 'bg-blue-600' : 'bg-slate-700'}`}
            disabled={!serverUrl || loading}
            onPress={handleConnect}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text className={`font-black uppercase tracking-widest text-[11px] ${serverUrl ? 'text-white' : 'text-slate-400'}`}>Hubungkan ke Sistem</Text>}
          </TouchableOpacity>
        </View>
        <StatusBar style="light" />
      </View>
    </KeyboardAvoidingView>
  );
}
