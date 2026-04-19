import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScalableButton } from './ScalableButton';
import { appTheme, appLayout } from '../theme/app-theme';

type AppActionCardProps = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  onPress?: () => void;
  style?: any;
};

export function AppActionCard({
  title,
  subtitle,
  icon,
  iconColor,
  iconBg,
  onPress,
  style,
}: AppActionCardProps) {
  return (
    <ScalableButton onPress={onPress} style={style}>
      <View
        style={{
          backgroundColor: appTheme.colors.surface,
          borderRadius: appTheme.radius.lg,
          padding: appLayout.cardPadding,
          borderWidth: 1,
          borderColor: appTheme.colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          ...appTheme.shadow.card,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: iconColor,
            opacity: 0.9,
          }}
        />
        <View
          style={{
            position: 'absolute',
            right: -16,
            top: -10,
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: iconBg,
            opacity: 0.45,
          }}
        />
        <View
          style={{
            width: appTheme.sizing.iconTile,
            height: appTheme.sizing.iconTile,
            borderRadius: 20,
            backgroundColor: iconBg,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.55)',
          }}
        >
          <Ionicons name={icon} size={24} color={iconColor} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ color: appTheme.colors.text, fontSize: 17, fontWeight: '900' }}>{title}</Text>
          <Text style={{ color: appTheme.colors.textMuted, fontSize: 12, marginTop: 5, lineHeight: 17 }}>{subtitle}</Text>
        </View>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#ffffff',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: appTheme.colors.border,
          }}
        >
          <Ionicons name="arrow-forward" size={16} color={appTheme.colors.text} />
        </View>
      </View>
    </ScalableButton>
  );
}
