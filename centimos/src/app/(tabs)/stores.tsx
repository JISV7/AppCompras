import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CreateStoreModal } from "@/components/stores/CreateStoreModal";
import { StoreDetailModal } from "@/components/stores/StoreDetailModal";
import { useThemeColor } from "@/hooks/use-theme-color";
import { getNearbyStores, searchStores } from "@/services/api";

interface Store {
	store_id: string;
	name: string;
	address?: string;
	latitude?: number;
	longitude?: number;
}

export default function StoresScreen() {
	const insets = useSafeAreaInsets();
	const bgColor = useThemeColor({}, "background");
	const cardColor = useThemeColor({}, "surfaceLight");
	const textColor = useThemeColor({}, "textMain");
	const subTextColor = useThemeColor({}, "textSecondary");
	const primaryColor = useThemeColor({}, "primary");

	const [stores, setStores] = useState<Store[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [_isSearching, setIsSearching] = useState(false);
	const [modalVisible, setModalVisible] = useState(false);

	// Detail Modal
	const [selectedStore, setSelectedStore] = useState<Store | null>(null);
	const [detailVisible, setDetailVisible] = useState(false);

	// Location
	const [userLocation, setUserLocation] =
		useState<Location.LocationObject | null>(null);
	const [_permissionGranted, setPermissionGranted] = useState(false);

	const initLocationAndFetch = useCallback(async () => {
		setLoading(true);
		try {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				setPermissionGranted(false);
				setLoading(false);
				// If no permission, try to load all stores or leave empty
				const all = await searchStores("");
				setStores(all);
				return;
			}
			setPermissionGranted(true);

			const location = await Location.getCurrentPositionAsync({});
			setUserLocation(location);

			// Load Nearby Stores by default
			const nearby = await getNearbyStores(
				location.coords.latitude,
				location.coords.longitude,
			);
			setStores(nearby);
		} catch (error) {
			console.error("Error getting location/stores", error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		initLocationAndFetch();
	}, [initLocationAndFetch]);

	const handleSearch = async () => {
		if (!searchQuery.trim()) {
			initLocationAndFetch();
			return;
		}

		setIsSearching(true);
		setLoading(true);
		try {
			const results = await searchStores(searchQuery);
			setStores(results);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	const calculateDistance = (lat1?: number, lon1?: number) => {
		if (!userLocation || !lat1 || !lon1) return null;

		// Haversine formula simplified for display
		const R = 6371; // km
		const dLat = ((lat1 - userLocation.coords.latitude) * Math.PI) / 180;
		const dLon = ((lon1 - userLocation.coords.longitude) * Math.PI) / 180;
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos((userLocation.coords.latitude * Math.PI) / 180) *
				Math.cos((lat1 * Math.PI) / 180) *
				Math.sin(dLon / 2) *
				Math.sin(dLon / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		const d = R * c; // Distance in km

		if (d < 1) return `${(d * 1000).toFixed(0)} m`;
		return `${d.toFixed(1)} km`;
	};

	const renderItem = ({ item }: { item: Store }) => (
		<TouchableOpacity
			style={[styles.card, { backgroundColor: cardColor }]}
			onPress={() => {
				setSelectedStore(item);
				setDetailVisible(true);
			}}
		>
			<View style={styles.iconBox}>
				<FontAwesome5 name="store-alt" size={24} color={primaryColor} />
			</View>
			<View style={styles.info}>
				<Text style={[styles.storeName, { color: textColor }]}>
					{item.name}
				</Text>
				<Text
					style={[styles.storeAddress, { color: subTextColor }]}
					numberOfLines={2}
				>
					{item.address || "Dirección no disponible"}
				</Text>

				{/* Distance Badge */}
				{userLocation && (item.latitude || item.longitude) && (
					<View style={styles.distanceBadge}>
						<Ionicons name="navigate" size={10} color={primaryColor} />
						<Text style={[styles.distanceText, { color: primaryColor }]}>
							{calculateDistance(item.latitude, item.longitude)}
						</Text>
					</View>
				)}
			</View>
			<Ionicons name="chevron-forward" size={20} color="#ccc" />
		</TouchableOpacity>
	);

	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: bgColor, paddingTop: insets.top },
			]}
		>
			{/* Header */}
			<View style={styles.header}>
				<Text style={[styles.title, { color: textColor }]}>Tiendas</Text>
				<TouchableOpacity onPress={() => setModalVisible(true)}>
					<Ionicons name="add-circle" size={32} color={primaryColor} />
				</TouchableOpacity>
			</View>

			{/* Search Bar */}
			<View style={styles.searchContainer}>
				<View style={[styles.searchBar, { backgroundColor: cardColor }]}>
					<Ionicons name="search" size={20} color={subTextColor} />
					<TextInput
						style={[styles.input, { color: textColor }]}
						placeholder="Buscar tiendas..."
						placeholderTextColor="#999"
						value={searchQuery}
						onChangeText={setSearchQuery}
						onSubmitEditing={handleSearch}
						returnKeyType="search"
					/>
					{searchQuery.length > 0 && (
						<TouchableOpacity
							onPress={() => {
								setSearchQuery("");
								initLocationAndFetch();
							}}
						>
							<Ionicons name="close-circle" size={20} color={subTextColor} />
						</TouchableOpacity>
					)}
				</View>
			</View>

			{/* List */}
			{loading ? (
				<ActivityIndicator
					size="large"
					color={primaryColor}
					style={{ marginTop: 50 }}
				/>
			) : (
				<FlatList
					data={stores}
					renderItem={renderItem}
					keyExtractor={(item) => item.store_id}
					contentContainerStyle={styles.listContent}
					ListEmptyComponent={
						<View style={styles.centerEmpty}>
							<FontAwesome5 name="search" size={40} color={subTextColor} />
							<Text style={{ color: subTextColor, marginTop: 10 }}>
								No se encontraron tiendas.
							</Text>
						</View>
					}
					refreshing={loading}
					onRefresh={initLocationAndFetch}
				/>
			)}

			{/* Create Modal */}
			<CreateStoreModal
				visible={modalVisible}
				onClose={() => setModalVisible(false)}
				onStoreCreated={() => {
					setSearchQuery("");
					initLocationAndFetch();
				}}
			/>

			<StoreDetailModal
				visible={detailVisible}
				store={selectedStore}
				distance={
					selectedStore
						? calculateDistance(selectedStore.latitude, selectedStore.longitude)
						: null
				}
				onClose={() => {
					setDetailVisible(false);
					setSelectedStore(null);
				}}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 15,
	},
	title: { fontSize: 32, fontWeight: "bold" },

	searchContainer: { paddingHorizontal: 20, marginBottom: 10 },
	searchBar: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderRadius: 12,
		gap: 10,
	},
	input: { flex: 1, fontSize: 16 },

	listContent: { padding: 20, paddingBottom: 100 },

	card: {
		flexDirection: "row",
		alignItems: "center",
		padding: 15,
		borderRadius: 16,
		marginBottom: 15,
		shadowColor: "#000",
		shadowOpacity: 0.05,
		shadowRadius: 5,
		elevation: 2,
	},
	iconBox: {
		width: 50,
		height: 50,
		borderRadius: 12,
		backgroundColor: "#E0F2F1",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 15,
	},
	info: { flex: 1 },
	storeName: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
	storeAddress: { fontSize: 13 },

	distanceBadge: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 6,
		gap: 4,
		backgroundColor: "#E0F2F1",
		alignSelf: "flex-start",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
	},
	distanceText: { fontSize: 11, fontWeight: "bold" },

	centerEmpty: { alignItems: "center", marginTop: 50, paddingHorizontal: 40 },
});
