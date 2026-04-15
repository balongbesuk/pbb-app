import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type TaxStats = {
  totalSppt: number;
  lunasSppt: number;
};

export type AdminUser = {
  name?: string;
  dusun?: string;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Dashboard: {
    villageName: string;
    serverUrl: string;
    stats?: Partial<TaxStats>;
    villageLogo?: string | null;
  };
  PaymentCheck: {
    serverUrl: string;
  };
  Mutation: {
    serverUrl: string;
    isDark?: boolean;
    initialDraft?: {
      nopLama?: string;
      namaPemohon?: string;
      alasan?: string;
    };
  };
  Login: {
    serverUrl?: string;
  };
  AdminDashboard: {
    serverUrl: string;
    user: AdminUser;
    isAdmin?: boolean;
    stats?: Partial<TaxStats>;
    villageName: string;
  };
  GisMap: {
    serverUrl: string;
  };
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
