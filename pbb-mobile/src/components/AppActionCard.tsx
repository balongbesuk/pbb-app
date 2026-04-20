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

export function AppActionCard({ title, subtitle, icon, iconColor, iconBg, onPress, style }: AppActionCardProps) {
  return (
    <ScalableButton onPress={onPress} style={style}>
      <View
        style={{
          backgroundColor: appTheme.colors.surface,
          borderRadius: appTheme.radius.md,
          padding: 18,
          flexDirection: 'row',
          alignItems: 'center',
          ...appTheme.shadow.card,
          borderWidth: 1,
          borderColor: appTheme.colors.borderLight,
        }}
      >
        <View
          style={{
            width: appTheme.sizing.iconTile,
            height: appTheme.sizing.iconTile,
            borderRadius: 16,
            backgroundColor: iconBg,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.03)'
          }}
        >
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={{ color: appTheme.colors.text, ...appTheme.typo.bodyBold }}>{title}</Text>
          <Text style={{ color: appTheme.colors.textMuted, ...appTheme.typo.caption, marginTop: 4, lineHeight: 18 }}>{subtitle}</Text>
        </View>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: appTheme.colors.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="chevron-forward" size={16} color={appTheme.colors.textSoft} />
        </View>
      </View>
    </ScalableButton>
  );
}
