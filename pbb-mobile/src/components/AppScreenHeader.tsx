import React from 'react';
import { View, Text, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  centerTitle?: boolean;
};

export function AppScreenHeader({
  title,
  subtitle,
  onBack,
  rightAction,
  children,
  style,
  centerTitle,
}: AppScreenHeaderProps) {
  return (
    <LinearGradient
      colors={[appTheme.colors.headerStart, appTheme.colors.headerEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          paddingTop: appLayout.header.paddingTop,
          paddingHorizontal: appLayout.screenPadding,
          paddingBottom: appLayout.header.paddingBottom,
          borderBottomLeftRadius: appLayout.header.radius,
          borderBottomRightRadius: appLayout.header.radius,
          ...appTheme.shadow.header,
        },
        style,
      ]}
    >
      {/* Subtle modern pattern overlays */}
      <View style={{ position: 'absolute', top: -30, right: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(5, 150, 105, 0.08)' }} />
      <View style={{ position: 'absolute', top: 40, left: -40, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.03)' }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: centerTitle ? 'center' : 'flex-start' }}>
        {onBack ? (
          <View style={centerTitle ? { position: 'absolute', left: 0, zIndex: 10 } : { marginRight: 16 }}>
            <ScalableButton onPress={onBack}>
              <View
                style={{
                  width: appTheme.sizing.backButton,
                  height: appTheme.sizing.backButton,
                  borderRadius: appTheme.sizing.backButton / 2,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)'
                }}
              >
                <Ionicons name="arrow-back" size={20} color="white" />
              </View>
            </ScalableButton>
          </View>
        ) : null}
        
        <View style={[{ flex: 1 }, centerTitle && { alignItems: 'center' }]}>
          {subtitle ? (
            <Text style={{ color: 'rgba(255,255,255,0.6)', ...appTheme.typo.label, textTransform: 'uppercase', textAlign: centerTitle ? 'center' : 'left' }}>
              {subtitle}
            </Text>
          ) : null}
          <Text
            style={{
              color: 'white',
              ...appTheme.typo.heading,
              marginTop: subtitle ? 6 : 0,
              textAlign: centerTitle ? 'center' : 'left'
            }}
          >
            {title}
          </Text>
        </View>

        {rightAction ? (
           <View style={centerTitle ? { position: 'absolute', right: 0, zIndex: 10 } : { marginLeft: 14 }}>
             {rightAction}
           </View>
        ) : centerTitle ? (
           <View style={{ width: appTheme.sizing.backButton }} /> 
        ) : null}
      </View>
      {children}
    </LinearGradient>
  );
}
