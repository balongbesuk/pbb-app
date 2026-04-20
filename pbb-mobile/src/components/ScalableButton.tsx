import React from 'react';
import { Pressable, ViewStyle, StyleProp } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  interpolate,
} from 'react-native-reanimated';

interface ScalableButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  activeOpacity?: number;
  scaleTo?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ScalableButton: React.FC<ScalableButtonProps> = ({ 
  children, 
  onPress, 
  disabled, 
  style,
  scaleTo = 0.96 
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: interpolate(scale.value, [scaleTo, 1], [0.92, disabled ? 0.55 : 1]),
    };
  });

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withTiming(scaleTo, { duration: 100 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, {
      damping: 10,
      stiffness: 300,
    });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[style, animatedStyle]}
      android_ripple={{ color: 'rgba(59,91,219,0.08)', borderless: false }}
    >
      {children}
    </AnimatedPressable>
  );
};
