export const appTheme = {
  colors: {
    bg: '#f6efe6',
    surface: '#fffaf4',
    surfaceMuted: '#f1e7da',
    surfaceStrong: '#e7dac9',
    text: '#1d2b24',
    textMuted: '#647267',
    textSoft: '#95a094',
    primary: '#1c5a45',
    primaryDark: '#102f25',
    primarySoft: '#dceee5',
    accent: '#ee8a5b',
    accentSoft: '#fde1d3',
    info: '#3f67d6',
    infoSoft: '#dfe7ff',
    danger: '#d75d5d',
    dangerSoft: '#f9dddd',
    success: '#21986a',
    successSoft: '#d8f2e6',
    border: '#e4d7c6',
    overlay: 'rgba(10, 23, 18, 0.7)',
    dark: '#102f25',
    glow: '#ffe7b8',
  },
  radius: {
    sm: 14,
    md: 20,
    lg: 28,
    xl: 36,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    screen: 24,
  },
  sizing: {
    headerTop: 58,
    headerBottom: 26,
    headerRadius: 34,
    backButton: 46,
    iconTile: 52,
    modalIcon: 72,
  },
  shadow: {
    card: {
      shadowColor: '#24170c',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.09,
      shadowRadius: 24,
      elevation: 10,
    },
    floating: {
      shadowColor: '#24170c',
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.16,
      shadowRadius: 32,
      elevation: 16,
    },
  },
};

export const appLayout = {
  screenPadding: appTheme.spacing.screen,
  header: {
    paddingTop: appTheme.sizing.headerTop,
    paddingBottom: appTheme.sizing.headerBottom,
    radius: appTheme.sizing.headerRadius,
  },
  cardPadding: 18,
};

export const statusTone = {
  LUNAS: {
    bg: appTheme.colors.successSoft,
    text: appTheme.colors.success,
  },
  BELUM_LUNAS: {
    bg: appTheme.colors.dangerSoft,
    text: appTheme.colors.danger,
  },
  PIUTANG: {
    bg: appTheme.colors.dangerSoft,
    text: appTheme.colors.danger,
  },
  SUSPEND: {
    bg: appTheme.colors.accentSoft,
    text: appTheme.colors.accent,
  },
  TIDAK_TERBIT: {
    bg: '#e8ece8',
    text: '#637068',
  },
};
