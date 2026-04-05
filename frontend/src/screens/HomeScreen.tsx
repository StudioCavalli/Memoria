/**
 * HomeScreen
 *
 * The main screen of Memoria.
 * Shows a greeting with the senior's name, a large clock, and the
 * single "Parler a Memoria" button.
 *
 * Hidden settings: long press (3s) on the clock -> PIN modal -> settings panel.
 *
 * Uses the WebSocket VoicePipeline for real-time voice conversation.
 * Redesigned to match the Memoria website palette (cream/brown/orange).
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
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
import { Colors } from "../constants/theme";

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

/** Delai avant de reconnecter le WebSocket en cas de coupure (ms) */
const RECONNECT_DELAY_MS = 2000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon apr\u00e8s-midi";
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
 * Convertit une chaine base64 en ArrayBuffer.
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
 * Convertit un ArrayBuffer en chaine base64.
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
        // Le texte transcrit de l'utilisateur — on garde l'ecran epure
        break;

      case "response_text":
        if (event.text) {
          setResponseText(event.text);
        }
        break;

      case "silence_detected":
        setResponseText("Je suis toujours l\u00e0. Prenez votre temps.");
        break;

      case "latency":
        if (__DEV__) {
          console.log(
            `[Pipeline] Latence \u2014 STT: ${event.stt_ms}ms, LLM: ${event.llm_ms}ms, TTS: ${event.tts_ms}ms, Total: ${event.total_ms}ms`
          );
        }
        break;

      case "error":
        console.error("[Pipeline] Erreur:", event.message);
        setAppState("idle");
        setResponseText("Je reviens dans un instant. R\u00e9essayez bient\u00f4t.");
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
          console.error("[HomeScreen] \u00c9chec de la reconnexion:", error);
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
        "V\u00e9rifiez la connexion internet et r\u00e9essayez dans quelques instants."
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
      console.error("[HomeScreen] \u00c9chec du d\u00e9marrage de l'enregistrement:", error);
      setAppState("idle");
      setResponseText("D\u00e9sol\u00e9e, je n'ai pas pu activer le microphone.");
    }
  }, [appState, ensureSession]);

  const handleStopListening = useCallback(async () => {
    try {
      setAppState("thinking");

      const audioUri = await AudioManager.stopRecording();

      if (!audioUri) {
        setAppState("idle");
        setResponseText("Je n'ai rien entendu. R\u00e9essayez.");
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
        throw new Error("Pipeline non connect\u00e9");
      }

      FileSystem.deleteAsync(audioUri, { idempotent: true }).catch(() => {});
    } catch (error) {
      console.error("[HomeScreen] Erreur de conversation:", error);
      setAppState("idle");
      setResponseText(
        "D\u00e9sol\u00e9e, il y a eu un petit probl\u00e8me. R\u00e9essayez dans un moment."
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
    setResponseText("\u00c0 bient\u00f4t !");
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
    <SafeAreaView className="flex-1 bg-cream">
      <StatusBar barStyle="dark-content" backgroundColor={Colors.cream} />

      {/* Top section: greeting and clock */}
      <View className="items-center pt-12 px-6">
        <Text className="text-4xl font-bold text-brown mb-3">{greetingText}</Text>
        <Pressable
          onLongPress={handleClockLongPress}
          delayLongPress={3000}
          accessibilityLabel="Horloge"
        >
          <Text className="text-7xl font-bold text-brown tracking-wide">{timeString}</Text>
        </Pressable>
        <Text className="text-2xl text-text-muted mt-2 capitalize">{dateString}</Text>
      </View>

      {/* Middle section: animation and response */}
      <View className="flex-1 justify-center items-center px-8">
        <WaveAnimation state={appState} />

        {responseText ? (
          <View className="mt-6 px-8 py-6 bg-cream rounded-2xl max-w-[600px] w-full border border-brown/10"
                style={{ shadowColor: '#7D6340', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }}>
            <Text className="text-3xl text-text-dark leading-10 text-center">{responseText}</Text>
          </View>
        ) : (
          <View className="mt-6 px-8">
            <Text className="text-2xl text-text-muted text-center">
              {appState === "idle"
                ? "Appuyez sur le bouton pour me parler"
                : ""}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom section: main button */}
      <View className="items-center pb-16">
        <MainButton
          state={appState}
          onPress={handleButtonPress}
          onLongPress={handleEndSession}
          disabled={appState === "thinking"}
        />
        <Text className="mt-4 text-3xl font-semibold text-brown">Parler \u00e0 Memoria</Text>
      </View>

      {/* ---- PIN Modal ---- */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPinModal(false)}
      >
        <Pressable
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: Colors.overlay }}
          onPress={() => setShowPinModal(false)}
        >
          <Pressable
            className="bg-white rounded-3xl px-8 py-12 w-[85%] max-w-[420px]"
            style={{ shadowColor: '#7D6340', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 8 }}
            onPress={() => {}}
          >
            <Text className="text-3xl font-bold text-brown text-center mb-3">Param\u00e8tres</Text>
            <Text className="text-2xl text-text-muted text-center mb-6">
              Entrez le code PIN pour acc\u00e9der aux param\u00e8tres
            </Text>
            <TextInput
              className="bg-cream rounded-xl border border-brown/20 px-4 py-3 text-3xl text-text-dark text-center tracking-widest"
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
              <Text className="text-2xl text-red-700 text-center mt-3">{pinError}</Text>
            ) : null}
            <View className="flex-row justify-between mt-8 gap-4">
              <Pressable
                className="flex-1 py-3 rounded-xl border-2 border-brown items-center"
                onPress={() => setShowPinModal(false)}
              >
                <Text className="text-2xl font-semibold text-brown">Annuler</Text>
              </Pressable>
              <Pressable
                className="flex-1 py-3 rounded-xl bg-brown items-center"
                style={{ shadowColor: '#7D6340', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }}
                onPress={handlePinSubmit}
              >
                <Text className="text-2xl font-bold text-white">Valider</Text>
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
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: Colors.overlay }}
          onPress={() => setShowSettings(false)}
        >
          <Pressable
            className="bg-white rounded-3xl px-8 py-12 w-[85%] max-w-[460px]"
            style={{ shadowColor: '#7D6340', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 8 }}
            onPress={() => {}}
          >
            <Text className="text-3xl font-bold text-brown text-center mb-3">Param\u00e8tres</Text>

            {pairing && (
              <View className="bg-cream rounded-xl p-6 mt-6 mb-6">
                <Text className="text-2xl font-semibold text-text-muted mt-2">Senior actuel</Text>
                <Text className="text-3xl font-semibold text-text-dark mb-3">
                  {pairing.senior_name}
                </Text>
                <Text className="text-2xl font-semibold text-text-muted mt-2">Serveur</Text>
                <Text className="text-3xl font-semibold text-text-dark mb-3">
                  {pairing.api_url}
                </Text>
              </View>
            )}

            <Pressable
              className="bg-brown rounded-xl py-4 items-center mt-3"
              style={{ shadowColor: '#7D6340', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }}
              onPress={handleChangeSenior}
            >
              <Text className="text-2xl font-bold text-white">
                Changer de senior
              </Text>
            </Pressable>

            <Pressable
              className="bg-cream rounded-xl py-4 items-center mt-3 border-2 border-red-700"
              onPress={handleResetPairing}
            >
              <Text className="text-2xl font-bold text-red-700">
                R\u00e9initialiser le jumelage
              </Text>
            </Pressable>

            <Pressable
              className="mt-6 py-3 items-center"
              onPress={() => setShowSettings(false)}
            >
              <Text className="text-2xl font-semibold text-text-muted">Fermer</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
