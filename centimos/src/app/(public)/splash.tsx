import { Redirect, router } from 'expo-router';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useEffect, useRef } from 'react';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const color = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');

  useEffect(() => {
    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Redirect after 2 seconds
    const timer = setTimeout(() => {
      // In a real app, you'd check if user has completed onboarding
      // For now, redirect to onboarding
      // If user has completed onboarding, redirect to login or main app
      router.replace('/(public)/onboarding');
    }, 2000);

    return () => clearTimeout(timer);
  }, [pulseAnim]);

  return (
    <ThemedView style={[styles.container, { backgroundColor: color }]}>
      {/* Main Content: Centered Logo */}
      <View style={styles.mainContent}>
        {/* Logo Container with Pulse Animation */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: pulseAnim }],
            }
          ]}
        >
          {/* Decorative back splash for depth */}
          <View style={[styles.decorativeSplash, { backgroundColor: `${primaryColor}33` }]} />

          {/* Icon Container */}
          <View style={[
            styles.iconContainer,
            {
              backgroundColor: useThemeColor({}, 'surfaceLight'),
              shadowColor: `${primaryColor}1a`,
              borderColor: useThemeColor({}, 'text') === '#ECEDEE' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            }
          ]}>
            <Text style={[styles.logoIcon, { color: primaryColor }]}>💰</Text>
          </View>
        </Animated.View>

        {/* App Name */}
        <View style={styles.appNameContainer}>
          <Text style={[styles.appName, { color: textColor }]}>
            Céntimos<Text style={{ color: primaryColor }}>VE</Text>
          </Text>
          <Text style={[styles.appSubtitle, { color: useThemeColor({}, 'textSecondary') }]}>
            Presupuesto Inteligente
          </Text>
        </View>
      </View>

      {/* Footer: Attribution */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: useThemeColor({}, 'textSecondary') }]}>
          Potenciado por Datos Inteligentes
        </Text>
        <View style={[styles.divider, { backgroundColor: useThemeColor({}, 'textSecondary') }]} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  decorativeSplash: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9999,
    transform: [{ scale: 1.5 }],
    opacity: 0.2,
  },
  iconContainer: {
    width: 128,
    height: 128,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
    borderWidth: 1,
  },
  logoIcon: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  appNameContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  footer: {
    width: '100%',
    paddingBottom: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  divider: {
    height: 4,
    width: 48,
    borderRadius: 2,
  },
});