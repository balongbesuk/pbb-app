import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl } from '../utils/server';

export default function LoginScreen({ route, navigation }: ScreenProps<'Login'>) {
  const { serverUrl } = route.params || {};

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

        // Simulasi Arahkan ke Layar Admin
        navigation.navigate('AdminDashboard', { 
            serverUrl, 
            user: data.user, 
            isAdmin: true,
            // dummy stats for admin dashboard view
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-slate-900">
      <View className="flex-1 justify-center p-8">
        
        <TouchableOpacity onPress={() => navigation.goBack()} className="absolute top-16 left-8 bg-slate-800 p-3 rounded-full z-10 w-12 h-12 items-center justify-center">
           <Text className="text-slate-400 font-bold text-lg">←</Text>
        </TouchableOpacity>

        <View className="mb-12 mt-12">
          <View className="w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center mb-6 shadow-lg shadow-blue-500/50">
             <Text className="text-white text-3xl">🛡️</Text>
          </View>
          <Text className="text-white text-4xl font-black mb-2 uppercase tracking-tighter">Login Petugas</Text>
          <Text className="text-slate-400 text-base leading-relaxed">
            Masukkan kredensial Anda yang terdaftar pada sistem utama Pemda.
          </Text>
        </View>

        <View className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl">
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 ml-1">Username / NIP</Text>
          <TextInput
            className="bg-slate-900/50 text-white px-5 py-4 rounded-2xl border border-slate-700 mb-6 font-medium focus:border-blue-500 focus:bg-slate-900"
            placeholder="Ketik username Anda"
            placeholderTextColor="#475569"
            autoCapitalize="none"
            value={form.username}
            onChangeText={(t) => setForm({ ...form, username: t })}
          />

          <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 ml-1">Kata Sandi</Text>
          <TextInput
            className="bg-slate-900/50 text-white px-5 py-4 rounded-2xl border border-slate-700 mb-4 font-medium focus:border-blue-500 focus:bg-slate-900"
            placeholder="••••••••"
            placeholderTextColor="#475569"
            secureTextEntry={true}
            value={form.password}
            onChangeText={(t) => setForm({ ...form, password: t })}
          />

          {errorMsg ? <Text className="text-red-400 text-[10px] font-bold mb-4 ml-1">{errorMsg}</Text> : null}

          <TouchableOpacity 
            className={`py-4 mt-2 rounded-2xl flex-row justify-center items-center shadow-lg ${form.username && form.password ? 'bg-blue-600 shadow-blue-500/30' : 'bg-slate-700'}`}
            disabled={!form.username || !form.password || loading}
            onPress={handleLogin}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text className={`font-black uppercase tracking-widest text-[11px] ${form.username && form.password ? 'text-white' : 'text-slate-400'}`}>Masuk ke Sistem</Text>}
          </TouchableOpacity>
        </View>
        <StatusBar style="light" />
      </View>
    </KeyboardAvoidingView>
  );
}
