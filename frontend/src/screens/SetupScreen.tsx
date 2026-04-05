/**
 * SetupScreen
 *
 * Écran de configuration initiale — jumelage de la tablette à un senior.
 * Protégé par un code PIN (1234).
 *
 * Flux :
 * 1. Saisie du PIN → 2. Connexion (email/mot de passe) → 3. Sélection du senior → 4. Sauvegarde
 */

import React, { useState } from "react";
import {
  StyleSheet,
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
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from "../constants/theme";
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
  /** Si true, on est en mode « paramètres » (skip le PIN) */
  settingsMode?: boolean;
  /** URL de l'API pré-remplie */
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
  // Steps: pin → login → select → done
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
        throw new Error("Impossible de récupérer le token d'authentification");
      }

      setToken(jwt);

      // Récupérer la liste des seniors
      const seniorsResponse = await fetch(`${cleanUrl}/api/seniors/`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });

      if (!seniorsResponse.ok) {
        throw new Error("Impossible de récupérer la liste des seniors");
      }

      const seniorsData: Senior[] = await seniorsResponse.json();

      if (!seniorsData || seniorsData.length === 0) {
        throw new Error("Aucun senior trouvé dans ce compte");
      }

      // Si un seul senior, sélection automatique
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Memoria</Text>
            <Text style={styles.subtitle}>
              {step === "pin"
                ? "Configuration de la tablette"
                : step === "login"
                ? "Connexion à votre compte"
                : "Sélection du senior"}
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* ---- PIN Step ---- */}
            {step === "pin" && (
              <>
                <Text style={styles.label}>Code PIN de configuration</Text>
                <TextInput
                  style={styles.input}
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
                  <Text style={styles.errorText}>{pinError}</Text>
                ) : null}
                <Pressable style={styles.primaryButton} onPress={handlePinSubmit}>
                  <Text style={styles.primaryButtonText}>Valider</Text>
                </Pressable>
              </>
            )}

            {/* ---- Login Step ---- */}
            {step === "login" && (
              <>
                <Text style={styles.label}>Adresse du serveur</Text>
                <TextInput
                  style={styles.input}
                  value={apiUrl}
                  onChangeText={setApiUrl}
                  placeholder="http://192.168.1.x:8000"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={styles.label}>Adresse email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="votre@email.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={styles.label}>Mot de passe</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Votre mot de passe"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                  onSubmitEditing={handleLogin}
                />

                {loginError ? (
                  <Text style={styles.errorText}>{loginError}</Text>
                ) : null}

                <Pressable
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Se connecter</Text>
                  )}
                </Pressable>
              </>
            )}

            {/* ---- Senior Selection Step ---- */}
            {step === "select" && (
              <>
                <Text style={styles.label}>
                  Choisissez le senior pour cette tablette
                </Text>
                {seniors.map((senior) => (
                  <Pressable
                    key={senior.id}
                    style={styles.seniorItem}
                    onPress={() => selectSenior(senior)}
                  >
                    <Text style={styles.seniorName}>
                      {senior.first_name} {senior.last_name}
                    </Text>
                    <Text style={styles.seniorArrow}>→</Text>
                  </Pressable>
                ))}
                {loading && (
                  <ActivityIndicator
                    color={Colors.brown}
                    size="large"
                    style={{ marginTop: Spacing.lg }}
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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.hero,
    fontWeight: "700",
    color: Colors.brown,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.bodyLarge,
    color: Colors.textMuted,
    textAlign: "center",
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    width: "100%",
    maxWidth: 500,
    ...Shadows.medium,
  },
  label: {
    fontSize: FontSizes.body,
    fontWeight: "600",
    color: Colors.brown,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.body,
    color: Colors.textDark,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: FontSizes.body,
    color: Colors.error,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: Colors.brown,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.lg,
    ...Shadows.soft,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: FontSizes.bodyLarge,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  seniorItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.orangeSoft,
  },
  seniorName: {
    fontSize: FontSizes.bodyLarge,
    fontWeight: "600",
    color: Colors.textDark,
  },
  seniorArrow: {
    fontSize: FontSizes.heading2,
    color: Colors.orangeSoft,
  },
});
