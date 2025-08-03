import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { ThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Navbar } from '@/components/Navbar';
import { loadFonts } from '@/utils/fonts';

// Definir tema claro personalizado
const CustomLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3498DB',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#2C3E50',
    border: '#F0F0F0',
    notification: '#3498DB',
  },
};

// Definir tema oscuro personalizado
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#3498DB',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#2C3E50',
    border: '#F0F0F0',
    notification: '#3498DB',
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Lufga-Thin': require('../assets/fonts/lufga/LufgaThin.ttf'),
    'Lufga-ThinItalic': require('../assets/fonts/lufga/LufgaThinItalic.ttf'),
    'Lufga-ExtraLight': require('../assets/fonts/lufga/LufgaExtraLight.ttf'),
    'Lufga-ExtraLightItalic': require('../assets/fonts/lufga/LufgaExtraLightItalic.ttf'),
    'Lufga-Light': require('../assets/fonts/lufga/LufgaLight.ttf'),
    'Lufga-LightItalic': require('../assets/fonts/lufga/LufgaLightItalic.ttf'),
    'Lufga-Regular': require('../assets/fonts/lufga/LufgaRegular.ttf'),
    'Lufga-Italic': require('../assets/fonts/lufga/LufgaItalic.ttf'),
    'Lufga-Medium': require('../assets/fonts/lufga/LufgaMedium.ttf'),
    'Lufga-MediumItalic': require('../assets/fonts/lufga/LufgaMediumItalic.ttf'),
    'Lufga-SemiBold': require('../assets/fonts/lufga/LufgaSemiBold.ttf'),
    'Lufga-SemiBoldItalic': require('../assets/fonts/lufga/LufgaSemiBoldItalic.ttf'),
    'Lufga-Bold': require('../assets/fonts/lufga/LufgaBold.ttf'),
    'Lufga-BoldItalic': require('../assets/fonts/lufga/LufgaBoldItalic.ttf'),
    'Lufga-ExtraBold': require('../assets/fonts/lufga/LufgaExtraBold.ttf'),
    'Lufga-ExtraBoldItalic': require('../assets/fonts/lufga/LufgaExtraBoldItalic.ttf'),
    'Lufga-Black': require('../assets/fonts/lufga/LufgaBlack.ttf'),
    'Lufga-BlackItalic': require('../assets/fonts/lufga/LufgaBlackItalic.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomLightTheme}>
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <Navbar />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: {
              backgroundColor: '#FFFFFF',
            },
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="search" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="dark" />
      </View>
    </ThemeProvider>
  );
}
