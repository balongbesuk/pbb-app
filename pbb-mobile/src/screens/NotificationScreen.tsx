import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl } from '../utils/server';

export default function NotificationScreen({ route, navigation }: ScreenProps<'Notification'>) {
  const { serverUrl, user } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetchNotifications();
    markAllAsRead();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const url = joinServerUrl(serverUrl, `/api/mobile/officer/notifications?userId=${user.id}`);
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (err) {
      console.error('Fetch Notifications Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const url = joinServerUrl(serverUrl, '/api/mobile/officer/notifications');
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, markAll: true })
      });
    } catch (err) {
      console.error('Mark as read Error:', err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'REQUEST': return { name: 'swap-horizontal', color: '#3b82f6', bg: '#eff6ff' };
      case 'ACCEPTED': return { name: 'checkmark-circle', color: '#10b981', bg: '#ecfdf5' };
      case 'REJECTED': return { name: 'close-circle', color: '#ef4444', bg: '#fef2f2' };
      default: return { name: 'information-circle', color: '#6366f1', bg: '#eef2ff' };
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
            <Text className="text-white text-xl font-black">Notifikasi</Text>
            <Text className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">Pemberitahuan Sistem</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-6 pt-6" 
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {notifications.length > 0 ? (
          notifications.map((notif) => {
            const icon = getIcon(notif.type);
            const date = new Date(notif.createdAt);
            return (
              <View key={notif.id} className="bg-white p-5 rounded-[28px] mb-4 border border-slate-100 shadow-sm flex-row items-start">
                 <View className="w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: icon.bg }}>
                    <Ionicons name={icon.name as any} size={24} color={icon.color} />
                 </View>
                 <View className="flex-1 ml-4">
                    <Text className="text-slate-900 font-bold text-sm mb-1">{notif.title}</Text>
                    <Text className="text-slate-500 text-xs leading-5">{notif.message}</Text>
                    <Text className="text-slate-400 text-[9px] font-bold mt-2 uppercase tracking-widest">
                       {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                 </View>
                 {!notif.isRead && <View className="w-2 h-2 rounded-full bg-blue-500 ml-2 mt-2" />}
              </View>
            );
          })
        ) : loading ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <View className="py-20 items-center">
            <Ionicons name="notifications-off-outline" size={64} color="#e2e8f0" />
            <Text className="text-slate-400 font-bold text-sm mt-4">Tidak ada notifikasi</Text>
          </View>
        )}
      </ScrollView>

      <StatusBar style="light" />
    </View>
  );
}
