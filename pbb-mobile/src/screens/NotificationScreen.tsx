import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert, Modal } from 'react-native';
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

  // Status Modal State
  const [statusModal, setStatusModal] = useState<{ visible: boolean, type: 'success' | 'error', title: string, message: string }>({
    visible: false,
    type: 'success',
    title: '',
    message: ''
  });

  const handleTransferResponse = async (notifId: string, requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    setRefreshing(true);
    try {
      const url = joinServerUrl(serverUrl, '/api/mobile/officer/transfer-response');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status, userId: user.id })
      });
      const data = await res.json();
      if (data.success) {
        setStatusModal({
          visible: true,
          type: 'success',
          title: 'Berhasil!',
          message: data.message || 'Permintaan telah diproses.'
        });
        // Mark notification as read/processed immediately
        markAsRead(notifId); // Non-blocking
        fetchNotifications();
      } else {
        setStatusModal({
          visible: true,
          type: 'error',
          title: 'Gagal',
          message: data.error || 'Terjadi kesalahan sistem'
        });
        setRefreshing(false);
      }
    } catch (err) {
      setStatusModal({
        visible: true,
        type: 'error',
        title: 'Network Error',
        message: 'Gagal terhubung ke server'
      });
      setRefreshing(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
       const url = joinServerUrl(serverUrl, '/api/mobile/officer/notifications');
       await fetch(url, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ userId: user.id, notificationId: id })
       });
    } catch (e) {}
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
            const isRequest = notif.type === 'REQUEST' && notif.link;

            return (
              <View key={notif.id} className="bg-white p-5 rounded-[28px] mb-4 border border-slate-100 shadow-sm">
                 <View className="flex-row items-start">
                    <View className="w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: icon.bg }}>
                        <Ionicons name={icon.name as any} size={24} color={icon.color} />
                    </View>
                    <View className="flex-1 ml-4">
                        <View className="flex-row justify-between items-start">
                          <Text className="text-slate-900 font-bold text-sm mb-1 flex-1 pr-2">{notif.title}</Text>
                          {!notif.isRead && <View className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />}
                        </View>
                        <Text className="text-slate-500 text-xs leading-5">{notif.message}</Text>
                        <Text className="text-slate-400 text-[9px] font-bold mt-2 uppercase tracking-widest">
                          {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                 </View>
                 
                 {isRequest && !notif.isRead && (
                   <View className="flex-row gap-3 mt-4 pt-4 border-t border-slate-50">
                      <TouchableOpacity 
                        onPress={() => handleTransferResponse(notif.id, notif.link, 'ACCEPTED')}
                        className="flex-1 bg-emerald-500 py-3 rounded-xl items-center justify-center flex-row shadow-sm shadow-emerald-500/20"
                      >
                         <Text className="text-white font-black text-[10px] uppercase tracking-widest">Terima</Text>
                         <Ionicons name="checkmark-circle" size={14} color="white" style={{ marginLeft: 6 }} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => handleTransferResponse(notif.id, notif.link, 'REJECTED')}
                        className="flex-1 bg-rose-50 py-3 rounded-xl items-center justify-center flex-row border border-rose-100"
                      >
                         <Text className="text-rose-500 font-black text-[10px] uppercase tracking-widest">Tolak</Text>
                         <Ionicons name="close-circle" size={14} color="#f43f5e" style={{ marginLeft: 6 }} />
                      </TouchableOpacity>
                   </View>
                 )}
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

      {/* Result Modal (Success/Error) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={statusModal.visible}
        onRequestClose={() => setStatusModal({ ...statusModal, visible: false })}
      >
        <View className="flex-1 bg-slate-900/60 justify-center items-center p-8">
           <View className="bg-white w-full rounded-[40px] p-8 items-center shadow-2xl">
              <View className={`w-20 h-20 ${statusModal.type === 'success' ? 'bg-emerald-50' : 'bg-rose-50'} rounded-[28px] items-center justify-center mb-6`}>
                 <Ionicons 
                    name={statusModal.type === 'success' ? 'checkmark-circle' : 'alert-circle'} 
                    size={48} 
                    color={statusModal.type === 'success' ? '#10b981' : '#f43f5e'} 
                 />
              </View>
              
              <Text className="text-2xl font-black text-slate-900 mb-2 text-center uppercase tracking-tighter">{statusModal.title}</Text>
              
              <View className="bg-slate-50 p-6 rounded-3xl w-full mb-8 border border-slate-100">
                <Text className="text-center text-slate-500 text-sm font-bold leading-relaxed">
                   {statusModal.message}
                </Text>
              </View>

              <TouchableOpacity 
                 className={`w-full ${statusModal.type === 'success' ? 'bg-emerald-600' : 'bg-slate-900'} py-5 rounded-[22px] items-center shadow-lg`}
                 onPress={() => setStatusModal({ ...statusModal, visible: false })}
              >
                 <Text className="text-white font-black text-xs uppercase tracking-[2px]">Tutup</Text>
              </TouchableOpacity>
           </View>
        </View>
      </Modal>

      <StatusBar style="light" />
    </View>
  );
}
