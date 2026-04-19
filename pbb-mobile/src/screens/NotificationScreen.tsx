import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import type { ScreenProps } from '../types/navigation';
import { joinServerUrl } from '../utils/server';
import { ScalableButton } from '../components/ScalableButton';
import { AppScreenHeader } from '../components/AppScreenHeader';
import { AppModalCard } from '../components/AppModalCard';
import { AppEmptyState } from '../components/AppEmptyState';
import { AppSkeletonCard } from '../components/AppSkeletonCard';
import { appTheme } from '../theme/app-theme';

export default function NotificationScreen({ route, navigation }: ScreenProps<'Notification'>) {
  const { serverUrl, user } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [statusModal, setStatusModal] = useState<{ visible: boolean; type: 'success' | 'error'; title: string; message: string }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

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
      case 'REQUEST':
        return { name: 'swap-horizontal', color: appTheme.colors.info, bg: appTheme.colors.infoSoft };
      case 'ACCEPTED':
        return { name: 'checkmark-circle', color: appTheme.colors.success, bg: appTheme.colors.successSoft };
      case 'REJECTED':
        return { name: 'close-circle', color: appTheme.colors.danger, bg: appTheme.colors.dangerSoft };
      default:
        return { name: 'information-circle', color: appTheme.colors.primary, bg: appTheme.colors.primarySoft };
    }
  };

  const handleTransferResponse = async (notifId: string, requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    setRefreshing(true);
    try {
      const url = joinServerUrl(serverUrl, '/api/mobile/officer/transfer-response');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status, userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusModal({
          visible: true,
          type: 'success',
          title: 'Permintaan diproses',
          message: data.message || 'Permintaan telah diproses.',
        });
        markAsRead(notifId);
        fetchNotifications();
      } else {
        setStatusModal({
          visible: true,
          type: 'error',
          title: 'Permintaan gagal',
          message: data.error || 'Terjadi kesalahan sistem',
        });
        setRefreshing(false);
      }
    } catch (err) {
      setStatusModal({
        visible: true,
        type: 'error',
        title: 'Koneksi bermasalah',
        message: 'Gagal terhubung ke server',
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
        body: JSON.stringify({ userId: user.id, notificationId: id }),
      });
    } catch (e) {}
  };

  const markAllAsRead = async () => {
    try {
      const url = joinServerUrl(serverUrl, '/api/mobile/officer/notifications');
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, markAll: true }),
      });
    } catch (err) {
      console.error('Mark as read Error:', err);
    }
  };

  const renderHeader = () => (
    <AppScreenHeader title="Notifikasi" subtitle="Panel Petugas" onBack={() => navigation.goBack()}>
      <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 13, lineHeight: 20, marginTop: 6 }}>
        Pantau permintaan masuk, update status transfer, dan aktivitas operasional terbaru dalam satu tempat.
      </Text>
    </AppScreenHeader>
  );

  const renderItem = ({ item: notif }: { item: any }) => {
    const icon = getIcon(notif.type);
    const date = new Date(notif.createdAt);
    const isRequest = notif.type === 'REQUEST' && notif.link;

    return (
      <View
        style={{
          backgroundColor: appTheme.colors.surface,
          borderRadius: 26,
          padding: 18,
          borderWidth: 1,
          borderColor: isRequest && !notif.isRead ? '#c8dde9' : appTheme.colors.border,
          marginBottom: 14,
          ...appTheme.shadow.card,
        }}
      >
        {isRequest && !notif.isRead ? (
          <View style={{ alignSelf: 'flex-start', marginBottom: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: appTheme.colors.infoSoft }}>
            <Text style={{ color: appTheme.colors.info, fontSize: 10, fontWeight: '900' }}>PERLU RESPONS</Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: icon.bg }}>
            <Ionicons name={icon.name as any} size={24} color={icon.color} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={{ color: appTheme.colors.text, fontSize: 15, fontWeight: '800', flex: 1, marginRight: 10 }}>{notif.title}</Text>
              {!notif.isRead ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: appTheme.colors.primary, marginTop: 4 }} /> : null}
            </View>
            <Text style={{ color: appTheme.colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 6 }}>{notif.message}</Text>
            <Text style={{ color: appTheme.colors.textSoft, fontSize: 11, marginTop: 10 }}>
              {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {isRequest && !notif.isRead ? (
          <View style={{ flexDirection: 'row', marginTop: 16 }}>
            <ScalableButton onPress={() => handleTransferResponse(notif.id, notif.link, 'ACCEPTED')} style={{ flex: 1, marginRight: 6 }}>
              <View style={{ backgroundColor: appTheme.colors.primary, borderRadius: 18, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '900', marginLeft: 6 }}>Terima</Text>
              </View>
            </ScalableButton>
            <ScalableButton onPress={() => handleTransferResponse(notif.id, notif.link, 'REJECTED')} style={{ flex: 1, marginLeft: 6 }}>
              <View style={{ backgroundColor: appTheme.colors.dangerSoft, borderRadius: 18, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderWidth: 1, borderColor: '#efcccc' }}>
                <Ionicons name="close-circle-outline" size={16} color={appTheme.colors.danger} />
                <Text style={{ color: appTheme.colors.danger, fontSize: 12, fontWeight: '900', marginLeft: 6 }}>Tolak</Text>
              </View>
            </ScalableButton>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <FlatList
        data={loading ? [] : notifications}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListHeaderComponentStyle={{ marginBottom: 18 }}
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingHorizontal: 24 }}>
              <AppSkeletonCard compact />
              <AppSkeletonCard compact />
              <AppSkeletonCard compact />
            </View>
          ) : (
            <View style={{ paddingHorizontal: 24 }}>
              <AppEmptyState icon="notifications-off-outline" title="Tidak ada notifikasi" description="Belum ada aktivitas atau permintaan baru." />
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: 60 }}
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={appTheme.colors.primary} />}
        initialNumToRender={8}
        windowSize={7}
        maxToRenderPerBatch={10}
        removeClippedSubviews
      />

      <AppModalCard
        visible={statusModal.visible}
        title={statusModal.title}
        message={statusModal.message}
        icon={statusModal.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
        iconColor={statusModal.type === 'success' ? appTheme.colors.success : appTheme.colors.danger}
        iconBg={statusModal.type === 'success' ? appTheme.colors.successSoft : appTheme.colors.dangerSoft}
        onRequestClose={() => setStatusModal({ ...statusModal, visible: false })}
      >
        <ScalableButton onPress={() => setStatusModal({ ...statusModal, visible: false })} style={{ marginTop: 18 }}>
          <View style={{ backgroundColor: statusModal.type === 'success' ? appTheme.colors.primary : appTheme.colors.danger, borderRadius: 18, paddingVertical: 15, alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 13, fontWeight: '900' }}>Tutup</Text>
          </View>
        </ScalableButton>
      </AppModalCard>

      <StatusBar style="light" />
    </View>
  );
}
