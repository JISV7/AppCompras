import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors } from '@/constants/theme';
import { Link } from 'expo-router';
import { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const color = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'textMain');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const surfaceColor = useThemeColor({}, 'surfaceLight');
  const [email, setEmail] = useState('');

  const handleSendResetLink = () => {
    // In a real app, you would send reset link to the email
    console.log('Sending reset link to:', email);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: color }]}>
      {/* TopAppBar */}
      <View style={styles.topBar}>
        <Link href="/login" asChild>
          <TouchableOpacity style={styles.backButton}>
            <MaterialIcons name="arrow-back-ios-new" size={24} color={textColor} />
          </TouchableOpacity>
        </Link>
      </View>

      {/* Scrollable Content */}
      <View style={styles.content}>
        {/* HeaderImage (Adapted for Illustration) */}
        <View style={styles.headerImageContainer}>
          <View style={styles.headerImageWrapper}>
            <View style={[styles.headerImage, {
              backgroundColor: 'transparent',
              backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuASTkR3df8KpUMIFHCBZ0sNJqymqBHziS7DXCPJnWSNJ4Wcj2BDMp_lgBcKQjF-arg8RNH9eJG19lMhIAvpYv5swI52wd6BnRmUibSq0jEHBLN0iZagpomtAZkntiePhtnHffZ0wOVL3IBwGgNWTKiejHvTH1kKfiKN2sRxPuRfoM-nPpmJDss9GCnX21lCZDelQ2r9R5eZAfK0OzCIsGrZ20FMraEdLpg6rEvKcoP8-jksUR3InbmV83Ut7Nh5DFgYlUjPAEHLXTTe')`,
            }]} />
          </View>
        </View>

        {/* HeadlineText */}
        <Text style={[styles.headline, { color: textColor }]}>
          Forgot Password?
        </Text>

        {/* BodyText */}
        <Text style={[styles.bodyText, { color: textSecondaryColor }]}>
          Don't worry! It happens. Please enter the email associated with your account.
        </Text>

        {/* Spacing */}
        <View style={styles.spacer} />

        {/* Form Section */}
        <View style={styles.form}>
          {/* Floating Label Input */}
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.floatingInput, { color: textColor, backgroundColor: surfaceColor }]}
              placeholder=" "
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={[styles.floatingLabel, { color: textSecondaryColor }]}>
              Email Address
            </Text>
            {/* Optional Email Icon indicator */}
            <View style={styles.emailIcon}>
              <MaterialIcons name="mail" size={20} color={textSecondaryColor} />
            </View>
          </View>

          {/* Primary Action Button */}
          <Link href="/otp" asChild>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: primaryColor }]}
              onPress={handleSendResetLink}
            >
              <Text style={styles.actionButtonText}>Send Instructions</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Footer / Help Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: textSecondaryColor }]}>
            No access to email? <Link href="#" asChild><Text style={{ color: primaryColor, fontWeight: '500' }}>Contact Support</Text></Link>
          </Text>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f7',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6f8f7',
    padding: 16,
    paddingBottom: 8,
    justifyContent: 'flex-start',
    zIndex: 50,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    marginHorizontal: 'auto',
    paddingHorizontal: 16,
  },
  headerImageContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  headerImageWrapper: {
    width: '100%',
    justifyContent: 'center',
  },
  headerImage: {
    width: 192,
    height: 192,
    alignSelf: 'center',
    backgroundColor: 'transparent',
    borderRadius: 16,
  },
  headline: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 8,
  },
  bodyText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingBottom: 32,
    paddingTop: 4,
  },
  spacer: {
    height: 16,
    width: '100%',
  },
  form: {
    width: '100%',
    paddingHorizontal: 16,
    gap: 24,
  },
  inputGroup: {
    position: 'relative',
  },
  floatingInput: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 24,
    fontSize: 16,
    color: '#0d1b17',
  },
  floatingLabel: {
    position: 'absolute',
    left: 16,
    top: 24,
    zIndex: 1,
    fontSize: 12,
    color: '#9CA3AF',
    transform: [{ translateY: -12 }, { scale: 0.85 }],
  },
  emailIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  actionButton: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b77f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 32,
    paddingVertical: 32,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
});