import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const color = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'textMain');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const surfaceColor = useThemeColor({}, 'surfaceLight');

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const passwordRef = useRef<TextInput>(null);
  
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Alerta', 'Por favor completa todos los campos');
      return;
    }
    try {
      await login(email, password);
    } catch (e) {
      console.log("Login error handled");
    }
  };

  return (
      <ThemedView style={[styles.container, { backgroundColor: color, paddingBottom: insets.bottom }]}>
        {/* Header Section */}
        <View style={styles.topHeader}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <View style={styles.spacer} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.logoArea}>
            <View style={[styles.logoContainer, { backgroundColor: `${primaryColor}1a` }]}>
              <MaterialIcons name="savings" size={32} color={primaryColor} />
            </View>

            <Text style={[styles.title, { color: textColor }]}>
              Bienvenido de nuevo
            </Text>

            <Text style={[styles.subtitle, { color: textSecondaryColor }]}>
              Optimiza tu presupuesto de mercado con CéntimosVE.
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Correo electrónico</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <MaterialIcons name="mail" size={20} color={textSecondaryColor} />
                </View>
                <TextInput
                  style={[styles.input, { color: textColor, backgroundColor: surfaceColor }]}
                  placeholder="usuario@ejemplo.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  submitBehavior="submit"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Contraseña</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <MaterialIcons name="lock" size={20} color={textSecondaryColor} />
                </View>
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, { color: textColor, backgroundColor: surfaceColor }]}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.passwordToggle} onPress={togglePasswordVisibility}>
                  <MaterialIcons
                    name={showPassword ? "visibility" : "visibility-off"}
                    size={20}
                    color={textSecondaryColor}
                  />
                </TouchableOpacity>
              </View>
                <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                   <Text style={[styles.forgotPassword, { color: primaryColor }]}>
                     ¿Olvidaste tu contraseña?
                   </Text>
                </TouchableOpacity>
            </View>

            {/* Main Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.loginButton, { backgroundColor: primaryColor }]}
                onPress={handleLogin}
              >
                <Text style={styles.loginButtonText}>Iniciar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Social Login */}
          <View style={styles.socialSection}>
            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: useThemeColor({}, 'textSecondary') }]} />
              <Text style={[styles.dividerText, { color: useThemeColor({}, 'textSecondary') }]}>
                O continuar con
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
        </ScrollView>
        {/* Footer */}
        <View style={styles.footer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.footerText, { color: useThemeColor({}, 'textSecondary') }]}>
              ¿No tienes una cuenta?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
               <Text style={{ color: primaryColor, fontWeight: 'bold' }}>Regístrate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fcfa',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 24,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  spacer: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    marginTop: 16,
  },
  actions: {
    marginTop: 24,
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
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 14,
  },
});