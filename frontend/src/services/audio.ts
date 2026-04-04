/**
 * Memoria Audio Manager
 *
 * Simple API for recording microphone input and playing back audio.
 * Uses expo-av for all audio operations.
 */

import { Audio } from "expo-av";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let recording: Audio.Recording | null = null;
let currentPlayback: Audio.Sound | null = null;

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

/**
 * Request microphone permissions. Call once at app startup.
 * Returns true if granted.
 */
export async function requestPermissions(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync();
  return status === "granted";
}

// ---------------------------------------------------------------------------
// Recording
// ---------------------------------------------------------------------------

/**
 * Start recording from the microphone.
 * Configures audio mode for recording on iOS/Android.
 */
export async function startRecording(): Promise<void> {
  // Stop any existing recording first
  if (recording) {
    await stopRecording();
  }

  // Configure audio session for recording
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording: newRecording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );

  recording = newRecording;
}

/**
 * Stop the current recording and return the local file URI.
 * Returns null if no recording was active.
 */
export async function stopRecording(): Promise<string | null> {
  if (!recording) {
    return null;
  }

  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    recording = null;

    // Restore audio mode for playback
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });

    return uri ?? null;
  } catch (error) {
    recording = null;
    console.error("[AudioManager] Error stopping recording:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Playback
// ---------------------------------------------------------------------------

/**
 * Play audio from a URI (local file or remote URL).
 * Returns a promise that resolves when playback finishes.
 */
export async function playAudio(uri: string): Promise<void> {
  // Stop any currently playing audio
  await stopPlayback();

  const { sound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: true, volume: 1.0 }
  );

  currentPlayback = sound;

  return new Promise<void>((resolve) => {
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        stopPlayback();
        resolve();
      }
    });
  });
}

/**
 * Stop any currently playing audio and release resources.
 */
export async function stopPlayback(): Promise<void> {
  if (currentPlayback) {
    try {
      await currentPlayback.stopAsync();
      await currentPlayback.unloadAsync();
    } catch {
      // Sound may already be unloaded
    }
    currentPlayback = null;
  }
}

/**
 * Check if audio is currently being recorded.
 */
export function isRecording(): boolean {
  return recording !== null;
}

/**
 * Check if audio is currently playing.
 */
export function isPlaying(): boolean {
  return currentPlayback !== null;
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
