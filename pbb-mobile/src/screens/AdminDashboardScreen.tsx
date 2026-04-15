import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScreenProps } from '../types/navigation';

// Menggunakan WebView untuk Leaflet JS yang sudah ada di web biar tidak perlu recreate polygon
import { WebView } from 'react-native-webview';

export default function AdminDashboardScreen({ route, navigation }: ScreenProps<'AdminDashboard'>) {
  const { serverUrl, user, stats, villageName } = route.params;
  const firstName = user?.name?.trim()?.split(/\s+/)[0] || 'Petugas';
  const totalSppt = stats?.totalSppt ?? 0;
  const lunasSppt = stats?.lunasSppt ?? 0;
  const tertunggakSppt = Math.max(totalSppt - lunasSppt, 0);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('@admin_magic_token');
      navigation.replace('Dashboard', { serverUrl, stats, villageName });
    } catch (e) {
      navigation.replace('Dashboard', { serverUrl, stats, villageName });
    }
  };

  return (
    <View className="flex-1 bg-slate-900">
      <View className="p-8 pt-16 pb-6 bg-blue-600 rounded-b-[40px] shadow-xl z-10">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-blue-200 font-bold text-[10px] uppercase tracking-widest mb-1">Panel Petugas: {villageName}</Text>
            <Text className="text-3xl font-black text-white tracking-tighter">Halo, {firstName}!</Text>
          </View>
          <View className="w-14 h-14 bg-white/20 rounded-full items-center justify-center border-2 border-white/40">
            <Text className="text-white font-black text-xl">👮</Text>
          </View>
        </View>

        <View className="bg-white/10 p-5 rounded-3xl mt-2 border border-white/20 flex-row justify-between">
           <View className="items-center">
             <Text className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1">Tugas Anda</Text>
             <Text className="text-white text-2xl font-black">{totalSppt}</Text>
           </View>
           <View className="h-full w-[1px] bg-white/20"></View>
           <View className="items-center">
             <Text className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1">Telah Lunas</Text>
             <Text className="text-emerald-300 text-2xl font-black">{lunasSppt}</Text>
           </View>
           <View className="h-full w-[1px] bg-white/20"></View>
           <View className="items-center">
             <Text className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1">Tertunggak</Text>
             <Text className="text-rose-300 text-2xl font-black">{tertunggakSppt}</Text>
           </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
        
        <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest ml-2 mb-3">Menu Operasional</Text>
        
        <View className="flex-row flex-wrap justify-between mb-6">
            <TouchableOpacity 
              className="w-[48%] bg-slate-800 p-5 rounded-3xl border border-slate-700 mb-4 items-center shadow-lg"
              onPress={() => navigation.navigate('PaymentCheck', { serverUrl })}
            >
               <View className="bg-emerald-500/20 w-12 h-12 rounded-full items-center justify-center mb-3">
                 <Text className="text-2xl">💸</Text>
               </View>
               <Text className="text-white font-black text-xs text-center">Terima Setoran</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="w-[48%] bg-slate-800 p-5 rounded-3xl border border-slate-700 mb-4 items-center shadow-lg"
              onPress={() => navigation.navigate('GisMap', { serverUrl })}
            >
               <View className="bg-blue-500/20 w-12 h-12 rounded-full items-center justify-center mb-3">
                 <Text className="text-2xl">🗺️</Text>
               </View>
               <Text className="text-white font-black text-xs text-center">Peta GIS Desa</Text>
            </TouchableOpacity>

            <TouchableOpacity className="w-[48%] bg-slate-800 p-5 rounded-3xl border border-slate-700 mb-4 items-center shadow-lg">
               <View className="bg-amber-500/20 w-12 h-12 rounded-full items-center justify-center mb-3">
                 <Text className="text-2xl">👥</Text>
               </View>
               <Text className="text-white font-black text-xs text-center">Wajib Pajak</Text>
            </TouchableOpacity>

            <TouchableOpacity className="w-[48%] bg-slate-800 p-5 rounded-3xl border border-slate-700 mb-4 items-center shadow-lg">
               <View className="bg-rose-500/20 w-12 h-12 rounded-full items-center justify-center mb-3">
                 <Text className="text-2xl">⚠️</Text>
               </View>
               <Text className="text-white font-black text-xs text-center">Laporan Kendala</Text>
            </TouchableOpacity>
        </View>

        <TouchableOpacity 
          className="bg-rose-500/20 border border-rose-500/50 px-8 py-4 rounded-xl w-full"
          onPress={handleLogout}
        >
          <Text className="text-rose-400 text-center font-bold uppercase tracking-widest text-xs">Keluar (Logout)</Text>
        </TouchableOpacity>
      </ScrollView>

      <StatusBar style="light" />
    </View>
  );
}
