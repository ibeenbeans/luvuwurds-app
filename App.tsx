import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Compliment } from './constants/compliments';
import { useVoice } from './hooks/useVoice';
import { VoiceContext } from './hooks/VoiceContext';
import HomeScreen from './screens/HomeScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import CalibrateScreen from './screens/CalibrateScreen';
import TuneScreen from './screens/TuneScreen';

export type RootStackParamList = {
  Home: undefined;
  Favorites: {
    favorites: Compliment[];
    setFavorites: (favs: Compliment[]) => void;
  };
  Calibrate: undefined;
  Tune: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const voice = useVoice();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <VoiceContext.Provider value={voice}>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Favorites" component={FavoritesScreen} />
              <Stack.Screen name="Calibrate" component={CalibrateScreen} />
              <Stack.Screen name="Tune" component={TuneScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </VoiceContext.Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
