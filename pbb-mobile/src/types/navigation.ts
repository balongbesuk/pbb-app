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
  TaxpayerList: {
    serverUrl: string;
    user: AdminUser & { id: string };
    tahun: number;
    villageName: string;
  };
  BillingHistory: {
    serverUrl: string;
    user: AdminUser & { id: string };
    villageName: string;
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
