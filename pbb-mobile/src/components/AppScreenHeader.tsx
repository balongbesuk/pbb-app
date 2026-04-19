import React from 'react';
import { View, Text, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScalableButton } from './ScalableButton';
import { appTheme, appLayout } from '../theme/app-theme';

type AppScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function AppScreenHeader({
  title,
  subtitle,
  onBack,
  rightAction,
  children,
  style,
}: AppScreenHeaderProps) {
  return (
    <View
      style={[
        {
          backgroundColor: appTheme.colors.primaryDark,
          paddingTop: appLayout.header.paddingTop,
          paddingHorizontal: appLayout.screenPadding,
          paddingBottom: appLayout.header.paddingBottom,
          borderBottomLeftRadius: appLayout.header.radius,
          borderBottomRightRadius: appLayout.header.radius,
        },
        style,
      ]}
    >
      <View
        style={{
          position: 'absolute',
          top: -36,
          right: -28,
          width: 156,
          height: 156,
          borderRadius: 78,
          backgroundColor: 'rgba(255,255,255,0.08)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 34,
          right: 84,
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: 'rgba(238,138,91,0.22)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: -22,
          left: -14,
          width: 128,
          height: 128,
          borderRadius: 64,
          backgroundColor: 'rgba(255,255,255,0.05)',
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {onBack ? (
          <ScalableButton onPress={onBack}>
            <View
              style={{
                width: appTheme.sizing.backButton,
                height: appTheme.sizing.backButton,
                borderRadius: appTheme.sizing.backButton / 2,
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.16)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </View>
          </ScalableButton>
        ) : null}
        <View style={{ flex: 1, marginLeft: onBack ? 14 : 0, marginRight: rightAction ? 12 : 0 }}>
          {subtitle ? (
            <Text style={{ color: 'rgba(255,244,232,0.76)', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }}>{subtitle}</Text>
          ) : null}
          <Text style={{ color: 'white', fontSize: 30, fontWeight: '900', marginTop: subtitle ? 6 : 0, lineHeight: 34 }}>{title}</Text>
        </View>
        {rightAction}
      </View>
      {children}
    </View>
  );
}
