import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { appTheme } from '../theme/app-theme';

type AppSectionTitleProps = {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  right?: React.ReactNode;
};

export function AppSectionTitle({ title, subtitle, icon, right }: AppSectionTitleProps) {
  return (
    <View style={{ marginTop: 8, marginBottom: 14, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {icon ? <Ionicons name={icon} size={15} color={appTheme.colors.textMuted} /> : null}
          <Text style={{ color: appTheme.colors.text, fontSize: 16, fontWeight: '700', marginLeft: icon ? 8 : 0 }}>
            {title}
          </Text>
        </View>
        {subtitle ? (
          <Text style={{ color: appTheme.colors.textSoft, fontSize: 12, fontWeight: '500', lineHeight: 17, marginTop: 3 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}
