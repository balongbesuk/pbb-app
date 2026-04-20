import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Image, ImageBackground, ScrollView, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, FadeInDown, FadeInUp, runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl, normalizeServerUrl } from '../utils/server';
import { ScalableButton } from '../components/ScalableButton';
import { appTheme } from '../theme/app-theme';

export default function OnboardingScreen({ navigation }: ScreenProps<'Onboarding'>) {
  const [serverUrl, setServerUrl] = useState('pbb.galaxynet.my.id');
  const [isHttps, setIsHttps] = useState(true);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [villageNamePreview, setVillageNamePreview] = useState<string | null>(null);
  const [recentServers, setRecentServers] = useState<string[]>([]);
  const progress = useSharedValue(0);

  useEffect(() => { loadSavedConnection(); }, []);
  useEffect(() => {
    const timer = setTimeout(() => { if (serverUrl.length > 3) fetchPreviewLogo(); }, 900);
    return () => clearTimeout(timer);
  }, [serverUrl, isHttps]);

  const loadSavedConnection = async () => {
    try {
      const savedServerUrl = await AsyncStorage.getItem('serverUrl');
      const savedRecent = await AsyncStorage.getItem('recentServerUrls');
      if (savedRecent) setRecentServers(JSON.parse(savedRecent));
      if (!savedServerUrl) return;
      setIsHttps(savedServerUrl.startsWith('https://'));
      setServerUrl(savedServerUrl.replace(/^https?:\/\//, ''));
    } catch (e) {}
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
        if (!logo.startsWith('http')) logo = joinServerUrl(fullUrl, logo);
        setPreviewLogo(logo);
        if (data.village?.namaDesa) setVillageNamePreview(data.village.namaDesa);
      }
    } catch (e) {}
  };

  const handleConnect = async () => {
    setLoading(true); setErrorMsg('');
    if (Platform.OS !== 'web') Vibration.vibrate(10);
    const fullUrl = getResolvedServerUrl();
    if (!fullUrl) { setLoading(false); setErrorMsg('Alamat server desa wajib diisi.'); return; }
    try {
      const response = await fetch(joinServerUrl(fullUrl, '/api/mobile/connect'), { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      if (response.ok) {
        const data = await response.json();
        if (!data?.success) { setErrorMsg(data?.error || 'Server merespons tetapi koneksi mobile belum siap.'); return; }
        setSyncing(true);
        progress.value = withTiming(1, { duration: 2500, easing: Easing.bezier(0.4, 0, 0.2, 1) }, (finished) => { if (finished) runOnJS(finishSync)(data); });
      } else { setErrorMsg(`Gagal terhubung (Status: ${response.status})`); }
    } catch (err) { setErrorMsg('Server tidak merespons. Pastikan URL benar.'); }
    finally { setLoading(false); }
  };

  const finishSync = async (data: any) => {
    if (!data?.success) { setSyncing(false); setErrorMsg('Sinkronisasi gagal.'); return; }
    const villageName = data.village?.namaDesa || 'Balongbesuk';
    const villageLogo = data.village?.logoUrl || null;
    const fullUrl = getResolvedServerUrl();
    if (!fullUrl) { setSyncing(false); setErrorMsg('Alamat server tidak valid.'); return; }
    await AsyncStorage.setItem('serverUrl', fullUrl);
    await AsyncStorage.setItem('villageName', villageName);
    if (villageLogo) await AsyncStorage.setItem('villageLogo', villageLogo);
    const nextRecent = [fullUrl, ...recentServers.filter((i) => i !== fullUrl)].slice(0, 5);
    await AsyncStorage.setItem('recentServerUrls', JSON.stringify(nextRecent));
    navigation.replace('Dashboard', { villageName, serverUrl: fullUrl, stats: data.stats, villageLogo });
  };

  const animatedProgressStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  if (syncing) {
    return (
      <ImageBackground source={require('../../assets/village-bg.png')} style={{ flex: 1 }}>
        <LinearGradient colors={['rgba(15,23,42,0.6)', 'rgba(15,23,42,0.95)']} style={{ flex: 1, justifyContent: 'center', padding: 28 }}>
          <Animated.View entering={FadeInUp.duration(600)} style={{ alignItems: 'center' }}>
            <BlurView intensity={70} tint="dark" style={{ width: '100%', borderRadius: appTheme.radius.xl, padding: 36, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <View style={{ width: 88, height: 88, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                {previewLogo ? <Image source={{ uri: previewLogo }} style={{ width: 56, height: 56 }} resizeMode="contain" />
                  : <ActivityIndicator size="large" color={appTheme.colors.primary} />}
              </View>
              <Text style={{ color: 'white', ...appTheme.typo.heading, textAlign: 'center', marginBottom: 10 }}>SINKRONISASI</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', ...appTheme.typo.body, textAlign: 'center', marginBottom: 32 }}>
                Menyiapkan profil desa dan sinkronisasi layanan mobile terbaru ke perangkat Anda...
              </Text>
              <View style={{ width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
                <Animated.View style={[animatedProgressStyle, { height: '100%', backgroundColor: appTheme.colors.primary, borderRadius: 999 }]} />
              </View>
            </BlurView>
          </Animated.View>
        </LinearGradient>
        <StatusBar style="light" />
      </ImageBackground>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ImageBackground source={require('../../assets/village-bg.png')} style={{ flex: 1 }}>
        <LinearGradient colors={['rgba(15,23,42,0.4)', 'rgba(15,23,42,0.92)']} style={{ flex: 1 }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingBottom: 40, paddingTop: 80 }} showsVerticalScrollIndicator={false}>
              
              <Animated.View entering={FadeInUp.duration(800).springify()} style={{ alignItems: 'center', marginBottom: 40 }}>
                <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                  {previewLogo ? <Image source={{ uri: previewLogo }} style={{ width: 44, height: 44 }} resizeMode="contain" />
                    : <Image source={require('../../assets/icon.png')} style={{ width: 38, height: 38 }} resizeMode="contain" />}
                </View>
                <Text style={{ color: 'white', ...appTheme.typo.hero, textAlign: 'center', textTransform: 'uppercase' }}>PBB MOBILE</Text>
                <View style={{ height: 2, width: 40, backgroundColor: appTheme.colors.primary, marginTop: 4, borderRadius: 1 }} />
                <Text style={{ color: 'rgba(255,255,255,0.8)', ...appTheme.typo.label, marginTop: 12, textTransform: 'uppercase' }}>
                  {villageNamePreview ? `Desa ${villageNamePreview}` : 'Desa Nama Desa'}
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(200).duration(800)}>
                <BlurView intensity={Platform.OS === 'ios' ? 40 : 80} tint="dark" style={{ borderRadius: appTheme.radius.xl, padding: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                  <Text style={{ color: 'white', fontSize: 20, fontWeight: '800', marginBottom: 8, letterSpacing: -0.3 }}>Sambungkan Desa Anda</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', ...appTheme.typo.body, marginBottom: 24, lineHeight: 20 }}>
                    Masukkan alamat website desa Anda agar aplikasi terhubung ke layanan PBB resmi desa tersebut.
                  </Text>

                  <Text style={{ color: 'rgba(255,255,255,0.5)', ...appTheme.typo.label, marginBottom: 12 }}>ALAMAT WEBSITE DESA</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: appTheme.radius.md, paddingHorizontal: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                    <Text style={{ color: isHttps ? appTheme.colors.success : appTheme.colors.primary, fontSize: 13, fontWeight: '800' }}>{isHttps ? 'HTTPS://' : 'HTTP://'}</Text>
                    <TextInput
                      style={{ flex: 1, color: 'white', paddingHorizontal: 12, paddingVertical: 18, fontSize: 17, fontWeight: '700' }}
                      placeholder="desa.id"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={serverUrl.replace(/^https?:\/\//, '')}
                      onChangeText={setServerUrl}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  {recentServers.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', ...appTheme.typo.label, marginBottom: 12 }}>SAMBUNGAN TERAKHIR</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {recentServers.map((rs) => (
                          <ScalableButton key={rs} onPress={() => { setIsHttps(rs.startsWith('https://')); setServerUrl(rs.replace(/^https?:\/\//, '')); setErrorMsg(''); }} style={{ marginRight: 10 }}>
                            <BlurView intensity={40} tint="light" style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, overflow: 'hidden' }}>
                              <Text style={{ color: 'white', fontSize: 13, fontWeight: '700' }}>{rs.replace(/^https?:\/\//, '')}</Text>
                            </BlurView>
                          </ScalableButton>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {errorMsg ? (
                    <Animated.View entering={FadeInDown} style={{ marginBottom: 20, backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: appTheme.radius.sm, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                      <Ionicons name="alert-circle" size={18} color={appTheme.colors.danger} />
                      <Text style={{ color: 'white', fontSize: 13, fontWeight: '600', flex: 1, marginLeft: 10 }}>{errorMsg}</Text>
                    </Animated.View>
                  ) : null}

                  <ScalableButton onPress={handleConnect} disabled={loading}>
                    <LinearGradient colors={[appTheme.colors.primary, appTheme.colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={{ borderRadius: appTheme.radius.md, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                      {loading ? <ActivityIndicator color="white" /> : (
                        <>
                          <Text style={{ color: 'white', fontSize: 15, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' }}>Masuk Ke Layanan Desa</Text>
                        </>
                      )}
                    </LinearGradient>
                  </ScalableButton>
                </BlurView>
              </Animated.View>

              <View style={{ marginTop: 'auto', paddingTop: 40, alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', ...appTheme.typo.label }}>VERSI 1.0.0 • DESA DIGITAL</Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
      <StatusBar style="light" />
    </View>
  );
}
