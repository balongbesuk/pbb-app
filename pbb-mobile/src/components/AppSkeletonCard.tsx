import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { appTheme } from '../theme/app-theme';

type AppSkeletonCardProps = {
  lines?: number;
  compact?: boolean;
};

export function AppSkeletonCard({ lines = 3, compact = false }: AppSkeletonCardProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, {
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.45, 0.9]),
  }));

  const blockColor = appTheme.colors.surfaceStrong;
  const secondaryColor = appTheme.colors.surfaceMuted;

  return (
    <View
      style={{
        backgroundColor: appTheme.colors.surface,
        borderRadius: compact ? 24 : 26,
        padding: compact ? 16 : 18,
        borderWidth: 1,
        borderColor: appTheme.colors.border,
        marginBottom: 14,
        ...appTheme.shadow.card,
      }}
    >
      <Animated.View style={[{ width: 88, height: 12, borderRadius: 999, backgroundColor: secondaryColor }, animatedStyle]} />
      <Animated.View style={[{ width: '72%', height: 18, borderRadius: 10, backgroundColor: blockColor, marginTop: 14 }, animatedStyle]} />
      {Array.from({ length: lines }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            {
              width: index === lines - 1 ? '48%' : '100%',
              height: 12,
              borderRadius: 8,
              backgroundColor: index % 2 === 0 ? secondaryColor : blockColor,
              marginTop: 10,
            },
            animatedStyle,
          ]}
        />
      ))}
    </View>
  );
}
