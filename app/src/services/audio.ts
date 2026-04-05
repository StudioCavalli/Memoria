/**
 * Memoria Audio Manager
 *
 * Simple API for recording microphone input and playing back audio.
 * Uses expo-audio for all audio operations.
 */

import {
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  createAudioPlayer,
  AudioModule,
  RecordingPresets,
} from "expo-audio";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let recorder: InstanceType<typeof AudioModule.AudioRecorder> | null = null;
let currentPlayer: ReturnType<typeof createAudioPlayer> | null = null;

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

export async function requestPermissions(): Promise<boolean> {
  const { granted } = await requestRecordingPermissionsAsync();
  return granted;
}

// ---------------------------------------------------------------------------
// Recording
// ---------------------------------------------------------------------------

export async function startRecording(): Promise<void> {
  if (recorder) {
    await stopRecording();
  }

  await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

  recorder = new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY);
  await recorder.prepareToRecordAsync();
  recorder.record();
}

export async function stopRecording(): Promise<string | null> {
  if (!recorder) {
    return null;
  }

  try {
    await recorder.stop();
    const uri = recorder.uri;
    recorder = null;
    return uri ?? null;
  } catch (error) {
    recorder = null;
    console.error("[AudioManager] Error stopping recording:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Playback
// ---------------------------------------------------------------------------

export async function playAudio(uri: string): Promise<void> {
  await stopPlayback();

  const player = createAudioPlayer({ uri });
  currentPlayer = player;

  return new Promise<void>((resolve) => {
    player.addListener("playbackStatusUpdate", (status) => {
      if (status.didJustFinish) {
        stopPlayback();
        resolve();
      }
    });
    player.play();
  });
}

export async function stopPlayback(): Promise<void> {
  if (currentPlayer) {
    try {
      currentPlayer.remove();
    } catch {
      // already released
    }
    currentPlayer = null;
  }
}

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

export function isRecording(): boolean {
  return recorder !== null;
}

export function isPlaying(): boolean {
  return currentPlayer !== null;
}

const AudioManager = {
  requestPermissions,
  startRecording,
  stopRecording,
  playAudio,
  stopPlayback,
  isRecording,
  isPlaying,
};

export default AudioManager;
