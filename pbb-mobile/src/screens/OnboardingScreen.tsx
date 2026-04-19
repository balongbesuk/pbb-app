import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  StyleSheet,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeInDown,
  FadeInUp,
  runOnJS,
} from 'react-native-reanimated';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl, normalizeServerUrl } from '../utils/server';
import { ScalableButton } from '../components/ScalableButton';
import { appTheme } from '../theme/app-theme';

export default function OnboardingScreen({ navigation }: ScreenProps<'Onboarding'>) {
  const [serverUrl, setServerUrl] = useState('localhost:3000');
  const [isHttps, setIsHttps] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [recentServers, setRecentServers] = useState<string[]>([]);

  const progress = useSharedValue(0);

  useEffect(() => {
    loadSavedConnection();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (serverUrl.length > 3) {
        fetchPreviewLogo();
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [serverUrl, isHttps]);

  const loadSavedConnection = async () => {
    try {
      const savedServerUrl = await AsyncStorage.getItem('serverUrl');
      const savedRecentServers = await AsyncStorage.getItem('recentServerUrls');
      if (savedRecentServers) {
        setRecentServers(JSON.parse(savedRecentServers));
      }
      if (!savedServerUrl) return;

      const usingHttps = savedServerUrl.startsWith('https://');
      const savedHost = savedServerUrl.replace(/^https?:\/\//, '');
      setIsHttps(usingHttps);
      setServerUrl(savedHost);
    } catch (e) {
      // ignore
    }
  };

  const getResolvedServerUrl = () => normalizeServerUrl(serverUrl, isHttps);

  const fetchPreviewLogo = async () => {
    const fullUrl = getResolvedServerUrl();
    if (!fullUrl) return;

    try {
      const response = await fetch(joinServerUrl(fullUrl, '/api/mobile/connect'));
      const data = await response.json();
      if (data.success && data.village?.logoUrl) {
        let logo = data.village.logoUrl;
        if (!logo.startsWith('http')) {
          logo = joinServerUrl(fullUrl, logo);
        }
        setPreviewLogo(logo);
      }
    } catch (e) {
      // keep silent
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setErrorMsg('');

    const fullUrl = getResolvedServerUrl();
    if (!fullUrl) {
      setLoading(false);
      setErrorMsg('Alamat server desa wajib diisi.');
      return;
    }

    try {
      const response = await fetch(joinServerUrl(fullUrl, '/api/mobile/connect'), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (!data?.success) {
          setErrorMsg(data?.error || 'Server merespons tetapi koneksi mobile belum siap.');
          return;
        }
        setSyncing(true);
        progress.value = withTiming(1, { duration: 2200, easing: Easing.bezier(0.4, 0, 0.2, 1) }, (finished) => {
          if (finished) {
            runOnJS(finishSync)(data);
          }
        });
      } else {
        setErrorMsg(`Gagal terhubung (Status: ${response.status})`);
      }
    } catch (err) {
      setErrorMsg('Server tidak merespons. Pastikan URL benar.');
    } finally {
      setLoading(false);
    }
  };

  const finishSync = async (data: any) => {
    if (!data?.success) {
      setSyncing(false);
      setErrorMsg('Sinkronisasi gagal. Silakan cek kembali server Anda.');
      return;
    }

    const villageName = data.village?.namaDesa || 'Balongbesuk';
    const villageLogo = data.village?.logoUrl || null;
    const fullUrl = getResolvedServerUrl();

    if (!fullUrl) {
      setSyncing(false);
      setErrorMsg('Alamat server tidak valid.');
      return;
    }

    await AsyncStorage.setItem('serverUrl', fullUrl);
    await AsyncStorage.setItem('villageName', villageName);
    if (villageLogo) await AsyncStorage.setItem('villageLogo', villageLogo);
    const nextRecentServers = [fullUrl, ...recentServers.filter((item) => item !== fullUrl)].slice(0, 5);
    await AsyncStorage.setItem('recentServerUrls', JSON.stringify(nextRecentServers));
    setRecentServers(nextRecentServers);

    navigation.replace('Dashboard', {
      villageName,
      serverUrl: fullUrl,
      stats: data.stats,
      villageLogo,
    });
  };

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  if (syncing) {
    return (
      <View style={{ flex: 1, backgroundColor: appTheme.colors.primaryDark, justifyContent: 'center', padding: 28 }}>
        <View style={StyleSheet.absoluteFillObject}>
          <Image source={require('../../assets/village-bg.png')} style={{ width: '100%', height: '100%', opacity: 0.18 }} resizeMode="cover" />
          <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: appTheme.colors.overlay }} />
        </View>
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: 34,
            padding: 28,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 28,
                backgroundColor: 'rgba(255,255,255,0.12)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
              }}
            >
              {previewLogo ? (
                <Image source={{ uri: previewLogo }} style={{ width: 54, height: 54 }} resizeMode="contain" />
              ) : (
                <ActivityIndicator size="large" color="white" />
              )}
            </View>
            <Text style={{ color: 'white', fontSize: 28, fontWeight: '900', marginBottom: 8 }}>Menyambungkan desa</Text>
            <Text style={{ color: 'rgba(255,255,255,0.74)', fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 22 }}>
              Menyimpan profil desa dan menyiapkan layanan mobile untuk digunakan.
            </Text>
          </View>

          <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, overflow: 'hidden' }}>
            <Animated.View style={[animatedProgressStyle, { height: '100%', backgroundColor: '#ffffff' }]} />
          </View>
        </View>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <View style={StyleSheet.absoluteFillObject}>
        <Image source={require('../../assets/village-bg.png')} style={{ width: '100%', height: '58%', opacity: 0.15 }} resizeMode="cover" />
        <View style={{ position: 'absolute', top: -40, right: -30, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(238,138,91,0.18)' }} />
        <View style={{ position: 'absolute', top: 120, left: -50, width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(63,103,214,0.10)' }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInUp.duration(600)}>
            <View
              style={{
                backgroundColor: appTheme.colors.primaryDark,
                borderRadius: appTheme.radius.xl,
                padding: 28,
                marginBottom: 18,
                ...appTheme.shadow.floating,
                overflow: 'hidden',
              }}
            >
              <View style={{ position: 'absolute', top: -34, right: -22, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.08)' }} />
              <View style={{ position: 'absolute', bottom: -28, left: -10, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(238,138,91,0.22)' }} />
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
                <Text style={{ color: 'white', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 }}>PORTAL DESA MODERN</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 22,
                    backgroundColor: 'rgba(255,255,255,0.14)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}
                >
                  {previewLogo ? (
                    <Image source={{ uri: previewLogo }} style={{ width: 40, height: 40 }} resizeMode="contain" />
                  ) : (
                    <Image source={require('../../assets/icon.png')} style={{ width: 34, height: 34 }} resizeMode="contain" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'rgba(255,244,232,0.76)', fontSize: 11, fontWeight: '800', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>
                    PBB Mobile
                  </Text>
                  <Text style={{ color: 'white', fontSize: 31, fontWeight: '900', lineHeight: 36 }}>Hubungkan aplikasi desa</Text>
                </View>
              </View>

              <Text style={{ color: 'rgba(255,248,240,0.82)', fontSize: 14, lineHeight: 22 }}>
                Masukkan alamat server desa untuk membuka layanan PBB, data warga, dan panel petugas dalam satu aplikasi yang serasi.
              </Text>
              <View style={{ flexDirection: 'row', marginTop: 18 }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10, marginRight: 10 }}>
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '800' }}>Cepat disetel</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10 }}>
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '800' }}>Satu tema utuh</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(650)}>
            <View
              style={{
                backgroundColor: appTheme.colors.surface,
                borderRadius: appTheme.radius.xl,
                padding: 24,
                borderWidth: 1,
                borderColor: appTheme.colors.border,
                ...appTheme.shadow.card,
                overflow: 'hidden',
              }}
            >
              <View style={{ position: 'absolute', top: -24, right: -16, width: 110, height: 110, borderRadius: 55, backgroundColor: appTheme.colors.primarySoft, opacity: 0.7 }} />
              <Text style={{ color: appTheme.colors.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
                Alamat server desa
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: appTheme.colors.surfaceMuted,
                  borderRadius: appTheme.radius.md,
                  borderWidth: 1,
                  borderColor: appTheme.colors.border,
                  paddingHorizontal: 14,
                }}
              >
                <ScalableButton onPress={() => setIsHttps(!isHttps)}>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: 14,
                      backgroundColor: isHttps ? appTheme.colors.primarySoft : appTheme.colors.accentSoft,
                    }}
                  >
                    <Text style={{ color: isHttps ? appTheme.colors.primary : appTheme.colors.accent, fontSize: 11, fontWeight: '900' }}>
                      {isHttps ? 'HTTPS' : 'HTTP'}
                    </Text>
                  </View>
                </ScalableButton>
                <TextInput
                  style={{ flex: 1, color: appTheme.colors.text, paddingHorizontal: 12, paddingVertical: 16, fontSize: 15, fontWeight: '700' }}
                  placeholder="desa.id atau 192.168.1.10:3000"
                  placeholderTextColor={appTheme.colors.textSoft}
                  value={serverUrl.replace('http://', '').replace('https://', '')}
                  onChangeText={(val) => setServerUrl(val)}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <Text style={{ color: appTheme.colors.textSoft, fontSize: 12, lineHeight: 18, marginTop: 10 }}>
                Contoh: `desa-ku.id`, `localhost:3000`, atau IP server lokal kantor desa.
              </Text>

              {recentServers.length > 0 && (
                <View style={{ marginTop: 18 }}>
                  <Text style={{ color: appTheme.colors.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 10 }}>
                    Sambungan terakhir
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {recentServers.map((recentServer) => (
                      <ScalableButton
                        key={recentServer}
                        onPress={() => {
                          setIsHttps(recentServer.startsWith('https://'));
                          setServerUrl(recentServer.replace(/^https?:\/\//, ''));
                          setErrorMsg('');
                        }}
                        style={{ marginRight: 10 }}
                      >
                        <View
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            borderRadius: 999,
                            backgroundColor: appTheme.colors.surfaceMuted,
                            borderWidth: 1,
                            borderColor: appTheme.colors.border,
                          }}
                        >
                          <Text style={{ color: appTheme.colors.text, fontSize: 12, fontWeight: '700' }}>
                            {recentServer.replace(/^https?:\/\//, '')}
                          </Text>
                        </View>
                      </ScalableButton>
                    ))}
                  </ScrollView>
                </View>
              )}

              {errorMsg ? (
                <View
                  style={{
                    marginTop: 14,
                    backgroundColor: appTheme.colors.dangerSoft,
                    borderRadius: appTheme.radius.md,
                    borderWidth: 1,
                    borderColor: '#f0caca',
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: appTheme.colors.danger, fontSize: 12, fontWeight: '700', flex: 1 }}>{errorMsg}</Text>
                </View>
              ) : null}

              <ScalableButton onPress={handleConnect} disabled={loading} style={{ marginTop: 18 }}>
                <View
                  style={{
                    backgroundColor: appTheme.colors.primary,
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
                      <Text style={{ color: 'white', fontSize: 13, fontWeight: '900' }}>Hubungkan dan lanjutkan</Text>
                      <Text style={{ color: 'white', marginLeft: 8, fontSize: 16 }}>→</Text>
                    </>
                  )}
                </View>
              </ScalableButton>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      <StatusBar style="dark" />
    </View>
  );
}
