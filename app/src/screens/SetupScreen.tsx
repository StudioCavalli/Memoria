/**
 * SetupScreen
 *
 * Ecran de configuration initiale -- jumelage de la tablette a un senior.
 *
 * Nouveau flux simplifie :
 * 1. Selection de la langue (FR/EN/ES/IT)
 * 2. Saisie du code de pairing 6 chiffres genere sur le dashboard
 *    -> validation via POST /api/pairing/validate (sans auth)
 *    -> sauvegarde du token + senior dans AsyncStorage
 *    -> transition vers HomeScreen
 */

import React, { useState, useRef } from "react";
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

interface SetupScreenProps {
  onSetupComplete: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_API_URL = "https://memoria-production-aeec.up.railway.app";
const LOCALES: Locale[] = ['fr', 'en', 'es', 'it'];
const CODE_LENGTH = 6;

// ---------------------------------------------------------------------------
// Language Picker
// ---------------------------------------------------------------------------

function LanguagePicker({ onNext }: { onNext: () => void }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <>
      <Text className="text-2xl font-semibold text-brown mb-6 text-center">
        {t('setup.lang.title')}
      </Text>
      <View className="flex-row justify-center items-center mb-8 gap-3 flex-wrap">
        {LOCALES.map((loc) => (
          <Pressable
            key={loc}
            onPress={() => setLocale(loc)}
            className="px-6 py-3 rounded-xl"
            style={[
              locale === loc
                ? { backgroundColor: Colors.brown }
                : { backgroundColor: Colors.cream, borderWidth: 2, borderColor: Colors.brown + '33' },
            ]}
          >
            <Text
              className="text-xl font-bold"
              style={{ color: locale === loc ? Colors.white : Colors.brown }}
            >
              {LOCALE_LABELS[loc]}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        className="bg-brown rounded-xl py-4 items-center mt-4"
        style={{ shadowColor: '#7D6340', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }}
        onPress={onNext}
      >
        <Text className="text-3xl font-bold text-white">{t('setup.lang.next')}</Text>
      </Pressable>
    </>
  );
}

// ---------------------------------------------------------------------------
// Pairing Code Input
// ---------------------------------------------------------------------------

function PairingCodeInput({
  onSubmit,
  loading,
  error,
}: {
  onSubmit: (code: string) => void;
  loading: boolean;
  error: string;
}) {
  const { t } = useI18n();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleDigitChange = (index: number, value: string) => {
    // Only accept digits
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Auto-advance to next input
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = () => {
    const code = digits.join("");
    if (code.length === CODE_LENGTH) {
      onSubmit(code);
    }
  };

  const code = digits.join("");
  const isComplete = code.length === CODE_LENGTH;

  return (
    <>
      <Text className="text-2xl font-semibold text-brown mb-2 text-center">
        {t('setup.pairing.title')}
      </Text>
      <Text className="text-xl text-text-muted mb-8 text-center">
        {t('setup.pairing.subtitle')}
      </Text>

      <View className="flex-row justify-center gap-3 mb-6">
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            style={{
              width: 56,
              height: 72,
              backgroundColor: '#FFF8F0',
              borderRadius: 14,
              borderWidth: 2,
              borderColor: digit ? Colors.brown : 'rgba(125,99,64,0.2)',
              fontSize: 36,
              fontWeight: 'bold',
              color: '#3D2C1E',
              textAlign: 'center',
            }}
            value={digit}
            onChangeText={(v) => handleDigitChange(index, v)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={1}
            autoFocus={index === 0}
            selectTextOnFocus
          />
        ))}
      </View>

      {error ? (
        <Text className="text-xl text-red-700 text-center mt-2 mb-3">{error}</Text>
      ) : null}

      <Pressable
        className="bg-brown rounded-xl py-4 items-center mt-6"
        style={[
          { shadowColor: '#7D6340', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
          (!isComplete || loading) ? { opacity: 0.6 } : {},
        ]}
        onPress={handleSubmit}
        disabled={!isComplete || loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <Text className="text-3xl font-bold text-white">{t('setup.pairing.submit')}</Text>
        )}
      </Pressable>
    </>
  );
}

// ---------------------------------------------------------------------------
// Success Screen
// ---------------------------------------------------------------------------

function SuccessScreen({ seniorName, onContinue }: { seniorName: string; onContinue: () => void }) {
  const { t } = useI18n();

  React.useEffect(() => {
    const timer = setTimeout(onContinue, 3000);
    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <>
      <Text className="text-5xl mb-4 text-center">{"\u2705"}</Text>
      <Text className="text-3xl font-bold text-brown text-center mb-4">
        {t('setup.pairing.success')}
      </Text>
      <Text className="text-2xl text-text-muted text-center">
        {t('setup.pairing.welcome').replace('{name}', seniorName)}
      </Text>
    </>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SetupScreen({ onSetupComplete }: SetupScreenProps) {
  const { t } = useI18n();

  const [step, setStep] = useState<"language" | "pairing" | "success">("language");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successName, setSuccessName] = useState("");

  const handlePairingSubmit = async (code: string) => {
    setLoading(true);
    setError("");

    try {
      const apiUrl = DEFAULT_API_URL;
      const cleanUrl = apiUrl.replace(/\/+$/, "");

      const response = await fetch(`${cleanUrl}/api/pairing/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(t('setup.pairing.error.invalid'));
        }
        throw new Error(t('setup.pairing.error.server'));
      }

      const data = await response.json();
      const jwt = data.access_token;
      const seniorId = data.senior_id;
      const seniorName = data.senior_name;
      const settingsPin = data.settings_pin || "1234";

      if (!jwt || !seniorId) {
        throw new Error(t('setup.pairing.error.server'));
      }

      // Configure API URLs
      setBaseURL(`${cleanUrl}/api`);
      setWsURL(cleanUrl.replace(/^http/, "ws"));

      // Save pairing data (including settings PIN from server)
      await savePairing({
        senior_id: seniorId,
        senior_name: seniorName,
        api_token: jwt,
        api_url: cleanUrl,
        settings_pin: settingsPin,
      });

      setSuccessName(seniorName);
      setStep("success");
    } catch (err: any) {
      setError(err.message || t('setup.pairing.error.server'));
    } finally {
      setLoading(false);
    }
  };

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
              {step === "language"
                ? t('setup.subtitle')
                : step === "pairing"
                ? t('setup.pairing.header')
                : ""}
            </Text>
          </View>

          {/* Card */}
          <View
            className="bg-white rounded-3xl px-8 py-12 w-full max-w-[500px]"
            style={{ shadowColor: '#7D6340', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 5 }}
          >
            {step === "language" && (
              <LanguagePicker onNext={() => setStep("pairing")} />
            )}

            {step === "pairing" && (
              <PairingCodeInput
                onSubmit={handlePairingSubmit}
                loading={loading}
                error={error}
              />
            )}

            {step === "success" && (
              <SuccessScreen
                seniorName={successName}
                onContinue={onSetupComplete}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
