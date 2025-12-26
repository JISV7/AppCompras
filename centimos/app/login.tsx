import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors } from '@/constants/theme';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const color = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'textMain');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const surfaceColor = useThemeColor({}, 'surfaceLight');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = () => {
    // In a real app, you would handle login logic here
    console.log('Login with:', { email, password });
    login(email, password);
    // After successful login, navigate to main app
    router.replace('/(tabs)/index');
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: color }]}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={[styles.logoWrapper, { backgroundColor: `${primaryColor}1a`, transform: [{ rotate: '3deg' }] }]}>
            <MaterialIcons name="savings" size={40} color={primaryColor} />
          </View>
          <View style={styles.decorationDot}>
            <MaterialIcons name="currency-exchange" size={14} color="white" />
          </View>
        </View>

        <Text style={[styles.title, { color: textColor }]}>
          Welcome Back
        </Text>

        <Text style={[styles.subtitle, { color: textSecondaryColor }]}>
          Optimize your grocery budget with CentimosVE.
        </Text>
      </View>

      {/* Form Section */}
      <View style={styles.form}>
        {/* Email Field */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColor }]}>Email Address</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <MaterialIcons
                name="mail"
                size={20}
                color={textSecondaryColor}
              />
            </View>
            <TextInput
              style={[styles.input, { color: textColor, backgroundColor: surfaceColor }]}
              placeholder="user@example.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Password Field */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColor }]}>Password</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <MaterialIcons
                name="lock"
                size={20}
                color={textSecondaryColor}
              />
            </View>
            <TextInput
              style={[styles.input, { color: textColor, backgroundColor: surfaceColor }]}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={togglePasswordVisibility}
            >
              <MaterialIcons
                name={showPassword ? "visibility" : "visibility-off"}
                size={20}
                color={textSecondaryColor}
              />
            </TouchableOpacity>
          </View>
          <Link href="/forgot-password" asChild>
            <Text style={[styles.forgotPassword, { color: primaryColor }]}>
              Forgot Password?
            </Text>
          </Link>
        </View>

        {/* Main Actions */}
        <View style={styles.actions}>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: primaryColor }]}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>Log In</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.faceIdButton}>
              <MaterialIcons name="face" size={28} color={primaryColor} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Social Login */}
      <View style={styles.socialSection}>
        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: useThemeColor({}, 'textSecondary') }]} />
          <Text style={[styles.dividerText, { color: useThemeColor({}, 'textSecondary') }]}>
            Or continue with
          </Text>
          <View style={[styles.divider, { backgroundColor: useThemeColor({}, 'textSecondary') }]} />
        </View>

        <View style={styles.socialButtons}>
          <TouchableOpacity style={[styles.socialButton, { backgroundColor: surfaceColor }]}>
            <MaterialIcons name="mail" size={20} color="#4285F4" />
            <Text style={[styles.socialButtonText, { color: textColor }]}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.socialButton, { backgroundColor: surfaceColor }]}>
            <MaterialIcons name="apple" size={20} color={textColor} />
            <Text style={[styles.socialButtonText, { color: textColor }]}>Apple</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: useThemeColor({}, 'textSecondary') }]}>
          Don't have an account?
          <Link href="/register" asChild>
            <Text style={{ color: primaryColor, fontWeight: 'bold' }}> Sign Up</Text>
          </Link>
        </Text>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fcfa',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '3deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  decorationDot: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FBBF24',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f8fcfa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: '#4c9a80',
  },
  form: {
    width: '100%',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIconContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  input: {
    flex: 1,
    paddingLeft: 44,
    paddingRight: 44,
    paddingVertical: 16,
    borderRadius: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    marginTop: 8,
  },
  actions: {
    marginTop: 24,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  loginButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#10b77f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  faceIdButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  socialSection: {
    width: '100%',
    marginBottom: 32,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
});