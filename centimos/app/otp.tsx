import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors } from '@/constants/theme';
import { Link, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons';

export default function OtpScreen() {
  const color = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'textMain');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(59);
  const router = useRouter();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleOtpChange = (index: number, value: string) => {
    if (/^\d*$/.test(value) || value === '') {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Move to next input if value is entered and not the last input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-input-${index + 1}`);
        // @ts-ignore
        nextInput?.focus();
      }
    }
  };

  const handleVerify = () => {
    const otpCode = otp.join('');
    if (otpCode.length === 6) {
      // In a real app, you would verify the OTP code
      console.log('Verifying OTP:', otpCode);
      Alert.alert('Success', 'OTP verified successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // After successful OTP verification, navigate to reset password screen
            // For now, we'll navigate to login
            router.replace('/login');
          }
        }
      ]);
    } else {
      Alert.alert('Error', 'Please enter the complete OTP code');
    }
  };

  const handleResend = () => {
    // In a real app, you would resend the OTP
    console.log('Resending OTP...');
    setTimer(59); // Reset timer
    Alert.alert('OTP Resent', 'A new OTP has been sent to your email');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: color }]}>
      {/* TopAppBar */}
      <View style={styles.topBar}>
        <Link href="/forgot-password" asChild>
          <TouchableOpacity style={styles.backButton}>
            <MaterialIcons name="arrow-back-ios-new" size={24} color={textColor} />
          </TouchableOpacity>
        </Link>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Icon / Illustration */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconWrapper, { backgroundColor: `${primaryColor}1a` }]}>
            <MaterialIcons name="mark-email-unread" size={48} color={primaryColor} />
          </View>
        </View>

        {/* HeadlineText */}
        <Text style={[styles.headline, { color: textColor }]}>
          Check your mail
        </Text>

        {/* BodyText */}
        <Text style={[styles.bodyText, { color: textSecondaryColor }]}>
          We sent a 6-digit code to <Text style={{ fontWeight: 'bold', color: textColor }}>alex***@gmail.com</Text>. Enter it below to reset your password.
        </Text>

        {/* ConfirmationCode */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              id={`otp-input-${index}`}
              style={[styles.otpInput, { color: textColor, backgroundColor: useThemeColor({}, 'surfaceLight') }]}
              value={digit}
              onChangeText={(value) => handleOtpChange(index, value)}
              keyboardType="number-pad"
              maxLength={1}
              autoFocus={index === 0}
            />
          ))}
        </View>

        {/* Timer / Resend */}
        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, { color: textSecondaryColor }]}>
            Resend code in <Text style={{ color: textColor, fontWeight: 'bold' }}>{formatTime(timer)}</Text>
          </Text>
          {timer === 0 && (
            <TouchableOpacity onPress={handleResend}>
              <Text style={[styles.resendLink, { color: primaryColor }]}>Resend Code</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Verify Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.verifyButton, { backgroundColor: primaryColor }]}
          onPress={handleVerify}
        >
          <Text style={styles.verifyButtonText}>Verify and Reset</Text>
        </TouchableOpacity>
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
    padding: 16,
    paddingTop: 24,
    zIndex: 10,
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  iconContainer: {
    marginBottom: 24,
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderColor: '#D1D5DB',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    backgroundColor: '#FFFFFF',
  },
  timerContainer: {
    alignItems: 'center',
    gap: 2,
    marginBottom: 32,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  verifyButton: {
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
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});