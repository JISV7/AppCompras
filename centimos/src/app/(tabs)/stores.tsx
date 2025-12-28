import { StyleSheet, Text, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';

export default function StoresScreen() {
  const textColor = useThemeColor({}, 'textMain');
  const bgColor = useThemeColor({}, 'background');
  const primary = useThemeColor({}, 'primary');

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
           <Ionicons name="storefront" size={60} color={primary} />
        </View>
        <Text style={[styles.title, { color: textColor }]}>Stores Coming Soon</Text>
        <Text style={[styles.subtitle, { color: '#888' }]}>
          Compare prices across your favorite supermarkets nearby.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', padding: 30 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { textAlign: 'center', fontSize: 16, lineHeight: 24 },
});