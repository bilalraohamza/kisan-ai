import React, { useEffect, useCallback } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';

// ── Main screen wrapper — fade + slide up ────────────────────────────────────
export function ScreenEntrance({ children, delay = 0, style }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useFocusEffect(
    useCallback(() => {
      opacity.value = 0;
      translateY.value = 12;

      const timer = setTimeout(() => {
        opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
        translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) });
      }, delay);

      return () => {
        clearTimeout(timer);
        opacity.value = 0;
        translateY.value = 12;
      };
    }, [delay, opacity, translateY])
  );

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, animStyle, style]}>
      {children}
    </Animated.View>
  );
}

// ── Card entrance — staggered fade + slide up ────────────────────────────────
export function CardEntrance({ children, delay = 0, style }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useFocusEffect(
    useCallback(() => {
      opacity.value = 0;
      translateY.value = 8;

      const timer = setTimeout(() => {
        opacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) });
        translateY.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.quad) });
      }, delay);

      return () => {
        clearTimeout(timer);
        opacity.value = 0;
        translateY.value = 8;
      };
    }, [delay, opacity, translateY])
  );

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animStyle, style]}>
      {children}
    </Animated.View>
  );
}

const AnimatedPressableComponent = Animated.createAnimatedComponent(Pressable);

// ── Animated press button ────────────────────────────────────────────────────
export function AnimatedPressable({ children, onPress, style, disabled }) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn  = () => { scale.value = withSpring(0.95, { damping: 15 }); };
  const onPressOut = () => { scale.value = withSpring(1.0,  { damping: 15 }); };

  return (
    <AnimatedPressableComponent
      onPress={disabled ? null : onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[animStyle, style]}
    >
      {children}
    </AnimatedPressableComponent>
  );
}

// ── Pulse — for UrgentBanner ─────────────────────────────────────────────────
export function PulseView({ children, style }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    const pulse = () => {
      scale.value = withSpring(1.02, { damping: 8 }, () => {
        scale.value = withSpring(1.0, { damping: 8 });
      });
    };
    pulse();
    const interval = setInterval(pulse, 2000);
    return () => clearInterval(interval);
  }, [scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animStyle, style]}>
      {children}
    </Animated.View>
  );
}

// ── Message bubble pop ───────────────────────────────────────────────────────
export function BubblePop({ children, delay = 0 }) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 14, stiffness: 180 });
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, opacity, scale]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      {children}
    </Animated.View>
  );
}
