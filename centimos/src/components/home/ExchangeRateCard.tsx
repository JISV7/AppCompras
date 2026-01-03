import { FontAwesome5 } from "@expo/vector-icons";
import {
	ActivityIndicator,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";

// Define what data this component expects
interface ExchangeRateCardProps {
	rate: {
		rate_to_ves: string;
		source: string;
		recorded_at: string;
	} | null;
	loading: boolean;
	onPress?: () => void;
}

export function ExchangeRateCard({
	rate,
	loading,
	onPress,
}: ExchangeRateCardProps) {
	const cardColor = useThemeColor({}, "surfaceLight");
	const textColor = useThemeColor({}, "textMain");
	const subTextColor = useThemeColor({}, "textSecondary");
	const primaryColor = useThemeColor({}, "primary");

	const formatDate = (dateString?: string) => {
		if (!dateString) return "No data";

		// The date string from the backend is naive (e.g., "2025-12-29 22:05:27.984079")
		// but represents UTC time. We need to parse it as such.
		const isoUtcString = dateString.includes("T")
			? dateString
			: `${dateString.replace(" ", "T")}Z`;
		const date = new Date(isoUtcString);

		// Using undefined for locale uses the device's default.
		const options: Intl.DateTimeFormatOptions = {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		};

		return date.toLocaleString(undefined, options);
	};

	return (
		<TouchableOpacity
			style={[styles.card, { backgroundColor: cardColor }]}
			onPress={onPress}
			activeOpacity={0.7}
		>
			<View style={styles.header}>
				<View style={styles.iconContainer}>
					<FontAwesome5 name="money-bill-wave" size={14} color="white" />
				</View>
				<Text style={[styles.label, { color: subTextColor }]}>Tasa BCV</Text>
				{rate && (
					<View style={styles.badge}>
						<Text style={styles.badgeText}>{rate.source}</Text>
					</View>
				)}
			</View>

			{loading ? (
				<ActivityIndicator
					color={primaryColor}
					style={{ alignSelf: "flex-start", marginTop: 10 }}
				/>
			) : (
				<View style={styles.content}>
					<Text style={[styles.value, { color: textColor }]}>
						{rate ? parseFloat(rate.rate_to_ves).toFixed(2) : "0.00"}
						<Text style={styles.currency}> Bs</Text>
					</Text>
					<Text style={[styles.date, { color: subTextColor }]}>
						{rate ? formatDate(rate.recorded_at) : "No data"}
					</Text>
				</View>
			)}
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	card: {
		padding: 16,
		borderRadius: 16,
		marginBottom: 25,
		shadowColor: "#000",
		shadowOpacity: 0.05,
		shadowRadius: 10,
		elevation: 2,
	},
	header: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
	iconContainer: {
		backgroundColor: "#388E3C",
		borderRadius: 6,
		width: 20,
		height: 20,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 8,
	},
	label: { fontSize: 14, fontWeight: "600", flex: 1 },
	badge: {
		backgroundColor: "#E8F5E9",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
	},
	badgeText: { color: "#2E7D32", fontSize: 10, fontWeight: "bold" },
	content: {
		flexDirection: "row",
		alignItems: "baseline",
		justifyContent: "space-between",
	},
	value: { fontSize: 32, fontWeight: "bold" },
	currency: { fontSize: 20, fontWeight: "normal" },
	date: { fontSize: 12 },
});
