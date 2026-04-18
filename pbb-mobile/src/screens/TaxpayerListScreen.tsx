import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl, formatCurrency } from '../utils/server';

export default function TaxpayerListScreen({ route, navigation }: ScreenProps<'TaxpayerList'>) {
  const { serverUrl, user, tahun, villageName } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [taxpayers, setTaxpayers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [searchTimer, setSearchTimer] = useState<any>(null);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    // Reset to page 1 for every search change
    setPage(1);
    fetchTaxpayers(1, search);
  }, [search]);

  const fetchTaxpayers = async (pageNum: number, searchQuery: string) => {
    if (pageNum > 1) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({
        userId: user.id,
        tahun: tahun.toString(),
        search: searchQuery,
        page: pageNum.toString(),
        limit: '20'
      });
      const url = joinServerUrl(serverUrl, `/api/mobile/officer/taxpayers?${params.toString()}`);
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        if (pageNum === 1) {
          setTaxpayers(data.data);
        } else {
          setTaxpayers(prev => [...prev, ...data.data]);
        }
        setHasMore(data.hasMore);
      }
    } catch (err) {
      console.error('Fetch Taxpayers Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchTaxpayers(1, search);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTaxpayers(nextPage, search);
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-slate-900 pt-16 pb-6 px-6 rounded-b-[32px] shadow-lg">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/10"
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <View className="ml-4">
            <Text className="text-white text-xl font-black">Data Wajib Pajak</Text>
            <Text className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">Wilayah {villageName}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="relative">
          <Ionicons name="search" size={18} color="#94a3b8" style={{ position: 'absolute', left: 16, top: 14, zIndex: 1 }} />
          <TextInput 
            className="bg-white/10 border border-white/20 rounded-2xl py-3 pl-12 pr-6 text-white font-bold"
            placeholder="Cari Nama atau NOP..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-6 pt-6" 
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {loading && page === 1 ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : taxpayers.length > 0 ? (
          <>
            {taxpayers.map((wp) => (
              <TouchableOpacity 
                key={wp.id} 
                className="bg-white p-5 rounded-3xl mb-4 border border-slate-100 shadow-sm"
                onPress={() => navigation.navigate('TaxpayerDetail', { 
                  serverUrl, 
                  taxpayer: wp, 
                  user, 
                  villageName 
                })}
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1 mr-4">
                    <Text className="text-slate-900 font-black text-sm uppercase" numberOfLines={1}>{wp.namaWp}</Text>
                    <Text className="text-slate-400 font-bold text-[10px] tracking-widest mt-0.5">{wp.nop}</Text>
                  </View>
                  <View className={`px-3 py-1 rounded-full ${wp.paymentStatus === 'LUNAS' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                    <Text className={`text-[8px] font-black uppercase ${wp.paymentStatus === 'LUNAS' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {wp.paymentStatus === 'LUNAS' ? 'LUNAS' : 'PIUTANG'}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center mb-4">
                   <Ionicons name="location-outline" size={12} color="#94a3b8" />
                   <Text className="text-slate-400 text-[10px] font-bold ml-1 uppercase">
                     Dusun {wp.dusun || '-'} • RT {wp.rt || '-'} / RW {wp.rw || '-'}
                   </Text>
                </View>

                <View className="flex-row justify-between items-center bg-slate-50 p-3 rounded-2xl">
                   <Text className="text-slate-400 font-black text-[9px] uppercase">Ketetapan</Text>
                   <Text className="text-slate-900 font-black text-sm">{formatCurrency(wp.ketetapan)}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {hasMore && (
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={loadMore}
                disabled={loadingMore}
                className="bg-white border border-slate-100 py-4 rounded-2xl items-center shadow-sm mb-4"
              >
                {loadingMore ? (
                  <ActivityIndicator color="#3b82f6" />
                ) : (
                  <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest">Muat Lebih Banyak</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View className="py-20 items-center">
            <Ionicons name="documents-outline" size={64} color="#e2e8f0" />
            <Text className="text-slate-400 font-bold text-sm mt-4">Data tidak ditemukan</Text>
            <Text className="text-slate-400 text-xs">Coba kata kunci lain atau filter berbeda</Text>
          </View>
        )}
      </ScrollView>
      <StatusBar style="light" />
    </View>
  );
}
