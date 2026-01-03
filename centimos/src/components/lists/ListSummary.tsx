import { StyleSheet, Text, View } from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";

interface ListSummaryProps {
	totalPrice: number;
	budgetLimit?: number;
	currency?: string;
}

export function ListSummary({
	totalPrice,
	budgetLimit,
	currency = "$",
}: ListSummaryProps) {
	const cardColor = useThemeColor({}, "surfaceLight");
	const primaryColor = useThemeColor({}, "primary");

	return (
		<View style={[styles.summary, { backgroundColor: cardColor }]}>
			<Text style={{ color: "#888" }}>Total Estimado</Text>
			<Text
				style={[
					styles.totalPrice,
					{
						color:
							budgetLimit && totalPrice > budgetLimit
								? "#FF5252"
								: primaryColor,
					},
				]}
			>
				{currency} {totalPrice.toFixed(2)}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	summary: {
		padding: 20,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	totalPrice: {
		fontSize: 24,
		fontWeight: "900",
	},
});
