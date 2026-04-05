/**
 * SetupScreen
 *
 * Ecran de configuration initiale -- jumelage de la tablette a un senior.
 * Protege par un code PIN (1234).
 *
 * Flux :
 * 1. Saisie du PIN -> 2. Connexion (email/mot de passe) -> 3. Selection du senior -> 4. Sauvegarde
 */

import React, { useState } from "react";
import {
  Text,
  TextInput,
  View,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/theme";
import { savePairing } from "../services/storage";
import { setBaseURL, setWsURL } from "../services/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Senior {
  id: number;
  first_name: string;
  last_name: string;
}

interface SetupScreenProps {
  onSetupComplete: () => void;
  /** Si true, on est en mode "parametres" (skip le PIN) */
  settingsMode?: boolean;
  /** URL de l'API pre-remplie */
  initialApiUrl?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SETUP_PIN = "1234";
const DEFAULT_API_URL = "http://localhost:8000";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SetupScreen({
  onSetupComplete,
  settingsMode = false,
  initialApiUrl,
}: SetupScreenProps) {
  // Steps: pin -> login -> select -> done
  const [step, setStep] = useState<"pin" | "login" | "select">(
    settingsMode ? "login" : "pin"
  );

  // PIN
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  // Login
  const [apiUrl, setApiUrl] = useState(initialApiUrl || DEFAULT_API_URL);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  // Token + seniors
  const [token, setToken] = useState("");
  const [seniors, setSeniors] = useState<Senior[]>([]);

  // -------------------------------------------------------------------------
  // PIN validation
  // -------------------------------------------------------------------------

  const handlePinSubmit = () => {
    if (pin === SETUP_PIN) {
      setPinError("");
      setStep("login");
    } else {
      setPinError("Code PIN incorrect");
      setPin("");
    }
  };

  // -------------------------------------------------------------------------
  // Login + fetch seniors
  // -------------------------------------------------------------------------

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setLoginError("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    setLoginError("");

    try {
      const cleanUrl = apiUrl.replace(/\/+$/, "");

      // Authentification
      const loginResponse = await fetch(`${cleanUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!loginResponse.ok) {
        const errorText = await loginResponse.text().catch(() => "");
        if (loginResponse.status === 401) {
          throw new Error("Email ou mot de passe incorrect");
        }
        throw new Error(`Erreur serveur (${loginResponse.status}): ${errorText}`);
      }

      const loginData = await loginResponse.json();
      const jwt = loginData.token || loginData.access_token || loginData.jwt;

      if (!jwt) {
        throw new Error("Impossible de r\u00e9cup\u00e9rer le token d'authentification");
      }

      setToken(jwt);

      // Recuperer la liste des seniors
      const seniorsResponse = await fetch(`${cleanUrl}/api/seniors/`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });

      if (!seniorsResponse.ok) {
        throw new Error("Impossible de r\u00e9cup\u00e9rer la liste des seniors");
      }

      const seniorsData: Senior[] = await seniorsResponse.json();

      if (!seniorsData || seniorsData.length === 0) {
        throw new Error("Aucun senior trouv\u00e9 dans ce compte");
      }

      // Si un seul senior, selection automatique
      if (seniorsData.length === 1) {
        await selectSenior(seniorsData[0], jwt, cleanUrl);
        return;
      }

      setSeniors(seniorsData);
      setStep("select");
    } catch (error: any) {
      setLoginError(error.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Senior selection
  // -------------------------------------------------------------------------

  const selectSenior = async (senior: Senior, jwt?: string, url?: string) => {
    const cleanUrl = (url || apiUrl).replace(/\/+$/, "");
    const finalToken = jwt || token;

    try {
      setLoading(true);

      // Configurer les URLs de l'API
      setBaseURL(`${cleanUrl}/api`);
      setWsURL(cleanUrl.replace(/^http/, "ws"));

      // Sauvegarder le jumelage
      await savePairing({
        senior_id: senior.id,
        senior_name: `${senior.first_name} ${senior.last_name}`.trim(),
        api_token: finalToken,
        api_url: cleanUrl,
      });

      onSetupComplete();
    } catch (error: any) {
      setLoginError(error.message || "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32, paddingVertical: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="items-center mb-8">
            <Text className="text-6xl font-bold text-brown mb-3">Memoria</Text>
            <Text className="text-3xl text-text-muted text-center">
              {step === "pin"
                ? "Configuration de la tablette"
                : step === "login"
                ? "Connexion \u00e0 votre compte"
                : "S\u00e9lection du senior"}
            </Text>
          </View>

          {/* Card */}
          <View
            className="bg-white rounded-3xl px-8 py-12 w-full max-w-[500px]"
            style={{ shadowColor: '#7D6340', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 5 }}
          >
            {/* ---- PIN Step ---- */}
            {step === "pin" && (
              <>
                <Text className="text-2xl font-semibold text-brown mb-2 mt-4">Code PIN de configuration</Text>
                <TextInput
                  className="bg-cream rounded-xl border border-brown/20 px-4 py-3 text-2xl text-text-dark mb-3"
                  value={pin}
                  onChangeText={setPin}
                  placeholder="Entrez le code PIN"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                  autoFocus
                  onSubmitEditing={handlePinSubmit}
                />
                {pinError ? (
                  <Text className="text-2xl text-red-700 text-center mt-2 mb-3">{pinError}</Text>
                ) : null}
                <Pressable
                  className="bg-brown rounded-xl py-4 items-center mt-6"
                  style={{ shadowColor: '#7D6340', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }}
                  onPress={handlePinSubmit}
                >
                  <Text className="text-3xl font-bold text-white">Valider</Text>
                </Pressable>
              </>
            )}

            {/* ---- Login Step ---- */}
            {step === "login" && (
              <>
                <Text className="text-2xl font-semibold text-brown mb-2 mt-4">Adresse du serveur</Text>
                <TextInput
                  className="bg-cream rounded-xl border border-brown/20 px-4 py-3 text-2xl text-text-dark mb-3"
                  value={apiUrl}
                  onChangeText={setApiUrl}
                  placeholder="http://192.168.1.x:8000"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text className="text-2xl font-semibold text-brown mb-2 mt-4">Adresse email</Text>
                <TextInput
                  className="bg-cream rounded-xl border border-brown/20 px-4 py-3 text-2xl text-text-dark mb-3"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="votre@email.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text className="text-2xl font-semibold text-brown mb-2 mt-4">Mot de passe</Text>
                <TextInput
                  className="bg-cream rounded-xl border border-brown/20 px-4 py-3 text-2xl text-text-dark mb-3"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Votre mot de passe"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                  onSubmitEditing={handleLogin}
                />

                {loginError ? (
                  <Text className="text-2xl text-red-700 text-center mt-2 mb-3">{loginError}</Text>
                ) : null}

                <Pressable
                  className="bg-brown rounded-xl py-4 items-center mt-6"
                  style={[
                    { shadowColor: '#7D6340', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
                    loading ? { opacity: 0.6 } : {},
                  ]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <Text className="text-3xl font-bold text-white">Se connecter</Text>
                  )}
                </Pressable>
              </>
            )}

            {/* ---- Senior Selection Step ---- */}
            {step === "select" && (
              <>
                <Text className="text-2xl font-semibold text-brown mb-2 mt-4">
                  Choisissez le senior pour cette tablette
                </Text>
                {seniors.map((senior) => (
                  <Pressable
                    key={senior.id}
                    className="flex-row items-center justify-between bg-cream rounded-xl px-6 py-4 mt-4 border-2 border-orange-soft"
                    onPress={() => selectSenior(senior)}
                  >
                    <Text className="text-3xl font-semibold text-text-dark">
                      {senior.first_name} {senior.last_name}
                    </Text>
                    <Text className="text-4xl text-orange-soft">{"\u2192"}</Text>
                  </Pressable>
                ))}
                {loading && (
                  <ActivityIndicator
                    color={Colors.brown}
                    size="large"
                    style={{ marginTop: 24 }}
                  />
                )}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
