import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';

interface QuickActionsProps {
  onLogPrice: () => void;
  onOpenConverter: () => void;
}

export function QuickActions({ onLogPrice, onOpenConverter }: QuickActionsProps) {
  const textColor = useThemeColor({}, 'textMain');
  const cardColor = useThemeColor({}, 'surfaceLight');
  const primaryColor = useThemeColor({}, 'primary');
  const router = useRouter();

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: textColor }]}>Acciones rápidas</Text>
      <View style={styles.grid}>
        {/* 1. Log Price */}
        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: cardColor }]}
          onPress={onLogPrice}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
             <MaterialIcons name="add-location-alt" size={24} color={primaryColor} />
          </View>
          <Text style={[styles.actionTitle, { color: textColor }]}>Registrar precio</Text>
        </TouchableOpacity>

        {/* 2. Converter */}
        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: cardColor }]}
          onPress={onOpenConverter}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
             <MaterialIcons name="calculate" size={24} color="#1976D2" />
          </View>
          <Text style={[styles.actionTitle, { color: textColor }]}>Convertidor</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.grid, { marginTop: 15 }]}>
        {/* 3. New List */}
        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: cardColor }]}
          onPress={() => router.push('/lists')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
             <MaterialIcons name="playlist-add" size={24} color="#E65100" />
          </View>
          <Text style={[styles.actionTitle, { color: textColor }]}>Nueva lista</Text>
        </TouchableOpacity>

        {/* 4. Add Store */}
        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: cardColor }]}
          onPress={() => router.push('/stores')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
             <MaterialIcons name="storefront" size={24} color="#7B1FA2" />
          </View>
          <Text style={[styles.actionTitle, { color: textColor }]}>Agregar tienda</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.grid, { marginTop: 15 }]}>
        {/* 5. Example Modal */}
        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: cardColor }]}
          onPress={() => router.push('/modal')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#E0F7FA' }]}>
             <MaterialIcons name="info-outline" size={24} color="#00ACC1" />
          </View>
          <Text style={[styles.actionTitle, { color: textColor }]}>Ejemplo Modal</Text>
        </TouchableOpacity>

        {/* Empty space for balance */}
        <View style={{ flex: 1 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  grid: { flexDirection: 'row', gap: 15 },
  actionCard: {
    flex: 1, padding: 15, borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1,
  },
  actionIcon: {
    width: 45, height: 45, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10
  },
  actionTitle: { fontWeight: 'bold', fontSize: 15 },
});