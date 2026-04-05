/**
 * Memoria - Senior Biographical AI Companion
 *
 * Main entry point.
 * Checks AsyncStorage for tablet pairing data:
 * - If paired -> HomeScreen
 * - If not paired -> SetupScreen
 */

import './global.css';

import React, { useCallback, useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import HomeScreen from "./src/screens/HomeScreen";
import SetupScreen from "./src/screens/SetupScreen";
import { getPairing } from "./src/services/storage";
import { setBaseURL, setWsURL } from "./src/services/api";
import { Colors } from "./src/constants/theme";
import { I18nProvider } from "./src/i18n";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPaired, setIsPaired] = useState(false);

  const checkPairing = useCallback(async () => {
    try {
      const pairing = await getPairing();
      if (pairing) {
        // Configurer les URLs de l'API depuis le jumelage sauvegarde
        const cleanUrl = pairing.api_url.replace(/\/+$/, "");
        setBaseURL(`${cleanUrl}/api`);
        setWsURL(cleanUrl.replace(/^http/, "ws"));
        setIsPaired(true);
      } else {
        setIsPaired(false);
      }
    } catch (error) {
      console.error("[App] Erreur de verification du jumelage:", error);
      setIsPaired(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPairing();
  }, [checkPairing]);

  const handleSetupComplete = useCallback(() => {
    setIsPaired(true);
  }, []);

  const handleUnpaired = useCallback(() => {
    setIsPaired(false);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 bg-cream justify-center items-center">
          <StatusBar style="dark" />
          <Text className="text-5xl font-bold text-brown mb-6">Memoria</Text>
          <ActivityIndicator size="large" color={Colors.brown} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <I18nProvider>
      <SafeAreaProvider>
        <View className="flex-1 bg-cream">
          <StatusBar style="dark" />
          {isPaired ? (
            <HomeScreen onRequestSetup={handleUnpaired} />
          ) : (
            <SetupScreen onSetupComplete={handleSetupComplete} />
          )}
        </View>
      </SafeAreaProvider>
    </I18nProvider>
  );
}
