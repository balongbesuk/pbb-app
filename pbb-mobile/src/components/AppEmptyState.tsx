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
    <View style={{ paddingVertical: 72, alignItems: 'center', paddingHorizontal: 18 }}>
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: 28,
          backgroundColor: appTheme.colors.surface,
          borderWidth: 1,
          borderColor: appTheme.colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          ...appTheme.shadow.card,
        }}
      >
        <Ionicons name={icon} size={34} color={appTheme.colors.textSoft} />
      </View>
      <Text style={{ color: appTheme.colors.text, fontSize: 16, fontWeight: '800', marginTop: 14 }}>{title}</Text>
      {description ? (
        <Text style={{ color: appTheme.colors.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 19 }}>{description}</Text>
      ) : null}
    </View>
  );
}
