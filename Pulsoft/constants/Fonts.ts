// Constantes de fuentes Lufga para usar en toda la aplicación
export const FONTS = {
  // Pesos principales
  THIN: 'Lufga-Thin',
  EXTRA_LIGHT: 'Lufga-ExtraLight',
  LIGHT: 'Lufga-Light',
  REGULAR: 'Lufga-Regular',
  MEDIUM: 'Lufga-Medium',
  SEMI_BOLD: 'Lufga-SemiBold',
  BOLD: 'Lufga-Bold',
  EXTRA_BOLD: 'Lufga-ExtraBold',
  BLACK: 'Lufga-Black',
  
  // Variantes en cursiva
  THIN_ITALIC: 'Lufga-ThinItalic',
  EXTRA_LIGHT_ITALIC: 'Lufga-ExtraLightItalic',
  LIGHT_ITALIC: 'Lufga-LightItalic',
  ITALIC: 'Lufga-Italic',
  MEDIUM_ITALIC: 'Lufga-MediumItalic',
  SEMI_BOLD_ITALIC: 'Lufga-SemiBoldItalic',
  BOLD_ITALIC: 'Lufga-BoldItalic',
  EXTRA_BOLD_ITALIC: 'Lufga-ExtraBoldItalic',
  BLACK_ITALIC: 'Lufga-BlackItalic',
} as const;

// Tamaños de fuente estándar
export const FONT_SIZES = {
  XS: 12,
  SM: 14,
  BASE: 16,
  LG: 18,
  XL: 20,
  '2XL': 24,
  '3XL': 32,
  '4XL': 36,
  '5XL': 48,
} as const;

// Estilos de texto predefinidos
export const TEXT_STYLES = {
  // Títulos
  H1: {
    fontSize: FONT_SIZES['3XL'],
    fontFamily: FONTS.BOLD,
    lineHeight: 40,
  },
  H2: {
    fontSize: FONT_SIZES['2XL'],
    fontFamily: FONTS.BOLD,
    lineHeight: 32,
  },
  H3: {
    fontSize: FONT_SIZES.XL,
    fontFamily: FONTS.BOLD,
    lineHeight: 28,
  },
  H4: {
    fontSize: FONT_SIZES.LG,
    fontFamily: FONTS.SEMI_BOLD,
    lineHeight: 24,
  },
  
  // Texto del cuerpo
  BODY_LARGE: {
    fontSize: FONT_SIZES.LG,
    fontFamily: FONTS.REGULAR,
    lineHeight: 28,
  },
  BODY: {
    fontSize: FONT_SIZES.BASE,
    fontFamily: FONTS.REGULAR,
    lineHeight: 24,
  },
  BODY_SMALL: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.REGULAR,
    lineHeight: 20,
  },
  BODY_XS: {
    fontSize: FONT_SIZES.XS,
    fontFamily: FONTS.REGULAR,
    lineHeight: 16,
  },
  
  // Botones
  BUTTON_LARGE: {
    fontSize: FONT_SIZES.LG,
    fontFamily: FONTS.BOLD,
    lineHeight: 24,
  },
  BUTTON: {
    fontSize: FONT_SIZES.BASE,
    fontFamily: FONTS.BOLD,
    lineHeight: 20,
  },
  BUTTON_SMALL: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.SEMI_BOLD,
    lineHeight: 18,
  },
  
  // Etiquetas
  LABEL: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.MEDIUM,
    lineHeight: 20,
  },
  CAPTION: {
    fontSize: FONT_SIZES.XS,
    fontFamily: FONTS.REGULAR,
    lineHeight: 16,
  },
} as const; 