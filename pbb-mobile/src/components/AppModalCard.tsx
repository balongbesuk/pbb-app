import React from 'react';
import { Modal, View, Text, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { appTheme, appLayout } from '../theme/app-theme';

type AppModalCardProps = {
  visible: boolean;
  title: string;
  message: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  onRequestClose: () => void;
  children?: React.ReactNode;
};

export function AppModalCard({ visible, title, message, icon, iconColor, iconBg, onRequestClose, children }: AppModalCardProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onRequestClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', padding: appLayout.screenPadding }}>
        {Platform.OS === 'ios' && <BlurView intensity={20} tint="dark" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />}
        
        <Animated.View entering={FadeIn.duration(300)}
          style={{
            backgroundColor: appTheme.colors.surface,
            borderRadius: 32,
            padding: 32,
            ...appTheme.shadow.floating,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: appTheme.colors.borderLight,
          }}
        >
          <View style={{ position: 'absolute', top: -40, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: iconBg, opacity: 0.15 }} />
          
          <View
            style={{
              width: appTheme.sizing.modalIcon,
              height: appTheme.sizing.modalIcon,
              borderRadius: 24,
              backgroundColor: iconBg,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.03)'
            }}
          >
            <Ionicons name={icon} size={30} color={iconColor} />
          </View>
          
          <Text style={{ color: appTheme.colors.text, ...appTheme.typo.heading, fontSize: 22, marginBottom: 10 }}>{title}</Text>
          <Text style={{ color: appTheme.colors.textMuted, ...appTheme.typo.body, lineHeight: 22 }}>{message}</Text>
          
          <View style={{ marginTop: 12 }}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
