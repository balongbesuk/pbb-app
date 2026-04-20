import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { appTheme } from '../theme/app-theme';

type AppSkeletonCardProps = { lines?: number; compact?: boolean };

export function AppSkeletonCard({ lines = 3, compact = false }: AppSkeletonCardProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: interpolate(shimmer.value, [0, 1], [0.4, 0.8]) }));

  return (
    <View style={{ backgroundColor: appTheme.colors.surface, borderRadius: compact ? 22 : 24, padding: compact ? 16 : 18, marginBottom: 14, ...appTheme.shadow.soft }}>
      <Animated.View style={[{ width: 80, height: 11, borderRadius: 999, backgroundColor: appTheme.colors.surfaceMuted }, animatedStyle]} />
      <Animated.View style={[{ width: '68%', height: 16, borderRadius: 8, backgroundColor: appTheme.colors.surfaceStrong, marginTop: 14 }, animatedStyle]} />
      {Array.from({ length: lines }).map((_, i) => (
        <Animated.View key={i} style={[{ width: i === lines - 1 ? '45%' : '100%', height: 11, borderRadius: 6, backgroundColor: i % 2 === 0 ? appTheme.colors.surfaceMuted : appTheme.colors.surfaceStrong, marginTop: 10 }, animatedStyle]} />
      ))}
    </View>
  );
}
