/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#10b77f"; // Primary green from design
const tintColorDark = "#0d9466"; // Darker green from design

export const Colors = {
	light: {
		text: "#0d1b17", // Main text from design
		textSecondary: "#4c9a80", // Secondary text from design
		textMain: "#0d1b17", // Main text from design
		textSub: "#4c9a80", // Sub text from design
		background: "#f6f8f7", // Background from design
		backgroundLight: "#f8fcfa", // Background from design
		backgroundDark: "#10221c", // Dark background from design
		tint: tintColorLight,
		icon: "#687076",
		tabIconDefault: "#687076",
		tabIconSelected: tintColorLight,
		primary: "#10b77f",
		primaryDark: "#0e8c61", // Updated to match design
		surfaceLight: "#ffffff",
		surfaceDark: "#183028",
	},
	dark: {
		text: "#ECEDEE",
		textSecondary: "#a0b3ac", // Secondary text from design
		textMain: "#e0ece9", // Main text from design
		textSub: "#a0b3ac", // Sub text from design
		background: "#151718",
		backgroundLight: "#f8fcfa",
		backgroundDark: "#10221c", // Dark background from design
		tint: tintColorDark,
		icon: "#9BA1A6",
		tabIconDefault: "#9BA1A6",
		tabIconSelected: tintColorDark,
		primary: "#10b77f",
		primaryDark: "#0a8f61", // Updated to match design
		surfaceLight: "#ffffff",
		surfaceDark: "#183028",
	},
};

export const Fonts = Platform.select({
	ios: {
		/** iOS `UIFontDescriptorSystemDesignDefault` */
		sans: "system-ui",
		/** iOS `UIFontDescriptorSystemDesignSerif` */
		serif: "ui-serif",
		/** iOS `UIFontDescriptorSystemDesignRounded` */
		rounded: "ui-rounded",
		/** iOS `UIFontDescriptorSystemDesignMonospaced` */
		mono: "ui-monospace",
	},
	default: {
		sans: "normal",
		serif: "serif",
		rounded: "normal",
		mono: "monospace",
	},
	web: {
		sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
		serif: "Georgia, 'Times New Roman', serif",
		rounded:
			"'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
		mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
	},
});

// Border radius constants
export const BorderRadius = {
	DEFAULT: 8, // 0.5rem
	lg: 16, // 1rem
	xl: 24, // 1.5rem
	"2xl": 32, // 2rem
	full: 9999, // Full rounded
};
