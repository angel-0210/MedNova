export const themeTokens = {
  colors: {
    primary: '#000a24',          // Deep Navy
    primaryContainer: '#14213d', // Deep Navy Container
    secondary: '#855300',
    secondaryContainer: '#ffa515', // Safety Orange
    background: '#f9f9f9',       // Clean sterile gray/white background
    backgroundMain: '#FFFFFF',
    surface: '#f9f9f9',
    surfaceContainer: '#eeeeee',
    surfaceContainerHigh: '#e8e8e8',
    surfaceContainerHighest: '#e2e2e2',
    surfaceContainerLow: '#f4f3f3',
    surfaceContainerLowest: '#ffffff',
    surfaceGlass: 'rgba(255, 255, 255, 0.7)',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onSurface: '#1a1c1c',
    onSurfaceVariant: '#45464d',
    textRich: '#000000',
    inverseSurface: '#2f3131',
    inverseOnSurface: '#f1f1f1',
    outline: '#75777e',
    outlineVariant: '#c5c6ce',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    onError: '#ffffff',
    onErrorContainer: '#93000a',
    statusStable: '#14213D',     // Deep Navy
    statusCritical: '#FCA311',   // Warning/Alert Orange
  },
  typography: {
    displayLg: {
      fontFamily: 'System', // Fallback to System to guarantee fonts render without native Inter setup
      fontSize: 48,
      lineHeight: 56,
      letterSpacing: -0.96, // -0.02em
      fontWeight: '700' as const,
    },
    headlineLg: {
      fontFamily: 'System',
      fontSize: 32,
      lineHeight: 40,
      letterSpacing: -0.32, // -0.01em
      fontWeight: '600' as const,
    },
    headlineLgMobile: {
      fontFamily: 'System',
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600' as const,
    },
    statsXl: {
      fontFamily: 'System',
      fontSize: 40,
      lineHeight: 48,
      letterSpacing: -1.2, // -0.03em
      fontWeight: '500' as const,
    },
    bodyMd: {
      fontFamily: 'System',
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
    },
    bodySm: {
      fontFamily: 'System',
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
    },
    labelCaps: {
      fontFamily: 'System',
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.6, // 0.05em
      fontWeight: '600' as const,
    },
  },
  roundness: {
    sm: 4,
    default: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  spacing: {
    unit: 8,
    gutter: 16,
    containerMargin: 24,
    sectionGap: 40,
  },
};
