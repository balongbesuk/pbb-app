import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function DashboardScreen({ route, navigation }: any) {
  const { serverUrl, stats, villageName } = route.params;
  const [isDark, setIsDark] = useState(true);

  const toggleColorScheme = () => {
    setIsDark(!isDark);
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#09090b]' : 'bg-slate-100'}`}>
       {/* Background Glows (Supported in tailwind web mostly) */}
       <View className={`absolute -top-10 -left-10 w-96 h-96 ${isDark ? 'bg-blue-900/20' : 'bg-blue-200/50'} rounded-full`}></View>
       
       <ScrollView className="flex-1 px-6 pt-16 pb-12" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="flex-row items-center justify-between mb-8">
             <View className="flex-1">
                <View className={`px-3 py-1.5 rounded-full self-start mb-2 border ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-100 border-blue-200'}`}>
                  <Text className={`font-bold text-[9px] uppercase tracking-widest ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{villageName || 'Pemda System'}</Text>
                </View>
                <Text className={`text-3xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>PBB Digital</Text>
             </View>
             
             <View className="flex-row">
               <TouchableOpacity 
                  className={`w-12 h-12 rounded-full items-center justify-center border mr-2 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`} 
                  onPress={toggleColorScheme}
               >
                  <Text className="text-xl">{isDark ? '☀️' : '🌙'}</Text>
               </TouchableOpacity>

               <TouchableOpacity 
                  className={`w-12 h-12 rounded-full items-center justify-center border ${isDark ? 'bg-white/5 border-white/10' : 'bg-blue-600 border-blue-700 shadow-sm'}`} 
                  onPress={() => navigation.navigate('Login', { serverUrl })}
               >
                  <Text className="text-xl">{isDark ? '👮' : '🛡️'}</Text>
               </TouchableOpacity>
             </View>
          </View>

          {/* Main Stats Card - Highly Styled */}
          <View className="mb-8">
            <View className="bg-blue-600 rounded-[32px] p-6 shadow-2xl relative overflow-hidden">
              <View className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full"></View>
              <View className="absolute -bottom-8 -left-8 w-40 h-40 bg-indigo-500/50 rounded-full"></View>

              <Text className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1 z-10">Total SPOP Terdaftar</Text>
              <View className="flex-row items-baseline mb-4 z-10">
                <Text className="text-white text-5xl font-black tracking-tighter">{stats.totalSppt.toLocaleString('id-ID')}</Text>
                <Text className="text-blue-200 font-bold ml-2 text-sm">Berkas</Text>
              </View>
              
              <View className="bg-black/20 self-start px-4 py-2.5 rounded-2xl z-10 flex-row items-center border border-white/10">
                <View className="w-2 h-2 bg-emerald-400 rounded-full mr-2 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></View>
                <Text className="text-white text-[11px] font-bold tracking-wide">{stats.lunasSppt.toLocaleString('id-ID')} Pajak Telah Lunas</Text>
              </View>
            </View>
          </View>

          <Text className={`font-black text-[10px] uppercase tracking-widest ml-1 mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Layanan Utama</Text>

          {/* Asymmetrical Grid */}
          <View className="flex-row justify-between mb-4">
            {/* Card 1: Cek Tagihan - Tall Card */}
            <TouchableOpacity 
              className={`w-[48%] rounded-3xl p-5 border items-start justify-between min-h-[170px] ${isDark ? 'bg-[#18181b] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}
              onPress={() => navigation.navigate('PaymentCheck', { serverUrl, isDark })}
            >
              <View className={`w-14 h-14 rounded-2xl items-center justify-center mb-4 border ${isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
                <Text className="text-2xl">💳</Text>
              </View>
              <View>
                <Text className={`font-black text-lg mb-1 leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Cek{'\n'}Tagihan</Text>
                <Text className={`text-[10px] font-medium leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Cari NOP & status</Text>
              </View>
            </TouchableOpacity>

            {/* Card 2: Mutasi PBB - Tall Card */}
            <TouchableOpacity 
              className={`w-[48%] rounded-3xl p-5 border items-start justify-between min-h-[170px] ${isDark ? 'bg-[#18181b] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}
              onPress={() => navigation.navigate('Mutation', { serverUrl, isDark })}
            >
              <View className={`w-14 h-14 rounded-2xl items-center justify-center mb-4 border ${isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
                <Text className="text-2xl">🔄</Text>
              </View>
              <View>
                <Text className={`font-black text-lg mb-1 leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Mutasi{'\n'}Pajak</Text>
                <Text className={`text-[10px] font-medium leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Pengajuan ubah data</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Full Width List Cards */}
          <TouchableOpacity className={`w-full p-4 rounded-3xl border flex-row items-center mb-4 ${isDark ? 'bg-[#18181b] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
            <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 border ${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-100'}`}>
              <Text className="text-xl">📑</Text>
            </View>
            <View className="flex-1">
              <Text className={`font-black text-sm mb-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>Pencarian Data SPOP</Text>
              <Text className={`text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Arsip digital wajib pajak</Text>
            </View>
            <View className={`w-8 h-8 rounded-full items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
              <Text className="text-slate-400 font-bold text-xs">→</Text>
            </View>
          </TouchableOpacity>

          {/* Admin Login Button - Differentiated */}
          <TouchableOpacity 
            className={`w-full p-4 rounded-3xl border flex-row items-center mb-10 ${isDark ? 'bg-blue-600/10 border-blue-500/30' : 'bg-slate-900 border-slate-800 shadow-md'}`}
            onPress={() => navigation.navigate('Login', { serverUrl, isDark })}
          >
            <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 border ${isDark ? 'bg-blue-500/20 border-blue-500/30' : 'bg-slate-800 border-slate-700'}`}>
              <Text className="text-xl">🛡️</Text>
            </View>
            <View className="flex-1">
              <Text className={`font-black text-sm mb-0.5 ${isDark ? 'text-blue-400' : 'text-white'}`}>Akses Petugas / Admin</Text>
              <Text className={`text-[10px] font-medium ${isDark ? 'text-blue-500/70' : 'text-slate-400'}`}>Login untuk pemungut pajak</Text>
            </View>
            <View className={`w-8 h-8 rounded-full items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-white/10'}`}>
              <Text className={`font-bold text-xs ${isDark ? 'text-blue-400' : 'text-white'}`}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            className="py-4 items-center mb-8"
            onPress={() => navigation.replace('Onboarding')}
          >
            <Text className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">Putuskan Koneksi Server</Text>
          </TouchableOpacity>
       </ScrollView>
       <StatusBar style="light" />
    </View>
  );
}
