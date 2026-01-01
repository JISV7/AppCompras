import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/services/api';

export default function OtpScreen() {
  const color = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'textMain');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const surfaceColor = useThemeColor({}, 'surfaceLight');
  
  // Get the email passed from the previous screen
  const { email } = useLocalSearchParams<{ email: string }>();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(59);
  
  // Refs for focusing next inputs (Phone Safe)
  const inputRefs = useRef<Array<TextInput | null>>([]);
  
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let interval: any = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [timer]);

  const handleOtpChange = (index: number, value: string) => {
    // Handle paste logic if the length is > 1
    if (value.length > 1) {
      // Check if it's numeric
      if (/^\d+$/.test(value)) {
        const newOtp = [...otp];
        const chars = value.split('').slice(0, 6); // Take up to 6 digits
        
        // Fill starting from the current index
        for (let i = 0; i < chars.length; i++) {
          if (index + i < 6) {
            newOtp[index + i] = chars[i];
          }
        }
        setOtp(newOtp);
        
        // Focus the input after the pasted segment, or the last one
        const nextIndex = Math.min(index + chars.length, 5);
        inputRefs.current[nextIndex]?.focus();
      }
      return;
    }

    // Normal single character input
    if (/^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      // If current box is empty and we are not at the start, move back and delete
      if (otp[index] === '' && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleVerifyAndReset = async () => {
    const code = otp.join('');
    
    if (code.length !== 6) {
      Alert.alert('Error', 'Por favor ingresa el código completo de 6 dígitos');
      return;
    }

    // 2. STRONG Password Check (Regex)
    // ^ = start
    // (?=.*[0-9]) = must contain at least 1 digit
    // (?=.*[!@#$%^&*]) = must contain at least 1 symbol (you can add more symbols inside [])
    // .{8,} = at least 8 characters long
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      Alert.alert(
        'Contraseña débil', 
        'La contraseña debe tener al menos 8 caracteres y contener al menos 1 número y 1 símbolo.'
      );
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: email,
        code: code,
        new_password: newPassword
      });

      Alert.alert('Éxito', '¡Contraseña actualizada! Por favor inicia sesión.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') }
      ]);
      
    } catch (error: any) {
      console.error('Reset Password Error:', error);
      
      // 1. Extract the specific message from the backend (e.g., "Invalid request")
      const backendMessage = error.response?.data?.detail;
      
      // 2. Fallback message if backend doesn't speak
      const displayMessage = backendMessage || 'Código inválido o expirado.';

      // 3. Show a nice Alert instead of crashing
      Alert.alert('Verificación fallida', displayMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/forgot-password', { email });
      setTimer(59);
      Alert.alert('Enviado', 'Se ha enviado un nuevo código.');
    } catch (e) {
      Alert.alert('Error', 'No se pudo reenviar el código.');
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: color }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 20 }}>
          
          {/* Back Button */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.headline, { color: textColor }]}>Restablecer contraseña</Text>
          <Text style={[styles.bodyText, { color: textSecondaryColor }]}>
            Ingresa el código enviado a <Text style={{ fontWeight: 'bold' }}>{email}</Text> y tu nueva contraseña.
          </Text>

          {/* OTP Inputs */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                // @ts-ignore
                ref={ref => inputRefs.current[index] = ref}
                style={[styles.otpInput, { color: textColor, backgroundColor: surfaceColor }]}
                value={digit}
                onChangeText={(value) => handleOtpChange(index, value)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={6} // Allow pasting up to 6 chars temporarily
                selectTextOnFocus
              />
            ))}
          </View>

          {/* New Password Input */}
          <View style={styles.passwordContainer}>
             <Text style={[styles.label, { color: textSecondaryColor }]}>Nueva contraseña</Text>
             <TextInput
                style={[styles.passwordInput, { color: textColor, backgroundColor: surfaceColor }]}
                placeholder="Ingresa nueva contraseña"
                placeholderTextColor="#9CA3AF"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
             />
          </View>

          {/* Timer */}
          <View style={styles.timerContainer}>
            {timer > 0 ? (
              <Text style={{ color: textSecondaryColor }}>Reenviar en {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={{ color: primaryColor, fontWeight: 'bold' }}>Reenviar código</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.verifyButton, { backgroundColor: primaryColor }]}
            onPress={handleVerifyAndReset}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.verifyButtonText}>Confirmar cambio</Text>}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 24,
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
  headline: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timerContainer: {
    alignItems: 'center',
    gap: 2,
    marginBottom: 32,
  },
  verifyButton: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b77f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  passwordContainer: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 4,
  },
  passwordInput: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
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
});