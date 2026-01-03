import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";

interface ListActionMenuProps {
	visible: boolean;
	onToggle: () => void;
	onCompleteList: () => void;
	onManualAdd: () => void;
	onScan: () => void;
	isCompleted: boolean;
	hasSelecteditem: boolean;
}

export function ListActionMenu({
	visible,
	onToggle,
	onCompleteList,
	onManualAdd,
	onScan,
	isCompleted,
	hasSelecteditem,
}: ListActionMenuProps) {
	const primaryColor = useThemeColor({}, "primary");

	if (isCompleted) return null;
	if (hasSelecteditem) return null;

	return (
		<>
			{visible && (
				<View style={styles.actionMenu}>
					<TouchableOpacity style={styles.actionBtn} onPress={onCompleteList}>
						<MaterialIcons name="done-all" size={24} color="white" />
						<Text style={styles.actionText}>Finalizar la Lista</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.actionBtn} onPress={onManualAdd}>
						<Ionicons name="keypad" size={24} color="white" />
						<Text style={styles.actionText}>Escribir Código</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.actionBtn} onPress={onScan}>
						<Ionicons name="scan" size={24} color="white" />
						<Text style={styles.actionText}>Escanear</Text>
					</TouchableOpacity>
				</View>
			)}

			<TouchableOpacity
				style={[
					styles.fab,
					{
						backgroundColor: primaryColor,
						transform: [{ rotate: visible ? "45deg" : "0deg" }],
					},
				]}
				onPress={onToggle}
				activeOpacity={0.8}
			>
				<Ionicons name="add" size={32} color="white" />
			</TouchableOpacity>
		</>
	);
}

const styles = StyleSheet.create({
	fab: {
		position: "absolute",
		bottom: 60,
		right: 30,
		width: 60,
		height: 60,
		borderRadius: 30,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOpacity: 0.3,
		shadowRadius: 5,
		elevation: 5,
		zIndex: 10,
	},
	actionMenu: {
		position: "absolute",
		bottom: 130,
		right: 30,
		gap: 12,
		alignItems: "flex-end",
		zIndex: 10,
	},
	actionBtn: {
		flexDirection: "row",
		backgroundColor: "#455A64",
		padding: 12,
		borderRadius: 25,
		alignItems: "center",
		gap: 10,
		shadowColor: "#000",
		shadowOpacity: 0.2,
		shadowRadius: 4,
		elevation: 4,
	},
	actionText: {
		color: "white",
		fontWeight: "bold",
	},
});
