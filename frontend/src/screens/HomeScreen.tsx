/**
 * HomeScreen
 *
 * The one and only screen of Memoria.
 * Shows a greeting, a large clock, and the single "Parler à Memoria" button.
 * No menus, no navigation, zero friction.
 *
 * Uses the WebSocket VoicePipeline for real-time voice conversation.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import * as FileSystem from "expo-file-system/legacy";

import MainButton from "../components/MainButton";
import WaveAnimation from "../components/WaveAnimation";
import AudioManager from "../services/audio";
import { startSession, VoicePipeline } from "../services/api";
import type { VoicePipelineEvent } from "../services/api";
import { Colors, FontSizes, Spacing } from "../constants/theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AppState = "idle" | "listening" | "thinking" | "speaking";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Senior ID — en production, viendrait d'AsyncStorage ou de la configuration */
const SENIOR_ID = 1;

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

export default function HomeScreen() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [responseText, setResponseText] = useState<string>("");

  const sessionIdRef = useRef<number | null>(null);
  const pipelineRef = useRef<VoicePipeline | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioChunksRef = useRef<ArrayBuffer[]>([]);
  const isMountedRef = useRef(true);

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
        // Le texte transcrit de l'utilisateur — on pourrait l'afficher
        // mais on préfère garder l'écran épuré pour les aînés.
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
        // Métriques de latence — utile pour le debug, pas affiché
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
        // Tenter une reconnexion automatique
        scheduleReconnect();
        break;
    }
  }, []);

  const handlePipelineAudio = useCallback(async (audioData: ArrayBuffer) => {
    if (!isMountedRef.current) return;

    // Accumuler les morceaux audio reçus du serveur
    audioChunksRef.current.push(audioData);
  }, []);

  // -------------------------------------------------------------------------
  // Audio playback — assembled from WS binary chunks
  // -------------------------------------------------------------------------

  /**
   * Lorsque le serveur passe en état "speaking" puis revient à "idle",
   * on sait que tous les morceaux audio ont été envoyés.
   * On les concatène, on les écrit dans un fichier temporaire, et on les joue.
   */
  const playAccumulatedAudio = useCallback(async () => {
    const chunks = audioChunksRef.current;
    audioChunksRef.current = [];

    if (chunks.length === 0) return;

    try {
      // Concaténer tous les morceaux
      const totalLength = chunks.reduce((sum, c) => sum + c.byteLength, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      }

      // Écrire dans un fichier temporaire
      const tempPath = `${FileSystem.cacheDirectory}memoria_response_${Date.now()}.wav`;
      const base64Audio = arrayBufferToBase64(combined.buffer);
      await FileSystem.writeAsStringAsync(tempPath, base64Audio, {
        encoding: "base64",
      });

      // Jouer le fichier audio
      if (isMountedRef.current) {
        setAppState("speaking");
        await AudioManager.playAudio(tempPath);

        // Nettoyer le fichier temporaire
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
      // Nettoyer l'ancien pipeline s'il existe
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
    if (reconnectTimerRef.current) return; // Déjà planifié

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
      // Créer une nouvelle session via REST
      const session = await startSession(SENIOR_ID);
      const sessionId = session.id;
      sessionIdRef.current = sessionId;

      // Connecter le pipeline WebSocket
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
  }, [connectPipeline]);

  // -------------------------------------------------------------------------
  // Conversation flow
  // -------------------------------------------------------------------------

  const handleButtonPress = useCallback(async () => {
    // Si on écoute déjà, arrêter et envoyer
    if (appState === "listening") {
      await handleStopListening();
      return;
    }

    // Si le système parle, interrompre
    if (appState === "speaking") {
      await AudioManager.stopPlayback();
      pipelineRef.current?.interrupt();
      setAppState("idle");
      audioChunksRef.current = [];
      return;
    }

    // Si le système réfléchit, ne rien faire
    if (appState === "thinking") return;

    // Démarrer l'écoute
    try {
      setResponseText("");
      audioChunksRef.current = [];

      // S'assurer qu'on a une session et un pipeline
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

      // Arrêter l'enregistrement
      const audioUri = await AudioManager.stopRecording();

      if (!audioUri) {
        setAppState("idle");
        setResponseText("Je n'ai rien entendu. Réessayez.");
        return;
      }

      // Lire le fichier audio enregistré en base64
      const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
        encoding: "base64",
      });

      // Convertir en ArrayBuffer et envoyer via WebSocket
      const audioBuffer = base64ToArrayBuffer(base64Audio);

      if (pipelineRef.current) {
        pipelineRef.current.sendAudioChunk(audioBuffer);
        pipelineRef.current.endTurn();
      } else {
        throw new Error("Pipeline non connecté");
      }

      // Le reste est géré par les événements du pipeline :
      // - status → thinking/speaking/idle
      // - response_text → sous-titres
      // - binary audio → playAccumulatedAudio()

      // Nettoyer le fichier d'enregistrement
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

    // Quand le serveur signale "speaking", on attend.
    // Quand il revient à "idle" après "speaking", on joue l'audio accumulé.
    if (prev === "speaking" && appState === "idle") {
      // L'audio a déjà été joué par playAudio dans playAccumulatedAudio
      // ou le serveur a terminé sans audio
      return;
    }

    // Quand on passe à "speaking" via un événement status du serveur,
    // on lance la lecture de l'audio accumulé
    if (appState === "speaking" && prev === "thinking") {
      // Petit délai pour laisser les derniers morceaux arriver
      const timer = setTimeout(() => {
        playAccumulatedAudio();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [appState, playAccumulatedAudio]);

  // -------------------------------------------------------------------------
  // End session (long press)
  // -------------------------------------------------------------------------

  const handleEndSession = useCallback(async () => {
    // Arrêter tout enregistrement ou lecture en cours
    if (AudioManager.isRecording()) {
      await AudioManager.stopRecording();
    }
    await AudioManager.stopPlayback();

    // Terminer la session via WebSocket
    if (pipelineRef.current) {
      pipelineRef.current.endSessionWs();
    }

    // Nettoyer
    cleanupPipeline();
    setAppState("idle");
    setResponseText("À bientôt !");
  }, [cleanupPipeline]);

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
          onLongPress={handleEndSession}
          disabled={appState === "thinking"}
        />
        <Text style={styles.buttonLabel}>Parler à Memoria</Text>
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
