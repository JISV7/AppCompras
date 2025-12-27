import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors } from '@/constants/theme';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    title: "Beat the Inflation.",
    description: "Real-time exchange rates and historical data to help you decide the best time to buy.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCz4db3-KLb3YCzQjmF7okOc1z7W6E5WQTk_ppVv6GPMiGZLvlU8eDAuz5d9YOqGV5zHs8ByYQCgjitL45_NyPlEDzbvQ9sfHtKzoUJhOOCz_5c9fJ1_0Lf8T7m2jGqOYmI3EM1Dl1SQc3AvYK5MYHYiV2VdyCh6omNWEHwHOm9vqJnfJBBevsuUrRC8Q92Jxv4UL_sugTdM3yT8wvG-ljiaz3gs5pTjJBCz4LzNBCRnMp_PcqfTvvIgTZ5aLvy-Wj1sbppJftSk6kb"
  },
  {
    title: "Compare Store Prices.",
    description: "Find the cheapest place to buy your list. We track prices across local supermarkets.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhagMnNZ2eSJvYr2jw2ZP7UJtwAZIxg-4oujv0vtI0YIdEWk0FnjoOIG8i4gb6jJa1O4YQVB7Ei9PR0sAsEx3lD9vLL6uNlvhvR2hBDKc7rvBIW6F1E3_aXYqJyphZ26PQL8gM82h684UqG0WdQqJOX-1uuFiuhxass93sof9SwQQiB8SkssVnn8N6dkHeIfVhY-U9Ka8Zp4NCh5E13E3QUBdIsh5Raxa6x9VYvJ6MXHj5JUuH8LTyaSH5ffVdOmLXklgyKVF06-0j"
  },
  {
    title: "Plan Smart, Spend Less.",
    description: "Create monthly budgets for groceries and pharmacy. Let us estimate the cost before you leave home.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCpWyDayLyNYuUrAUkNZSU4qa7BkxsiXdpPYcEaQzOuPx0lUAQxs02jL6wZZUIBq-nCvJ0xqMXFZk7X8eUNjIvnnQBhfgBeWhOxeZ_KIGtQ41yODFph9gW3MleQ43KcenlobolDN8mfIct4AenGjVW4jLG5VKq9wnCV53F4PlHMRVC__5X4y-9majUoWpmLDHTZ8n1Pu4dZeVWqsOkvSuPSH4cVEAbGyMW4FoEgWSKU5jOB-6sRkQvMNmthwwzJ7QG0AJEgVJwqvvfp"
  }
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const color = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const nextStep = () => {
    if (currentStep < onboardingData.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const skipOnboarding = () => {
    // In a real app, you'd save this to async storage
    // For now, just navigate to welcome screen
  };

  const completeOnboarding = () => {
    // In a real app, you'd save this to async storage
    // For now, just navigate to welcome screen
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: color, paddingBottom: insets.bottom + 20 }]}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <Link href="/welcome" asChild>
          <Text style={[styles.skipButton, { color: primaryColor }]}>
            Skip
          </Text>
        </Link>
      </View>

      {/* Scrollable Content Area (Flex Grow) */}
      <View style={styles.content}>
        {/* Header Image / Illustration */}
        <View style={styles.imageContainer}>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: onboardingData[currentStep].image }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: textColor }]}>
            {onboardingData[currentStep].title}
          </Text>
          <Text style={[styles.description, { color: textSecondaryColor }]}>
            {onboardingData[currentStep].description}
          </Text>
        </View>
      </View>

      {/* Footer / Bottom Action Area */}
      <View style={styles.bottomSection}>
        {/* Page Indicators */}
        <View style={styles.indicators}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor: index === currentStep ? `${primaryColor}33` : '#D1D5DB', // Fixed: active indicator should be primary color
                  width: index === currentStep ? 32 : 10,
                  height: 10,
                  borderRadius: 5,
                }
              ]}
            />
          ))}
        </View>

        {/* Get Started Button */}
        {currentStep === onboardingData.length - 1 ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: primaryColor }]}
            onPress={() => router.push('/welcome')}
          >
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
              Get Started
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: primaryColor }]}
            onPress={nextStep}
          >
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
              Next
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingTop: 24,
    zIndex: 10,
  },
  skipButton: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    marginBottom: 32,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 4/3,
    justifyContent: 'center',
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 40,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  bottomSection: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 0,
    alignItems: 'center',
    gap: 32,
    marginBottom: 20, // Add margin to avoid overlap with navigation controls
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  indicator: {
    marginHorizontal: 1.5,
  },
  actionButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 24,
    shadowColor: '#10b77f', // Using the primary color value directly
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
});