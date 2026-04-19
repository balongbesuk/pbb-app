import React from 'react';
import { Modal, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

export function AppModalCard({
  visible,
  title,
  message,
  icon,
  iconColor,
  iconBg,
  onRequestClose,
  children,
}: AppModalCardProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onRequestClose}>
      <View style={{ flex: 1, backgroundColor: appTheme.colors.overlay, justifyContent: 'center', padding: appLayout.screenPadding }}>
        <View
          style={{
            backgroundColor: appTheme.colors.surface,
            borderRadius: appTheme.radius.xl,
            padding: appTheme.spacing.xl,
            borderWidth: 1,
            borderColor: appTheme.colors.border,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: -30,
              right: -18,
              width: 132,
              height: 132,
              borderRadius: 66,
              backgroundColor: iconBg,
              opacity: 0.35,
            }}
          />
          <View
            style={{
              width: appTheme.sizing.modalIcon,
              height: appTheme.sizing.modalIcon,
              borderRadius: 24,
              backgroundColor: iconBg,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 18,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.55)',
            }}
          >
            <Ionicons name={icon} size={36} color={iconColor} />
          </View>
          <Text style={{ color: appTheme.colors.text, fontSize: 24, fontWeight: '900', marginBottom: 8 }}>{title}</Text>
          <Text style={{ color: appTheme.colors.textMuted, fontSize: 14, lineHeight: 21 }}>{message}</Text>
          {children}
        </View>
      </View>
    </Modal>
  );
}
