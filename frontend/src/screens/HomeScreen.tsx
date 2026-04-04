/**
 * HomeScreen
 *
 * The one and only screen of Memoria.
 * Shows a greeting, a large clock, and the single "Parler a Memoria" button.
 * No menus, no navigation, zero friction.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  StatusBar,
} from "react-native";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";

import MainButton from "../components/MainButton";
import WaveAnimation from "../components/WaveAnimation";
import AudioManager from "../services/audio";
import ApiService from "../services/api";
import { Colors, FontSizes, Spacing } from "../constants/theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AppState = "idle" | "listening" | "thinking" | "speaking";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon apres-midi";
  return "Bonsoir";
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HomeScreen() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [responseText, setResponseText] = useState<string>("");
  const sessionIdRef = useRef<string | null>(null);

  // Senior ID -- in production this would come from configuration
  const seniorId = "default-senior";

  // -------------------------------------------------------------------------
  // Clock tick
  // -------------------------------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10_000);
    return () => clearInterval(timer);
  }, []);

  // -------------------------------------------------------------------------
  // Keep screen awake
  // -------------------------------------------------------------------------
  useEffect(() => {
    activateKeepAwakeAsync();
    return () => {
      deactivateKeepAwake();
    };
  }, []);

  // -------------------------------------------------------------------------
  // Request audio permissions on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    AudioManager.requestPermissions();
  }, []);

  // -------------------------------------------------------------------------
  // Conversation flow
  // -------------------------------------------------------------------------

  const handleButtonPress = useCallback(async () => {
    // If already listening, stop and process
    if (appState === "listening") {
      await handleStopListening();
      return;
    }

    // If speaking or thinking, do nothing
    if (appState !== "idle") return;

    // Start listening
    try {
      setAppState("listening");
      setResponseText("");
      await AudioManager.startRecording();
    } catch (error) {
      console.error("[HomeScreen] Failed to start recording:", error);
      setAppState("idle");
      setResponseText("Desolee, je n'ai pas pu activer le microphone.");
    }
  }, [appState]);

  const handleStopListening = async () => {
    try {
      // Stop recording
      setAppState("thinking");
      const audioUri = await AudioManager.stopRecording();

      if (!audioUri) {
        setAppState("idle");
        setResponseText("Je n'ai rien entendu. Reessayez.");
        return;
      }

      // Ensure we have a session
      if (!sessionIdRef.current) {
        const session = await ApiService.startSession(seniorId);
        sessionIdRef.current = session.id;
      }

      // For now, send a placeholder text.
      // In production, the audio file would be sent to a speech-to-text
      // service first, or the backend would accept audio directly.
      const response = await ApiService.sendMessage(
        sessionIdRef.current,
        "[audio message]"
      );

      setResponseText(response.text);

      // Play audio response if available
      if (response.audioUrl) {
        setAppState("speaking");
        await AudioManager.playAudio(response.audioUrl);
      }

      setAppState("idle");
    } catch (error) {
      console.error("[HomeScreen] Conversation error:", error);
      setAppState("idle");
      setResponseText(
        "Desolee, il y a eu un petit probleme. Reessayez dans un moment."
      );
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const greeting = getGreeting();
  const timeString = formatTime(currentTime);
  const dateString = formatDate(currentTime);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.backgroundPrimary} />

      {/* Top section: greeting and clock */}
      <View style={styles.topSection}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.clock}>{timeString}</Text>
        <Text style={styles.date}>{dateString}</Text>
      </View>

      {/* Middle section: animation and response */}
      <View style={styles.middleSection}>
        <WaveAnimation state={appState} />

        {responseText ? (
          <View style={styles.responseContainer}>
            <Text style={styles.responseText}>{responseText}</Text>
          </View>
        ) : (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>
              {appState === "idle"
                ? "Appuyez sur le bouton pour me parler"
                : ""}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom section: main button */}
      <View style={styles.bottomSection}>
        <MainButton
          state={appState}
          onPress={handleButtonPress}
          disabled={appState === "thinking" || appState === "speaking"}
        />
        <Text style={styles.buttonLabel}>Parler a Memoria</Text>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  topSection: {
    alignItems: "center",
    paddingTop: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  greeting: {
    fontSize: FontSizes.heading2,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  clock: {
    fontSize: FontSizes.hero,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  date: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textTransform: "capitalize",
  },
  middleSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  responseContainer: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    maxWidth: 600,
    width: "100%",
    shadowColor: "#1A1A2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  responseText: {
    fontSize: FontSizes.bodyLarge,
    color: Colors.textPrimary,
    lineHeight: FontSizes.bodyLarge * 1.5,
    textAlign: "center",
  },
  hintContainer: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  hintText: {
    fontSize: FontSizes.body,
    color: Colors.textMuted,
    textAlign: "center",
  },
  bottomSection: {
    alignItems: "center",
    paddingBottom: Spacing.xxxl,
  },
  buttonLabel: {
    marginTop: Spacing.md,
    fontSize: FontSizes.bodyLarge,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
});
