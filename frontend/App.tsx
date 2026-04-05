/**
 * Memoria - Senior Biographical AI Companion
 *
 * Main entry point.
 * Checks AsyncStorage for tablet pairing data:
 * - If paired → HomeScreen
 * - If not paired → SetupScreen
 */

import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import HomeScreen from "./src/screens/HomeScreen";
import SetupScreen from "./src/screens/SetupScreen";
import { getPairing } from "./src/services/storage";
import { setBaseURL, setWsURL } from "./src/services/api";
import { Colors } from "./src/constants/theme";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPaired, setIsPaired] = useState(false);

  const checkPairing = useCallback(async () => {
    try {
      const pairing = await getPairing();
      if (pairing) {
        // Configurer les URLs de l'API depuis le jumelage sauvegardé
        const cleanUrl = pairing.api_url.replace(/\/+$/, "");
        setBaseURL(`${cleanUrl}/api`);
        setWsURL(cleanUrl.replace(/^http/, "ws"));
        setIsPaired(true);
      } else {
        setIsPaired(false);
      }
    } catch (error) {
      console.error("[App] Erreur de vérification du jumelage:", error);
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
        <View style={styles.loadingRoot}>
          <StatusBar style="dark" />
          <Text style={styles.loadingTitle}>Memoria</Text>
          <ActivityIndicator size="large" color={Colors.brown} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="dark" />
        {isPaired ? (
          <HomeScreen onRequestSetup={handleUnpaired} />
        ) : (
          <SetupScreen onSetupComplete={handleSetupComplete} />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingTitle: {
    fontSize: 48,
    fontWeight: "700",
    color: Colors.brown,
    marginBottom: 24,
  },
});
