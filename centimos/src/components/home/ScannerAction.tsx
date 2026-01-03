import { Ionicons } from "@expo/vector-icons";
import {
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";

interface ScannerActionProps {
	onScanPress: () => void;
	searchQuery: string;
	onSearchChange: (text: string) => void;
	onSearchSubmit: () => void;
}

export function ScannerAction({
	onScanPress,
	searchQuery,
	onSearchChange,
	onSearchSubmit,
}: ScannerActionProps) {
	const cardColor = useThemeColor({}, "surfaceLight");
	const textColor = useThemeColor({}, "textMain");
	const subTextColor = useThemeColor({}, "textSecondary");

	return (
		<View style={styles.container}>
			{/* 1. Camera Button */}
			<TouchableOpacity
				style={styles.scannerButton}
				activeOpacity={0.8}
				onPress={onScanPress}
			>
				<View style={styles.visual}>
					<Ionicons name="scan-outline" size={60} color="white" />
					<Text style={styles.text}>Toca para escanear producto</Text>
				</View>
			</TouchableOpacity>

			{/* 2. Search Bar */}
			<View style={[styles.searchBar, { backgroundColor: cardColor }]}>
				<Ionicons
					name="search"
					size={20}
					color={subTextColor}
					style={styles.searchIcon}
				/>
				<TextInput
					style={[styles.input, { color: textColor }]}
					placeholder="O busca por nombre/código..."
					placeholderTextColor={subTextColor}
					value={searchQuery}
					onChangeText={onSearchChange}
					onSubmitEditing={onSearchSubmit}
					returnKeyType="search"
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		borderRadius: 20,
		overflow: "hidden",
		marginBottom: 30,
		shadowColor: "#000",
		shadowOpacity: 0.1,
		shadowRadius: 15,
		elevation: 4,
	},
	scannerButton: {
		backgroundColor: "#263238",
		height: 180,
		alignItems: "center",
		justifyContent: "center",
	},
	visual: { alignItems: "center", opacity: 0.9 },
	text: { color: "white", marginTop: 10, fontWeight: "600", fontSize: 16 },
	searchBar: { flexDirection: "row", alignItems: "center", padding: 15 },
	searchIcon: { marginRight: 10 },
	input: { flex: 1, fontSize: 16, height: 40 },
});
