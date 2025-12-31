import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
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
    image: require("@/assets/images/onboarding/step1.png")
  },
  {
    title: "Compare Store Prices.",
    description: "Find the cheapest place to buy your list. We track prices across local supermarkets.",
    image: require("@/assets/images/onboarding/step2.png")
  },
  {
    title: "Plan Smart, Spend Less.",
    description: "Create monthly budgets for groceries and pharmacy. Let us estimate the cost before you leave home.",
    image: require("@/assets/images/onboarding/step3.png")
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
    <ThemedView style={[styles.container, { backgroundColor: color, paddingBottom: insets.bottom }]}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <Link href="/(public)/welcome" asChild>
          <Text style={[styles.skipButton, { color: primaryColor }]}>
            Skip
          </Text>
        </Link>
      </View>

      {/* Scrollable Content Area (Flex Grow) */}
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
        {/* Header Image / Illustration */}
        <View style={styles.imageContainer}>
          <View style={styles.imageWrapper}>
            <Image
              source={onboardingData[currentStep].image}
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
      </ScrollView>

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
            onPress={() => router.push('/(public)/welcome')}
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
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 24,
    paddingBottom: 150,
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
    paddingBottom: 24,
    paddingTop: 12,
    alignItems: 'center',
    gap: 32,
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