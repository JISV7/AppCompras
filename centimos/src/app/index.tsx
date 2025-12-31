import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { isAuthenticated } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Simulate splash screen delay
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); // Show splash for 2 seconds

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <Redirect href="/(public)/splash" />;
  }

  // If user is authenticated, redirect to main app
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  // Check if user has completed onboarding
  // For now, redirect to onboarding - in a real app you'd check this with async storage
  return <Redirect href="/(public)/onboarding" />;
}