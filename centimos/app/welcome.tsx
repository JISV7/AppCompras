import { View, Text, StyleSheet, Image } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors } from '@/constants/theme';
import { Link } from 'expo-router';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const color = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'textMain');
  const textSubColor = useThemeColor({}, 'textSub');
  const primaryColor = useThemeColor({}, 'primary');
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={[styles.container, { backgroundColor: color, paddingBottom: insets.bottom }]}>
      {/* Content Wrapper */}
      <View style={styles.contentWrapper}>
        {/* Top Branding / Illustration Area */}
        <View style={styles.topArea}>
          {/* App Logo / Icon Placeholder */}
          <View style={[styles.logoContainer, { backgroundColor: `${primaryColor}1a` }]}>
            <Text style={[styles.logoIcon, { color: primaryColor }]}>🛒</Text>
          </View>

          {/* Hero Illustration */}
          <View style={styles.illustrationContainer}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPLuBHQhyXvqd-f8P5uNsUp_iF8j7P_HNtSqQObhoNpMfG8IwZm5aCbU6gttJFIK3bR_lm52qbHByBkMvRPeVpMm6HtT9oxWw67F-BI3q7OqwxkvaPzHCoIDd2fVxOe8_6iW7yfQN_79RAXSnjDK7Y9Y5O-r-cfmM-w2TjV8F-QhogttwqL6OiEfSUFhR1FKeE3OkX5wy7145aXL2b392FRPq_hSrKDJghZdpavK2-aGfZAJaGAPKMlX-W6S-JYc5WdUQIWK5vRWfb' }}
              style={styles.illustration}
              resizeMode="contain"
            />
            {/* Decorative Elements to enhance visual interest */}
            <View style={[styles.decorativeElement1, { backgroundColor: '#FFD70033' }]} />
            <View style={[styles.decorativeElement2, { backgroundColor: `${primaryColor}1a` }]} />
          </View>
        </View>

        {/* Text Content Area */}
        <View style={styles.textArea}>
          <Text style={[styles.title, { color: textColor }]}>
            Shop Smarter in Venezuela
          </Text>
          <Text style={[styles.subtitle, { color: textSubColor }]}>
            Track prices, monitor the dollar, and save on every purchase.
          </Text>
        </View>

        {/* Action Buttons Area */}
        <View style={styles.buttonArea}>
          {/* Create Account Button (Primary) */}
          <Link href="/register" asChild>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: primaryColor }]}>
              <Text style={styles.primaryButtonText}>Create Account</Text>
            </TouchableOpacity>
          </Link>

          {/* Login Button (Outline/Secondary) */}
          <Link href="/login" asChild>
            <TouchableOpacity style={[styles.secondaryButton, { borderColor: `${primaryColor}33` }]}>
              <Text style={[styles.secondaryButtonText, { color: primaryColor }]}>Login</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Guest Link (Tertiary) */}
        <View style={styles.guestArea}>
          <TouchableOpacity style={styles.guestButton}>
            <Text style={[styles.guestButtonText, { color: textSubColor }]}>Continue as Guest</Text>
            <Text style={[styles.guestButtonIcon, { color: primaryColor }]}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Background Decorative Blobs for depth (Subtle) */}
      <View style={styles.backgroundBlobs}>
        <View style={[styles.blob1, { backgroundColor: `${primaryColor}0d` }]} />
        <View style={[styles.blob2, { backgroundColor: '#3b82f60d' }]} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f6f8f7',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  topArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '40%',
    paddingTop: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  logoIcon: {
    fontSize: 32,
  },
  illustrationContainer: {
    width: '100%',
    height: 256,
    position: 'relative',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  decorativeElement1: {
    position: 'absolute',
    top: -16,
    right: -16,
    width: 48,
    height: 48,
    borderRadius: 24,
    opacity: 0.2,
  },
  decorativeElement2: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 96,
    height: 96,
    borderRadius: 48,
    opacity: 0.2,
  },
  textArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 280,
  },
  buttonArea: {
    width: '100%',
    marginBottom: 16,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#10b77f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.39,
    shadowRadius: 14,
    elevation: 5,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  guestArea: {
    width: '100%',
    justifyContent: 'center',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  guestButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  guestButtonIcon: {
    fontSize: 16,
  },
  backgroundBlobs: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  blob1: {
    position: 'absolute',
    top: '-10%',
    right: '-10%',
    width: '50%',
    height: '30%',
    borderRadius: 9999,
    opacity: 0.2,
  },
  blob2: {
    position: 'absolute',
    bottom: '-5%',
    left: '-10%',
    width: '60%',
    height: '40%',
    borderRadius: 9999,
    opacity: 0.2,
  },
});