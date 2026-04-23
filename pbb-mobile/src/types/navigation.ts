import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type TaxStats = {
  totalSppt: number;
  lunasSppt: number;
};

export type AdminUser = {
  id?: string;
  name?: string;
  dusun?: string;
  role?: string;
};

export type RootStackParamList = {
  Onboarding: undefined;
  UserAuth: {
    serverUrl: string;
    villageName: string;
    villageLogo?: string | null;
  };
  Dashboard: {
    villageName: string;
    serverUrl: string;
    stats?: Partial<TaxStats>;
    villageLogo?: string | null;
  };
  PaymentCheck: {
    serverUrl: string;
  };

  Login: {
    serverUrl?: string;
    villageName?: string;
  };
  AdminDashboard: {
    serverUrl: string;
    user: AdminUser & { id: string };
    isAdmin?: boolean;
    stats?: Partial<TaxStats>;
    villageName: string;
  };
  GisMap: {
    serverUrl: string;
  };
  TaxpayerList: {
    serverUrl: string;
    user: AdminUser & { id: string };
    tahun: number;
    villageName: string;
    bapendaConfig?: any;
  };
  BillingHistory: {
    serverUrl: string;
    user: AdminUser & { id: string };
    villageName: string;
  };
  Mutation: {
    serverUrl: string;
    isDark?: boolean;
    initialDraft?: any;
  };
  Notification: {
    serverUrl: string;
    user: AdminUser & { id: string };
  };
  TaxpayerDetail: {
    serverUrl: string;
    user: AdminUser & { id: string; role?: string };
    taxpayer: any;
    villageName: string;
    bapendaConfig?: any;
    onUpdate?: (updatedWp: any) => void;
  };
  SelectOfficer: {
    serverUrl: string;
    senderId: string;
    senderRole: string;
    taxId: string | number;
    taxName: string;
  };
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
