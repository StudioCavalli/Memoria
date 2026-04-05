/**
 * HomeScreen
 *
 * The main screen of Memoria.
 * Shows a greeting with the senior's name, a large clock, and the
 * single "Parler à Memoria" button.
 *
 * Hidden settings: long press (3s) on the clock → PIN modal → settings panel.
 *
 * Uses the WebSocket VoicePipeline for real-time voice conversation.
 * Redesigned to match the Memoria website palette (cream/brown/orange).
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  Modal,
  TextInput,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import * as FileSystem from "expo-file-system/legacy";

import MainButton from "../components/MainButton";
import WaveAnimation from "../components/WaveAnimation";
import AudioManager from "../services/audio";
import { startSession, VoicePipeline } from "../services/api";
import type { VoicePipelineEvent } from "../services/api";
import { getPairing, clearPairing, type PairingData } from "../services/storage";
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from "../constants/theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AppState = "idle" | "listening" | "thinking" | "speaking";

interface HomeScreenProps {
  onRequestSetup: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SETTINGS_PIN = "1234";

/** Délai avant de reconnecter le WebSocket en cas de coupure (ms) */
const RECONNECT_DELAY_MS = 2000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
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

/**
 * Convertit une chaîne base64 en ArrayBuffer.
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convertit un ArrayBuffer en chaîne base64.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HomeScreen({ onRequestSetup }: HomeScreenProps) {
  const [appState, setAppState] = useState<AppState>("idle");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [responseText, setResponseText] = useState<string>("");

  // Pairing data
  const [pairing, setPairing] = useState<PairingData | null>(null);
  const seniorId = pairing?.senior_id ?? 1;
  const seniorFirstName = pairing?.senior_name?.split(" ")[0] ?? "";

  // Settings modal
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const sessionIdRef = useRef<number | null>(null);
  const pipelineRef = useRef<VoicePipeline | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioChunksRef = useRef<ArrayBuffer[]>([]);
  const isMountedRef = useRef(true);

  // -------------------------------------------------------------------------
  // Load pairing on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    getPairing().then((data) => {
      if (data) setPairing(data);
    });
  }, []);

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
  // Cleanup on unmount
  // -------------------------------------------------------------------------
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanupPipeline();
    };
  }, []);

  // -------------------------------------------------------------------------
  // Pipeline event handlers
  // -------------------------------------------------------------------------

  const handlePipelineEvent = useCallback((event: VoicePipelineEvent) => {
    if (!isMountedRef.current) return;

    switch (event.type) {
      case "status":
        if (event.status) {
          setAppState(event.status);
        }
        break;

      case "transcription":
        // Le texte transcrit de l'utilisateur — on garde l'écran épuré
        break;

      case "response_text":
        if (event.text) {
          setResponseText(event.text);
        }
        break;

      case "silence_detected":
        setResponseText("Je suis toujours là. Prenez votre temps.");
        break;

      case "latency":
        if (__DEV__) {
          console.log(
            `[Pipeline] Latence — STT: ${event.stt_ms}ms, LLM: ${event.llm_ms}ms, TTS: ${event.tts_ms}ms, Total: ${event.total_ms}ms`
          );
        }
        break;

      case "error":
        console.error("[Pipeline] Erreur:", event.message);
        setAppState("idle");
        setResponseText("Je reviens dans un instant. Réessayez bientôt.");
        scheduleReconnect();
        break;
    }
  }, []);

  const handlePipelineAudio = useCallback(async (audioData: ArrayBuffer) => {
    if (!isMountedRef.current) return;
    audioChunksRef.current.push(audioData);
  }, []);

  // -------------------------------------------------------------------------
  // Audio playback — assembled from WS binary chunks
  // -------------------------------------------------------------------------

  const playAccumulatedAudio = useCallback(async () => {
    const chunks = audioChunksRef.current;
    audioChunksRef.current = [];

    if (chunks.length === 0) return;

    try {
      const totalLength = chunks.reduce((sum, c) => sum + c.byteLength, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      }

      const tempPath = `${FileSystem.cacheDirectory}memoria_response_${Date.now()}.wav`;
      const base64Audio = arrayBufferToBase64(combined.buffer);
      await FileSystem.writeAsStringAsync(tempPath, base64Audio, {
        encoding: "base64",
      });

      if (isMountedRef.current) {
        setAppState("speaking");
        await AudioManager.playAudio(tempPath);
        FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => {});
      }
    } catch (error) {
      console.error("[HomeScreen] Erreur de lecture audio:", error);
    } finally {
      if (isMountedRef.current) {
        setAppState("idle");
      }
    }
  }, []);

  // -------------------------------------------------------------------------
  // Pipeline lifecycle
  // -------------------------------------------------------------------------

  const connectPipeline = useCallback(
    async (sessionId: number) => {
      if (pipelineRef.current) {
        pipelineRef.current.disconnect();
      }

      const pipeline = new VoicePipeline(
        handlePipelineEvent,
        handlePipelineAudio
      );
      pipeline.connect(sessionId);
      pipelineRef.current = pipeline;
    },
    [handlePipelineEvent, handlePipelineAudio]
  );

  const cleanupPipeline = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (pipelineRef.current) {
      pipelineRef.current.disconnect();
      pipelineRef.current = null;
    }
    sessionIdRef.current = null;
    audioChunksRef.current = [];
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimerRef.current) return;

    reconnectTimerRef.current = setTimeout(async () => {
      reconnectTimerRef.current = null;
      if (!isMountedRef.current) return;

      const sessionId = sessionIdRef.current;
      if (sessionId) {
        try {
          await connectPipeline(sessionId);
        } catch (error) {
          console.error("[HomeScreen] Échec de la reconnexion:", error);
        }
      }
    }, RECONNECT_DELAY_MS);
  }, [connectPipeline]);

  // -------------------------------------------------------------------------
  // Ensure session + pipeline exist
  // -------------------------------------------------------------------------

  const ensureSession = useCallback(async (): Promise<number> => {
    if (sessionIdRef.current && pipelineRef.current) {
      return sessionIdRef.current;
    }

    try {
      const session = await startSession(seniorId);
      const sessionId = session.id;
      sessionIdRef.current = sessionId;

      await connectPipeline(sessionId);

      return sessionId;
    } catch (error) {
      console.error("[HomeScreen] Impossible de joindre le serveur:", error);
      setResponseText(
        "Je ne suis pas disponible pour le moment. " +
        "Vérifiez la connexion internet et réessayez dans quelques instants."
      );
      setAppState("idle");
      throw error;
    }
  }, [connectPipeline, seniorId]);

  // -------------------------------------------------------------------------
  // Conversation flow
  // -------------------------------------------------------------------------

  const handleButtonPress = useCallback(async () => {
    if (appState === "listening") {
      await handleStopListening();
      return;
    }

    if (appState === "speaking") {
      await AudioManager.stopPlayback();
      pipelineRef.current?.interrupt();
      setAppState("idle");
      audioChunksRef.current = [];
      return;
    }

    if (appState === "thinking") return;

    try {
      setResponseText("");
      audioChunksRef.current = [];

      await ensureSession();

      setAppState("listening");
      await AudioManager.startRecording();
    } catch (error) {
      console.error("[HomeScreen] Échec du démarrage de l'enregistrement:", error);
      setAppState("idle");
      setResponseText("Désolée, je n'ai pas pu activer le microphone.");
    }
  }, [appState, ensureSession]);

  const handleStopListening = useCallback(async () => {
    try {
      setAppState("thinking");

      const audioUri = await AudioManager.stopRecording();

      if (!audioUri) {
        setAppState("idle");
        setResponseText("Je n'ai rien entendu. Réessayez.");
        return;
      }

      const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
        encoding: "base64",
      });

      const audioBuffer = base64ToArrayBuffer(base64Audio);

      if (pipelineRef.current) {
        pipelineRef.current.sendAudioChunk(audioBuffer);
        pipelineRef.current.endTurn();
      } else {
        throw new Error("Pipeline non connecté");
      }

      FileSystem.deleteAsync(audioUri, { idempotent: true }).catch(() => {});
    } catch (error) {
      console.error("[HomeScreen] Erreur de conversation:", error);
      setAppState("idle");
      setResponseText(
        "Désolée, il y a eu un petit problème. Réessayez dans un moment."
      );
    }
  }, []);

  // -------------------------------------------------------------------------
  // Watch for state transitions to play accumulated audio
  // -------------------------------------------------------------------------

  const prevAppStateRef = useRef<AppState>("idle");

  useEffect(() => {
    const prev = prevAppStateRef.current;
    prevAppStateRef.current = appState;

    if (prev === "speaking" && appState === "idle") {
      return;
    }

    if (appState === "speaking" && prev === "thinking") {
      const timer = setTimeout(() => {
        playAccumulatedAudio();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [appState, playAccumulatedAudio]);

  // -------------------------------------------------------------------------
  // End session (long press on main button)
  // -------------------------------------------------------------------------

  const handleEndSession = useCallback(async () => {
    if (AudioManager.isRecording()) {
      await AudioManager.stopRecording();
    }
    await AudioManager.stopPlayback();

    if (pipelineRef.current) {
      pipelineRef.current.endSessionWs();
    }

    cleanupPipeline();
    setAppState("idle");
    setResponseText("À bientôt !");
  }, [cleanupPipeline]);

  // -------------------------------------------------------------------------
  // Hidden settings — long press 3s on clock
  // -------------------------------------------------------------------------

  const handleClockLongPress = useCallback(() => {
    setPinInput("");
    setPinError("");
    setShowPinModal(true);
  }, []);

  const handlePinSubmit = useCallback(() => {
    if (pinInput === SETTINGS_PIN) {
      setShowPinModal(false);
      setPinInput("");
      setPinError("");
      setShowSettings(true);
    } else {
      setPinError("Code PIN incorrect");
      setPinInput("");
    }
  }, [pinInput]);

  const handleChangeSenior = useCallback(async () => {
    setShowSettings(false);
    cleanupPipeline();
    await clearPairing();
    onRequestSetup();
  }, [cleanupPipeline, onRequestSetup]);

  const handleResetPairing = useCallback(async () => {
    setShowSettings(false);
    cleanupPipeline();
    await clearPairing();
    onRequestSetup();
  }, [cleanupPipeline, onRequestSetup]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const greeting = getGreeting();
  const timeString = formatTime(currentTime);
  const dateString = formatDate(currentTime);
  const greetingText = seniorFirstName
    ? `${greeting} ${seniorFirstName}`
    : greeting;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.cream} />

      {/* Top section: greeting and clock */}
      <View style={styles.topSection}>
        <Text style={styles.greeting}>{greetingText}</Text>
        <Pressable
          onLongPress={handleClockLongPress}
          delayLongPress={3000}
          accessibilityLabel="Horloge"
        >
          <Text style={styles.clock}>{timeString}</Text>
        </Pressable>
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
          onLongPress={handleEndSession}
          disabled={appState === "thinking"}
        />
        <Text style={styles.buttonLabel}>Parler à Memoria</Text>
      </View>

      {/* ---- PIN Modal ---- */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPinModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPinModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Paramètres</Text>
            <Text style={styles.modalSubtitle}>
              Entrez le code PIN pour accéder aux paramètres
            </Text>
            <TextInput
              style={styles.modalInput}
              value={pinInput}
              onChangeText={setPinInput}
              placeholder="Code PIN"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              autoFocus
              onSubmitEditing={handlePinSubmit}
            />
            {pinError ? (
              <Text style={styles.modalError}>{pinError}</Text>
            ) : null}
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalSecondaryButton}
                onPress={() => setShowPinModal(false)}
              >
                <Text style={styles.modalSecondaryButtonText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={styles.modalPrimaryButton}
                onPress={handlePinSubmit}
              >
                <Text style={styles.modalPrimaryButtonText}>Valider</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ---- Settings Modal ---- */}
      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSettings(false)}
        >
          <Pressable style={styles.settingsCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Paramètres</Text>

            {pairing && (
              <View style={styles.settingsInfo}>
                <Text style={styles.settingsInfoLabel}>Senior actuel</Text>
                <Text style={styles.settingsInfoValue}>
                  {pairing.senior_name}
                </Text>
                <Text style={styles.settingsInfoLabel}>Serveur</Text>
                <Text style={styles.settingsInfoValue}>
                  {pairing.api_url}
                </Text>
              </View>
            )}

            <Pressable
              style={styles.settingsButton}
              onPress={handleChangeSenior}
            >
              <Text style={styles.settingsButtonText}>
                Changer de senior
              </Text>
            </Pressable>

            <Pressable
              style={[styles.settingsButton, styles.settingsButtonDanger]}
              onPress={handleResetPairing}
            >
              <Text style={[styles.settingsButtonText, styles.settingsButtonDangerText]}>
                Réinitialiser le jumelage
              </Text>
            </Pressable>

            <Pressable
              style={styles.settingsCloseButton}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.settingsCloseButtonText}>Fermer</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  topSection: {
    alignItems: "center",
    paddingTop: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  greeting: {
    fontSize: FontSizes.heading2,
    fontWeight: "700",
    color: Colors.brown,
    marginBottom: Spacing.sm,
  },
  clock: {
    fontSize: FontSizes.hero,
    fontWeight: "700",
    color: Colors.brown,
    letterSpacing: 2,
  },
  date: {
    fontSize: FontSizes.body,
    color: Colors.textMuted,
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
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.lg,
    maxWidth: 600,
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.divider,
    ...Shadows.soft,
  },
  responseText: {
    fontSize: FontSizes.bodyLarge,
    color: Colors.textDark,
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
    color: Colors.brown,
  },

  // ---- Modals ----
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    width: "85%",
    maxWidth: 420,
    ...Shadows.strong,
  },
  modalTitle: {
    fontSize: FontSizes.heading3,
    fontWeight: "700",
    color: Colors.brown,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  modalSubtitle: {
    fontSize: FontSizes.body,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  modalInput: {
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.bodyLarge,
    color: Colors.textDark,
    textAlign: "center",
    letterSpacing: 8,
  },
  modalError: {
    fontSize: FontSizes.body,
    color: Colors.error,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  modalSecondaryButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.brown,
    alignItems: "center",
  },
  modalSecondaryButtonText: {
    fontSize: FontSizes.body,
    fontWeight: "600",
    color: Colors.brown,
  },
  modalPrimaryButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.brown,
    alignItems: "center",
    ...Shadows.soft,
  },
  modalPrimaryButtonText: {
    fontSize: FontSizes.body,
    fontWeight: "700",
    color: Colors.white,
  },

  // ---- Settings Panel ----
  settingsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    width: "85%",
    maxWidth: 460,
    ...Shadows.strong,
  },
  settingsInfo: {
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  settingsInfoLabel: {
    fontSize: FontSizes.body,
    fontWeight: "600",
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  settingsInfoValue: {
    fontSize: FontSizes.bodyLarge,
    fontWeight: "600",
    color: Colors.textDark,
    marginBottom: Spacing.sm,
  },
  settingsButton: {
    backgroundColor: Colors.brown,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.sm,
    ...Shadows.soft,
  },
  settingsButtonText: {
    fontSize: FontSizes.body,
    fontWeight: "700",
    color: Colors.white,
  },
  settingsButtonDanger: {
    backgroundColor: Colors.cream,
    borderWidth: 1.5,
    borderColor: Colors.error,
  },
  settingsButtonDangerText: {
    color: Colors.error,
  },
  settingsCloseButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  settingsCloseButtonText: {
    fontSize: FontSizes.body,
    fontWeight: "600",
    color: Colors.textMuted,
  },
});
