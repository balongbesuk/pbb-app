import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl } from '../utils/server';

import { ScalableButton } from '../components/ScalableButton';

export default function LoginScreen({ route, navigation }: ScreenProps<'Login'>) {
  const { serverUrl, villageName } = route.params || {};

  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!form.username || !form.password) {
      setErrorMsg('Username dan Password wajib diisi');
      return;
    }

    if (!serverUrl) {
      setErrorMsg('Koneksi server terputus. Silakan kembalil ke menu ganti server.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(joinServerUrl(serverUrl, '/api/mobile/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: form.username,
          password: form.password
        })
      });

      const data = await response.json();

      if (data.success) {
        // Save magicToken for WebView bridging
        if (data.magicToken) {
          await AsyncStorage.setItem('@admin_magic_token', data.magicToken);
        }

        // Simpan sesi user agar bisa login otomatis
        await AsyncStorage.setItem('@auth_user', JSON.stringify(data.user));

        // Arahkan ke Layar Admin
        navigation.navigate('AdminDashboard', { 
            serverUrl, 
            user: data.user, 
            isAdmin: true,
            stats: { totalSppt: 0, lunasSppt: 0 }, 
            villageName: data.user.dusun || 'Hak Akses Admin'
        });
      } else {
        setErrorMsg(data.error || 'Username atau password salah.');
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server untuk autentikasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-slate-50">
      <View className="flex-1 justify-center p-8">
        
        <ScalableButton 
          onPress={() => navigation.goBack()} 
          style={{ position: 'absolute', top: 64, left: 32, zIndex: 10 }}
        >
           <View className="bg-white p-3 rounded-full w-12 h-12 items-center justify-center border border-slate-100 shadow-sm">
             <Ionicons name="arrow-back" size={24} color="#64748b" />
           </View>
        </ScalableButton>

        <View className="mb-10 mt-12 px-2">
          <View className="w-16 h-16 bg-blue-600 rounded-[22px] items-center justify-center mb-6 shadow-xl shadow-blue-600/40">
             <Ionicons name="shield-checkmark" size={32} color="white" />
          </View>
          <Text className="text-slate-900 text-4xl font-black mb-2 tracking-tighter uppercase">PBB Mobile</Text>
          <Text className="text-slate-600 text-sm font-semibold leading-relaxed">
            Halaman login untuk Petugas / Penarik Lapangan
          </Text>
        </View>

        <View className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-200">
          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-[2px] mb-3 ml-1">Username / NIP</Text>
          <View className="relative mb-6">
            <View className="absolute left-4 top-4 z-10">
              <Ionicons name="person-outline" size={20} color="#94a3b8" />
            </View>
            <TextInput
              className="bg-slate-50 text-slate-900 px-12 py-4 rounded-2xl border border-slate-100 font-bold focus:border-blue-500 focus:bg-white"
              placeholder="Username petugas"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              value={form.username}
              onChangeText={(t) => setForm({ ...form, username: t })}
            />
          </View>

          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-[2px] mb-3 ml-1">Kata Sandi</Text>
          <View className="relative mb-4">
            <View className="absolute left-4 top-4 z-10">
              <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
            </View>
            <TextInput
              className="bg-slate-50 text-slate-900 px-12 py-4 rounded-2xl border border-slate-100 font-bold focus:border-blue-500 focus:bg-white"
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry={true}
              value={form.password}
              onChangeText={(t) => setForm({ ...form, password: t })}
            />
          </View>

          {errorMsg ? (
            <View className="bg-rose-50 p-3 rounded-xl mb-4 border border-rose-100 flex-row items-center">
              <Ionicons name="alert-circle" size={16} color="#e11d48" />
              <Text className="text-rose-600 text-[10px] font-bold ml-2">{errorMsg}</Text>
            </View>
          ) : null}

          <ScalableButton
            disabled={!form.username || !form.password || loading}
            onPress={handleLogin}
          >
            <View className={`py-5 mt-2 rounded-[22px] flex-row justify-center items-center shadow-xl ${form.username && form.password ? 'bg-blue-600 shadow-blue-600/30' : 'bg-slate-200'}`}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className={`font-black uppercase tracking-[2px] text-[11px] ${form.username && form.password ? 'text-white' : 'text-slate-400'}`}>Masuk ke Sistem</Text>
                  <Ionicons name="chevron-forward" size={16} color={form.username && form.password ? "white" : "#94a3b8"} style={{ marginLeft: 8 }} />
                </>
              )}
            </View>
          </ScalableButton>
        </View>

        <View className="items-center mt-12">
           <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-[3px]">PBB Mobile Desa {villageName || '...'}</Text>
        </View>

        <StatusBar style="dark" />
      </View>
    </KeyboardAvoidingView>
  );
}
