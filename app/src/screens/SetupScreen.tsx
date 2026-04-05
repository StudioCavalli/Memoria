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
import { useI18n, LOCALE_LABELS } from "../i18n";
import type { Locale } from "../i18n";

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
const DEFAULT_API_URL = "https://memoria-production-aeec.up.railway.app";
const LOCALES: Locale[] = ['fr', 'en', 'es', 'it'];

// ---------------------------------------------------------------------------
// Language Picker
// ---------------------------------------------------------------------------

function LanguagePicker() {
  const { locale, setLocale } = useI18n();

  return (
    <View className="flex-row justify-center items-center mb-6 gap-2">
      {LOCALES.map((loc) => (
        <Pressable
          key={loc}
          onPress={() => setLocale(loc)}
          className="px-4 py-2 rounded-lg"
          style={[
            locale === loc
              ? { backgroundColor: Colors.brown }
              : { backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.brown + '33' },
          ]}
        >
          <Text
            className="text-lg font-bold"
            style={{ color: locale === loc ? Colors.white : Colors.brown }}
          >
            {LOCALE_LABELS[loc]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SetupScreen({
  onSetupComplete,
  settingsMode = false,
  initialApiUrl,
}: SetupScreenProps) {
  const { t } = useI18n();

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
      setPinError(t('setup.pin.error'));
      setPin("");
    }
  };

  // -------------------------------------------------------------------------
  // Login + fetch seniors
  // -------------------------------------------------------------------------

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setLoginError(t('setup.login.error.empty'));
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
          throw new Error(t('setup.login.error.credentials'));
        }
        throw new Error(`${t('setup.login.error.server')} (${loginResponse.status}): ${errorText}`);
      }

      const loginData = await loginResponse.json();
      const jwt = loginData.token || loginData.access_token || loginData.jwt;

      if (!jwt) {
        throw new Error(t('setup.login.error.token'));
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
        throw new Error(t('setup.login.error.seniors'));
      }

      const seniorsData: Senior[] = await seniorsResponse.json();

      if (!seniorsData || seniorsData.length === 0) {
        throw new Error(t('setup.login.error.noseniors'));
      }

      // Si un seul senior, selection automatique
      if (seniorsData.length === 1) {
        await selectSenior(seniorsData[0], jwt, cleanUrl);
        return;
      }

      setSeniors(seniorsData);
      setStep("select");
    } catch (error: any) {
      setLoginError(error.message || t('setup.login.error.connection'));
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
      setLoginError(error.message || t('setup.login.error.save'));
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
            <Text className="text-6xl font-bold text-brown mb-3">{t('setup.title')}</Text>
            <Text className="text-3xl text-text-muted text-center">
              {step === "pin"
                ? t('setup.subtitle')
                : step === "login"
                ? t('setup.login.subtitle')
                : t('setup.select.subtitle')}
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
                <LanguagePicker />
                <Text className="text-2xl font-semibold text-brown mb-2 mt-4">{t('setup.pin.title')}</Text>
                <TextInput
                  style={{ backgroundColor: '#FFF8F0', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(125,99,64,0.2)', paddingHorizontal: 16, paddingVertical: 14, fontSize: 22, color: '#3D2C1E', marginBottom: 12 }}
                  value={pin}
                  onChangeText={setPin}
                  placeholder={t('setup.pin.placeholder')}
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
                  <Text className="text-3xl font-bold text-white">{t('setup.pin.submit')}</Text>
                </Pressable>
              </>
            )}

            {/* ---- Login Step ---- */}
            {step === "login" && (
              <>
                <Text className="text-2xl font-semibold text-brown mb-2 mt-4">{t('setup.login.server')}</Text>
                <TextInput
                  style={{ backgroundColor: '#FFF8F0', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(125,99,64,0.2)', paddingHorizontal: 16, paddingVertical: 14, fontSize: 22, color: '#3D2C1E', marginBottom: 12 }}
                  value={apiUrl}
                  onChangeText={setApiUrl}
                  placeholder="http://192.168.1.x:8000"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text className="text-2xl font-semibold text-brown mb-2 mt-4">{t('setup.login.email')}</Text>
                <TextInput
                  style={{ backgroundColor: '#FFF8F0', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(125,99,64,0.2)', paddingHorizontal: 16, paddingVertical: 14, fontSize: 22, color: '#3D2C1E', marginBottom: 12 }}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="votre@email.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text className="text-2xl font-semibold text-brown mb-2 mt-4">{t('setup.login.password')}</Text>
                <TextInput
                  style={{ backgroundColor: '#FFF8F0', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(125,99,64,0.2)', paddingHorizontal: 16, paddingVertical: 14, fontSize: 22, color: '#3D2C1E', marginBottom: 12 }}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('setup.login.password.placeholder')}
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
                    <Text className="text-3xl font-bold text-white">{t('setup.login.submit')}</Text>
                  )}
                </Pressable>
              </>
            )}

            {/* ---- Senior Selection Step ---- */}
            {step === "select" && (
              <>
                <Text className="text-2xl font-semibold text-brown mb-2 mt-4">
                  {t('setup.select.title')}
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
