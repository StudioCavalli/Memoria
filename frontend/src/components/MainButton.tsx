/**
 * MainButton
 *
 * The single large central button for Memoria.
 * 160x160 round button with state-dependent colors and haptic feedback.
 * Touch target well above the 48dp accessibility minimum.
 *
 * Redesigned to match the Memoria website palette (brown/orange/green).
 */

import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import { Colors } from "../constants/theme";

type ButtonState = "idle" | "listening" | "thinking" | "speaking";

interface MainButtonProps {
  state: ButtonState;
  onPress: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BUTTON_SIZE = 160;

const BG_COLORS: Record<ButtonState, string> = {
  idle: Colors.buttonIdle,       // brown #7D6340
  listening: Colors.buttonListening, // orange-soft #E8A87C
  thinking: Colors.buttonThinking,   // brownLight #8B6F47
  speaking: Colors.buttonSpeaking,   // greenForest #4A7A35
};

const LABELS: Record<ButtonState, string> = {
  idle: "Parler",
  listening: "J'\u00e9coute\u2026",
  thinking: "Je r\u00e9fl\u00e9chis\u2026",
  speaking: "Je parle\u2026",
};

const ICONS: Record<ButtonState, string> = {
  idle: "\uD83C\uDF99",     // microphone emoji
  listening: "\uD83D\uDC42", // ear emoji
  thinking: "\uD83D\uDCAD",  // thought bubble
  speaking: "\uD83D\uDCAC",  // speech bubble
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MainButton({
  state,
  onPress,
  onLongPress,
  disabled = false,
}: MainButtonProps) {
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  // Pulse animation for thinking state
  useEffect(() => {
    if (state === "thinking") {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.06, {
            duration: 800,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, {
            duration: 800,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1, { duration: 200 });
    }

    return () => cancelAnimation(pulseScale);
  }, [state, pulseScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulseScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.93, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
  };

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const backgroundColor = BG_COLORS[state];
  const label = LABELS[state];
  const icon = ICONS[state];

  return (
    <View className="items-center justify-center" style={{ width: BUTTON_SIZE + 24, height: BUTTON_SIZE + 24 }}>
      {/* Outer glow ring -- color matches current state */}
      <View
        className="absolute rounded-full"
        style={{
          width: BUTTON_SIZE + 24,
          height: BUTTON_SIZE + 24,
          borderRadius: (BUTTON_SIZE + 24) / 2,
          borderWidth: 4,
          borderColor: backgroundColor,
          opacity: 0.15,
        }}
      />

      <AnimatedPressable
        onPress={handlePress}
        onLongPress={() => {
          if (!disabled && onLongPress) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onLongPress();
          }
        }}
        delayLongPress={800}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        className="w-40 h-40 rounded-full justify-center items-center"
        style={[
          {
            backgroundColor,
            shadowColor: '#7D6340',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.18,
            shadowRadius: 16,
            elevation: 8,
          },
          animatedStyle,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Parler \u00e0 Memoria. \u00c9tat actuel: ${label}`}
        accessibilityHint="Appuyez pour commencer \u00e0 parler. Appui long pour terminer la session."
      >
        <Text style={{ fontSize: 40, marginBottom: 6 }}>{icon}</Text>
        <Text className="text-white text-2xl font-bold text-center">{label}</Text>
      </AnimatedPressable>
    </View>
  );
}
