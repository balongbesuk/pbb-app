import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator, 
  Image, 
  StyleSheet,
  Dimensions,
  ScrollView
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
  withRepeat,
  withSequence
} from 'react-native-reanimated';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl, normalizeServerUrl } from '../utils/server';

const { height: SCREEN_HEIGHT } = Dimensions.get('screen');

export default function OnboardingScreen({ navigation }: ScreenProps<'Onboarding'>) {
  const [serverUrl, setServerUrl] = useState('localhost:3000');
  const [isHttps, setIsHttps] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [recentServers, setRecentServers] = useState<string[]>([]);

  const progress = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    loadSavedConnection();
  }, []);

  // Effect to try and fetch logo from the entered URL live
  useEffect(() => {
    const timer = setTimeout(() => {
      if (serverUrl.length > 3) {
        fetchPreviewLogo();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [serverUrl, isHttps]);

  useEffect(() => {
    if (syncing) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(1, { duration: 1000, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        ),
        -1,
        true
      );
    }
  }, [syncing]);

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
      // Ignore storage read failure and keep default onboarding state
    }
  };

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
      // Keep existing logo or null if error
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setErrorMsg('');

    const fullUrl = getResolvedServerUrl();
    if (!fullUrl) {
      setLoading(false);
      setErrorMsg('Alamat website desa wajib diisi.');
      return;
    }
    
    try {
      const response = await fetch(joinServerUrl(fullUrl, '/api/mobile/connect'), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (!data?.success) {
          setErrorMsg(data?.error || 'Server merespons tetapi koneksi mobile belum siap.');
          return;
        }
        setSyncing(true);
        startSyncAnimation(data);
      } else {
        setErrorMsg(`Gagal terhubung (Status: ${response.status})`);
      }
    } catch (err) {
      setErrorMsg('Server tidak merespons. Pastikan URL benar.');
    } finally {
      setLoading(false);
    }
  };

  const startSyncAnimation = (data: any) => {
    progress.value = withTiming(1, { duration: 4000, easing: Easing.bezier(0.4, 0, 0.2, 1) }, (finished) => {
      if (finished) {
        runOnJS(finishSync)(data);
      }
    });
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
      villageName: villageName,
      serverUrl: fullUrl,
      stats: data.stats,
      villageLogo: villageLogo
    });
  };

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.8 + (pulse.value - 1) * 2
  }));

  const getResolvedServerUrl = () => normalizeServerUrl(serverUrl, isHttps);

  if (syncing) {
    return (
      <View className="flex-1 bg-black items-center justify-center p-12">
        {/* Background Image - Persisted for visual continuity */}
        <View style={StyleSheet.absoluteFill}>
          <Image 
            source={require('../../assets/village-bg.png')} 
            style={{ width: '100%', height: '100%', opacity: 0.4 }}
            resizeMode="cover"
          />
          <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.6)' }} />
        </View>

        <Animated.View entering={FadeInUp} className="items-center w-full">
          <Animated.View 
            style={[animatedPulseStyle]}
            className="w-32 h-32 rounded-[40px] items-center justify-center mb-12 bg-white/5 border border-white/10"
          >
             {previewLogo ? (
               <Image 
                 source={{ uri: previewLogo }} 
                 style={{ width: 80, height: 80 }}
                 resizeMode="contain"
               />
             ) : (
               <ActivityIndicator size="large" color="#10b981" />
             )}
          </Animated.View>
          
          <Text className="text-white text-3xl font-black mb-2 uppercase tracking-tight text-center">Sinkronisasi</Text>
          <Text className="text-emerald-400 text-[10px] font-black uppercase tracking-[3px] mb-12 text-center">Menyimpan profil desa anda...</Text>
          
          <View className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <Animated.View 
              style={[animatedProgressStyle, { height: '100%', backgroundColor: '#10b981' }]}
            />
          </View>
        </Animated.View>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={{ height: SCREEN_HEIGHT, backgroundColor: '#0f172a' }}>
      {/* Background Image - User's Majestic Village Panorama */}
      <View style={StyleSheet.absoluteFill}>
        <Image 
          source={require('../../assets/village-bg.png')} 
          style={{ width: '100%', height: '100%', opacity: 0.7 }}
          resizeMode="cover"
        />
        {/* Dark overlay for readability */}
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.3)' }} />
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} showsVerticalScrollIndicator={false}>
          <View className="flex-1 justify-center p-8 pt-5 pb-12 items-center">
            
            {/* Header Section - More Compact */}
            <Animated.View entering={FadeInUp.delay(200).duration(800)} style={{ width: '100%', alignItems: 'center', marginBottom: 20 }}>
              {/* Dynamic Logo in Circle - Smaller for better spacing */}
              <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', marginBottom: 15 }}>
                {previewLogo ? (
                  <Image 
                    source={{ uri: previewLogo }} 
                    style={{ width: 75, height: 75 }}
                    resizeMode="contain"
                  />
                ) : (
                  <Image 
                    source={require('../../assets/icon.png')} 
                    style={{ width: 60, height: 60, opacity: 0.6 }}
                    resizeMode="contain"
                  />
                )}
              </View>

              <Text style={{ fontSize: 32, fontWeight: '900', color: 'white', letterSpacing: -1, textTransform: 'uppercase' }}>PBB MOBILE</Text>
              <View style={{ height: 3, width: 60, backgroundColor: '#10b981', marginTop: 4, borderRadius: 2 }} />
              <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 4, marginTop: 8, opacity: 0.8 }}>Layanan PBB Desa</Text>
            </Animated.View>

            {/* Form Card */}
            <Animated.View entering={FadeInDown.delay(400).duration(800)} className="w-full max-w-sm">
              <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', borderRadius: 40, padding: 28, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 30 }}>
                <View className="mb-6">
                  <Text className="text-white text-xl font-black mb-1">Sambungkan Desa Anda</Text>
                  <Text className="text-slate-400 text-[11px] leading-relaxed font-medium">
                    Masukkan alamat website desa Anda agar aplikasi terhubung ke layanan PBB resmi desa tersebut.
                  </Text>
                </View>

                <View>
                  <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-2 ml-1">Alamat Website Desa</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 20, borderWidth: 1, borderColor: '#334155', marginBottom: 8 }}>
                    <TouchableOpacity onPress={() => setIsHttps(!isHttps)} style={{ paddingLeft: 16 }}>
                      <Text style={{ color: isHttps ? '#10b981' : '#fbbf24', fontWeight: 'bold', fontSize: 11 }}>{isHttps ? 'HTTPS://' : 'HTTP://'}</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={{ flex: 1, color: 'white', paddingHorizontal: 10, paddingVertical: 12, fontWeight: '900', fontSize: 13 }}
                      placeholder="contoh: desasaya.id atau localhost:3000"
                      placeholderTextColor="#475569"
                      value={serverUrl.replace('http://', '').replace('https://', '')}
                      onChangeText={(val) => setServerUrl(val)}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3 mb-2">
                    <Text className="text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-1">Alamat Tujuan</Text>
                    <Text className="text-white text-xs font-bold">{getResolvedServerUrl() || 'https://desasaya.id'}</Text>
                  </View>
                  <Text className="text-slate-400 text-[10px] leading-relaxed mt-1 mb-1">
                    Gunakan alamat website resmi desa Anda. Untuk testing, Anda juga bisa memasukkan `localhost:3000`.
                  </Text>
                  {recentServers.length > 0 && (
                    <View className="mt-3 mb-1">
                      <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-2 ml-1">Sambungan Terakhir</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {recentServers.map((recentServer) => (
                          <TouchableOpacity
                            key={recentServer}
                            className="mr-2 px-3 py-2 rounded-full border border-slate-600 bg-slate-900"
                            onPress={() => {
                              setIsHttps(recentServer.startsWith('https://'));
                              setServerUrl(recentServer.replace(/^https?:\/\//, ''));
                              setErrorMsg('');
                            }}
                          >
                            <Text className="text-white text-[10px] font-bold">{recentServer.replace(/^https?:\/\//, '')}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  {errorMsg && (
                    <Text className="text-rose-400 text-[9px] font-bold mt-2 ml-1 uppercase tracking-tighter text-center">
                      ⚠️ {errorMsg}
                    </Text>
                  )}

                  <TouchableOpacity 
                    style={{ marginTop: 15, backgroundColor: '#059669', paddingVertical: 16, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#059669', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 15 }}
                    disabled={loading}
                    onPress={handleConnect}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={{ color: 'white', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, fontSize: 12 }}>Masuk ke Layanan Desa</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              
              <View className="items-center mt-8">
                <Text className="text-white/30 text-[9px] font-bold tracking-[3px] uppercase">Versi 1.0.0 • Desa Digital</Text>
              </View>
            </Animated.View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <StatusBar style="light" />
    </View>
  );
}
