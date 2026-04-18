import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl, formatCurrency } from '../utils/server';

export default function AdminDashboardScreen({ route, navigation }: ScreenProps<'AdminDashboard'>) {
  const { serverUrl, user, villageName } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  
  const firstName = user?.name?.trim()?.split(/\s+/)[0] || 'Petugas';
  const currentYear = dashboardData?.tahunPajak || new Date().getFullYear();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const url = joinServerUrl(serverUrl, `/api/mobile/officer/dashboard?userId=${user.id}&tahun=${new Date().getFullYear()}`);
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Fetch Dashboard Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  // Logout Modal State
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleLogout = async () => {
    setLogoutModalVisible(false);
    try {
      await AsyncStorage.removeItem('@admin_magic_token');
      navigation.replace('Dashboard', { 
        serverUrl, 
        villageName,
        stats: { totalSppt: dashboardData?.stats?.totalWp || 0, lunasSppt: dashboardData?.stats?.wpLunas || 0 }
      });
    } catch (e) {
      navigation.replace('Dashboard', { serverUrl, villageName });
    }
  };

  const stats = dashboardData?.stats || {
    totalTarget: 0,
    totalWp: 0,
    totalLunas: 0,
    wpLunas: 0,
    wpSengketa: 0,
    wpTdkTerbit: 0
  };

  const progress = stats.totalTarget > 0 ? (stats.totalLunas / stats.totalTarget) : 0;
  const progressPercent = (progress * 100).toFixed(1);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-slate-400 font-bold mt-4 uppercase tracking-widest text-xs">Memuat Data Panel...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {/* Premium Light Header - Standardized with Main Service */}
        <View className="bg-white pt-16 pb-32 px-6 rounded-b-[40px] shadow-sm border-b border-slate-100">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-blue-600 font-black text-[10px] uppercase tracking-[3px] mb-1">PBB Mobile</Text>
              <Text className="text-slate-900 text-3xl font-black tracking-tighter">Halo, {firstName}!</Text>
              <Text className="text-slate-400 text-xs font-bold mt-1">
                {villageName} • Tahun {currentYear}
              </Text>
            </View>
            <TouchableOpacity 
              className="w-14 h-14 bg-blue-50 rounded-2xl items-center justify-center border border-blue-100"
              onPress={() => navigation.navigate('Notification', { serverUrl, user })}
            >
               <Ionicons name="notifications-outline" size={28} color="#3b82f6" />
               {dashboardData?.unreadNotificationsCount > 0 && (
                 <View className="absolute -top-1 -right-1 bg-rose-500 min-w-[20px] h-[20px] rounded-full items-center justify-center border-2 border-white px-1">
                   <Text className="text-white text-[10px] font-black">{dashboardData.unreadNotificationsCount}</Text>
                 </View>
               )}
            </TouchableOpacity>
          </View>

          {/* Floating Performance Card */}
          <View className="absolute -bottom-16 left-6 right-6 bg-white rounded-[32px] p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
             <View className="flex-row justify-between items-end mb-4">
                <View>
                   <Text className="text-slate-400 font-black text-[9px] uppercase tracking-widest mb-1">Target Terkumpul</Text>
                   <Text className="text-slate-900 text-2xl font-black tracking-tighter">{formatCurrency(stats.totalLunas)}</Text>
                   <Text className="text-emerald-500 text-[10px] font-bold mt-1 uppercase mb-2">
                     {stats.wpLunas} WP Telah Lunas
                   </Text>
                </View>
                <View className="items-end">
                   <View className="bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 mb-2">
                      <Text className="text-blue-600 font-black text-xs">{progressPercent}%</Text>
                   </View>
                   <Text className="text-slate-400 font-bold text-[9px] uppercase">Dari {formatCurrency(stats.totalTarget)}</Text>
                </View>
             </View>

             <View className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <View 
                  className="h-full bg-blue-600 rounded-full" 
                  style={{ width: `${Math.min(parseFloat(progressPercent), 100)}%` }} 
                />
             </View>
             
             <View className="flex-row gap-2 mt-4 pt-4 border-t border-slate-50">
                {stats.wpSengketa > 0 && (
                   <View className="bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                      <Text className="text-[8px] font-black text-amber-700 uppercase">{stats.wpSengketa} Sengketa</Text>
                   </View>
                )}
                <View className="bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 flex-1">
                   <Text className="text-[8px] font-black text-indigo-700 uppercase text-center" numberOfLines={1}>
                     Piutang: {formatCurrency(stats.totalTarget - stats.totalLunas)}
                   </Text>
                </View>
             </View>
          </View>
        </View>

        {/* Operational Menu Selection - List Style standardized with Main Service */}
        <View className="mt-24 px-6">
           <Text className="text-slate-400 font-black text-[10px] uppercase tracking-[2px] mb-5 ml-1">Layanan Operasional</Text>
           
           <View className="flex-col space-y-3">
              <TouchableOpacity 
                activeOpacity={0.7}
                className="w-full bg-white p-4 rounded-[24px] flex-row items-center border border-slate-100 shadow-sm"
                onPress={() => navigation.navigate('PaymentCheck', { serverUrl })}
              >
                 <View className="w-14 h-14 bg-emerald-50 rounded-2xl items-center justify-center border border-emerald-100/50 mr-4">
                   <Ionicons name="cash-outline" size={26} color="#059669" />
                 </View>
                 <View className="flex-1">
                   <Text className="font-black text-slate-800 text-base leading-5 tracking-tight">Terima Setoran</Text>
                   <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Update Status Pembayaran</Text>
                 </View>
                 <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center border border-slate-100">
                   <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                 </View>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.7}
                className="w-full bg-white p-4 rounded-[24px] flex-row items-center border border-slate-100 shadow-sm mt-3"
                onPress={() => navigation.navigate('GisMap', { serverUrl })}
              >
                 <View className="w-14 h-14 bg-blue-50 rounded-2xl items-center justify-center border border-blue-100/50 mr-4">
                   <Ionicons name="map-outline" size={26} color="#2563eb" />
                 </View>
                 <View className="flex-1">
                   <Text className="font-black text-slate-800 text-base leading-5 tracking-tight">Peta GIS Wilayah</Text>
                   <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Peta Sebaran Lunas/Belum</Text>
                 </View>
                 <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center border border-slate-100">
                   <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                 </View>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.7}
                className="w-full bg-white p-4 rounded-[24px] flex-row items-center border border-slate-100 shadow-sm mt-3"
                onPress={() => navigation.navigate('TaxpayerList', { serverUrl, user, tahun: currentYear, villageName })}
              >
                 <View className="w-14 h-14 bg-indigo-50 rounded-2xl items-center justify-center border border-indigo-100/50 mr-4">
                   <Ionicons name="people-outline" size={26} color="#4f46e5" />
                 </View>
                 <View className="flex-1">
                   <Text className="font-black text-slate-800 text-base leading-5 tracking-tight">Data Wajib Pajak</Text>
                   <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Daftar Wajib Pajak Kelolaan</Text>
                 </View>
                 <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center border border-slate-100">
                   <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                 </View>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.7}
                className="w-full bg-white p-4 rounded-[24px] flex-row items-center border border-slate-100 shadow-sm mt-3"
                onPress={() => navigation.navigate('BillingHistory', { serverUrl, user, villageName })}
              >
                 <View className="w-14 h-14 bg-amber-50 rounded-2xl items-center justify-center border border-amber-100/50 mr-4">
                   <Ionicons name="receipt-outline" size={26} color="#d97706" />
                 </View>
                 <View className="flex-1">
                   <Text className="font-black text-slate-800 text-base leading-5 tracking-tight">Riwayat Penagihan</Text>
                   <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Log Transaksi & Penarikan</Text>
                 </View>
                 <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center border border-slate-100">
                   <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                 </View>
              </TouchableOpacity>
           </View>

           {/* Recent History Section Summary */}
           <View className="mt-8 mb-4 flex-row justify-between items-center px-1">
              <View className="flex-row items-center">
                 <Ionicons name="time-outline" size={16} color="#64748b" />
                 <Text className="ml-2 text-slate-500 font-black text-[10px] uppercase tracking-widest">Aktivitas Terakhir</Text>
              </View>
           </View>

           <View className="bg-white rounded-[28px] border border-slate-100 shadow-sm mb-8">
              {dashboardData?.logs?.length > 0 ? (
                dashboardData.logs.map((log: any, i: number) => {
                  const isUnpaid = log.details?.includes("BELUM_LUNAS") || log.details?.includes("TIDAK_TERBIT");
                  const date = new Date(log.createdAt);
                  return (
                    <View key={log.id} className={`flex-row items-center p-4 ${i < dashboardData.logs.length - 1 ? 'border-b border-slate-50' : ''}`}>
                       <View className={`w-10 h-10 rounded-xl items-center justify-center ${isUnpaid ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                          <Ionicons name={isUnpaid ? "close-circle" : "checkmark-circle"} size={20} color={isUnpaid ? "#e11d48" : "#059669"} />
                       </View>
                       <View className="flex-1 ml-3">
                          <Text className="text-slate-900 font-bold text-xs" numberOfLines={1}>{log.details}</Text>
                          <Text className="text-slate-400 text-[9px] font-bold mt-0.5">
                            {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                       </View>
                    </View>
                  );
                })
              ) : (
                <View className="py-8 items-center">
                   <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Belum ada aktivitas</Text>
                </View>
              )}
           </View>

           <TouchableOpacity 
             className="bg-rose-50 border border-rose-100 px-8 py-5 rounded-[28px] w-full mt-4 flex-row items-center justify-center"
             onPress={() => setLogoutModalVisible(true)}
           >
             <Ionicons name="log-out-outline" size={18} color="#e11d48" />
             <Text className="text-rose-600 text-center font-black uppercase tracking-[2px] text-[10px] ml-3">Keluar Sesi Petugas</Text>
           </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900/60 justify-center items-center p-8">
           <View className="bg-white w-full rounded-[40px] p-8 items-center shadow-2xl">
              <View className="w-20 h-20 bg-rose-50 rounded-[28px] items-center justify-center mb-6">
                 <Ionicons name="log-out" size={40} color="#f43f5e" />
              </View>
              
              <Text className="text-2xl font-black text-slate-900 mb-2 text-center uppercase tracking-tighter">Keluar Sesi</Text>
              
              <View className="bg-slate-50 p-6 rounded-3xl w-full mb-8 border border-slate-100">
                <Text className="text-center text-slate-500 text-xs font-bold leading-relaxed">
                   Apakah Anda yakin ingin mengakhiri sesi petugas lapangan ini?
                </Text>
              </View>

              <View className="w-full space-y-3">
                <TouchableOpacity 
                   className="w-full bg-rose-600 py-5 rounded-[22px] items-center shadow-lg shadow-rose-600/30 flex-row justify-center"
                   onPress={handleLogout}
                >
                   <Text className="text-white font-black text-xs uppercase tracking-[2px]">Ya, Keluar Sesi</Text>
                   <Ionicons name="checkmark-circle" size={18} color="white" style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setLogoutModalVisible(false)} 
                  className="py-4 w-full items-center mt-2"
                >
                  <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Tetap di Sini</Text>
                </TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>

      <StatusBar style="dark" />
    </View>
  );
}
