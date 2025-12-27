import { View, Text, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors } from '@/constants/theme';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function HomeScreen() {
  const color = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: color }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: textColor }]}>
          Welcome to CentimosVE!
        </Text>
        <Text style={[styles.subtitle, { color: useThemeColor({}, 'textSecondary') }]}>
          {user ? `Hello, ${user.username || user.email}!` : 'You are now logged in.'}
        </Text>
        
        <Text style={[styles.description, { color: textColor }]}>
          This is the main app screen. You can add your main app functionality here.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: primaryColor }]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    paddingBottom: 40,
  },
  logoutButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});