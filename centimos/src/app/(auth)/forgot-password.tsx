import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/services/api'; // Import your API

export default function ForgotPasswordScreen() {
  const color = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'textMain');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const surfaceColor = useThemeColor({}, 'surfaceLight');
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSendResetLink = async () => {
    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      // 1. Call Backend
      await api.post('/auth/forgot-password', { email });
      
      // 2. Success Feedback
      Alert.alert('Email Sent', 'Check your inbox for the code.');
      
      // 3. Navigate to OTP screen with the email
      router.push({
        pathname: '/(auth)/otp',
        params: { email: email }
      });
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Could not send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ThemedView style={[styles.container, { backgroundColor: color, paddingBottom: insets.bottom }]}>
        <View style={styles.topBar}>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.backButton}>
              <MaterialIcons name="arrow-back-ios-new" size={24} color={textColor} />
            </TouchableOpacity>
          </Link>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={[styles.headline, { color: textColor }]}>
              Forgot Password?
            </Text>
            <Text style={[styles.bodyText, { color: textSecondaryColor }]}>
              Don't worry! It happens. Please enter the email associated with your account.
            </Text>

            <View style={styles.spacer} />

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.floatingInput, { color: textColor, backgroundColor: surfaceColor }]}
                  placeholder="Enter your email"
                  placeholderTextColor={textSecondaryColor}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: primaryColor }]}
                onPress={handleSendResetLink}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.actionButtonText}>Send Instructions</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
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