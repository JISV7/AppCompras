import { FontAwesome5 } from "@expo/vector-icons";
import { useCameraPermissions } from "expo-camera";
import { useCallback, useEffect, useState } from "react";
import {
	Alert,
	Keyboard,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConverterSheet } from "@/components/home/ConverterSheet";
// Import our new Lego blocks
import { ExchangeRateCard } from "@/components/home/ExchangeRateCard";
// NEW COMPONENTS
import { ExchangeRateHistorySheet } from "@/components/home/ExchangeRateHistorySheet";
import { ListSelectorModal } from "@/components/home/ListSelectorModal";
import { ProductSearchSheet } from "@/components/home/ProductSearchSheet";
import { ProfileSheet } from "@/components/home/ProfileSheet";
import { QuickActions } from "@/components/home/QuickActions";
import { ScannerAction } from "@/components/home/ScannerAction";
import { CameraModal } from "@/components/scanner/CameraModal";
import { ProductSheet } from "@/components/scanner/ProductSheet";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
	getLatestExchangeRate,
	getProduct,
	getUserProfile,
	type Product,
} from "@/services/api";
import { addListItem } from "@/services/lists";

export default function HomeScreen() {
	const color = useThemeColor({}, "background");
	const textColor = useThemeColor({}, "textMain");
	const subTextColor = useThemeColor({}, "textSecondary");
	const cardColor = useThemeColor({}, "surfaceLight");
	const primaryColor = useThemeColor({}, "primary");
	const insets = useSafeAreaInsets();
	const { logout } = useAuth();

	// State
	const [rate, setRate] = useState<{
		rate_to_ves: string;
		source: string;
		recorded_at: string;
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [user, setUser] = useState<{
		full_name?: string;
		username: string;
		email: string;
	} | null>(null);
	const [profileVisible, setProfileVisible] = useState(false);

	// Exchange History State
	const [exchangeHistoryVisible, setExchangeHistoryVisible] = useState(false);

	// Converter State
	const [converterVisible, setConverterVisible] = useState(false);

	// Search Results State
	const [searchResultsVisible, setSearchResultsVisible] = useState(false);

	// List Selection State
	const [listSelectorVisible, setListSelectorVisible] = useState(false);
	const [selectedProductForList, setSelectedProductForList] =
		useState<Product | null>(null);

	// Camera State
	const [isScanning, setIsScanning] = useState(false);
	const [scanMode, setScanMode] = useState<"search" | "log">("search");
	const [permission, requestPermission] = useCameraPermissions();

	// NEW STATE FOR PRODUCT SHEET (Single result from barcode)
	const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
	const [sheetVisible, setSheetVisible] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		const [rateData, userData] = await Promise.all([
			getLatestExchangeRate(),
			getUserProfile(),
		]);

		if (rateData) setRate(rateData);
		if (userData) setUser(userData);

		setLoading(false);
	}, []);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await fetchData();
		setRefreshing(false);
	}, [fetchData]);

	const handleLogout = async () => {
		setProfileVisible(false);
		try {
			await logout();
		} catch (error) {
			console.error("Logout error:", error);
			Alert.alert(
				"Error",
				"Hubo un problema al cerrar sesión. Por favor intenta de nuevo.",
			);
		}
	};

	const handleStartScanning = async (mode: "search" | "log" = "search") => {
		setScanMode(mode);
		if (!permission?.granted) {
			const result = await requestPermission();
			if (!result.granted) {
				Alert.alert(
					"Permiso requerido",
					"Se necesita acceso a la cámara para escanear productos.",
				);
				return;
			}
		}
		setIsScanning(true);
	};

	// --- REUSABLE SEARCH FUNCTION ---
	const performSearch = async (barcode: string) => {
		if (!barcode) return;

		// Check if the input looks like a barcode (8 or more digits, starting with a digit)
		const isBarcode = /^\d{8,}$/.test(barcode);
		// Check if it's a URL or very long text (likely not a product name search)
		const isUrl = /^(https?:\/\/|www\.)/i.test(barcode);
		const isRawContent = isUrl || (barcode.length > 30 && !isBarcode);

		if (isBarcode || isRawContent) {
			// 1. Reset UI
			Keyboard.dismiss();
			setSheetVisible(true);
			setLastScannedCode(barcode);
			setScannedProduct(null);

			if (isBarcode) {
				setIsSearching(true);
				// 2. API Call
				try {
					const product = await getProduct(barcode);
					setScannedProduct(product);
				} catch (error: unknown) {
					console.error("Barcode search failed", error);
				} finally {
					setIsSearching(false);
				}
			} else {
				// It's a URL or raw text, no need to query the products API
				setIsSearching(false);
			}
		} else {
			// It's a typical text search (name, brand, etc.)
			Keyboard.dismiss();
			setSearchResultsVisible(true);
		}
	};

	const handleBarCodeScanned = ({ data }: { data: string }) => {
		setIsScanning(false);
		performSearch(data);
	};

	const handleCloseSheet = () => {
		setSheetVisible(false);
		setScannedProduct(null);
	};

	const handleManualSubmit = () => {
		performSearch(searchQuery);
	};

	const handleRescan = () => {
		setSheetVisible(false);
		setTimeout(() => setIsScanning(true), 300);
	};

	const handleProductSelect = (product: Product) => {
		setSearchResultsVisible(false);
		setSelectedProductForList(product);
		setListSelectorVisible(true);
	};

	const handleListSelect = async (listId: string) => {
		if (!selectedProductForList) return;

		try {
			await addListItem(listId, selectedProductForList.barcode, 1);
			// Alert.alert("Éxito", `${selectedProductForList.name} agregado a la lista.`);
			setListSelectorVisible(false);
			setSelectedProductForList(null);
		} catch {
			Alert.alert("Error", "No se pudo agregar el producto a la lista.");
		}
	};

	return (
		<ThemedView
			style={[
				styles.container,
				{ backgroundColor: color, paddingTop: insets.top },
			]}
		>
			{/* 1. Header */}
			<View style={styles.header}>
				<View>
					<Text style={[styles.appName, { color: primaryColor }]}>
						Céntimos
					</Text>
					<Text style={[styles.greeting, { color: subTextColor }]}>
						Compras inteligentes
					</Text>
				</View>

				<TouchableOpacity
					style={[styles.profileButton, { backgroundColor: cardColor }]}
					onPress={() => setProfileVisible(true)}
				>
					{user?.full_name || user?.username ? (
						<Text style={{ fontWeight: "bold", color: primaryColor }}>
							{(user.full_name || user.username)?.charAt(0)}
						</Text>
					) : (
						<FontAwesome5 name="user" size={16} color={textColor} />
					)}
				</TouchableOpacity>
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
			>
				{/* 2. Components */}
				<ExchangeRateCard
					rate={rate}
					loading={loading}
					onPress={() => setExchangeHistoryVisible(true)}
				/>

				<ScannerAction
					onScanPress={() => handleStartScanning("search")}
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					onSearchSubmit={handleManualSubmit}
				/>

				<QuickActions
					onLogPrice={() => handleStartScanning("log")}
					onOpenConverter={() => setConverterVisible(true)}
				/>
			</ScrollView>

			<CameraModal
				visible={isScanning}
				onClose={() => setIsScanning(false)}
				onBarcodeScanned={handleBarCodeScanned}
			/>

			<ProductSheet
				visible={sheetVisible}
				loading={isSearching}
				product={scannedProduct}
				barcode={lastScannedCode}
				mode={scanMode}
				onClose={handleCloseSheet}
				onRescan={handleRescan}
				onAddToList={handleProductSelect}
			/>

			<ProfileSheet
				visible={profileVisible}
				user={user}
				onClose={() => setProfileVisible(false)}
				onLogout={handleLogout}
			/>

			{/* NEW SHEETS */}
			<ExchangeRateHistorySheet
				visible={exchangeHistoryVisible}
				onClose={() => setExchangeHistoryVisible(false)}
			/>

			<ProductSearchSheet
				visible={searchResultsVisible}
				query={searchQuery}
				onClose={() => setSearchResultsVisible(false)}
				onProductSelect={handleProductSelect}
			/>

			<ListSelectorModal
				visible={listSelectorVisible}
				onClose={() => setListSelectorVisible(false)}
				onSelect={handleListSelect}
			/>

			<ConverterSheet
				visible={converterVisible}
				rate={rate ? parseFloat(rate.rate_to_ves) : 0}
				onClose={() => setConverterVisible(false)}
			/>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	content: { padding: 20 },
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingBottom: 15,
	},
	appName: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
	greeting: { fontSize: 13 },
	profileButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
});
