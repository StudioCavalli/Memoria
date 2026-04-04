/**
 * Memoria - Senior Biographical AI Companion
 *
 * Main entry point. Renders the single HomeScreen.
 * No navigation stack needed -- the entire app is one screen with one button.
 */

import React from "react";
import { StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import HomeScreen from "./src/screens/HomeScreen";
import { Colors } from "./src/constants/theme";

export default function App() {
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <HomeScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
});
