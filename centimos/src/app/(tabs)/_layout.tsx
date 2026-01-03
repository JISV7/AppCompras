import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
	const colorScheme = useColorScheme();

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
				headerShown: false,
				tabBarButton: HapticTab,
			}}
		>
			{/* Home Tab */}
			<Tabs.Screen
				name="index"
				options={{
					title: "Inicio",
					tabBarIcon: ({ color }) => (
						<IconSymbol size={28} name="house.fill" color={color} />
					),
				}}
			/>

			{/* Lists Tab */}
			<Tabs.Screen
				name="lists"
				options={{
					title: "Mis Listas",
					tabBarIcon: ({ color }) => (
						<MaterialIcons
							name="format-list-bulleted"
							size={28}
							color={color}
						/>
					),
				}}
			/>

			{/* Stores Tab */}
			<Tabs.Screen
				name="stores"
				options={{
					title: "Tiendas",
					tabBarIcon: ({ color }) => (
						<Ionicons name="storefront" size={28} color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
