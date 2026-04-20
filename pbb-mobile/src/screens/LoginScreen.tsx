import React, { useState } from 'react';
import { View, Text, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
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
    if (!form.username || !form.password) { setErrorMsg('Username dan password wajib diisi.'); return; }
    if (!serverUrl) { setErrorMsg('Koneksi server terputus.'); return; }
    setLoading(true); setErrorMsg('');
    try {
      const response = await fetch(joinServerUrl(serverUrl, '/api/mobile/auth/login'), { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(form) 
      });
      const data = await response.json();
      if (data.success) {
        if (data.magicToken) await AsyncStorage.setItem('@admin_magic_token', data.magicToken);
        await AsyncStorage.setItem('@auth_user', JSON.stringify(data.user));
        navigation.navigate('AdminDashboard', { 
          serverUrl, 
          user: data.user, 
          isAdmin: true, 
          stats: { totalSppt: 0, lunasSppt: 0 }, 
          villageName: data.user.dusun || villageName || 'Panel Petugas' 
        });
      } else { 
        setErrorMsg(data.error || 'Username atau password salah.'); 
      }
    } catch (err) { 
      setErrorMsg('Gagal terhubung ke server. Pastikan jaringan stabil.'); 
    } finally { 
      setLoading(false); 
    }
  };

  const canSubmit = Boolean(form.username && form.password && !loading);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
        
        <ScalableButton onPress={() => navigation.goBack()} style={{ position: 'absolute', top: 60, left: 24, zIndex: 100 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center', ...appTheme.shadow.soft, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
            <Ionicons name="arrow-back" size={22} color={appTheme.colors.text} />
          </View>
        </ScalableButton>

        {/* Premium Hero */}
        <Animated.View entering={FadeInUp.duration(600)}>
          <View style={{ borderRadius: 36, overflow: 'hidden', ...appTheme.shadow.header, marginBottom: -30 }}>
            <LinearGradient colors={[appTheme.colors.headerStart, appTheme.colors.headerEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 32, paddingBottom: 60 }}>
              <View style={{ position: 'absolute', top: -30, right: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.06)' }} />
              <View style={{ position: 'absolute', bottom: 40, left: -40, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.03)' }} />
              
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <View style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', ...appTheme.typo.badge, letterSpacing: 1.5 }}>AKSES OPERASIONAL</Text>
                </View>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 64, height: 64, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                  <Ionicons name="shield-checkmark" size={32} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', ...appTheme.typo.heading, fontSize: 28, letterSpacing: -0.5 }}>Panel Petugas</Text>
                  <View style={{ height: 3, width: 30, backgroundColor: appTheme.colors.primary, marginTop: 4, borderRadius: 2 }} />
                </View>
              </View>
              
              <Text style={{ color: 'rgba(255,255,255,0.7)', ...appTheme.typo.body, marginTop: 20, lineHeight: 22 }}>
                Masuk untuk mengelola penagihan, validasi pembayaran, dan distribusi data lapangan.
              </Text>
              
              <View style={{ marginTop: 24, alignSelf: 'flex-start', overflow: 'hidden', borderRadius: 16 }}>
                <BlurView intensity={20} tint="light" style={{ paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', ...appTheme.typo.caption, fontWeight: '700' }}>
                    {villageName || 'Desa'} • {serverUrl?.replace(/^https?:\/\//, '') || ''}
                  </Text>
                </BlurView>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Modern Form */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <View style={{ backgroundColor: appTheme.colors.surface, borderRadius: 32, padding: 28, ...appTheme.shadow.card, borderWidth: 1, borderColor: appTheme.colors.borderLight }}>
            <Text style={{ color: appTheme.colors.text, ...appTheme.typo.bodyBold, marginBottom: 10 }}>Username</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 20, paddingHorizontal: 18, marginBottom: 20, borderWidth: 1, borderColor: appTheme.colors.borderLight }}>
              <Ionicons name="person-outline" size={18} color={appTheme.colors.textSoft} />
              <TextInput 
                style={{ flex: 1, paddingVertical: 18, paddingLeft: 14, color: appTheme.colors.text, ...appTheme.typo.bodyBold }} 
                placeholder="Masukkan username" 
                placeholderTextColor={appTheme.colors.textSoft} 
                autoCapitalize="none" 
                value={form.username} 
                onChangeText={(t) => setForm({ ...form, username: t })} 
              />
            </View>

            <Text style={{ color: appTheme.colors.text, ...appTheme.typo.bodyBold, marginBottom: 10 }}>Kata Sandi</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: appTheme.colors.surfaceMuted, borderRadius: 20, paddingHorizontal: 18, borderWidth: 1, borderColor: appTheme.colors.borderLight }}>
              <Ionicons name="lock-closed-outline" size={18} color={appTheme.colors.textSoft} />
              <TextInput 
                style={{ flex: 1, paddingVertical: 18, paddingLeft: 14, color: appTheme.colors.text, ...appTheme.typo.bodyBold }} 
                placeholder="Masukkan kata sandi" 
                placeholderTextColor={appTheme.colors.textSoft} 
                secureTextEntry={!showPassword} 
                value={form.password} 
                onChangeText={(t) => setForm({ ...form, password: t })} 
              />
              <ScalableButton onPress={() => setShowPassword((p) => !p)}>
                <View style={{ padding: 8 }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={appTheme.colors.textMuted} />
                </View>
              </ScalableButton>
            </View>

            {errorMsg ? (
              <Animated.View entering={FadeInDown} style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: appTheme.colors.dangerSoft, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                <Ionicons name="alert-circle" size={18} color={appTheme.colors.danger} />
                <Text style={{ color: appTheme.colors.danger, ...appTheme.typo.caption, marginLeft: 10, flex: 1 }}>{errorMsg}</Text>
              </Animated.View>
            ) : null}

            <ScalableButton disabled={!canSubmit} onPress={handleLogin} style={{ marginTop: 28 }}>
              <View 
                style={{ 
                  borderRadius: 22, 
                  overflow: 'hidden',
                  ...(canSubmit ? appTheme.shadow.floating : {})
                }}
              >
                <LinearGradient 
                  colors={canSubmit ? [appTheme.colors.primary, appTheme.colors.primaryDark] : ['#e2e8f0', '#cbd5e1']}
                  start={{x:0, y:0}} end={{x:1, y:0}}
                  style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                  {loading ? <ActivityIndicator color="white" /> : (
                    <>
                      <Text style={{ color: canSubmit ? 'white' : '#94a3b8', ...appTheme.typo.bodyBold, fontSize: 16, letterSpacing: 1 }}>MASUK SEKARANG</Text>
                      <Ionicons name="arrow-forward" size={20} color={canSubmit ? 'white' : '#94a3b8'} style={{ marginLeft: 12 }} />
                    </>
                  )}
                </LinearGradient>
              </View>
            </ScalableButton>
          </View>
        </Animated.View>
      </ScrollView>
      <StatusBar style="dark" />
    </KeyboardAvoidingView>
  );
}
