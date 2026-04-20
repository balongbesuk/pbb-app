import React from 'react';
import { View, Text } from 'react-native';
import { appTheme } from '../theme/app-theme';

type AppStatCardProps = {
  label: string;
  value: string;
  tone?: 'light';
  compact?: boolean;
};

export function AppStatCard({ label, value, tone = 'light', compact = false }: AppStatCardProps) {
  if (tone === 'light') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(255,255,255,0.18)',
          borderRadius: compact ? 16 : 18,
          padding: compact ? 13 : 15,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.15)',
        }}
      >
        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '600', letterSpacing: 0.3 }}>{label}</Text>
        <Text style={{ color: 'white', fontSize: compact ? 15 : 20, fontWeight: '800', marginTop: 4 }}>{value}</Text>
      </View>
    );
  }
  return null;
}
