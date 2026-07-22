/**
 * Memoria API Service
 *
 * REST + WebSocket communication with the Memoria backend.
 */

// Host is configurable at build time via EXPO_PUBLIC_API_URL; the pairing flow
// overrides both URLs at runtime with the value returned by the backend.
const DEFAULT_HOST = (
  process.env.EXPO_PUBLIC_API_URL ?? "https://memoria-production-aeec.up.railway.app"
).replace(/\/+$/, "");

let baseURL = `${DEFAULT_HOST}/api`;
let wsURL = DEFAULT_HOST.replace(/^http/, "ws");
let authToken: string | null = null;

export function setBaseURL(url: string): void {
  baseURL = url.replace(/\/+$/, "");
}

export function setWsURL(url: string): void {
  wsURL = url.replace(/\/+$/, "");
}

/** Set the JWT obtained via pairing; sent on every REST + WebSocket call. */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getBaseURL(): string {
  return baseURL;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Session {
  id: number;
  senior_id: number;
  status: "active" | "completed" | "cancelled";
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  summary?: string;
}

export interface MessageResponse {
  session_id: number;
  user_text: string;
  ai_response: string;
  latency_ms: number;
}

export interface VoicePipelineEvent {
  type: "transcription" | "response_text" | "status" | "latency" | "silence_detected" | "error";
  text?: string;
  status?: "idle" | "listening" | "thinking" | "speaking";
  stt_ms?: number;
  llm_ms?: number;
  tts_ms?: number;
  total_ms?: number;
  message?: string;
}

export type VoicePipelineCallback = (event: VoicePipelineEvent) => void;
export type AudioCallback = (audioData: ArrayBuffer) => void;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${baseURL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`API Error ${response.status}: ${response.statusText} - ${errorBody}`);
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// REST API
// ---------------------------------------------------------------------------

export async function startSession(seniorId: number): Promise<Session> {
  return request<Session>("/sessions/start", {
    method: "POST",
    body: JSON.stringify({ senior_id: seniorId }),
  });
}

export async function sendMessage(sessionId: number, text: string): Promise<MessageResponse> {
  return request<MessageResponse>(`/sessions/${sessionId}/message`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function endSession(sessionId: number): Promise<Session> {
  return request<Session>(`/sessions/${sessionId}/end`, {
    method: "POST",
  });
}

// ---------------------------------------------------------------------------
// Voice Pipeline WebSocket
// ---------------------------------------------------------------------------

export class VoicePipeline {
  private ws: WebSocket | null = null;
  private onEvent: VoicePipelineCallback;
  private onAudio: AudioCallback;

  constructor(onEvent: VoicePipelineCallback, onAudio: AudioCallback) {
    this.onEvent = onEvent;
    this.onAudio = onAudio;
  }

  connect(sessionId: number): void {
    const query = authToken ? `?token=${encodeURIComponent(authToken)}` : "";
    this.ws = new WebSocket(`${wsURL}/ws/voice/${sessionId}${query}`);
    this.ws.binaryType = "arraybuffer";

    this.ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        // Binary audio data from TTS
        this.onAudio(event.data);
      } else {
        // JSON event
        try {
          const parsed = JSON.parse(event.data) as VoicePipelineEvent;
          this.onEvent(parsed);
        } catch {
          // Ignore parse errors
        }
      }
    };

    this.ws.onerror = () => {
      this.onEvent({ type: "error", message: "Connexion perdue" });
    };

    this.ws.onclose = () => {
      this.onEvent({ type: "status", status: "idle" });
    };
  }

  sendAudioChunk(chunk: ArrayBuffer): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(chunk);
    }
  }

  endTurn(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: "end_turn" }));
    }
  }

  interrupt(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: "interrupt" }));
    }
  }

  endSessionWs(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: "end_session" }));
    }
    this.disconnect();
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const ApiService = {
  setBaseURL,
  setWsURL,
  setAuthToken,
  getBaseURL,
  startSession,
  sendMessage,
  endSession,
  VoicePipeline,
};

export default ApiService;
