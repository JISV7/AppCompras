import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SwipeableRow } from "@/components/common/SwipeableRow";
import { useThemeColor } from "@/hooks/use-theme-color";
import type { EnrichedListItem } from "@/services/lists";

interface ListDetailItemProps {
	item: EnrichedListItem;
	onPress: (item: EnrichedListItem) => void;
	onRemove: (itemId: string) => void;
}

export function ListDetailItem({
	item,
	onPress,
	onRemove,
}: ListDetailItemProps) {
	const cardColor = useThemeColor({}, "surfaceLight");
	const textColor = useThemeColor({}, "textMain");
	const primaryColor = useThemeColor({}, "primary");

	const itemPrice = item.planned_price ?? item.estimatedPrice ?? 0;

	return (
		<SwipeableRow
			onDelete={() => onRemove(item.item_id)}
			height={80}
			bottomMargin={10}
		>
			<TouchableOpacity
				style={[
					styles.itemCard,
					{
						backgroundColor: cardColor,
						opacity: item.is_purchased ? 0.6 : 1,
					},
				]}
				onPress={() => onPress(item)}
				activeOpacity={0.9}
			>
				<View style={styles.itemImagePlaceholder}>
					{item.productImage ? (
						<Image
							source={{ uri: item.productImage }}
							style={styles.itemImage}
						/>
					) : (
						<FontAwesome5 name="box" size={20} color="#ccc" />
					)}
				</View>
				<View style={{ flex: 1, paddingHorizontal: 10 }}>
					<View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
						<Text
							style={[
								styles.itemName,
								{
									color: textColor,
									textDecorationLine: item.is_purchased
										? "line-through"
										: "none",
								},
							]}
							numberOfLines={1}
						>
							{item.productName}
						</Text>
						<View
							style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
						>
							<MaterialIcons
								name="storefront"
								size={16}
								color={item.store_id ? "#2196F3" : "#E0E0E0"}
							/>
							<MaterialIcons
								name="check-circle"
								size={16}
								color={item.is_purchased ? primaryColor : "#E0E0E0"}
							/>
						</View>
					</View>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Text style={{ color: "#888", fontSize: 12 }}>
							{item.product_barcode}
						</Text>
						<Text
							style={{
								color: primaryColor,
								fontWeight: "bold",
								fontSize: 14,
							}}
						>
							${itemPrice.toFixed(2)}
						</Text>
					</View>
				</View>
				<View style={styles.qtyBadge}>
					<Text style={{ fontWeight: "bold", color: primaryColor }}>
						x{item.quantity}
					</Text>
				</View>
			</TouchableOpacity>
		</SwipeableRow>
	);
}

const styles = StyleSheet.create({
	itemCard: {
		flexDirection: "row",
		padding: 12,
		borderRadius: 12,
		marginBottom: 10,
		alignItems: "center",
	},
	itemImagePlaceholder: {
		width: 50,
		height: 50,
		borderRadius: 8,
		backgroundColor: "#f0f0f0",
		alignItems: "center",
		justifyContent: "center",
	},
	itemImage: {
		width: 50,
		height: 50,
		borderRadius: 8,
	},
	itemName: {
		fontWeight: "600",
		fontSize: 16,
		marginBottom: 4,
	},
	qtyBadge: {
		backgroundColor: "#E3F2FD",
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 8,
	},
});
