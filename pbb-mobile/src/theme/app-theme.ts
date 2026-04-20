export const appTheme = {
  colors: {
    // Core backgrounds
    bg: '#f8fafc', // Slate 50
    surface: '#ffffff',
    surfaceMuted: '#f1f5f9', // Slate 100
    surfaceStrong: '#e2e8f0', // Slate 200

    // Text hierarchy
    text: '#0f172a', // Slate 900
    textMuted: '#475569', // Slate 600
    textSoft: '#94a3b8', // Slate 400

    // Primary — Premium Emerald Green
    primary: '#059669', // Emerald 600
    primaryDark: '#047857', // Emerald 700
    primarySoft: 'rgba(16, 185, 129, 0.08)',
    primaryLight: '#ecfdf5', // Emerald 50

    // Accent — Indigo
    accent: '#4f46e5',
    accentSoft: 'rgba(79, 70, 229, 0.08)',

    // Semantic
    info: '#0ea5e9',
    infoSoft: 'rgba(14, 165, 233, 0.08)',
    danger: '#ef4444',
    dangerSoft: 'rgba(239, 68, 68, 0.06)',
    success: '#10b981',
    successSoft: 'rgba(16, 185, 129, 0.12)',
    warning: '#f59e0b',
    warningSoft: 'rgba(245, 158, 11, 0.06)',

    // Borders & overlays
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    overlay: 'rgba(15, 23, 42, 0.5)',

    // Header gradient (Modern Deep Slate to Primary)
    headerStart: '#0f172a',
    headerEnd: '#1e293b',

    // Glass effects (Requires Blur on native, opacity fallback)
    glass: 'rgba(255, 255, 255, 0.72)',
    glassStrong: 'rgba(255, 255, 255, 0.88)',
    glassDark: 'rgba(15, 23, 42, 0.65)',
  },
  radius: {
    xs: 8,
    sm: 12,
    md: 18,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
    screen: 24,
  },
  sizing: {
    headerTop: 62,
    headerBottom: 28,
    headerRadius: 36,
    backButton: 46,
    iconTile: 52,
    modalIcon: 72,
  },
  shadow: {
    card: {
      shadowColor: '#334155',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 6,
    },
    soft: {
      shadowColor: '#475569',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 3,
    },
    floating: {
      shadowColor: '#059669',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 14,
    },
    header: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 15,
    },
  },
  typo: {
    hero: { fontSize: 32, fontWeight: '800' as const, lineHeight: 40, letterSpacing: -0.6 },
    heading: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32, letterSpacing: -0.4 },
    title: { fontSize: 18, fontWeight: '700' as const, lineHeight: 24, letterSpacing: -0.2 },
    body: { fontSize: 14, fontWeight: '500' as const, lineHeight: 22 },
    bodyBold: { fontSize: 14, fontWeight: '700' as const, lineHeight: 22 },
    caption: { fontSize: 12, fontWeight: '600' as const, lineHeight: 18 },
    label: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 0.8 },
    badge: { fontSize: 10, fontWeight: '900' as const, letterSpacing: 0.6 },
    mono: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.4 },
  },
};

export const appLayout = {
  screenPadding: appTheme.spacing.screen,
  header: {
    paddingTop: appTheme.sizing.headerTop,
    paddingBottom: appTheme.sizing.headerBottom,
    radius: appTheme.sizing.headerRadius,
  },
  cardPadding: 20,
};

export const statusTone = {
  LUNAS: {
    bg: appTheme.colors.primaryLight,
    text: appTheme.colors.primary,
    label: 'Lunas',
  },
  BELUM_LUNAS: {
    bg: appTheme.colors.dangerSoft,
    text: appTheme.colors.danger,
    label: 'Belum Lunas',
  },
  PIUTANG: {
    bg: 'rgba(245, 158, 11, 0.08)',
    text: '#d97706',
    label: 'Belum Lunas',
  },
  SUSPEND: {
    bg: appTheme.colors.warningSoft,
    text: appTheme.colors.warning,
    label: 'Sengketa',
  },
  TIDAK_TERBIT: {
    bg: appTheme.colors.surfaceMuted,
    text: appTheme.colors.textSoft,
    label: 'Tidak terbit',
  },
};
