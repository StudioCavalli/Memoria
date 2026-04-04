/**
 * WaveAnimation
 *
 * Visual feedback for the current conversation state.
 * - listening: organic audio waveform
 * - thinking: pulsing dots
 * - speaking: rhythmic wave pattern
 *
 * Uses react-native-reanimated for 60fps performance.
 */

import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
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
  idle: Colors.accentCalm,
  listening: Colors.buttonListening,
  thinking: Colors.buttonThinking,
  speaking: Colors.buttonSpeaking,
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
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        { backgroundColor: color, width: BAR_WIDTH },
        animatedStyle,
      ]}
    />
  );
}

function ListeningWave({ color }: { color: string }) {
  return (
    <View style={styles.barsContainer}>
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
      style={[
        styles.dot,
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
    <View style={styles.dotsContainer}>
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
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          backgroundColor: color,
          width: BAR_WIDTH + 2,
          borderRadius: (BAR_WIDTH + 2) / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

function SpeakingWave({ color }: { color: string }) {
  return (
    <View style={styles.barsContainer}>
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
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      {state === "listening" && <ListeningWave color={color} />}
      {state === "thinking" && <ThinkingDots color={color} />}
      {state === "speaking" && <SpeakingWave color={color} />}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    height: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: BAR_GAP,
    height: 64,
  },
  bar: {
    borderRadius: BAR_WIDTH / 2,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: DOT_GAP,
    height: 64,
  },
  dot: {},
});
