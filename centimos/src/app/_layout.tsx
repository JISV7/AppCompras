import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// 1. Create a separate component for the Navigation Logic
function InitialLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (isLoading) return;

    // Define which routes are "Public" (accessible without login)
    // We check segments[0] (the first part of the URL)
    const inAuthGroup = segments[0] === '(auth)';
    const inPublicGroup = segments[0] === '(public)';
    const isPublicRoute = inPublicGroup || ['index'].includes(segments[0] || 'index');

    if (user && (inAuthGroup || isPublicRoute)) {
      // If user is logged in, but currently on a public screen (like Login),
      // redirect them to the Tabs (Home)
      router.replace('/(tabs)');
    } else if (!user && segments[0] === '(tabs)') {
      // If user is NOT logged in, but tries to access Tabs,
      // kick them back to Welcome
      router.replace('/(public)/welcome');
    }
  }, [user, isLoading, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(public)/splash" options={{ headerShown: false }} />
        <Stack.Screen name="(public)/onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(public)/welcome" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/otp" options={{ headerShown: false }} />
        {/* The Tabs Folder */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

// 2. The Main Export wraps everything in the Provider
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <InitialLayout />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}