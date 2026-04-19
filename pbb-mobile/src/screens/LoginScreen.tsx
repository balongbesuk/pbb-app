import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl } from '../utils/server';
import { ScalableButton } from '../components/ScalableButton';
import { appTheme } from '../theme/app-theme';

export default function LoginScreen({ route, navigation }: ScreenProps<'Login'>) {
  const { serverUrl, villageName } = route.params || {};

  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!form.username || !form.password) {
      setErrorMsg('Username dan password wajib diisi.');
      return;
    }

    if (!serverUrl) {
      setErrorMsg('Koneksi server terputus. Silakan kembali ke pengaturan koneksi.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(joinServerUrl(serverUrl, '/api/mobile/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.magicToken) {
          await AsyncStorage.setItem('@admin_magic_token', data.magicToken);
        }

        await AsyncStorage.setItem('@auth_user', JSON.stringify(data.user));

        navigation.navigate('AdminDashboard', {
          serverUrl,
          user: data.user,
          isAdmin: true,
          stats: { totalSppt: 0, lunasSppt: 0 },
          villageName: data.user.dusun || villageName || 'Panel Petugas',
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

  const canSubmit = Boolean(form.username && form.password && !loading);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: appTheme.colors.bg }}
    >
      <View style={{ position: 'absolute', top: -40, right: -30, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(238,138,91,0.18)' }} />
      <View style={{ position: 'absolute', bottom: 90, left: -40, width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(63,103,214,0.10)' }} />
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <ScalableButton onPress={() => navigation.goBack()} style={{ position: 'absolute', top: 64, left: 24, zIndex: 10 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: appTheme.colors.surface,
              borderWidth: 1,
              borderColor: appTheme.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              ...appTheme.shadow.card,
            }}
          >
            <Ionicons name="arrow-back" size={22} color={appTheme.colors.text} />
          </View>
        </ScalableButton>

        <View
          style={{
            backgroundColor: appTheme.colors.primaryDark,
            borderRadius: appTheme.radius.xl,
            padding: 28,
            marginBottom: 20,
            ...appTheme.shadow.floating,
            overflow: 'hidden',
          }}
        >
          <View style={{ position: 'absolute', top: -30, right: -16, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <View style={{ position: 'absolute', bottom: -24, left: -10, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(238,138,91,0.2)' }} />
          <View
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
              marginBottom: 16,
            }}
          >
            <Text style={{ color: 'white', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 }}>AKSES PETUGAS</Text>
          </View>
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.14)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 18,
            }}
          >
            <Ionicons name="shield-checkmark" size={28} color="white" />
          </View>
          <Text style={{ color: 'white', fontSize: 31, fontWeight: '900', marginBottom: 8, lineHeight: 36 }}>
            Panel Petugas
          </Text>
          <Text style={{ color: 'rgba(255,248,240,0.82)', fontSize: 14, lineHeight: 22 }}>
            Masuk untuk mengelola penagihan, status pembayaran, dan distribusi data lapangan.
          </Text>

          <View
            style={{
              marginTop: 18,
              alignSelf: 'flex-start',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
            }}
          >
            <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>
              {villageName || 'Desa aktif'} • {serverUrl?.replace(/^https?:\/\//, '') || 'server belum dipilih'}
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: appTheme.colors.surface,
            borderRadius: appTheme.radius.xl,
            padding: 24,
            borderWidth: 1,
            borderColor: appTheme.colors.border,
            ...appTheme.shadow.card,
          }}
        >
          <Text style={{ color: appTheme.colors.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
            Username / NIP
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: appTheme.colors.surfaceMuted,
              borderRadius: appTheme.radius.md,
              borderWidth: 1,
              borderColor: appTheme.colors.border,
              paddingHorizontal: 16,
              marginBottom: 16,
            }}
          >
            <Ionicons name="person-outline" size={18} color={appTheme.colors.textSoft} />
            <TextInput
              style={{ flex: 1, paddingVertical: 16, paddingLeft: 12, color: appTheme.colors.text, fontSize: 15, fontWeight: '700' }}
              placeholder="Masukkan username petugas"
              placeholderTextColor={appTheme.colors.textSoft}
              autoCapitalize="none"
              value={form.username}
              onChangeText={(t) => setForm({ ...form, username: t })}
            />
          </View>

          <Text style={{ color: appTheme.colors.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
            Kata sandi
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: appTheme.colors.surfaceMuted,
              borderRadius: appTheme.radius.md,
              borderWidth: 1,
              borderColor: appTheme.colors.border,
              paddingHorizontal: 16,
            }}
          >
            <Ionicons name="lock-closed-outline" size={18} color={appTheme.colors.textSoft} />
            <TextInput
              style={{ flex: 1, paddingVertical: 16, paddingLeft: 12, color: appTheme.colors.text, fontSize: 15, fontWeight: '700' }}
              placeholder="Masukkan kata sandi"
              placeholderTextColor={appTheme.colors.textSoft}
              secureTextEntry={!showPassword}
              value={form.password}
              onChangeText={(t) => setForm({ ...form, password: t })}
            />
            <ScalableButton onPress={() => setShowPassword((prev) => !prev)}>
              <View style={{ padding: 6 }}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={appTheme.colors.textMuted}
                />
              </View>
            </ScalableButton>
          </View>

          {errorMsg ? (
            <View
              style={{
                marginTop: 14,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: appTheme.colors.dangerSoft,
                borderRadius: appTheme.radius.md,
                borderWidth: 1,
                borderColor: '#f0caca',
                padding: 12,
              }}
            >
              <Ionicons name="alert-circle" size={16} color={appTheme.colors.danger} />
              <Text style={{ color: appTheme.colors.danger, fontSize: 12, fontWeight: '700', marginLeft: 8, flex: 1 }}>
                {errorMsg}
              </Text>
            </View>
          ) : null}

          <ScalableButton disabled={!canSubmit} onPress={handleLogin} style={{ marginTop: 18 }}>
            <View
              style={{
                backgroundColor: canSubmit ? appTheme.colors.primary : appTheme.colors.surfaceStrong,
                borderRadius: appTheme.radius.md,
                paddingVertical: 18,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              shadowColor: appTheme.colors.primaryDark,
              shadowOffset: { width: 0, height: 14 },
              shadowOpacity: 0.18,
              shadowRadius: 22,
              elevation: 10,
            }}
          >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={{ color: canSubmit ? 'white' : appTheme.colors.textSoft, fontSize: 13, fontWeight: '900' }}>
                    Masuk ke Panel
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={canSubmit ? 'white' : appTheme.colors.textSoft}
                    style={{ marginLeft: 8 }}
                  />
                </>
              )}
            </View>
          </ScalableButton>
        </View>
      </View>
      <StatusBar style="dark" />
    </KeyboardAvoidingView>
  );
}
