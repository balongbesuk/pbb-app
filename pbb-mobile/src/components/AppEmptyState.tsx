import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { appTheme } from '../theme/app-theme';

type AppEmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
};

export function AppEmptyState({ icon, title, description }: AppEmptyStateProps) {
  return (
    <View style={{ paddingVertical: 64, alignItems: 'center', paddingHorizontal: 18 }}>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 26,
          backgroundColor: appTheme.colors.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={32} color={appTheme.colors.textSoft} />
      </View>
      <Text style={{ color: appTheme.colors.text, fontSize: 16, fontWeight: '700', marginTop: 16 }}>{title}</Text>
      {description ? (
        <Text style={{ color: appTheme.colors.textMuted, fontSize: 13, fontWeight: '500', marginTop: 6, textAlign: 'center', lineHeight: 19 }}>{description}</Text>
      ) : null}
    </View>
  );
}
