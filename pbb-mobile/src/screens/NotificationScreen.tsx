import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
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
  const [statusModal, setStatusModal] = useState<{ visible: boolean; type: 'success' | 'error'; title: string; message: string }>({ visible: false, type: 'success', title: '', message: '' });

  useEffect(() => { fetchNotifications(); markAllAsRead(); }, []);

  const fetchNotifications = async () => { setLoading(true); try { const r = await fetch(joinServerUrl(serverUrl, `/api/mobile/officer/notifications?userId=${user.id}`)); const d = await r.json(); if (d.success) setNotifications(d.data); } catch (e) {} finally { setLoading(false); setRefreshing(false); } };
  const onRefresh = () => { setRefreshing(true); fetchNotifications(); };
  const getIcon = (type: string) => {
    switch (type) { case 'REQUEST': return { name: 'swap-horizontal', color: appTheme.colors.info, bg: appTheme.colors.infoSoft }; case 'ACCEPTED': return { name: 'checkmark-circle', color: appTheme.colors.success, bg: appTheme.colors.successSoft }; case 'REJECTED': return { name: 'close-circle', color: appTheme.colors.danger, bg: appTheme.colors.dangerSoft }; default: return { name: 'information-circle', color: appTheme.colors.primary, bg: appTheme.colors.primarySoft }; }
  };
  const handleTransferResponse = async (notifId: string, requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    setRefreshing(true); try { const r = await fetch(joinServerUrl(serverUrl, '/api/mobile/officer/transfer-response'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId, status, userId: user.id }) }); const d = await r.json();
      if (d.success) { setStatusModal({ visible: true, type: 'success', title: 'Diproses', message: d.message || 'OK' }); markAsRead(notifId); fetchNotifications(); }
      else { setStatusModal({ visible: true, type: 'error', title: 'Gagal', message: d.error || 'Error' }); setRefreshing(false); }
    } catch (e) { setStatusModal({ visible: true, type: 'error', title: 'Koneksi error', message: 'Gagal terhubung' }); setRefreshing(false); }
  };
  const markAsRead = async (id: string) => { try { await fetch(joinServerUrl(serverUrl, '/api/mobile/officer/notifications'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, notificationId: id }) }); } catch (e) {} };
  const markAllAsRead = async () => { try { await fetch(joinServerUrl(serverUrl, '/api/mobile/officer/notifications'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, markAll: true }) }); } catch (e) {} };

  const renderHeader = () => (<AppScreenHeader title="Notifikasi" subtitle="Panel Petugas" onBack={() => navigation.goBack()}><Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500', marginTop: 6 }}>Permintaan masuk dan update aktivitas.</Text></AppScreenHeader>);

  const renderItem = ({ item: n }: { item: any }) => {
    const ic = getIcon(n.type); const date = new Date(n.createdAt); const isReq = n.type === 'REQUEST' && n.link;
    return (
      <View style={{ marginHorizontal: 24, marginBottom: 12 }}>
        <View style={{ backgroundColor: appTheme.colors.surface, borderRadius: 24, padding: 18, ...appTheme.shadow.card, borderLeftWidth: isReq && !n.isRead ? 3 : 0, borderLeftColor: appTheme.colors.info }}>
          {isReq && !n.isRead && <View style={{ alignSelf: 'flex-start', marginBottom: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: appTheme.colors.infoSoft }}><Text style={{ color: appTheme.colors.info, fontSize: 10, fontWeight: '700' }}>PERLU RESPONS</Text></View>}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: ic.bg }}><Ionicons name={ic.name as any} size={22} color={ic.color} /></View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={{ color: appTheme.colors.text, fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 }}>{n.title}</Text>
                {!n.isRead && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: appTheme.colors.primary, marginTop: 5 }} />}
              </View>
              <Text style={{ color: appTheme.colors.textMuted, fontSize: 13, fontWeight: '500', lineHeight: 19, marginTop: 5 }}>{n.message}</Text>
              <Text style={{ color: appTheme.colors.textSoft, fontSize: 11, fontWeight: '500', marginTop: 8 }}>{date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          </View>
          {isReq && !n.isRead && (
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <ScalableButton onPress={() => handleTransferResponse(n.id, n.link, 'ACCEPTED')} style={{ flex: 1, marginRight: 6 }}>
                <LinearGradient colors={[appTheme.colors.primary, appTheme.colors.primaryDark]} style={{ borderRadius: 16, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="white" /><Text style={{ color: 'white', fontSize: 12, fontWeight: '700', marginLeft: 6 }}>Terima</Text>
                </LinearGradient>
              </ScalableButton>
              <ScalableButton onPress={() => handleTransferResponse(n.id, n.link, 'REJECTED')} style={{ flex: 1, marginLeft: 6 }}>
                <View style={{ backgroundColor: appTheme.colors.dangerSoft, borderRadius: 16, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
                  <Ionicons name="close-circle-outline" size={16} color={appTheme.colors.danger} /><Text style={{ color: appTheme.colors.danger, fontSize: 12, fontWeight: '700', marginLeft: 6 }}>Tolak</Text>
                </View>
              </ScalableButton>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: appTheme.colors.bg }}>
      <FlatList data={loading ? [] : notifications} keyExtractor={(i) => String(i.id)} renderItem={renderItem} ListHeaderComponent={renderHeader} ListHeaderComponentStyle={{ marginBottom: 18 }}
        ListEmptyComponent={loading ? <View style={{ paddingHorizontal: 24 }}><AppSkeletonCard compact /><AppSkeletonCard compact /></View> : <AppEmptyState icon="notifications-off-outline" title="Tidak ada notifikasi" description="Belum ada permintaan baru." />}
        contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={appTheme.colors.primary} />} initialNumToRender={8} windowSize={7} removeClippedSubviews />
      <AppModalCard visible={statusModal.visible} title={statusModal.title} message={statusModal.message} icon={statusModal.type === 'success' ? 'checkmark-circle' : 'alert-circle'} iconColor={statusModal.type === 'success' ? appTheme.colors.success : appTheme.colors.danger} iconBg={statusModal.type === 'success' ? appTheme.colors.successSoft : appTheme.colors.dangerSoft} onRequestClose={() => setStatusModal({ ...statusModal, visible: false })}>
        <ScalableButton onPress={() => setStatusModal({ ...statusModal, visible: false })} style={{ marginTop: 18 }}><LinearGradient colors={statusModal.type === 'success' ? [appTheme.colors.primary, appTheme.colors.primaryDark] : [appTheme.colors.danger, '#b91c1c']} style={{ borderRadius: 18, paddingVertical: 15, alignItems: 'center' }}><Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>Tutup</Text></LinearGradient></ScalableButton>
      </AppModalCard>
      <StatusBar style="light" />
    </View>
  );
}
