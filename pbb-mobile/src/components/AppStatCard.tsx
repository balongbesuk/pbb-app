import React from 'react';
import { View, Text } from 'react-native';

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
          backgroundColor: 'rgba(255,255,255,0.12)',
          borderRadius: compact ? 18 : 20,
          padding: compact ? 14 : 16,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <Text style={{ color: 'rgba(255,244,232,0.72)', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>{label}</Text>
        <Text style={{ color: 'white', fontSize: compact ? 15 : 20, fontWeight: '900', marginTop: 4 }}>{value}</Text>
      </View>
    );
  }

  return null;
}
