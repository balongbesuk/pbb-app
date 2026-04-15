import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl } from '../utils/server';

export default function BillingHistoryScreen({ route, navigation }: ScreenProps<'BillingHistory'>) {
  const { serverUrl, user, villageName } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const fetchLogs = async (pageNum: number) => {
    try {
      const url = joinServerUrl(serverUrl, `/api/mobile/officer/logs?userId=${user.id}&page=${pageNum}&limit=20`);
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        if (pageNum === 1) {
          setLogs(data.data);
        } else {
          setLogs([...logs, ...data.data]);
        }
        setHasMore(data.hasMore);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Fetch Logs Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs(1);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchLogs(page + 1);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-slate-900 pt-16 pb-6 px-6 rounded-b-[32px] shadow-lg">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/10"
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <View className="ml-4">
            <Text className="text-white text-xl font-black">Riwayat Penagihan</Text>
            <Text className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">{villageName}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-6 pt-6" 
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {logs.length > 0 ? (
          logs.map((log, i) => {
            const isUnpaid = log.details?.includes("BELUM_LUNAS") || log.details?.includes("TIDAK_TERBIT");
            const date = new Date(log.createdAt);
            return (
              <View key={log.id} className="flex-row mb-6">
                <View className="items-center mr-4">
                   <View className={`w-10 h-10 rounded-full items-center justify-center ${isUnpaid ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                      <Ionicons name={isUnpaid ? "close" : "cash"} size={20} color={isUnpaid ? "#e11d48" : "#059669"} />
                   </View>
                   {i < logs.length - 1 && <View className="w-0.5 flex-1 bg-slate-200 my-2" />}
                </View>
                <View className="flex-1 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                   <Text className="text-slate-900 font-bold text-sm leading-5">{log.details}</Text>
                   <View className="flex-row items-center mt-3">
                      <Ionicons name="calendar-outline" size={10} color="#94a3b8" />
                      <Text className="text-slate-400 text-[10px] font-bold ml-1">
                        {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                      <Text className="text-slate-200 mx-2">•</Text>
                      <Ionicons name="time-outline" size={10} color="#94a3b8" />
                      <Text className="text-slate-400 text-[10px] font-bold ml-1">
                        {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </Text>
                   </View>
                   {log.entityId && (
                     <View className="mt-3 pt-3 border-t border-slate-50 flex-row items-center">
                        <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Objek Pajak (ID):</Text>
                        <Text className="ml-2 text-slate-800 font-bold text-[10px]">{log.entityId}</Text>
                     </View>
                   )}
                </View>
              </View>
            );
          })
        ) : loading ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <View className="py-20 items-center">
            <Ionicons name="archive-outline" size={64} color="#e2e8f0" />
            <Text className="text-slate-400 font-bold text-sm mt-4 text-center">Belum ada riwayat transaksi</Text>
          </View>
        )}

        {hasMore && !loading && (
          <TouchableOpacity 
            onPress={loadMore}
            className="py-4 items-center bg-white rounded-2xl border border-slate-100 shadow-sm mt-2"
          >
            <Text className="text-blue-600 font-bold text-xs">Muat Lebih Banyak</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      <StatusBar style="light" />
    </View>
  );
}
