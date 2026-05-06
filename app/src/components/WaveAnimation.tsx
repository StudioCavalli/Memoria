/**
 * WaveAnimation
 *
 * Visual feedback for the current conversation state.
 * - listening: organic audio waveform (orange-soft)
 * - thinking: pulsing dots (brown)
 * - speaking: rhythmic wave pattern (greenForest)
 *
 * Uses react-native-reanimated for 60fps performance.
 * Colors matched to the Memoria website palette.
 */

import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { Colors } from "../constants/theme";

type AnimationState = "idle" | "listening" | "thinking" | "speaking";

interface WaveAnimationProps {
  state: AnimationState;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BAR_COUNT = 5;
const BAR_WIDTH = 8;
const BAR_GAP = 10;
const MAX_BAR_HEIGHT = 48;
const MIN_BAR_HEIGHT = 12;

const DOT_COUNT = 3;
const DOT_SIZE = 16;
const DOT_GAP = 20;

const COLORS_BY_STATE: Record<AnimationState, string> = {
  idle: Colors.roseDusty,
  listening: Colors.orangeSoft,     // #E8A87C
  thinking: Colors.brown,           // #7D6340
  speaking: Colors.greenForest,     // #4A7A35
};

// ---------------------------------------------------------------------------
// Listening Bars
// ---------------------------------------------------------------------------

function ListeningBar({ index, color }: { index: number; color: string }) {
  const height = useSharedValue(MIN_BAR_HEIGHT);

  useEffect(() => {
    const duration = 350 + index * 80;
    height.value = withRepeat(
      withSequence(
        withTiming(MAX_BAR_HEIGHT, {
          duration,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(MIN_BAR_HEIGHT, {
          duration,
          easing: Easing.inOut(Easing.sin),
        })
      ),
      -1,
      false
    );

    return () => cancelAnimation(height);
  }, [height, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: height.value / MAX_BAR_HEIGHT }],
  }));

  return (
    <Animated.View
      className="rounded-full"
      style={[
        { backgroundColor: color, width: BAR_WIDTH, height: MAX_BAR_HEIGHT, borderRadius: BAR_WIDTH / 2 },
        animatedStyle,
      ]}
    />
  );
}

function ListeningWave({ color }: { color: string }) {
  return (
    <View className="flex-row items-center justify-center h-16" style={{ gap: BAR_GAP }}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <ListeningBar key={i} index={i} color={color} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Thinking Dots
// ---------------------------------------------------------------------------

function ThinkingDot({ index, color }: { index: number; color: string }) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    const delay = index * 250;
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.6, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [scale, opacity, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      className="rounded-full"
      style={[
        {
          backgroundColor: color,
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

function ThinkingDots({ color }: { color: string }) {
  return (
    <View className="flex-row items-center justify-center h-16" style={{ gap: DOT_GAP }}>
      {Array.from({ length: DOT_COUNT }).map((_, i) => (
        <ThinkingDot key={i} index={i} color={color} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Speaking Wave
// ---------------------------------------------------------------------------

function SpeakingBar({ index, color }: { index: number; color: string }) {
  const height = useSharedValue(MIN_BAR_HEIGHT);

  useEffect(() => {
    // Faster, more rhythmic pattern for speaking
    const duration = 250 + (index % 3) * 60;
    const maxH = MAX_BAR_HEIGHT * (0.5 + (index % 2) * 0.5);
    height.value = withRepeat(
      withSequence(
        withTiming(maxH, {
          duration,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(MIN_BAR_HEIGHT, {
          duration: duration * 1.2,
          easing: Easing.in(Easing.quad),
        })
      ),
      -1,
      false
    );

    return () => cancelAnimation(height);
  }, [height, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: height.value / MAX_BAR_HEIGHT }],
  }));

  return (
    <Animated.View
      className="rounded-full"
      style={[
        {
          backgroundColor: color,
          width: BAR_WIDTH + 2,
          height: MAX_BAR_HEIGHT,
          borderRadius: (BAR_WIDTH + 2) / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

function SpeakingWave({ color }: { color: string }) {
  return (
    <View className="flex-row items-center justify-center h-16" style={{ gap: BAR_GAP }}>
      {Array.from({ length: BAR_COUNT + 2 }).map((_, i) => (
        <SpeakingBar key={i} index={i} color={color} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function WaveAnimation({ state }: WaveAnimationProps) {
  const color = COLORS_BY_STATE[state];

  if (state === "idle") {
    return <View className="h-16 justify-center items-center" />;
  }

  return (
    <View className="h-16 justify-center items-center">
      {state === "listening" && <ListeningWave color={color} />}
      {state === "thinking" && <ThinkingDots color={color} />}
      {state === "speaking" && <SpeakingWave color={color} />}
    </View>
  );
}
