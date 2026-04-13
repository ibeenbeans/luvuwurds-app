import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Compliment } from './constants/compliments';
import { useAppState } from './hooks/useAppState';
import { AppStateContext } from './hooks/AppStateContext';

// Screens
import OnboardingScreen  from './screens/OnboardingScreen';
import HisSetupScreen    from './screens/HisSetupScreen';
import HerSetupScreen    from './screens/HerSetupScreen';
import HomeScreen        from './screens/HomeScreen';
import FavoritesScreen   from './screens/FavoritesScreen';
import RecordScreen      from './screens/RecordScreen';
import HerHomeScreen     from './screens/HerHomeScreen';
import HerSavedScreen    from './screens/HerSavedScreen';
import HisSavedScreen    from './screens/HisSavedScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  HisSetup:   undefined;
  HerSetup:   undefined;
  HisHome:    undefined;
  Favorites:  { favorites: Compliment[]; setFavorites: (f: Compliment[]) => void };
  Record:     { complimentIndex: number };
  HerHome:    undefined;
  HerSaved:   undefined;
  HisSaved:   undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const { appState, loading, saveAppState, clearAppState } = useAppState();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0d0b', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#e8c4a0" />
      </View>
    );
  }

  // Determine initial route based on saved role
  const initialRoute: keyof RootStackParamList =
    appState.role === 'his'  ? 'HisHome'    :
    appState.role === 'hers' ? 'HerHome'    :
    'Onboarding';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppStateContext.Provider value={{ appState, loading, saveAppState, clearAppState }}>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName={initialRoute}
              screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
            >
              <Stack.Screen name="Onboarding"  component={OnboardingScreen} />
              <Stack.Screen name="HisSetup"    component={HisSetupScreen} />
              <Stack.Screen name="HerSetup"    component={HerSetupScreen} />
              <Stack.Screen name="HisHome"     component={HomeScreen} />
              <Stack.Screen name="Favorites"   component={FavoritesScreen} />
              <Stack.Screen name="Record"      component={RecordScreen} />
              <Stack.Screen name="HerHome"     component={HerHomeScreen} />
              <Stack.Screen name="HerSaved"    component={HerSavedScreen} />
              <Stack.Screen name="HisSaved"    component={HisSavedScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </AppStateContext.Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
