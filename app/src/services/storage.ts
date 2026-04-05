/**
 * Memoria Storage Service
 *
 * AsyncStorage wrapper for tablet pairing data.
 * Stores the senior_id, senior_name, API token and API URL.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PairingData {
  senior_id: number;
  senior_name: string;
  api_token: string;
  api_url: string;
}

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

const PAIRING_KEY = "@memoria_pairing";

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * Récupère les données de jumelage depuis AsyncStorage.
 * Retourne null si aucun jumelage n'est enregistré.
 */
export async function getPairing(): Promise<PairingData | null> {
  try {
    const json = await AsyncStorage.getItem(PAIRING_KEY);
    if (!json) return null;
    return JSON.parse(json) as PairingData;
  } catch (error) {
    console.error("[Storage] Erreur de lecture du jumelage:", error);
    return null;
  }
}

/**
 * Enregistre les données de jumelage dans AsyncStorage.
 */
export async function savePairing(data: PairingData): Promise<void> {
  try {
    await AsyncStorage.setItem(PAIRING_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("[Storage] Erreur d'écriture du jumelage:", error);
    throw error;
  }
}

/**
 * Supprime les données de jumelage (réinitialisation).
 */
export async function clearPairing(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PAIRING_KEY);
  } catch (error) {
    console.error("[Storage] Erreur de suppression du jumelage:", error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const StorageService = {
  getPairing,
  savePairing,
  clearPairing,
};

export default StorageService;
