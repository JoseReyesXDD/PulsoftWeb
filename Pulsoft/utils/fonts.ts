import * as Font from 'expo-font';

export const loadFonts = async () => {
  await Font.loadAsync({
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
};

// Constantes para usar las fuentes de manera consistente
export const FONTS = {
  THIN: 'Lufga-Thin',
  THIN_ITALIC: 'Lufga-ThinItalic',
  EXTRA_LIGHT: 'Lufga-ExtraLight',
  EXTRA_LIGHT_ITALIC: 'Lufga-ExtraLightItalic',
  LIGHT: 'Lufga-Light',
  LIGHT_ITALIC: 'Lufga-LightItalic',
  REGULAR: 'Lufga-Regular',
  ITALIC: 'Lufga-Italic',
  MEDIUM: 'Lufga-Medium',
  MEDIUM_ITALIC: 'Lufga-MediumItalic',
  SEMI_BOLD: 'Lufga-SemiBold',
  SEMI_BOLD_ITALIC: 'Lufga-SemiBoldItalic',
  BOLD: 'Lufga-Bold',
  BOLD_ITALIC: 'Lufga-BoldItalic',
  EXTRA_BOLD: 'Lufga-ExtraBold',
  EXTRA_BOLD_ITALIC: 'Lufga-ExtraBoldItalic',
  BLACK: 'Lufga-Black',
  BLACK_ITALIC: 'Lufga-BlackItalic',
}; 