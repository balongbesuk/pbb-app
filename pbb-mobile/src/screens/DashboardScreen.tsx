import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, TouchableWithoutFeedback } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function DashboardScreen({ route, navigation }: any) {
  const { villageName, serverUrl, stats = {}, villageLogo } = route.params || {};
  const [menuVisible, setMenuVisible] = useState(false);

  const totalSppt = stats.totalSppt || 0;
  const lunasSppt = stats.lunasSppt || 0;

  // Dynamic Logo Logic
  const getLogoSource = () => {
    if (villageLogo) {
      if (villageLogo.startsWith('http')) {
        return { uri: villageLogo };
      }
      return { uri: `${serverUrl.replace(/\/$/, '')}${villageLogo.startsWith('/') ? '' : '/'}${villageLogo}` };
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
                 <Text style={{ fontSize: 26, fontWeight: '900', color: '#0f172a', letterSpacing: -1 }}>PBB Mobile</Text>
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

           {/* Informational Banner Card - Premium Visual */}
           <View className="mt-8 overflow-hidden rounded-[32px] bg-emerald-900 shadow-xl shadow-emerald-900/20">
              <View className="flex-row items-center p-6 relative">
                 {/* Decorative background gradients */}
                 <View className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-800/20 rounded-full" />
                 
                 <View className="flex-1 pr-4 z-10">
                    <Text className="text-white text-2xl font-black leading-tight tracking-tight">Cek Tagihan PBB{"\n"}Lebih Mudah</Text>
                    <Text className="text-emerald-100/60 mt-2 font-bold text-[11px] leading-relaxed">Cari data berdasarkan NOP{"\n"}atau nama wajib pajak</Text>
                 </View>

                 <View className="w-32 h-32 z-10">
                    <Image 
                       source={{ uri: 'file:///C:/Users/MSI MODern 14/.gemini/antigravity/brain/621bc9c6-85ca-47dc-9762-106e7f713578/pbb_house_banner_illustration_1775836881840.png' }}
                       className="w-full h-full"
                       resizeMode="contain"
                    />
                 </View>
              </View>
           </View>
         </View>

         {/* Menu Section */}
         <View className="px-6 mt-8">
           <Text className="text-slate-400 font-black text-[10px] uppercase tracking-[2px] mb-5 ml-1">Layanan Utama</Text>
           
           <View className="flex-row flex-wrap justify-between">
              {/* Card 1 */}
              <TouchableOpacity 
                className="w-[48%] bg-white p-6 rounded-[28px] shadow-sm mb-4 border border-slate-100/50"
                onPress={() => navigation.navigate('PaymentCheck', { serverUrl })}
              >
                <View className="w-12 h-12 bg-orange-50 rounded-2xl items-center justify-center mb-4">
                  <Text className="text-2xl">💳</Text>
                </View>
                <Text className="font-black text-slate-800 text-base leading-5">Cek{"\n"}Tagihan</Text>
                <Text className="text-[9px] text-slate-400 font-bold mt-1">Cari NOP & status</Text>
              </TouchableOpacity>

              {/* Card 2 */}
              <TouchableOpacity 
                className="w-[48%] bg-white p-6 rounded-[28px] shadow-sm mb-4 border border-slate-100/50"
                onPress={() => navigation.navigate('Mutation', { serverUrl })}
              >
                <View className="w-12 h-12 bg-emerald-50 rounded-2xl items-center justify-center mb-4">
                  <Text className="text-2xl">🔄</Text>
                </View>
                <Text className="font-black text-slate-800 text-base leading-5">Mutasi{"\n"}Pajak</Text>
                <Text className="text-[9px] text-slate-400 font-bold mt-1">Permohonan ubah data</Text>
              </TouchableOpacity>

              {/* Card 3 - Full Width */}
              <TouchableOpacity className="w-full bg-white p-5 rounded-[28px] flex-row items-center shadow-sm mb-4 border border-slate-100/50">
                 <View className="w-14 h-14 bg-amber-50 rounded-2xl items-center justify-center mr-4">
                    <Text className="text-2xl">📑</Text>
                 </View>
                 <View className="flex-1">
                    <Text className="font-black text-slate-800 text-base">Pencarian Data SPOP</Text>
                    <Text className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Arsip Digital</Text>
                 </View>
                 <View className="w-9 h-9 bg-slate-50 rounded-full items-center justify-center">
                    <Text className="text-slate-300 font-bold">→</Text>
                 </View>
              </TouchableOpacity>

              {/* Card 4 - Extra Access */}
              <TouchableOpacity 
                className="w-full bg-blue-50/50 p-5 rounded-[28px] flex-row items-center border border-blue-100/50"
                onPress={() => navigation.navigate('Login', { serverUrl })}
              >
                 <View className="w-14 h-14 bg-white rounded-2xl items-center justify-center mr-4 shadow-sm">
                    <Text className="text-2xl">🛡️</Text>
                 </View>
                 <View className="flex-1">
                    <Text className="font-black text-blue-900 text-base">Akses Petugas</Text>
                    <Text className="text-[9px] text-blue-600 font-bold uppercase tracking-wider">Khusus Operator</Text>
                 </View>
                 <View className="w-9 h-9 bg-white rounded-full items-center justify-center shadow-sm">
                    <Text className="text-blue-400 font-bold">→</Text>
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
                 <View style={{ flexDirection: 'row', alignItems: 'center', justifyBetween: 'space-between', marginBottom: 20 }}>
                   <View style={{ flex: 1 }}>
                     <Text style={{ fontSize: 20, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 }}>Pengaturan</Text>
                     <Text style={{ fontSize: 9, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2 }}>Akses & Koneksi Portal</Text>
                   </View>
                   <TouchableOpacity
                     onPress={() => setMenuVisible(false)}
                     style={{ width: 36, height: 36, backgroundColor: '#f1f5f9', borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
                   >
                     <Text style={{ color: '#64748b', fontWeight: '700' }}>✕</Text>
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
                        navigation.navigate('Login', { serverUrl });
                      }}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Text style={{ fontSize: 18 }}>🛡️</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '900', color: '#1e293b', fontSize: 14 }}>Akses Petugas</Text>
                        <Text style={{ fontSize: 9, color: '#3b82f6', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Operator Panel</Text>
                      </View>
                      <Text style={{ color: '#93c5fd', fontWeight: '700', fontSize: 18 }}>›</Text>
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
                        <Text style={{ fontSize: 18 }}>🔗</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '900', color: '#1e293b', fontSize: 14 }}>Ganti Koneksi</Text>
                        <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Server URL</Text>
                      </View>
                      <Text style={{ color: '#cbd5e1', fontWeight: '700', fontSize: 18 }}>›</Text>
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
