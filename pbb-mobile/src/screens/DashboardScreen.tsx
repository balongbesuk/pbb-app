import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, TouchableWithoutFeedback } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl } from '../utils/server';

export default function DashboardScreen({ route, navigation }: ScreenProps<'Dashboard'>) {
  const { villageName, serverUrl, stats = {}, villageLogo } = route.params || {};
  const [menuVisible, setMenuVisible] = useState(false);

  const totalSppt = stats.totalSppt || 0;
  const lunasSppt = stats.lunasSppt || 0;

  useEffect(() => {
    // Logic for other initializations can go here
  }, []);

  // Dynamic Logo Logic
  const getLogoSource = () => {
    if (villageLogo) {
      if (villageLogo.startsWith('http')) {
        return { uri: villageLogo };
      }
      return { uri: joinServerUrl(serverUrl, villageLogo) };
    }
    return require('../../assets/icon.png');
  };

  return (
    <View className="flex-1 bg-slate-50">
       <ScrollView 
         showsVerticalScrollIndicator={false}
         contentContainerStyle={{ paddingBottom: 100 }}
       >
         {/* Premium Header */}
         <View className="px-6 pt-14 pb-8 bg-white/80 rounded-b-[40px] shadow-sm border-b border-slate-100">
           <View className="flex-row justify-between items-center">
             <View className="flex-row items-center">
               <View className="w-14 h-14 bg-white rounded-2xl shadow-sm items-center justify-center p-2 border border-slate-100">
                 <Image 
                   source={getLogoSource()}
                   className="w-full h-full"
                   resizeMode="contain"
                 />
               </View>
               <View className="ml-4">
                 <Text style={{ fontSize: 26, fontWeight: '900', color: '#0f172a', letterSpacing: -1 }}>PBB Desa</Text>
                 <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748b', letterSpacing: 3, textTransform: 'uppercase' }}>{villageName || 'Balongbesuk'}</Text>
               </View>
             </View>
             
             <TouchableOpacity 
               onPress={() => setMenuVisible(true)}
               className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-100"
             >
               <Text className="text-xl">⚙️</Text>
             </TouchableOpacity>
           </View>

           <View className="mt-5 self-center bg-emerald-50 border border-emerald-100 rounded-full px-8 py-2">
             <Text className="text-[9px] font-black text-emerald-700 uppercase tracking-[2px] text-center">
               Terhubung ke layanan desa {villageName || 'aktif'}
             </Text>
           </View>

           {/* Informational Banner Card - Premium Visual */}
           <View className="mt-8 overflow-hidden rounded-[32px] bg-emerald-900 shadow-xl shadow-emerald-900/20">
              <View className="flex-row items-center p-6 relative">
                 {/* Decorative background gradients */}
                 <View className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-800/20 rounded-full" />
                 
                 <View className="flex-1 pr-4 z-10">
                    <Text className="text-white text-2xl font-black leading-tight tracking-tight">Layanan PBB{"\n"}Untuk Warga Desa</Text>
                    <Text className="text-emerald-100/60 mt-2 font-bold text-[11px] leading-relaxed">Cari data berdasarkan NOP{"\n"}atau nama wajib pajak</Text>
                 </View>

                 <View className="w-32 h-32 z-10">
                    <Image
                       source={require('../../assets/village-bg.png')}
                       className="w-full h-full rounded-[28px]"
                       resizeMode="cover"
                    />
                 </View>
              </View>
           </View>
         </View>

         {/* Menu Section */}
         <View className="px-6 mt-8">
           <Text className="text-slate-400 font-black text-[10px] uppercase tracking-[2px] mb-5 ml-1">Layanan Utama</Text>
           
           <View className="flex-col space-y-3">
              {/* Card 1 - Cek Tagihan */}
              <TouchableOpacity 
                activeOpacity={0.7}
                className="w-full bg-white p-4 rounded-[24px] flex-row items-center border border-slate-100 shadow-sm"
                onPress={() => navigation.navigate('PaymentCheck', { serverUrl })}
              >
                <View className="w-14 h-14 bg-indigo-50 rounded-2xl items-center justify-center border border-indigo-100/50 mr-4">
                  <Ionicons name="card-outline" size={26} color="#4f46e5" />
                </View>
                <View className="flex-1">
                  <Text className="font-black text-slate-800 text-base leading-5 tracking-tight">Cek Tagihan PBB</Text>
                  <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Status & Pembayaran</Text>
                </View>
                <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center border border-slate-100">
                  <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                </View>
              </TouchableOpacity>

              {/* Card 4 - Peta GIS */}
              <TouchableOpacity 
                activeOpacity={0.7}
                className="w-full bg-white p-4 rounded-[24px] flex-row items-center border border-slate-100 shadow-sm mt-3"
                onPress={() => navigation.navigate('GisMap', { serverUrl })}
              >
                <View className="w-14 h-14 bg-rose-50 rounded-2xl items-center justify-center border border-rose-100/50 mr-4">
                  <Ionicons name="map-outline" size={26} color="#e11d48" />
                </View>
                <View className="flex-1">
                  <Text className="font-black text-slate-800 text-base leading-5 tracking-tight">Peta GIS Desa</Text>
                  <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Visualisasi Sebaran PBB</Text>
                </View>
                <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center border border-slate-100">
                  <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                </View>
              </TouchableOpacity>
           </View>
         </View>
       </ScrollView>

       {/* Settings Overlay - Absolute positioned within app frame */}
       {menuVisible && (
         <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
           <View style={{
             position: 'absolute',
             top: 0, left: 0, right: 0, bottom: 0,
             backgroundColor: 'rgba(0,0,0,0.5)',
             justifyContent: 'center',
             alignItems: 'center',
             padding: 24,
             zIndex: 999,
           }}>
             <TouchableWithoutFeedback>
               <View style={{
                 backgroundColor: 'white',
                 borderRadius: 32,
                 padding: 24,
                 width: '100%',
                 shadowColor: '#000',
                 shadowOffset: { width: 0, height: 8 },
                 shadowOpacity: 0.15,
                 shadowRadius: 24,
                 elevation: 20,
               }}>
                 {/* Header */}
                 <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                   <View style={{ flex: 1 }}>
                     <Text style={{ fontSize: 20, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 }}>Pengaturan</Text>
                     <Text style={{ fontSize: 9, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2 }}>Akses & Koneksi Portal</Text>
                   </View>
                   <TouchableOpacity
                     onPress={() => setMenuVisible(false)}
                     style={{ width: 36, height: 36, backgroundColor: '#f1f5f9', borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
                   >
                     <Ionicons name="close" size={20} color="#64748b" />
                   </TouchableOpacity>
                 </View>

                 {/* Divider */}
                 <View style={{ height: 1, backgroundColor: '#f1f5f9', marginBottom: 16 }} />

                 <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Akses Petugas */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#eff6ff', borderRadius: 16, borderWidth: 1, borderColor: '#bfdbfe', marginBottom: 10 }}
                      onPress={() => {
                        setMenuVisible(false);
                        navigation.navigate('Login', { serverUrl, villageName });
                      }}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Ionicons name="shield-checkmark" size={20} color="#3b82f6" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '900', color: '#1e293b', fontSize: 14 }}>Akses Petugas</Text>
                        <Text style={{ fontSize: 9, color: '#3b82f6', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Operator Panel</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#93c5fd" />
                    </TouchableOpacity>

                    {/* Ganti Koneksi */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' }}
                      onPress={() => {
                        setMenuVisible(false);
                        navigation.replace('Onboarding');
                      }}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Ionicons name="link" size={20} color="#64748b" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '900', color: '#1e293b', fontSize: 14 }}>Ganti Koneksi</Text>
                        <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Server URL</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                    </TouchableOpacity>
                 </ScrollView>
               </View>
             </TouchableWithoutFeedback>
           </View>
         </TouchableWithoutFeedback>
       )}

       <StatusBar style="dark" />
    </View>
  );
}
